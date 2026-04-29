const WebSocket = require('ws');

class SignalingClient {
  constructor(url, posId) {
    this.url = url.endsWith('/ws') ? url : `${url}/ws`;
    this.posId = posId;
    this._handlers = {};
    this._openCb = null;
    this._closeCb = null;
    this._reconnectAttempts = 0;
    this._manuallyClosed = false;
    this._heartbeatInterval = null;
    this._connect();
  }

  _connect() {
    try {
      this.ws = new WebSocket(this.url);
    } catch (err) {
      console.error('[Signaling] Failed to create WS:', err.message);
      this._scheduleReconnect();
      return;
    }

    this.ws.on('open', () => {
      console.log('[Signaling] Connected');
      this._reconnectAttempts = 0;
      this._send({ type: 'join', payload: { role: 'agent', posId: this.posId } });

      // Heartbeat manual cada 25s
      this._heartbeatInterval = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          try { this.ws.send(JSON.stringify({ type: 'ping' })); } catch {}
        }
      }, 25000);

      if (this._openCb) this._openCb();
    });

    this.ws.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }
      if (msg.type === 'ping') {
        try { this.ws.send(JSON.stringify({ type: 'pong', ts: Date.now() })); } catch {}
        return;
      }
      if (msg.type === 'pong') return;
      const fn = this._handlers[msg.type];
      if (fn) fn(msg);
    });

    this.ws.on('ping', () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try { this.ws.pong(); } catch {}
      }
    });

    this.ws.on('close', () => {
      if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;

      if (this._closeCb) this._closeCb();

      if (!this._manuallyClosed) {
        this._scheduleReconnect();
      }
    });

    this.ws.on('error', (err) => console.error('[Signaling] Error:', err.message));
  }

  _scheduleReconnect() {
    const delay = Math.min(1000 * Math.pow(2, this._reconnectAttempts), 30000);
    this._reconnectAttempts++;
    console.log(`[Signaling] Reconnecting in ${delay}ms (attempt ${this._reconnectAttempts})`);
    setTimeout(() => this._connect(), delay);
  }

  on(type, fn) {
    this._handlers[type] = fn;
  }

  onOpen(fn) { this._openCb = fn; }
  onClose(fn) { this._closeCb = fn; }

  send(obj) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(obj));
        return true;
      } catch (err) {
        console.error('[Signaling] send error:', err.message);
      }
    }
    return false;
  }

  _send(obj) {
    return this.send(obj);
  }

  close() {
    this._manuallyClosed = true;
    if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);
    if (this.ws) {
      try { this.ws.close(); } catch {}
    }
  }
}

module.exports = SignalingClient;
