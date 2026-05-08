// WebRTC + screen capture en el Electron renderer
// desktopCapturer se accede via IPC al main process

console.log('[Renderer] Script loaded');
console.log('[Renderer] window.agent available:', typeof window.agent);

const sessions = new Map();
let cachedStream = null;

async function getScreenStream() {
  if (cachedStream && cachedStream.active) {
    window.agent.log('Reusing cached screen stream');
    return cachedStream;
  }

  window.agent.log('Getting desktop sources...');
  const sources = await window.agent.getDesktopSources();
  window.agent.log(`Got ${sources?.length} sources: ${sources?.map(s => s.name).join(', ')}`);

  if (!sources || sources.length === 0) {
    throw new Error('No screen sources found');
  }

  const source = sources[0]; // primary screen
  window.agent.log(`Using source: ${source.name} (${source.id})`);

  window.agent.log('Getting user media...');
  cachedStream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id,
        maxWidth: 1920,
        maxHeight: 1080,
        minFrameRate: 30,
        maxFrameRate: 60,
      },
    },
  });
  window.agent.log(`Got stream with ${cachedStream.getTracks().length} tracks`);

  // contentHint='motion' le dice al encoder que priorice fluidez de movimiento
  // sobre nitidez. Para control remoto interactivo es lo que queremos —
  // preferimos un texto un toque más blando antes que ver salto de frames.
  const videoTrack = cachedStream.getVideoTracks()[0];
  try { videoTrack.contentHint = 'motion'; } catch {}

  videoTrack.onended = () => {
    cachedStream = null;
  };

  return cachedStream;
}

console.log('[Renderer] Registering onSignal handler');

window.agent.onSignal(async (msg) => {
  console.log('[Renderer] Received signal:', msg.type, 'session:', msg.sessionId);
  const { type, sessionId, payload } = msg;

  if (type === 'browser-ready') {
    window.agent.log(`browser-ready for session: ${sessionId}`);
    try {
      const iceServers = payload.iceServers;
      const pc = new RTCPeerConnection({
        iceServers,
        iceCandidatePoolSize: 4,
        bundlePolicy: 'max-bundle',
      });
      sessions.set(sessionId, pc);

      window.agent.log('Getting screen stream...');
      const stream = await getScreenStream();
      window.agent.log(`Stream acquired with ${stream.getTracks().length} tracks`);
      window.agent.log(`Adding ${stream.getTracks().length} tracks to RTC`);
      stream.getTracks().forEach((track) => {
        window.agent.log(`Adding track: ${track.kind} (${track.id}), enabled: ${track.enabled}, readyState: ${track.readyState}`);
        const sender = pc.addTrack(track, stream);
        const params = sender.getParameters();
        if (!params.encodings) params.encodings = [{}];
        // Bitrate alto para 1080p60 con mucho movimiento. Si la red no aguanta,
        // la rebaja automáticamente — preferimos llenar la tubería antes que
        // inducir latencia por frames represados.
        params.encodings[0].maxBitrate = 12_000_000;
        params.encodings[0].maxFramerate = 60;
        params.encodings[0].priority = 'high';
        params.encodings[0].networkPriority = 'high';
        // Cuando hay congestión, sacrifica resolución/calidad antes que fps.
        // Para control remoto preferimos siempre 60 fps con un poco más blando.
        params.degradationPreference = 'maintain-framerate';
        sender.setParameters(params).catch((err) => {
          window.agent.log(`setParameters fallback: ${err.message}`);
        });
      });
      window.agent.log('All tracks added');

      const dc = pc.createDataChannel('input', {
        ordered: true,
        maxRetransmits: 0,
      });
      dc.onopen = () => window.agent.log(`DataChannel open for ${sessionId}`);
      dc.onmessage = ({ data }) => {
        let inputMsg;
        try { inputMsg = JSON.parse(data); } catch { return; }
        window.agent.sendInput(inputMsg);
      };

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          window.agent.sendSignal({
            type: 'ice-candidate',
            sessionId,
            payload: candidate,
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        window.agent.log(`ICE state: ${pc.iceConnectionState} session: ${sessionId}`);
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
          sessions.delete(sessionId);
        }
      };

      pc.onicecandidateerror = (event) => {
        window.agent.log(`ICE error: ${event.errorText}`);
      };

      window.agent.log('Creating offer...');
      const offer = await pc.createOffer();
      window.agent.log(`Offer created, type: ${offer.type}, sdp length: ${offer.sdp.length}`);
      await pc.setLocalDescription(offer);
      window.agent.sendSignal({
        type: 'offer',
        sessionId,
        payload: offer,
      });

      window.agent.log(`Offer sent for session: ${sessionId}`);

      // Enviar resolución de pantalla al navegador
      setTimeout(() => {
        window.agent.sendSignal({
          type: 'screen-resolution',
          sessionId,
          payload: { width: screen.width, height: screen.height },
        });
      }, 500);
    } catch (err) {
      console.error('[Renderer] browser-ready error:', err.message, err.stack);
      window.agent.sendInput({ type: 'log', message: `ERROR: ${err.message}` });
    }
  }

  if (type === 'answer') {
    const pc = sessions.get(sessionId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload));
        console.log('[Renderer] answer set for session:', sessionId);
      } catch (err) {
        console.error('[Renderer] answer error:', err);
      }
    }
  }

  if (type === 'ice-candidate') {
    const pc = sessions.get(sessionId);
    if (pc && payload) {
      try {
        // Ignorar candidates sin sdpMid/sdpMLineIndex (son inválidos durante setup)
        if (!payload.candidate || (!payload.sdpMid && !payload.sdpMLineIndex)) {
          console.log('[Renderer] Skipping invalid ICE candidate');
          return;
        }
        await pc.addIceCandidate(new RTCIceCandidate(payload));
      } catch (err) {
        console.warn('[Renderer] ice-candidate error:', err.message);
      }
    }
  }

  if (type === 'browser-left') {
    const pc = sessions.get(sessionId);
    if (pc) {
      pc.close();
      sessions.delete(sessionId);
      console.log('[Renderer] browser left, session closed:', sessionId);
    }
    if (sessions.size === 0 && cachedStream) {
      cachedStream.getTracks().forEach(t => t.stop());
      cachedStream = null;
      console.log('[Renderer] stream released (no active sessions)');
    }
  }
});

console.log('[Renderer] WebRTC agent initialized');
