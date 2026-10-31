// WebSocket client with automatic reconnect and server clock sync. Shared
// animation (moving platforms etc.) runs on the server's clock so both
// players see the same thing at the same moment.

const TOKEN_KEY = 'itt.token';

function storage(kind) {
  try {
    return kind === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

export class Net {
  constructor() {
    this.handlers = new Map();
    this.ws = null;
    this.connected = false;
    this.offset = 0;
    this.rtt = 0;
    this.samples = [];
    this.name = '';
    this.slot = -1;
    this.retry = 0;
    this.pingTimer = null;
    this.synced = false;
  }

  get token() {
    try {
      return storage('session')?.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  }

  set token(v) {
    try {
      storage('session')?.setItem(TOKEN_KEY, v);
    } catch {
      /* private mode */
    }
  }

  on(type, fn) {
    if (!this.handlers.has(type)) this.handlers.set(type, []);
    this.handlers.get(type).push(fn);
  }

  emit(type, msg) {
    for (const fn of this.handlers.get(type) || []) fn(msg);
  }

  connect(name) {
    this.name = name;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/ws`);
    this.ws = ws;
    ws.onopen = () => {
      this.connected = true;
      this.retry = 0;
      this.samples = [];
      this.send({ t: 'hello', token: this.token, name: this.name });
      this.ping();
      clearInterval(this.pingTimer);
      let n = 0;
      this.pingTimer = setInterval(() => {
        n++;
        // Ping fast at first for a quick sync, then settle.
        if (n < 8 || n % 8 === 0) this.ping();
      }, 250);
      this.emit('open');
    };
    ws.onmessage = (e) => {
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      if (msg.t === 'pong') {
        this.onPong(msg);
        return;
      }
      // Turned away: keep the "full" message up while retrying.
      if (msg.t === 'full') this.full = true;
      if (msg.t === 'welcome') {
        this.token = msg.token;
        this.slot = msg.slot;
        if (!this.synced) this.offset = msg.serverTime - performance.now();
      }
      this.emit(msg.t, msg);
    };
    ws.onclose = (e) => {
      const was = this.connected;
      this.connected = false;
      clearInterval(this.pingTimer);
      // Another device took this tab's seat: don't reconnect and take it back.
      if (e.code === 4001) {
        this.emit('taken');
        return;
      }
      if (was && !this.full) this.emit('close');
      this.full = false;
      const delay = Math.min(4000, 500 * 2 ** this.retry++);
      setTimeout(() => this.connect(this.name), delay);
    };
    ws.onerror = () => {};
  }

  send(msg) {
    if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(msg));
  }

  ping() {
    this.send({ t: 'ping', c: performance.now() });
  }

  onPong(msg) {
    const now = performance.now();
    const rtt = now - msg.c;
    const offset = msg.s + rtt / 2 - now;
    this.samples.push({ rtt, offset });
    if (this.samples.length > 12) this.samples.shift();
    // Trust the lowest-latency samples most.
    const best = [...this.samples].sort((a, b) => a.rtt - b.rtt).slice(0, 4);
    const target = best.reduce((s, x) => s + x.offset, 0) / best.length;
    if (!this.synced || Math.abs(target - this.offset) > 80) this.offset = target;
    else this.offset += (target - this.offset) * 0.2;
    this.synced = true;
    this.rtt = this.rtt ? this.rtt * 0.7 + rtt * 0.3 : rtt;
  }

  serverNow() {
    return performance.now() + this.offset;
  }
}
