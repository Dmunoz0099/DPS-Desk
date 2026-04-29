const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:4000');

ws.on('open', () => {
  console.log('[Test] ✅ Connected to signaling server');
  
  ws.send(JSON.stringify({
    type: 'join',
    payload: { role: 'agent', posId: 'isabel-riquelme-pos-real' }
  }));
  console.log('[Test] Sent: join as agent');
});

ws.on('message', (msg) => {
  try {
    const parsed = JSON.parse(msg);
    console.log('[Test] ✅ Received:', parsed.type);
  } catch {
    console.log('[Test] Received raw:', msg);
  }
});

ws.on('error', (err) => {
  console.error('[Test] ❌ Error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('[Test] ✅ WebSocket test complete');
  ws.close();
  process.exit(0);
}, 2000);
