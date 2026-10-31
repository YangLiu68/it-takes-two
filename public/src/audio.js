// All sound is synthesized: effects plus a gentle generative soundtrack whose
// key, progression and melody come from the level seed.

import { RNG } from '../shared/rng.js';

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

export class AudioEngine {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.music = null;
    this.hum = null;
    this.lastStep = 0;
  }

  // Must be called from a user gesture the first time.
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);
    this.sfx = ctx.createGain();
    this.sfx.connect(this.master);
    this.musicBus = ctx.createGain();
    this.musicBus.connect(this.master);
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.impulse(2.4, 2.2);
    this.reverbGain = ctx.createGain();
    this.reverbGain.gain.value = 0.35;
    this.reverb.connect(this.reverbGain).connect(this.master);
    this.noiseBuf = this.makeNoise();
    this.applyVolume();
  }

  applyVolume() {
    if (!this.ctx) return;
    const s = this.settings;
    this.master.gain.value = s.volume;
    this.sfx.gain.value = 0.9;
    this.musicBus.gain.value = s.music * 0.55;
  }

  impulse(seconds, decay) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  makeNoise() {
    const ctx = this.ctx;
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // -- primitives --------------------------------------------------------------

  out(opts) {
    const ctx = this.ctx;
    let node = ctx.createGain();
    node.gain.value = opts.vol ?? 1;
    let head = node;
    if (opts.pan) {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, opts.pan));
      node.connect(p);
      node = p;
    }
    node.connect(opts.bus || this.sfx);
    if (opts.verb) {
      const send = ctx.createGain();
      send.gain.value = opts.verb;
      node.connect(send).connect(this.reverb);
    }
    return head;
  }

  tone({ type = 'sine', f0, f1, dur = 0.15, gain = 0.3, attack = 0.005, delay = 0, curve = 'exp', vib = 0, ...o }) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    if (f1) {
      if (curve === 'exp') osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
      else osc.frequency.linearRampToValueAtTime(f1, t + dur);
    }
    if (vib) {
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = vib;
      lg.gain.value = f0 * 0.04;
      lfo.connect(lg).connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.05);
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let last = g;
    if (o.lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.lp;
      g.connect(f);
      last = f;
    }
    osc.connect(g);
    last.connect(this.out(o));
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  noise({ dur = 0.2, gain = 0.2, f0 = 1000, f1, q = 1, type = 'bandpass', delay = 0, attack = 0.005, ...o }) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.out(o));
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  // -- effects ------------------------------------------------------------------
  // `o` may carry { vol, pan } for the partner's sounds.

  play(name, o = {}) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const fn = this[`sfx_${name}`];
    if (fn) fn.call(this, { vol: o.vol ?? 1, pan: o.pan ?? 0 }, o);
  }

  sfx_jump(o) {
    this.tone({ f0: 330, f1: 640, dur: 0.13, gain: 0.18, type: 'sine', ...o });
    this.noise({ dur: 0.1, gain: 0.04, f0: 1800, f1: 3500, q: 0.8, ...o });
  }
  sfx_djump(o) {
    this.tone({ f0: 520, f1: 990, dur: 0.16, gain: 0.16, type: 'triangle', ...o });
    this.tone({ f0: 1760, f1: 2400, dur: 0.12, gain: 0.05, delay: 0.04, ...o, verb: 0.3 });
  }
  sfx_land(o, x) {
    const k = Math.min(1, (x.impact || 8) / 25);
    this.tone({ f0: 150, f1: 60, dur: 0.12, gain: 0.08 + k * 0.25, ...o });
    this.noise({ dur: 0.08, gain: 0.04 + k * 0.08, f0: 500, type: 'lowpass', ...o });
  }
  sfx_step(o) {
    this.noise({ dur: 0.035, gain: 0.03, f0: 2200 + Math.random() * 800, q: 2, ...o });
  }
  sfx_dash(o) {
    this.noise({ dur: 0.2, gain: 0.2, f0: 700, f1: 3200, q: 1.2, ...o });
    this.tone({ f0: 240, f1: 120, dur: 0.18, gain: 0.06, type: 'triangle', ...o });
  }
  sfx_poundStart(o) {
    this.noise({ dur: 0.16, gain: 0.08, f0: 400, f1: 2400, q: 2, ...o });
  }
  sfx_pound(o) {
    this.tone({ f0: 110, f1: 38, dur: 0.32, gain: 0.5, ...o });
    this.noise({ dur: 0.25, gain: 0.22, f0: 900, f1: 120, type: 'lowpass', ...o });
    this.tone({ f0: 160, f1: 90, dur: 0.06, gain: 0.08, type: 'square', lp: 900, ...o });
  }
  sfx_bounce(o, x) {
    const s = x.strong ? 1.4 : 1;
    this.tone({ f0: 180, f1: 520 * s, dur: 0.28 * s, gain: 0.22, vib: 18, type: 'sine', ...o });
    this.tone({ f0: 90, f1: 60, dur: 0.12, gain: 0.15, ...o });
  }
  sfx_launch(o) {
    this.tone({ f0: 180, f1: 1300, dur: 0.32, gain: 0.12, type: 'sawtooth', lp: 2400, ...o, verb: 0.25 });
    this.noise({ dur: 0.3, gain: 0.1, f0: 600, f1: 5000, q: 0.8, ...o });
  }
  sfx_attract(o) {
    this.tone({ f0: 220, f1: 440, dur: 0.22, gain: 0.08, type: 'triangle', ...o });
  }
  sfx_stick(o) {
    this.tone({ f0: 620, dur: 0.22, gain: 0.12, type: 'sine', ...o, verb: 0.2 });
    this.tone({ f0: 1490, dur: 0.15, gain: 0.07, type: 'sine', ...o });
    this.noise({ dur: 0.05, gain: 0.08, f0: 3000, q: 3, ...o });
  }
  sfx_magnetOff(o) {
    this.tone({ f0: 440, f1: 220, dur: 0.12, gain: 0.05, type: 'triangle', ...o });
  }
  sfx_bond(o) {
    [523, 659, 784].forEach((f, i) => this.tone({ f0: f, f1: f * 1.5, dur: 0.4, gain: 0.05, delay: i * 0.03, type: 'sine', ...o, verb: 0.4 }));
  }
  sfx_bondArrive(o) {
    [784, 988, 1175].forEach((f, i) => this.tone({ f0: f, dur: 0.3, gain: 0.06, delay: i * 0.05, type: 'triangle', ...o, verb: 0.4 }));
  }
  sfx_hit(o) {
    this.tone({ f0: 320, f1: 140, dur: 0.14, gain: 0.14, type: 'square', lp: 1500, ...o });
    this.noise({ dur: 0.1, gain: 0.08, f0: 1200, q: 1, ...o });
  }
  sfx_collect(o) {
    [1319, 1661, 1976, 2637].forEach((f, i) => this.tone({ f0: f, dur: 0.22, gain: 0.07, delay: i * 0.055, type: 'triangle', ...o, verb: 0.35 }));
  }
  sfx_checkpoint(o) {
    [523, 659, 784, 1047].forEach((f, i) => this.tone({ f0: f, dur: 0.7, gain: 0.06, delay: i * 0.07, type: 'sine', attack: 0.01, ...o, verb: 0.5 }));
  }
  sfx_plateOn(o) {
    this.tone({ f0: 900, dur: 0.03, gain: 0.08, type: 'square', lp: 3000, ...o });
    this.tone({ f0: 180, f1: 120, dur: 0.12, gain: 0.12, ...o });
  }
  sfx_plateOff(o) {
    this.tone({ f0: 1200, dur: 0.03, gain: 0.05, type: 'square', lp: 3000, ...o });
  }
  sfx_switch(o) {
    this.tone({ f0: 260, f1: 130, dur: 0.18, gain: 0.25, type: 'triangle', ...o });
    this.tone({ f0: 1046, dur: 0.25, gain: 0.06, delay: 0.05, ...o, verb: 0.3 });
  }
  sfx_mechanism(o) {
    this.noise({ dur: 0.7, gain: 0.08, f0: 300, f1: 900, q: 1.5, ...o });
    this.tone({ f0: 70, f1: 90, dur: 0.6, gain: 0.08, type: 'sawtooth', lp: 300, ...o });
  }
  sfx_unlock(o) {
    [392, 523, 659, 784].forEach((f, i) => this.tone({ f0: f, dur: 0.45, gain: 0.06, delay: i * 0.06, type: 'triangle', ...o, verb: 0.4 }));
  }
  sfx_crumble(o) {
    this.noise({ dur: 0.35, gain: 0.14, f0: 900, f1: 200, q: 0.8, ...o });
    this.tone({ f0: 140, f1: 70, dur: 0.25, gain: 0.08, type: 'triangle', ...o });
  }
  sfx_creak(o) {
    this.noise({ dur: 0.25, gain: 0.05, f0: 2400, q: 6, ...o });
  }
  sfx_die(o) {
    this.tone({ f0: 620, f1: 140, dur: 0.45, gain: 0.16, type: 'triangle', ...o, verb: 0.3 });
  }
  sfx_respawn(o) {
    this.tone({ f0: 300, f1: 900, dur: 0.12, gain: 0.12, ...o });
    this.tone({ f0: 1800, dur: 0.18, gain: 0.04, delay: 0.08, ...o, verb: 0.4 });
  }
  sfx_wave(o) {
    this.tone({ f0: 660, f1: 880, dur: 0.12, gain: 0.08, type: 'triangle', ...o });
    this.tone({ f0: 880, f1: 1100, dur: 0.12, gain: 0.07, delay: 0.12, type: 'triangle', ...o });
  }
  sfx_count(o) {
    this.tone({ f0: 660, dur: 0.14, gain: 0.12, type: 'triangle', ...o });
  }
  sfx_go(o) {
    this.tone({ f0: 990, dur: 0.4, gain: 0.14, type: 'triangle', ...o, verb: 0.3 });
    this.tone({ f0: 1320, dur: 0.4, gain: 0.08, type: 'sine', ...o });
  }
  sfx_complete(o) {
    const seq = [523, 659, 784, 1047, 784, 1047, 1319];
    seq.forEach((f, i) => this.tone({ f0: f, dur: 0.3, gain: 0.1, delay: i * 0.11, type: 'triangle', ...o, verb: 0.5 }));
    [523, 659, 784, 1047].forEach((f) => this.tone({ f0: f, dur: 1.6, gain: 0.05, delay: 0.8, attack: 0.05, ...o, verb: 0.6 }));
  }
  sfx_click(o) {
    this.tone({ f0: 1400, dur: 0.04, gain: 0.05, type: 'triangle', ...o });
  }

  // Magnet hum while pulling / stuck.
  // -- pranks, puzzles and horror --------------------------------------------------

  sfx_boing(o) {
    this.tone({ f0: 180, f1: 720, dur: 0.35, gain: 0.22, type: 'triangle', vib: 18, ...o });
    this.tone({ f0: 90, f1: 300, dur: 0.3, gain: 0.12, ...o });
  }
  sfx_honk(o) {
    // Clown horn: two squashed square-wave honks.
    for (const [d, f] of [[0, 420], [0.16, 360]]) {
      this.tone({ f0: f, f1: f * 0.92, dur: 0.14, gain: 0.08, type: 'square', delay: d, lp: 1600, ...o });
      this.tone({ f0: f * 1.5, dur: 0.12, gain: 0.04, type: 'sawtooth', delay: d, lp: 1400, ...o });
    }
  }
  sfx_punch(o, x) {
    const d = x.delay || 0;
    this.noise({ ...o, dur: 0.12, gain: 0.3, f0: 900, f1: 200, q: 0.8, delay: d });
    this.tone({ ...o, f0: 160, f1: 50, dur: 0.16, gain: 0.25, delay: d + 0.12 });
  }
  sfx_buzz(o) {
    this.tone({ f0: 110, dur: 0.35, gain: 0.12, type: 'sawtooth', lp: 900, ...o });
    this.tone({ f0: 116, dur: 0.35, gain: 0.1, type: 'square', lp: 700, ...o });
  }
  sfx_page(o) {
    this.noise({ dur: 0.25, gain: 0.12, f0: 3000, f1: 1500, q: 0.6, ...o });
    this.noise({ dur: 0.18, gain: 0.08, f0: 5000, delay: 0.12, q: 0.7, ...o });
  }
  sfx_sting(o) {
    // Shrieking cluster + slam: the jump-scare hit.
    const g = 0.16 * (o.vol ?? 1);
    for (const f of [740, 783, 1046, 1108]) this.tone({ f0: f * 1.02, f1: f, dur: 0.9, gain: g * 0.5, type: 'sawtooth', lp: 4200, vib: 9, ...o, verb: 0.6 });
    this.noise({ dur: 0.6, gain: g * 1.4, f0: 2500, f1: 600, q: 0.5, ...o });
    this.tone({ f0: 70, f1: 30, dur: 0.7, gain: g * 2, ...o });
  }
  sfx_spotted(o) {
    this.tone({ f0: 220, f1: 233, dur: 1.4, gain: 0.08, type: 'sawtooth', lp: 1200, ...o, verb: 0.6 });
    this.tone({ f0: 311, f1: 330, dur: 1.4, gain: 0.06, type: 'sawtooth', lp: 1200, ...o, verb: 0.6 });
  }
  sfx_slam(o) {
    this.noise({ dur: 0.4, gain: 0.45, f0: 400, f1: 80, q: 0.7, type: 'lowpass', ...o, verb: 0.8 });
    this.tone({ f0: 90, f1: 35, dur: 0.5, gain: 0.35, ...o });
  }
  sfx_whisper(o) {
    for (let i = 0; i < 6; i++) {
      this.noise({ dur: 0.18 + Math.random() * 0.2, gain: 0.05, f0: 1800 + Math.random() * 2400, q: 6, delay: i * 0.22 + Math.random() * 0.1, pan: Math.sin(i * 1.7) * 0.8, ...o, verb: 0.7 });
    }
  }
  sfx_knock(o) {
    for (const d of [0, 0.5, 1.0]) {
      this.tone({ ...o, f0: 180, f1: 90, dur: 0.12, gain: 0.3, delay: d, verb: 0.6 });
      this.noise({ ...o, dur: 0.06, gain: 0.15, f0: 900, type: 'lowpass', delay: d });
    }
  }
  sfx_thud(o) {
    this.tone({ f0: 70, f1: 40, dur: 0.18, gain: 0.18, ...o });
    this.noise({ dur: 0.08, gain: 0.05, f0: 300, type: 'lowpass', ...o });
  }

  // Horror ambience: a low drone, wind, and things that go bump.
  startDrone() {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    g.gain.exponentialRampToValueAtTime(0.9, ctx.currentTime + 3);
    g.connect(this.musicBus);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 240;
    f.connect(g);
    const nodes = [];
    for (const [freq, type, gain] of [[43.65, 'sawtooth', 0.08], [44.1, 'sawtooth', 0.08], [65.4, 'sine', 0.05], [92.5, 'triangle', 0.025]]) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      const og = ctx.createGain();
      og.gain.value = gain;
      o.connect(og).connect(f);
      o.start();
      nodes.push(o);
    }
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lg = ctx.createGain();
    lg.gain.value = 120;
    lfo.connect(lg).connect(f.frequency);
    lfo.start();
    nodes.push(lfo);
    // Wind
    const wind = ctx.createBufferSource();
    wind.buffer = this.noiseBuf;
    wind.loop = true;
    const wf = ctx.createBiquadFilter();
    wf.type = 'bandpass';
    wf.frequency.value = 380;
    wf.Q.value = 0.8;
    const wg = ctx.createGain();
    wg.gain.value = 0.035;
    wind.connect(wf).connect(wg).connect(g);
    wind.start();
    nodes.push(wind);
    const drone = { g, nodes, timer: 0, beatNext: 0, threat: Infinity, chasing: false };
    drone.timer = setInterval(() => this.droneTick(drone), 60);
    this.drone = drone;
  }

  droneTick(d) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    // Distant creaks, knocks and wrong notes every so often.
    if (Math.random() < 0.006) {
      const k = Math.random();
      const pan = Math.random() * 1.6 - 0.8;
      if (k < 0.3) this.sfx_creak({ vol: 0.35, pan });
      else if (k < 0.55) for (let i = 0; i < 3; i++) this.sfx_thud({ vol: 0.25, pan, delay: i * 0.3 });
      else if (k < 0.8) this.tone({ f0: NOTE(58 + [0, 1, 6, 11][Math.floor(Math.random() * 4)]), dur: 3, gain: 0.03, type: 'triangle', pan, bus: this.musicBus, verb: 0.9 });
      else this.sfx_whisper({ vol: 0.5 });
    }
    // Heartbeat speeds up as the monster gets close; a pulse while it chases you.
    if (d.threat < 20 || d.chasing) {
      const close = Math.max(0, Math.min(1, 1 - d.threat / 20));
      const gap = d.chasing ? 0.42 : 1.15 - close * 0.6;
      if (now >= d.beatNext) {
        const v = d.chasing ? 0.9 : 0.25 + close * 0.6;
        this.tone({ f0: 58, f1: 38, dur: 0.16, gain: 0.3 * v, bus: this.musicBus });
        this.tone({ f0: 52, f1: 34, dur: 0.14, gain: 0.22 * v, delay: 0.17, bus: this.musicBus });
        if (d.chasing) this.tone({ f0: NOTE(45), dur: 0.3, gain: 0.05, type: 'sawtooth', lp: 500, bus: this.musicBus });
        d.beatNext = now + gap;
      }
    }
  }

  stopDrone() {
    const d = this.drone;
    if (!d) return;
    this.drone = null;
    clearInterval(d.timer);
    const ctx = this.ctx;
    d.g.gain.cancelScheduledValues(ctx.currentTime);
    d.g.gain.setValueAtTime(Math.max(0.0001, d.g.gain.value), ctx.currentTime);
    d.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
    for (const n of d.nodes) n.stop(ctx.currentTime + 0.9);
  }

  setThreat(dist, chasing) {
    if (!this.drone) return;
    this.drone.threat = dist;
    this.drone.chasing = chasing;
  }

  setHum(on, pitch = 1) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    if (on && !this.hum) {
      const g = ctx.createGain();
      g.gain.value = 0.0001;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 700;
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      o1.type = o2.type = 'sawtooth';
      o1.frequency.value = 110 * pitch;
      o2.frequency.value = 111.5 * pitch;
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = 7;
      lg.gain.value = 0.02;
      lfo.connect(lg).connect(g.gain);
      o1.connect(f);
      o2.connect(f);
      f.connect(g).connect(this.sfx);
      [o1, o2, lfo].forEach((o) => o.start());
      g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.1);
      this.hum = { g, nodes: [o1, o2, lfo] };
    } else if (!on && this.hum) {
      const h = this.hum;
      this.hum = null;
      h.g.gain.cancelScheduledValues(ctx.currentTime);
      h.g.gain.setValueAtTime(h.g.gain.value, ctx.currentTime);
      h.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      h.nodes.forEach((o) => o.stop(ctx.currentTime + 0.2));
    }
  }

  // -- generative music -------------------------------------------------------------

  startMusic(seed) {
    if (!this.ctx) return;
    this.stopMusic();
    if (String(seed).startsWith('horror')) {
      this.startDrone();
      this.music = { timer: 0, drone: true };
      return;
    }
    const rng = new RNG(`${seed}:music`);
    const root = 48 + rng.pick([0, 2, 3, 5, 7, 9]);
    const major = [0, 2, 4, 5, 7, 9, 11];
    const progressions = [[0, 4, 5, 3], [0, 5, 3, 4], [5, 3, 0, 4], [0, 3, 5, 4], [3, 4, 0, 5]];
    const prog = rng.pick(progressions);
    const bpm = rng.range(86, 100);
    const beat = 60 / bpm;
    const triad = (deg) => [0, 2, 4].map((k) => {
      const d = deg + k;
      return root + major[d % 7] + 12 * Math.floor(d / 7);
    });
    const arpPattern = rng.pick([[0, 1, 2, 1, 0, 2, 1, 2], [0, 2, 1, 2, 0, 2, 1, 0], [0, 1, 2, 3, 2, 1, 2, 1]]);
    const melody = [];
    let deg = rng.int(7, 11);
    for (let i = 0; i < 32; i++) {
      deg += rng.pick([-2, -1, -1, 0, 1, 1, 2]);
      deg = Math.max(5, Math.min(14, deg));
      melody.push(rng.chance(0.62) ? deg : null);
    }
    const m = { step: 0, next: this.ctx.currentTime + 0.15, prog, triad, arpPattern, melody, beat, root, major };
    m.timer = setInterval(() => this.scheduleMusic(m), 30);
    this.music = m;
  }

  stopMusic() {
    if (this.music) clearInterval(this.music.timer);
    this.music = null;
    this.stopDrone();
  }

  note(midi, t, dur, gain, type = 'triangle', opts = {}) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = NOTE(midi);
    if (opts.detune) osc.detune.value = opts.detune;
    const g = ctx.createGain();
    const a = opts.attack ?? 0.008;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let last = g;
    if (opts.lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = opts.lp;
      g.connect(f);
      last = f;
    }
    osc.connect(g);
    last.connect(this.musicBus);
    if (opts.verb) {
      const s = ctx.createGain();
      s.gain.value = opts.verb;
      last.connect(s).connect(this.reverb);
    }
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  scheduleMusic(m) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const eighth = m.beat / 2;
    while (m.next < ctx.currentTime + 0.25) {
      const t = m.next;
      const s = m.step;
      const bar = Math.floor(s / 8);
      const inBar = s % 8;
      const chord = m.triad(m.prog[bar % m.prog.length]);
      // Pad on each bar
      if (inBar === 0) {
        for (const n of chord) {
          this.note(n + 12, t, eighth * 8.5, 0.022, 'sine', { attack: 0.5, verb: 0.5 });
          this.note(n + 12, t, eighth * 8.5, 0.012, 'triangle', { attack: 0.6, detune: 7, lp: 1200 });
        }
        this.note(chord[0] - 12, t, eighth * 3.5, 0.09, 'sine', { attack: 0.02 });
      }
      if (inBar === 4) this.note(chord[0] - 12, t, eighth * 3.5, 0.07, 'sine', { attack: 0.02 });
      if (inBar === 6 && bar % 2 === 1) this.note(chord[2] - 12, t, eighth * 1.5, 0.05, 'sine', { attack: 0.02 });
      // Music-box arpeggio
      const ai = m.arpPattern[inBar];
      const an = ai < 3 ? chord[ai] + 24 : chord[0] + 36;
      this.note(an, t, 0.6, 0.035, 'triangle', { verb: 0.45 });
      this.note(an + 12, t, 0.25, 0.008, 'sine');
      // Melody every other phrase
      if (Math.floor(bar / 4) % 2 === 1 && inBar % 2 === 0) {
        const md = m.melody[(bar % 4) * 4 + inBar / 2 + (Math.floor(bar / 8) % 2) * 16];
        if (md !== null && md !== undefined) {
          const n = m.root + 12 + m.major[md % 7] + 12 * Math.floor(md / 7);
          this.note(n, t, eighth * 2.2, 0.05, 'sine', { verb: 0.5, attack: 0.01 });
          this.note(n, t, eighth * 1.2, 0.015, 'square', { lp: 1800 });
        }
      }
      // Soft percussion
      if (inBar % 2 === 1) this.noiseAt(t, 0.04, 0.012, 7000);
      if (inBar === 0 || inBar === 4) this.kickAt(t);
      m.next += eighth;
      m.step++;
    }
  }

  noiseAt(t, dur, gain, freq) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.musicBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  kickAt(t) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.14);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g).connect(this.musicBus);
    o.start(t);
    o.stop(t + 0.2);
  }
}
