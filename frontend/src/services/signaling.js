// WebSocket signaling client con auto-reconnect (exponential backoff)

export function createSignalingClient({ onReconnect, onClose } = {}) {
  const handlers = {};
  let ws = null;
  let manuallyClosing = false;
  let reconnectAttempts = 0;
  let reconnectTimer = null;
  let pingInterval = null;

  // En Electron: usar window.__DPSDESK_CONFIG__.wsUrl (inyectado por preload)
  // En navegador: fallback a window.location.host
  const cfg = typeof window !== 'undefined' ? window.__DPSDESK_CONFIG__ : {};
  let url;
  if (cfg?.wsUrl) {
    url = `${cfg.wsUrl}/ws`;
  } else {
    url = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
  }

  function connect() {
    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('[Signaling] Connected');
      const wasReconnect = reconnectAttempts > 0;
      reconnectAttempts = 0;

      // Heartbeat manual cada 25s (backend hace ping cada 30s)
      pingInterval = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          try { ws.send(JSON.stringify({ type: 'ping' })); } catch {}
        }
      }, 25000);

      if (wasReconnect && onReconnect) onReconnect();
      handlers._open?.();
    };

    ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      if (msg.type === 'pong') return;
      handlers[msg.type]?.(msg);
    };

    ws.onclose = () => {
      console.log('[Signaling] Closed');
      if (pingInterval) clearInterval(pingInterval);
      pingInterval = null;

      if (!manuallyClosing) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        reconnectAttempts++;
        console.log(`[Signaling] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
        reconnectTimer = setTimeout(connect, delay);
        onClose?.();
      } else {
        onClose?.();
      }
    };

    ws.onerror = (err) => {
      console.error('[Signaling] Error:', err);
    };
  }

  connect();

  return {
    on(type, fn) {
      handlers[type] = fn;
    },
    onOpen(fn) {
      handlers._open = fn;
    },
    send(obj) {
      if (ws?.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(obj));
          return true;
        } catch (err) {
          console.error('[Signaling] send error:', err.message);
        }
      }
      return false;
    },
    close() {
      manuallyClosing = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pingInterval) clearInterval(pingInterval);
      if (ws) {
        try { ws.close(); } catch {}
      }
    },
    get readyState() {
      return ws?.readyState ?? WebSocket.CLOSED;
    },
  };
}
