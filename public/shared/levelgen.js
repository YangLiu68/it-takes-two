// Procedural level generator. Pure data, no three.js: the server imports this
// too, so it can run the puzzle logic for the exact level the clients render.
//
// A level is a chain of "segments" (puzzle templates) joined by square hubs.
// Each hub is a checkpoint and may turn the path left or right. Segments are
// built in a local frame (entry at the origin, forward = +Z) and transformed
// into the world once a non-overlapping heading has been found.

import { RNG, hashString } from './rng.js';
import { PHYS, jumpReach, MAX_BOOST_HEIGHT, MAX_GAP } from './constants.js';

export const THEMES = [
  {
    key: 'playroom',
    names: ['Playroom', 'Toy Box', 'Nursery', 'Block Tower'],
    skyTop: '#4f9dff', skyHorizon: '#ffc9a0', skyBottom: '#ffe2cc',
    fog: '#f3cdb6', fogDensity: 0.0055,
    sun: '#fff0d4', sunIntensity: 3.0,
    hemiSky: '#cfe4ff', hemiGround: '#f0c4a8', hemiIntensity: 1.25,
    blocks: ['#ff8a7a', '#ffc94d', '#6fd6b0', '#7cc4f2', '#b79cf2', '#ff9f5a'],
    wood: '#e2b07a', felt: '#f46a8a', metal: '#c3cbd6', cloud: '#ffffff',
  },
  {
    key: 'twilight',
    names: ['Dream Attic', 'Starlight Shelf', 'Night Light', 'Moon Nursery'],
    skyTop: '#26206b', skyHorizon: '#ff8fb3', skyBottom: '#ffc6a8',
    fog: '#c88bb4', fogDensity: 0.0065,
    sun: '#ffd1e8', sunIntensity: 2.4,
    hemiSky: '#9c8cff', hemiGround: '#ff9fb2', hemiIntensity: 1.1,
    blocks: ['#5ee0d6', '#ff6fb5', '#ffd25e', '#8f7bff', '#5ab4ff', '#ff9a6b'],
    wood: '#c99a74', felt: '#7b6cff', metal: '#b9b6d8', cloud: '#ffe3f1',
  },
  {
    key: 'garden',
    names: ['Garden Shed', 'Greenhouse', 'Treehouse', 'Flowerpot'],
    skyTop: '#55b8ff', skyHorizon: '#d4f0c2', skyBottom: '#eef6cc',
    fog: '#cde6bf', fogDensity: 0.0055,
    sun: '#fff6cf', sunIntensity: 3.1,
    hemiSky: '#d8f0ff', hemiGround: '#c8d99a', hemiIntensity: 1.25,
    blocks: ['#8ed16f', '#f2a65a', '#f5d76e', '#6cc3c9', '#e57a7a', '#b8a2e3'],
    wood: '#c8925a', felt: '#5fbf77', metal: '#c6cfc4', cloud: '#ffffff',
  },
  {
    key: 'candy',
    names: ['Candy Shop', 'Candy Jar', 'Cookie Tin', 'Frosting Rack'],
    skyTop: '#ff9ccf', skyHorizon: '#ffd6ea', skyBottom: '#ffcfe6',
    fog: '#fcc9e0', fogDensity: 0.006,
    sun: '#fff4fa', sunIntensity: 2.9,
    hemiSky: '#ffe2f2', hemiGround: '#c9b5ff', hemiIntensity: 1.3,
    blocks: ['#ff7eb6', '#7ee0ff', '#fff07a', '#a98bff', '#7affc4', '#ffb27a'],
    wood: '#f0c08c', felt: '#ff5fa2', metal: '#d8cfe6', cloud: '#fff6fb',
  },
  {
    key: 'workshop',
    names: ['Workshop', 'Sewing Basket', 'Clockworks', 'Workbench'],
    skyTop: '#3b6fb6', skyHorizon: '#ffcf8a', skyBottom: '#ffe9c4',
    fog: '#f2cf9e', fogDensity: 0.006,
    sun: '#ffe2b0', sunIntensity: 3.2,
    hemiSky: '#bcd6ff', hemiGround: '#e7b37e', hemiIntensity: 1.15,
    blocks: ['#e86f51', '#f4b942', '#3fa7a3', '#5d8ad6', '#c46fb3', '#8fbf4d'],
    wood: '#c98d55', felt: '#d9534f', metal: '#d0b48a', cloud: '#fff8ee',
  },
  {
    key: 'frost',
    names: ['Snow Globe', 'Ice Rink', 'Freezer Shelf', 'Frosty Window'],
    skyTop: '#6fb2ff', skyHorizon: '#e3f3ff', skyBottom: '#f3faff',
    fog: '#d6e9f7', fogDensity: 0.006,
    sun: '#ffffff', sunIntensity: 3.0,
    hemiSky: '#e4f2ff', hemiGround: '#b4cbe4', hemiIntensity: 1.3,
    blocks: ['#7cc8ff', '#a99bff', '#6fe0cc', '#ff9fc4', '#8fa8ff', '#ffd27a'],
    wood: '#d9b48c', felt: '#5b8def', metal: '#cfd8e3', cloud: '#ffffff',
  },
  {
    key: 'bath',
    names: ['Bubble Tub', 'Fish Tank', 'Duck Pond', 'Sink Harbor'],
    skyTop: '#2fa6d9', skyHorizon: '#bff0ef', skyBottom: '#e4fbf6',
    fog: '#b8e6e4', fogDensity: 0.006,
    sun: '#fffbe6', sunIntensity: 3.0,
    hemiSky: '#d0f4ff', hemiGround: '#9fd8cc', hemiIntensity: 1.25,
    blocks: ['#ffd84d', '#ff7a7a', '#4fc3e8', '#7be0a8', '#ff9ccf', '#9d8cff'],
    wood: '#e6c08f', felt: '#2fb5c9', metal: '#c4d6dc', cloud: '#ffffff',
  },
  {
    key: 'ember',
    names: ['Lantern Market', 'Toy Volcano', 'Fireside', 'Cocoa Kitchen'],
    skyTop: '#5a1f4f', skyHorizon: '#ff8a4c', skyBottom: '#ffc07a',
    fog: '#e88a66', fogDensity: 0.0065,
    sun: '#ffc58a', sunIntensity: 3.0,
    hemiSky: '#ffb3a0', hemiGround: '#b5524a', hemiIntensity: 1.2,
    blocks: ['#ff6b4a', '#ffb84d', '#ffe066', '#d65db1', '#8f6bff', '#4fd1c5'],
    wood: '#b8784a', felt: '#e0483e', metal: '#c9a98f', cloud: '#ffe0cc',
  },
  {
    key: 'space',
    names: ['Toy Rocket', 'Star Station', 'Moon Base', 'Comet Shelf'],
    skyTop: '#140a3a', skyHorizon: '#5b3fa8', skyBottom: '#2a1a5e',
    fog: '#3a2c78', fogDensity: 0.006,
    sun: '#d7d2ff', sunIntensity: 2.4,
    hemiSky: '#9c8cff', hemiGround: '#4b3a8a', hemiIntensity: 1.85, stars: true,
    blocks: ['#ff6fd8', '#5ee7ff', '#ffe45e', '#8fff9c', '#ff9a5e', '#b28cff'],
    wood: '#a8a0d0', felt: '#6c5ce7', metal: '#c7c9e6', cloud: '#b7a8ff',
  },
];

const ADJECTIVES = ['Wobbly', 'Toasty', 'Messy', 'Sparkly', 'Bouncy', 'Sleepy', 'Topsy-Turvy', 'Velvet', 'Creaky', 'Dizzy', 'Fuzzy', 'Breezy'];

const QUAD = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // [cos, sin] per quarter turn

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

class Xf {
  constructor(o, q) {
    this.o = o;
    this.q = ((q % 4) + 4) % 4;
    [this.c, this.s] = QUAD[this.q];
    this.yaw = (this.q * Math.PI) / 2;
  }
  p(x, y, z) {
    return [this.o[0] + x * this.c + z * this.s, this.o[1] + y, this.o[2] - x * this.s + z * this.c];
  }
  v(v) {
    return [v[0] * this.c + v[2] * this.s, v[1], -v[0] * this.s + v[2] * this.c];
  }
}

// ---------------------------------------------------------------------------
// Segment builder: everything here is in local coordinates.

// `d` (0..1) is the puzzle's base difficulty. `h` ("heat", 0..1) keeps rising
// level after level once `d` tops out: more pieces, smaller platforms, faster
// machines and extra hazards, always within what the jump physics can clear.
export class Seg {
  constructor(gen, type, rng, d, h = 0) {
    this.gen = gen;
    this.type = type;
    this.rng = rng;
    this.d = d;
    this.h = h;
    this.tw = gen.twist ? gen.twist.key : null;
    this.tempo = 1 + 0.2 * h + (this.tw === 'speedy' ? 0.1 : 0);
    // How much to shrink platforms by.
    this.shrink = 0.35 * h + (this.tw === 'tiny' ? 0.3 : 0);
    this.coop = false;
    this.hint = '';
    this.solids = [];
    this.movers = [];
    this.plates = [];
    this.switches = [];
    this.acts = [];
    this.pads = [];
    this.seesaws = [];
    this.bouncers = [];
    this.fields = [];
    this.gems = [];
    this.signs = [];
    this.wires = [];
    this.blinks = [];
    this.crumbles = [];
    this.pendulums = [];
    this.conveyors = [];
    this.fans = [];
    this.exitZ = 0;
    this.exitY = 0;
  }

  id(prefix) {
    return this.gen.newId(prefix);
  }

  color() {
    return this.rng.pick(this.gen.theme.blocks);
  }

  box(x, y, z, sx, sy, sz, o = {}) {
    const it = {
      id: this.id('s'), x, y, z, sx, sy, sz,
      yaw: o.yaw || 0,
      mat: o.mat || 'toy',
      color: o.color || (o.mat === 'wood' ? this.gen.theme.wood : o.mat === 'metal' ? this.gen.theme.metal : this.color()),
    };
    if (o.deep) it.deep = true;
    if (o.ice) it.ice = true; // slippery: you keep sliding
    this.solids.push(it);
    return it;
  }

  // Platform described by its top surface.
  plat(x, top, z, w, d, t = 1.4, o = {}) {
    return this.box(x, top - t / 2, z, w, t, d, { ...o, deep: t > 4 || o.deep });
  }

  mover(sx, sy, sz, motion, o = {}) {
    if (!o.steady) {
      if (motion.period) motion.period /= this.tempo;
      if (motion.speed) motion.speed *= this.tempo;
    }
    const it = {
      id: this.id('m'), sx, sy, sz,
      yaw: o.yaw || 0,
      mat: o.mat || 'toy',
      color: o.color || this.color(),
      motion,
    };
    if (o.hazard) it.hazard = o.hazard;
    this.movers.push(it);
    return it;
  }

  plate(x, top, z) {
    const id = this.id('p');
    this.plates.push({ id, x, y: top, z, w: 2.4, d: 2.4, yaw: 0 });
    return id;
  }

  pswitch(x, top, z, latch, duration = 1, color = null) {
    const id = this.id('w');
    const w = { id, x, y: top, z, yaw: 0, latch, duration };
    if (color) w.color = color;
    this.switches.push(w);
    return id;
  }

  // An actuator: parts move by `move` while the condition holds.
  act(style, when, latch, parts, o = {}) {
    const id = this.id('a');
    this.acts.push({
      id, style, when, latch,
      speed: o.speed || 6,
      mat: o.mat || 'metal',
      color: o.color || this.gen.theme.metal,
      x: o.lamp ? o.lamp[0] : parts[0].x,
      y: o.lamp ? o.lamp[1] : parts[0].y,
      z: o.lamp ? o.lamp[2] : parts[0].z,
      yaw: 0,
      parts: parts.map((p) => ({ yaw: 0, delay: 0, ...p })),
    });
    return id;
  }

  pad(x, y, z, n, pol, o = {}) {
    const id = this.id('g');
    this.pads.push({
      id, x, y, z, n, pol, yaw: 0,
      launch: o.launch || null,
      reach: o.reach || 2.4,
    });
    return id;
  }

  seesaw(x, top, z, len, w) {
    const id = this.id('e');
    this.seesaws.push({ id, x, y: top, z, len, w, yaw: 0 });
    return id;
  }

  bouncer(x, top, z, r) {
    const id = this.id('b');
    this.bouncers.push({ id, x, y: top, z, r, yaw: 0 });
    return id;
  }

  field(x, y, z, sx, sy, sz, pol) {
    const id = this.id('f');
    this.fields.push({ id, x, y, z, sx, sy, sz, yaw: 0, pol });
    return id;
  }

  gem(x, y, z) {
    this.gems.push({ id: this.id('c'), x, y, z, yaw: 0 });
  }

  // Solid only during its half of the cycle; group 0 and 1 alternate.
  blink(x, top, z, w, d, group, period, t = 0.8) {
    period /= 1 + (this.tempo - 1) * 0.6;
    this.blinks.push({ id: this.id('k'), x, y: top - t / 2, z, sx: w, sy: t, sz: d, yaw: 0, group, period });
  }

  // Falls a moment after someone stands on it, then comes back.
  crumble(x, top, z, w, d, t = 0.8) {
    this.crumbles.push({ id: this.id('r'), x, y: top - t / 2, z, sx: w, sy: t, sz: d, yaw: 0 });
  }

  // Swings across local x around a pivot. Head is a hazard.
  pendulum(x, y, z, len, amp, period, phase, head) {
    period /= this.tempo;
    this.pendulums.push({ id: this.id('h'), x, y, z, len, amp, period, phase, hx: head[0] / 2, hy: head[1] / 2, hz: head[2] / 2, yaw: 0 });
  }

  // Belt surface; dir is the local direction it carries you: [dx, dz].
  conveyor(x, top, z, w, d, speed, dir) {
    // Capped so a belt running against you can still be outrun.
    speed *= Math.min(this.tempo, 1.1);
    this.conveyors.push({ id: this.id('v'), x, y: top - 0.35, z, sx: w, sy: 0.7, sz: d, yaw: 0, speed, beltYaw: Math.atan2(dir[0], dir[1]) });
  }

  // Updraft column above (x, top, z). when: signals that power it (null = always on).
  fan(x, top, z, r, h, strength, when = null) {
    this.fans.push({ id: this.id('n'), x, y: top, z, r, h, strength, when, yaw: 0 });
  }

  // Signs teach a mechanic the first time it shows up in a level.
  sign(x, y, z, text) {
    if (this.firstOfType) this.signs.push({ x, y, z, yaw: Math.PI, text });
  }

  wire(sig, pts) {
    this.wires.push({ sig, pts });
  }

  exit(z, y) {
    this.exitZ = z;
    this.exitY = y;
  }

  // Local-space bounds used for overlap tests.
  bounds() {
    const b = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity, y0: Infinity, y1: -Infinity };
    const add = (x, y, z, hx, hy, hz) => {
      b.x0 = Math.min(b.x0, x - hx); b.x1 = Math.max(b.x1, x + hx);
      b.z0 = Math.min(b.z0, z - hz); b.z1 = Math.max(b.z1, z + hz);
      if (y !== null) {
        b.y0 = Math.min(b.y0, y - hy); b.y1 = Math.max(b.y1, y + hy);
      }
    };
    for (const s of this.solids) add(s.x, s.deep ? null : s.y, s.z, s.sx / 2, s.sy / 2, s.sz / 2);
    for (const m of this.movers) {
      const r = Math.hypot(m.sx, m.sz) / 2;
      const mo = m.motion;
      if (mo.type === 'linear') {
        add(mo.a[0], mo.a[1], mo.a[2], r, m.sy / 2, r);
        add(mo.b[0], mo.b[1], mo.b[2], r, m.sy / 2, r);
      } else if (mo.type === 'orbit') {
        add(mo.center[0], mo.center[1], mo.center[2], mo.radius + r, m.sy / 2, mo.radius + r);
      } else {
        add(mo.center[0], mo.center[1], mo.center[2], r, m.sy / 2, r);
      }
    }
    for (const g of this.gems) add(g.x, g.y, g.z, 0.5, 0.5, 0.5);
    for (const b of [...this.blinks, ...this.crumbles, ...this.conveyors]) add(b.x, b.y, b.z, b.sx / 2, b.sy / 2, b.sz / 2);
    for (const p of this.pendulums) add(p.x, p.y, p.z, p.len, p.len, p.hz + 1);
    for (const f of this.fans) add(f.x, f.y + f.h / 2, f.z, f.r, f.h / 2, f.r);
    for (const a of this.acts) for (const p of a.parts) add(p.x, null, p.z, p.sx / 2, 0, p.sz / 2);
    if (b.y0 === Infinity) { b.y0 = 0; b.y1 = 0; }
    b.y1 = Math.max(b.y1, this.exitY + 2);
    return b;
  }
}

// ---------------------------------------------------------------------------
// Segment templates. Movement limits come from PHYS so they stay solvable.

const SEGMENTS = {
  stones(s) {
    const { rng, d, h } = s;
    s.hint = 'Hop across the floating blocks. Press Space again in mid-air to double jump!';
    s.sign(0, 3.4, 1.2, 'Space: jump\nSpace twice: double jump');
    let z = 0, y = 0, x = 0, prevW = 10;
    const n = rng.int(4, 6) + (d > 0.6 ? 1 : 0) + Math.floor(2 * h);
    const crumbly = 0.3 * h + (s.tw === 'crumbly' ? 0.4 : 0);
    for (let i = 0; i < n; i++) {
      const size = clamp(lerp(4.4, 2.7, d) + rng.range(-0.3, 0.5) - s.shrink, 2.2, 4.8);
      let dy = rng.range(-1.4, 2.0);
      if (y + dy > 6) dy = -rng.range(0.6, 1.6);
      if (y + dy < -4) dy = rng.range(0.6, 1.6);
      const maxGap = jumpReach(Math.max(0, dy)) * 0.55;
      const gap = clamp(lerp(2.2, 4.6, d) + rng.range(-0.4, 0.9), 1.4, maxGap);
      let nx = clamp(x + rng.range(-3.6, 3.6), -5.5, 5.5);
      let gx = Math.max(0, Math.abs(nx - x) - (size + prevW) / 2);
      if (gx > gap * 0.7) {
        nx = x + Math.sign(nx - x) * ((size + prevW) / 2 + gap * 0.6);
        gx = Math.max(0, Math.abs(nx - x) - (size + prevW) / 2);
      }
      const gz = Math.sqrt(Math.max(0.25, gap * gap - gx * gx));
      const zc = z + gz + size / 2;
      y += dy;
      if (d > 0.3 && rng.chance(0.25 + 0.15 * h)) {
        s.mover(size + 0.6, 0.9, size + 0.6, {
          type: 'spin', center: [nx, y - 0.45, zc], speed: rng.range(0.5, 0.9) * rng.sign(), phase: rng.range(0, 6.28),
        });
      } else if (crumbly > 0 && rng.chance(crumbly)) {
        s.crumble(nx, y, zc, size, size);
      } else if (rng.chance(0.55)) {
        s.plat(nx, y, zc, size, size, 16);
      } else {
        s.plat(nx, y, zc, size, size, 1.4);
      }
      if (rng.chance(0.3)) s.gem(nx, y + 3.3, zc);
      z = zc + size / 2;
      x = nx;
      prevW = size;
    }
    const dyE = rng.range(-1, 1.5);
    const gapE = clamp(lerp(2.0, 3.8, d), 1.5, jumpReach(Math.max(0, dyE)) * 0.55);
    s.plat(0, y + dyE, z + gapE + 2.5, 8, 5, 1.4, { mat: 'wood' });
    s.exit(z + gapE + 5, y + dyE);
  },

  movers(s) {
    const { rng, d, h } = s;
    const v = rng.pick(['lateral', 'shuttle', 'orbit', 'vertical']);
    if (v === 'lateral') {
      s.hint = 'Time it right and hop onto the sliding platforms.';
      const k = rng.int(2, 3) + (d > 0.55 ? 1 : 0) + (h > 0.5 ? 1 : 0);
      const size = Math.max(2.6, lerp(4.2, 3.2, d) - s.shrink);
      const period = lerp(6.5, 4.4, d) + rng.range(-0.3, 0.4);
      let z = 0;
      for (let i = 0; i < k; i++) {
        const zc = z + rng.range(1.8, 2.7) + size / 2;
        const amp = rng.range(3, 5);
        s.mover(size, 0.8, size, { type: 'linear', a: [-amp, -0.4, zc], b: [amp, -0.4, zc], period, phase: (i % 2) * 0.5 });
        if (i === 1) s.gem(amp, 2.8, zc);
        z = zc + size / 2;
      }
      s.plat(0, 0, z + 2.2 + 2.5, 8, 5, 1.4, { mat: 'wood' });
      s.exit(z + 2.2 + 5, 0);
    } else if (v === 'shuttle') {
      s.hint = 'Ride the moving platform across the gap.';
      const L = lerp(13, 20, d) + rng.range(0, 3);
      const size = 4.6;
      s.mover(size, 0.8, size, {
        type: 'linear', a: [0, -0.4, 0.5 + size / 2], b: [0, -0.4, L - 0.5 - size / 2], period: L / 2.2 + 2, phase: 0,
      });
      if (d > 0.45) {
        // A slow sweeping bar across the shuttle's path (two when it gets hard).
        const two = h > 0.4 || s.tw === 'hammer';
        const zs = two ? [L * 0.32, L * 0.68] : [L / 2];
        const period = rng.range(3.2, 4.4);
        zs.forEach((zb, j) => s.mover(0.7, 0.7, 9, {
          type: 'linear', a: [-6, 1.0, zb], b: [6, 1.0, zb], period, phase: 0.25 + j * 0.5,
        }, { mat: 'hazard', color: '#ff5d5d', hazard: 'push' }));
      }
      s.gem(0, 3.6, L / 2);
      s.plat(0, 0, L + 2.5, 8, 5, 1.4, { mat: 'wood' });
      s.exit(L + 5, 0);
    } else if (v === 'orbit') {
      s.hint = 'Hop on the turntable, ride it around and jump off on the far side.';
      const R = rng.range(5, 6.5);
      const n = Math.max(3, rng.int(3, 4) - (h > 0.5 ? 1 : 0));
      const size = Math.max(2.8, 3.4 - s.shrink);
      const speed = lerp(0.45, 0.75, d) * rng.sign();
      const zc = R + size / 2 + 0.9;
      const ph = rng.range(0, Math.PI * 2);
      for (let i = 0; i < n; i++) {
        s.mover(size, 0.8, size, { type: 'orbit', center: [0, -0.4, zc], radius: R, speed, phase: ph + (i * Math.PI * 2) / n });
      }
      s.plat(0, 3.0, zc, 2.2, 2.2, 22, { mat: 'wood' });
      s.gem(0, 4.4, zc);
      const ze = zc + R + size / 2 + 0.9;
      s.plat(0, 0, ze + 2.5, 8, 5, 1.4, { mat: 'wood' });
      s.exit(ze + 5, 0);
    } else {
      s.hint = 'Ride the lifts up — jump across when they line up.';
      const k = rng.int(3, 4) + Math.floor(1.6 * h);
      const size = Math.max(2.8, 3.6 - s.shrink);
      const period = lerp(5.2, 3.9, d);
      let z = 0;
      for (let i = 0; i < k; i++) {
        const zc = z + 1.6 + size / 2;
        const base = i * 2.4 - 1.2;
        s.mover(size, 0.8, size, { type: 'linear', a: [0, base - 0.4, zc], b: [0, base + 3.6 - 0.4, zc], period, phase: i * 0.32 });
        z = zc + size / 2;
      }
      const top = (k - 1) * 2.4 + 2.4 + 0.8;
      s.gem(0, top + 1.5, z - size / 2);
      s.plat(0, top, z + 1.8 + 2.5, 8, 5, 1.4, { mat: 'wood' });
      s.exit(z + 1.8 + 5, top);
    }
  },

  sweeper(s) {
    const { rng, d, h } = s;
    s.hint = 'Jump over the spinning bars — if one sweeps you, you fall!';
    const A = 15;
    s.plat(0, 0, A / 2, A, A, 1.6, { mat: 'wood' });
    s.box(0, 1.25, A / 2, 1.6, 2.5, 1.6, { mat: 'metal' });
    // Not sped up by tempo: much faster and the bars come round too often to jump.
    const speed = lerp(1.3, 2.3, d) * (1 + 0.15 * h + (s.tw === 'hammer' ? 0.08 : 0)) * rng.sign();
    const bars = d > 0.5 ? 2 : 1;
    for (let b = 0; b < bars; b++) {
      s.mover(13.2, 0.7, 0.7, { type: 'spin', center: [0, 0.62, A / 2], speed, phase: (b * Math.PI) / 2 }, {
        mat: 'hazard', color: '#ff5d5d', hazard: 'push', steady: true,
      });
    }
    s.gem(0, 3.6, A / 2);
    s.exit(A, 0);
  },

  bounce(s) {
    const { rng, h } = s;
    s.hint = 'Bounce on the drums! Press C (ground pound) as you land to bounce higher.';
    s.sign(0, 3.4, 1.2, 'Drums bounce you up\nPress C to pound');
    let x = 0, y = 0, z = 0;
    const n = rng.int(3, 4) + Math.floor(2 * h);
    const r = Math.max(1.05, 1.35 - 0.25 * h - (s.tw === 'tiny' ? 0.15 : 0));
    for (let i = 0; i < n; i++) {
      z += i === 0 ? 3.7 : rng.range(4.6, 5.6);
      if (i > 0) y += rng.range(2.2, 3.2);
      x = clamp(x + rng.range(-2.5, 2.5), -4, 4);
      s.bouncer(x, y + 0.5, z, r);
      s.box(x, y + 0.15 - 8, z, 1.4, 16, 1.4, { mat: 'wood', deep: true });
      if (i === n - 2) s.gem(x, y + 0.5 + 8.2, z);
    }
    const top = y + 0.5 + rng.range(2.0, 2.8);
    const ze = z + 3.4;
    s.plat(0, top, ze + 2.5, 8, 5, 1.4, { mat: 'wood' });
    s.exit(ze + 5, top);
  },

  plateDoor(s) {
    const { rng } = s;
    s.coop = true;
    s.hint = 'Co-op: stand on the plate to hold the door open for your partner.';
    s.sign(0, 3.4, 1.2, 'Plates open doors —\nbut only while stood on');
    const W = 12, L = 18, H = 8, dz = 9, dw = 4, dh = 5;
    s.plat(0, 0, L / 2, W, L, 1.4, { mat: 'wood' });
    const wallColor = s.color();
    s.box(-(W / 2 + 0.5), (H - 1.4) / 2, L / 2, 1, H + 1.4, L - 2, { color: wallColor });
    s.box(W / 2 + 0.5, (H - 1.4) / 2, L / 2, 1, H + 1.4, L - 2, { color: wallColor });
    const crossColor = s.color();
    s.box(-(W / 2 + dw / 2) / 2, (H + 0.4) / 2, dz, W / 2 - dw / 2, H + 0.4, 1, { color: crossColor });
    s.box((W / 2 + dw / 2) / 2, (H + 0.4) / 2, dz, W / 2 - dw / 2, H + 0.4, 1, { color: crossColor });
    s.box(0, dh + (H + 0.4 - dh) / 2, dz, dw, H + 0.4 - dh, 1, { color: crossColor });
    const flip = rng.sign();
    const A = s.plate(-3.5 * flip, 0, 5);
    const B = s.plate(3.5 * flip, 0, 13);
    s.act('door', { op: 'any', in: [A, B] }, false, [
      { x: 0, y: dh / 2, z: dz, sx: dw - 0.1, sy: dh, sz: 0.6, move: [0, -(dh + 0.3), 0] },
    ], { speed: 16, lamp: [0, dh + 0.5, dz - 0.55] });
    s.wire(A, [[-3.5 * flip, 0, 5], [-3.5 * flip, 0, 8.2], [-2.1 * flip, 0, 8.2]]);
    s.wire(B, [[3.5 * flip, 0, 13], [3.5 * flip, 0, 9.8], [2.1 * flip, 0, 9.8]]);
    s.gem(-4.6 * flip, 1.0, 16.4);
    s.exit(L, 0);
  },

  syncBridge(s) {
    const { rng, d } = s;
    s.coop = true;
    s.hint = 'Co-op: each stand on a button and press C (ground pound) at the same time to raise the bridge.';
    s.sign(0, 3.4, 1.2, 'One of you on each button —\npress C together!');
    s.plat(0, 0, 4, 14, 8, 1.6, { mat: 'wood' });
    const window = Math.max(0.6, lerp(1.0, 0.7, d) - 0.1 * s.h);
    const A = s.pswitch(-5, 0, 4.5, false, window);
    const B = s.pswitch(5, 0, 4.5, false, window);
    const gap = Math.max(MAX_GAP + 1.5, 16 + rng.range(0, 2));
    const planks = 6;
    const pl = gap / planks;
    const parts = [];
    for (let i = 0; i < planks; i++) {
      parts.push({ x: 0, y: -0.3 - 9, z: 8 + pl * (i + 0.5), sx: 4, sy: 0.6, sz: pl - 0.06, move: [0, 9, 0], delay: i * 0.12 });
    }
    s.act('bridge', { op: 'all', in: [A, B] }, true, parts, { speed: 16, lamp: [0, 0.6, 7.6], mat: 'toy', color: s.color() });
    s.wire(A, [[-5, 0, 4.5], [-5, 0, 7.3], [-1.8, 0, 7.3]]);
    s.wire(B, [[5, 0, 4.5], [5, 0, 7.3], [1.8, 0, 7.3]]);
    const fz = 8 + gap;
    s.plat(0, 0, fz + 4, 10, 8, 1.6, { mat: 'wood' });
    s.gem(0, 2.6, 8 + gap / 2);
    s.exit(fz + 8, 0);
  },

  launch(s) {
    const { rng } = s;
    s.coop = true;
    const pol = rng.sign();
    const who = pol > 0 ? 'Sol' : 'Luna';
    s.hint = `Co-op: ${who} can stand on the same-color magnet pad and hold E to bounce up, then stand on the plate up there to raise the lift.`;
    s.sign(0, 3.4, 1.2, `Same colors repel!\n${who}: stand on the pad, hold E`);
    const H = clamp(rng.range(6.8, 7.4), MAX_BOOST_HEIGHT + 1.0, 7.6);
    s.plat(0, 0, 5, 12, 10, 1.6, { mat: 'wood' });
    const side = rng.sign();
    const lx = 3.6 * side;
    const cliff = s.color();
    const cliffBox = (x0, x1, z0, z1) =>
      s.box((x0 + x1) / 2, (H - 1.6) / 2, (z0 + z1) / 2, x1 - x0, H + 1.6, z1 - z0, { color: cliff });
    // The cliff is split around a lift shaft.
    const sx0 = lx - 1.8, sx1 = lx + 1.8;
    cliffBox(-7, sx0, 10, 22);
    cliffBox(sx1, 7, 10, 22);
    cliffBox(sx0, sx1, 13.6, 22);
    s.pad(-3 * side, 0.08, 7.2, [0, 1, 0], pol, { launch: [0, PHYS.repelSpeed, 0] });
    const plate = s.plate(lx, H, 15.6);
    s.act('lift', { op: 'any', in: [plate] }, false, [
      { x: lx, y: -0.08, z: 11.8, sx: 3.4, sy: 0.4, sz: 3.4, move: [0, H - 0.12, 0] },
    ], { speed: 4.5, lamp: [lx, H + 0.2, 13.4] });
    s.gem(-3 * side, 7.8, 7.6);
    s.exit(22, H);
  },

  ceiling(s) {
    const { rng } = s;
    s.coop = true;
    const pol = rng.sign();
    const who = pol > 0 ? 'Luna' : 'Sol';
    s.hint = `Co-op: opposite colors attract — ${who} can swing between the ceiling magnets (hold E, let go, aim at the next one).`;
    s.sign(0, 3.4, 1.2, `Opposites attract!\n${who}: hold E under\nthe ceiling magnets`);
    const Lc = rng.range(19, 23);
    s.plat(0, 0, 3, 10, 6, 1.6, { mat: 'wood' });
    const far0 = 6 + Lc;
    s.plat(0, 0, far0 + 4, 10, 8, 1.6, { mat: 'wood' });
    const beamTop = 8.6, beamBot = 7.6;
    s.box(0, (beamTop + beamBot) / 2, (2 + far0 + 7) / 2, 2, beamTop - beamBot, far0 + 5, { mat: 'metal' });
    s.box(0, beamBot / 2, 1.4, 1.2, beamBot, 1.2, { mat: 'metal' });
    s.box(0, beamBot / 2, far0 + 6.6, 1.2, beamBot, 1.2, { mat: 'metal' });
    const spacing = rng.range(5.0, 5.6);
    for (let z = 8; ; z += spacing) {
      s.pad(0, beamBot - 0.02, z, [0, -1, 0], pol);
      if (z >= far0 + 0.5) break;
    }
    s.gem(0, 6.2, 6 + Lc / 2);
    const sw = s.pswitch(3, 0, far0 + 3, true);
    const planks = Math.ceil(Lc / 3);
    const pl = Lc / planks;
    const parts = [];
    for (let i = 0; i < planks; i++) {
      parts.push({ x: 0, y: -0.3 - 9, z: 6 + pl * (i + 0.5), sx: 3, sy: 0.6, sz: pl - 0.06, move: [0, 9, 0], delay: i * 0.1 });
    }
    s.act('bridge', { op: 'all', in: [sw] }, true, parts, { speed: 16, mat: 'toy', color: s.color(), lamp: [2, 0.5, far0 + 0.6] });
    s.sign(0, 3.0, far0 + 1.6, 'Pound this button\nto bring your partner over');
    s.exit(far0 + 8, 0);
  },

  cannon(s) {
    const { rng } = s;
    s.coop = true;
    const pol = rng.sign();
    const who = pol > 0 ? 'Sol' : 'Luna';
    s.hint = `Co-op: ${who} launches across from the magnet cannon. Once over, hold E to call your partner; when they hold E too, they fly across.`;
    s.sign(0, 3.4, 1.2, `${who}: hold E\non the cannon pad`);
    s.plat(0, 0, 5, 12, 10, 1.6, { mat: 'wood' });
    const Lb = Math.max(MAX_GAP + 2, rng.range(15.5, 16.5));
    const farZ = 10 + Lb;
    s.plat(0, 0, farZ + 6, 12, 12, 1.6, { mat: 'wood' });
    const D = farZ + 4 - 4.5;
    const vy = 17;
    const T = (2 * vy) / PHYS.gravity;
    s.pad(0, 0.08, 4.5, [0, 1, 0], pol, { launch: [0, vy, D / T] });
    s.sign(0, 3.2, farZ + 1.4, 'Partner pull:\nhold E here, then your\npartner holds E too');
    s.gem(0, 8.6, 4.5 + D / 2);
    s.exit(farZ + 12, 0);
  },

  seesaw(s) {
    const { rng } = s;
    s.coop = true;
    s.hint = 'Co-op: one of you stands on one end of the seesaw, the other presses C (ground pound) on the other end to launch them up!';
    s.sign(0, 3.4, 1.2, 'One stands on one end —\nthe other presses C\non the other end!');
    const H = rng.range(9, 10);
    s.plat(0, 0, 7, 14, 14, 1.6, { mat: 'wood' });
    const cliff = s.color();
    s.box(0, (H - 1.6) / 2, 19, 14, H + 1.6, 10, { color: cliff });
    s.seesaw(0, 1.0, 9, 9.2, 2.4);
    const k = Math.ceil(H / 1.9);
    const parts = [];
    for (let i = 0; i < k - 1; i++) {
      const top = (H * (i + 1)) / k;
      // Tucked well inside the cliff until the switch is pounded.
      parts.push({ x: -5.5 + i * 2.3, y: top - 0.4, z: 15.6, sx: 2.2, sy: 0.8, sz: 2, move: [0, 0, -2.6], delay: i * 0.15 });
    }
    const sw = s.pswitch(-4.5, H, 17.5, true);
    s.act('steps', { op: 'all', in: [sw] }, true, parts, { speed: 3, mat: 'toy', color: s.color(), lamp: [-4.5, H + 0.3, 14.4] });
    s.gem(3.4, 11.5, 11);
    s.exit(24, H);
  },

  lanes(s) {
    const { rng } = s;
    s.coop = true;
    s.hint = 'Co-op: split up! Each take the path of your own color, then pound the button that opens your partner\'s door.';
    s.sign(0, 3.6, 1.2, 'Split up! You can only pass\nbarriers of your own color');
    const Lc = rng.range(14, 19) + 4 * s.h;
    const endZ = 5 + Lc;
    const Ll = endZ + 6;
    const wallH = 7;
    s.plat(0, 0, 2.5, 19, 5, 1.6, { mat: 'wood' });
    const wc = s.color();
    s.box(-10, (wallH - 1.6) / 2, Ll / 2, 1, wallH + 1.6, Ll, { color: wc });
    s.box(10, (wallH - 1.6) / 2, Ll / 2, 1, wallH + 1.6, Ll, { color: wc });
    s.box(0, (wallH + 0.4 - 1.6) / 2, (5 + Ll) / 2, 1, wallH + 0.4 + 1.6, Ll - 5, { color: wc });
    s.field(-5, wallH / 2, 5, 9, wallH, 0.3, 1);
    s.field(5, wallH / 2, 5, 9, wallH, 0.3, -1);
    const doors = {};
    for (const side of [-1, 1]) {
      const cx = side * 5;
      const lr = rng.fork(`lane${side}`);
      s.plat(cx, 0, 6, 9, 2, 1.6, { mat: 'wood' });
      // Lane course: stepping stones or sliding platforms.
      let z = 7;
      if (lr.chance(0.5)) {
        let x = cx;
        const crumbly = 0.25 * s.h + (s.tw === 'crumbly' ? 0.35 : 0);
        while (z < endZ - 3.5) {
          const size = lr.range(2.6, 3.4) - 0.5 * s.h;
          const gap = lr.range(1.8, 3.0) + 0.6 * s.h;
          x = clamp(x + lr.range(-2, 2), cx - 2.6, cx + 2.6);
          const zc = Math.min(z + gap + size / 2, endZ - 1.8 - size / 2);
          const top = lr.range(-0.6, 0.8);
          if (crumbly > 0 && lr.chance(crumbly)) s.crumble(x, top, zc, size, size);
          else s.plat(x, top, zc, size, size, 16);
          z = zc + size / 2;
        }
      } else {
        while (z < endZ - 4) {
          const size = 3.2;
          const zc = Math.min(z + lr.range(1.6, 2.4) + size / 2, endZ - 1.8 - size / 2);
          s.mover(size, 0.8, size, {
            type: 'linear', a: [cx - 2.4, -0.4, zc], b: [cx + 2.4, -0.4, zc], period: lr.range(3.6, 5), phase: lr.range(0, 1),
          });
          z = zc + size / 2;
        }
      }
      s.plat(cx, 0, endZ + 3, 9, 6, 1.6, { mat: 'wood' });
      doors[side] = { cx };
    }
    const swL = s.pswitch(-5, 0, endZ + 3, true);
    const swR = s.pswitch(5, 0, endZ + 3, true);
    // Each lane's button opens the other lane's door.
    s.act('door', { op: 'all', in: [swR] }, true, [
      { x: -5, y: wallH / 2, z: Ll, sx: 8.9, sy: wallH, sz: 0.6, move: [0, -(wallH + 0.4), 0] },
    ], { speed: 10, lamp: [-5, wallH + 0.3, Ll - 0.4] });
    s.act('door', { op: 'all', in: [swL] }, true, [
      { x: 5, y: wallH / 2, z: Ll, sx: 8.9, sy: wallH, sz: 0.6, move: [0, -(wallH + 0.4), 0] },
    ], { speed: 10, lamp: [5, wallH + 0.3, Ll - 0.4] });
    s.plat(0, 0, Ll + 3, 19, 6, 1.6, { mat: 'wood' });
    s.gem(0, 1.2, Ll + 3);
    s.exit(Ll + 6, 0);
  },

  // ---- Timing & hazards -------------------------------------------------

  blink(s) {
    const { rng, d, h } = s;
    s.hint = 'Pink and cyan blocks take turns turning solid — jump across when they light up!';
    const period = lerp(3.4, 2.1, d) + rng.range(-0.15, 0.15);
    const n = rng.int(5, 7) + (d > 0.6 ? 1 : 0) + Math.floor(3 * h);
    let z = 0, x = 0, y = 0;
    for (let i = 0; i < n; i++) {
      const size = Math.max(2.4, lerp(3.8, 2.9, d) - s.shrink);
      const gap = rng.range(1.3, lerp(2.3, 3.1, d));
      x = clamp(x + rng.range(-2.6, 2.6), -4, 4);
      y = clamp(y + rng.range(-0.6, 1.1), -2, 4);
      const zc = z + gap + size / 2;
      s.blink(x, y, zc, size, size, i % 2, period);
      if (i === Math.floor(n / 2)) s.gem(x, y + 3.1, zc);
      z = zc + size / 2;
    }
    s.plat(0, y, z + 2.0 + 2.5, 8, 5, 1.4, { mat: 'wood' });
    s.exit(z + 2.0 + 5, y);
  },

  crumble(s) {
    const { rng, d, h } = s;
    s.hint = 'Cracked tiles fall soon after you land on them — keep moving! They come back after a few seconds.';
    const n = rng.int(7, 9) + (d > 0.5 ? 2 : 0) + Math.floor(4 * h);
    let z = 0, x = 0, y = 0;
    for (let i = 0; i < n; i++) {
      const size = Math.max(2.0, lerp(2.9, 2.3, d) - s.shrink * 0.6);
      const gap = rng.range(0.8, lerp(1.7, 2.6, d));
      x = clamp(x + rng.range(-2.2, 2.2), -4.5, 4.5);
      y = clamp(y + rng.range(-0.5, 0.8), -2, 3.5);
      const zc = z + gap + size / 2;
      if (i === Math.floor(n / 2)) {
        // One safe stone to catch your breath on.
        s.plat(x, y, zc, size + 0.6, size + 0.6, 16);
        s.gem(x, y + 1.3, zc);
      } else s.crumble(x, y, zc, size, size);
      z = zc + size / 2;
    }
    s.plat(0, y, z + 1.6 + 2.5, 8, 5, 1.4, { mat: 'wood' });
    s.exit(z + 1.6 + 5, y);
  },

  pendulum(s) {
    const { rng, d, h } = s;
    s.hint = 'Time your run past the swinging hammers — one hit knocks you off the bridge!';
    const L = rng.range(22, 28) + 6 * h;
    s.plat(0, 0, L / 2, 3.2 - 0.6 * h, L, 1.2, { mat: 'wood' });
    const count = rng.int(3, 4) + (d > 0.55 ? 1 : 0) + Math.floor(2 * h) + (s.tw === 'hammer' ? 1 : 0);
    const period = lerp(3.1, 2.2, d);
    const len = 6.4;
    const py = 0.95 + len;
    for (let k = 0; k < count; k++) {
      const zc = (L * (k + 1)) / (count + 1);
      s.pendulum(0, py, zc, len, rng.range(0.95, 1.15), period + rng.range(-0.2, 0.2), k * 0.31 + rng.range(0, 0.15), [1.4, 1.4, 2.0]);
      for (const side of [-1, 1]) s.box(side * 3.8, (py + 0.6 - 14) / 2, zc, 0.6, py + 14.6, 0.6, { mat: 'metal', deep: true });
      s.box(0, py + 0.3, zc, 8.2, 0.5, 0.6, { mat: 'metal' });
    }
    s.gem(0, 3.4, L * 0.5);
    s.plat(0, 0, L + 2.5, 8, 5, 1.4, { mat: 'wood' });
    s.exit(L + 5, 0);
  },

  conveyor(s) {
    const { rng, d, h } = s;
    s.hint = 'Conveyor belts drag you along — walk against them and mind the edges!';
    const n = rng.int(3, 4) + (d > 0.5 ? 1 : 0) + Math.floor(2 * h);
    let z = 0, y = 0;
    for (let i = 0; i < n; i++) {
      const len = rng.range(8, 11.5);
      const w = rng.range(3.6, 4.6) - 0.5 * h;
      const gap = i === 0 ? 1.2 : rng.range(1.5, 2.4);
      const kind = i === 0 ? 'against' : rng.pick(['against', 'side', 'side', 'with']);
      const speed = lerp(3.4, 6.0, d) * (kind === 'with' ? 0.8 : 1);
      const zc = z + gap + len / 2;
      const x = rng.range(-1.2, 1.2);
      const side = rng.sign();
      const dir = kind === 'against' ? [0, -1] : kind === 'with' ? [0, 1] : [side, 0];
      s.conveyor(x, y, zc, w, len, speed, dir);
      if (i === 1) s.gem(x, y + 2.6, zc);
      z = zc + len / 2;
      y += rng.range(-0.2, 0.9);
    }
    s.plat(0, y, z + 1.6 + 2.5, 8, 5, 1.4, { mat: 'wood' });
    s.exit(z + 1.6 + 5, y);
  },

  pistons(s) {
    const { rng, d, h } = s;
    s.hint = 'Dodge the pistons — they push you off the walkway!';
    const L = rng.range(24, 30) + 5 * h;
    s.plat(0, 0, L / 2, 4, L, 1.2, { mat: 'wood' });
    const count = rng.int(4, 5) + (d > 0.6 ? 1 : 0) + Math.floor(3 * h) + (s.tw === 'hammer' ? 1 : 0);
    const period = lerp(2.7, 1.8, d);
    for (let k = 0; k < count; k++) {
      const zc = 3.5 + (k * (L - 7)) / (count - 1);
      const side = k % 2 ? 1 : -1;
      s.mover(2.2, 1.3, 1.8, {
        type: 'linear', a: [side * 4.4, 0.7, zc], b: [side * 0.4, 0.7, zc], period: period + rng.range(-0.2, 0.3), phase: rng.range(0, 1),
      }, { mat: 'hazard', color: '#ff5d5d', hazard: 'push' });
      s.box(side * 5.2, (1.6 - 13) / 2, zc, 1.8, 14.6, 2.4, { mat: 'metal', deep: true });
    }
    s.gem(0, 1.2, L - 2);
    s.plat(0, 0, L + 2.5, 8, 5, 1.4, { mat: 'wood' });
    s.exit(L + 5, 0);
  },

  turntable(s) {
    const { rng, d, h } = s;
    s.hint = 'Hop from one spinning cross to the next!';
    const count = rng.int(2, 3) + (h > 0.4 ? 1 : 0);
    const arm = rng.range(10, 11.5);
    const R = arm / 2;
    let z = 0;
    for (let k = 0; k < count; k++) {
      const zc = z + 1.3 + R;
      const speed = lerp(0.42, 0.75, d) * (k % 2 ? -1 : 1) * rng.range(0.9, 1.1);
      const ph = rng.range(0, Math.PI);
      const color = s.color();
      s.mover(arm, 0.8, 2.6, { type: 'spin', center: [0, -0.4, zc], speed, phase: ph }, { color });
      s.mover(arm - 0.02, 0.78, 2.58, { type: 'spin', center: [0, -0.41, zc], speed, phase: ph + Math.PI / 2 }, { color });
      if (k === count - 1) s.gem(0, 1.6, zc);
      z = zc + R;
    }
    s.plat(0, 0, z + 1.3 + 2.5, 8, 5, 1.4, { mat: 'wood' });
    s.exit(z + 1.3 + 5, 0);
  },

  fanClimb(s) {
    const { rng, h } = s;
    s.hint = 'Ride the updrafts! Walk onto a fan to get blown up, then float over to the next platform.';
    const steps = rng.int(2, 3) + (h > 0.45 ? 1 : 0);
    s.plat(0, 0, 3, 10, 6, 1.4, { mat: 'wood' });
    let y = 0, z = 6;
    for (let i = 0; i < steps; i++) {
      const rise = rng.range(6.2, 8);
      const x = rng.range(-2, 2);
      s.plat(x, y + 0.25, z + 2.2, 3.4, 3.4, 1.2, { mat: 'metal' });
      s.fan(x, y + 0.25, z + 2.2, 1.5, rise + 1.2, 56);
      if (i === steps - 1) s.gem(x, y + rise + 2.6, z + 2.2);
      y += rise;
      s.plat(0, y, z + 4.4 + 3, 8, 6, 16, { mat: i % 2 ? 'wood' : 'toy' });
      z += 10.4;
    }
    s.exit(z, y);
  },

  tower(s) {
    const { rng, d, h } = s;
    s.hint = 'Climb the spiral tower — don\'t look down!';
    const R = 6.2;
    const n = 11;
    const H = lerp(15, 20, d) + rng.range(-1, 1) + 4 * h;
    const size = 3.1 - Math.min(0.5, s.shrink);
    // Every third step crumbles; every other one when it gets hard.
    const every = h > 0.5 || s.tw === 'crumbly' ? 2 : 3;
    const cz = R + 3.5;
    s.plat(0, H - 2.4, cz, 4.2, 4.2, H + 14, { deep: true });
    s.gem(0, H - 2.4 + 1.3, cz);
    const step = (H - 0.8) / (n - 1);
    const dir = rng.sign();
    let lastTop = 0;
    for (let k = 0; k < n; k++) {
      const th = -Math.PI / 2 + dir * k * ((Math.PI * 3) / (n - 1));
      const x = Math.cos(th) * R;
      const z = cz + Math.sin(th) * R;
      lastTop = 0.8 + k * step;
      if (d > 0.5 && k % every === every - 1 && k < n - 1) s.crumble(x, lastTop, z, size, size);
      else s.plat(x, lastTop, z, size, size, 1.6);
    }
    const ez = cz + R + 1.55 + 1.2;
    s.plat(0, lastTop + 0.8, ez + 2.5, 8, 5, 1.4, { mat: 'wood' });
    s.exit(ez + 5, lastTop + 0.8);
  },

  // ---- New co-op ----------------------------------------------------------

  rideControl(s) {
    const { rng, d } = s;
    s.coop = true;
    s.hint = 'Co-op: the platform moves while someone stands on the plate. Send your partner across first, then swap!';
    s.sign(0, 3.4, 1.2, 'The plate moves the platform —\ntake turns riding across!');
    const Lc = Math.max(MAX_GAP + 3, rng.range(18, 23));
    s.plat(0, 0, 4, 12, 8, 1.6, { mat: 'wood' });
    const far0 = 8 + Lc;
    s.plat(0, 0, far0 + 4, 12, 8, 1.6, { mat: 'wood' });
    const A = s.plate(-3.5, 0, 4.5);
    const B = s.plate(3.5, 0, far0 + 4);
    s.act('carrier', { op: 'any', in: [A, B] }, false, [
      { x: 0, y: -0.3, z: 8 + 2.3, sx: 4.2, sy: 0.6, sz: 4.2, move: [0, 0, Lc - 4.6] },
    ], { speed: lerp(3.4, 4.6, d), mat: 'toy', color: s.color(), lamp: [0, 0.6, 7.4] });
    s.wire(A, [[-3.5, 0, 4.5], [-3.5, 0, 7.3], [-1.2, 0, 7.3]]);
    if (d > 0.4) {
      const two = s.h > 0.35 || s.tw === 'hammer';
      const zs = two ? [8 + Lc * 0.3, 8 + Lc * 0.7] : [8 + Lc / 2];
      const period = rng.range(3, 4);
      for (const [j, zb] of zs.entries()) s.mover(0.7, 0.7, 10, { type: 'linear', a: [-6, 1.05, zb], b: [6, 1.05, zb], period, phase: 0.25 + j * 0.5 }, {
        mat: 'hazard', color: '#ff5d5d', hazard: 'push',
      });
    }
    s.gem(0, 2.4, 8 + Lc * 0.35);
    s.exit(far0 + 8, 0);
  },

  timedRace(s) {
    const { rng, d } = s;
    s.coop = true;
    s.hint = 'Co-op: one runs ahead to pound the far button (C) — the other dashes through before the door shuts!';
    s.sign(0, 3.6, 1.2, 'One pounds the far button —\nthe other runs for the door!');
    const Lr = rng.range(14, 17);
    const side = rng.sign();
    s.plat(0, 0, 3, 12, 6, 1.6, { mat: 'wood' });
    // A long spur out to the button, so nobody can press it and make the run alone.
    s.plat(side * 18.5, 0, 3, 25, 2, 1.2, { mat: 'wood' });
    s.plat(side * 33.5, 0, 3, 5, 5, 1.6, { mat: 'wood' });
    const gaps = s.h > 0.5 ? 3 : 2;
    const piece = (Lr - gaps * 2.2) / (gaps + 1);
    for (let i = 0; i <= gaps; i++) {
      const z0 = 6 + i * (piece + 2.2);
      s.plat(0, 0, z0 + piece / 2, 3.4, piece, 1.2, { mat: 'toy' });
    }
    const runTime = (Lr / PHYS.runSpeed) * 1.25 + 0.5;
    // Long enough for a partner already at the start, too short for someone
    // who pounds the far button and then runs (even dashing) to the course.
    const T = runTime * 0.95 + lerp(1.2, 0.7, d);
    const S1 = s.pswitch(side * 33.5, 0, 3, false, T);
    const wz = 6 + Lr;
    const H = 8, dh = 4.6, dw = 3.4;
    const wc = s.color();
    // Wide wings so nobody can jump around the wall.
    const wing = 15;
    s.box(-(wing + dw / 2) / 2, (H - 1.2) / 2, wz, wing - dw / 2, H + 1.2, 1, { color: wc });
    s.box((wing + dw / 2) / 2, (H - 1.2) / 2, wz, wing - dw / 2, H + 1.2, 1, { color: wc });
    s.box(0, dh + (H - dh) / 2, wz, dw, H - dh, 1, { color: wc });
    s.plat(0, 0, wz + 4, 12, 8, 1.6, { mat: 'wood' });
    const S2 = s.pswitch(3, 0, wz + 4.5, true);
    s.act('door', { op: 'any', in: [S1, S2] }, false, [
      { x: 0, y: dh / 2, z: wz, sx: dw - 0.1, sy: dh, sz: 0.6, move: [0, -(dh + 0.3), 0] },
    ], { speed: 18, lamp: [0, dh + 0.5, wz - 0.55] });
    s.sign(0, 3.2, wz + 1.6, 'Pound this button\nto keep the door open');
    s.gem(0, 2.6, 6 + piece + 1.1);
    s.exit(wz + 8, 0);
  },

  magnetLanes(s) {
    const { rng } = s;
    s.coop = true;
    s.hint = 'Co-op: each of you swings along the magnets of the other color (hold E, let go, aim at the next one). Then both stand on the plates to open the gate.';
    s.sign(0, 3.6, 1.2, 'Red magnets pull Luna,\nblue magnets pull Sol');
    const Lc = rng.range(18, 22);
    const far0 = 6 + Lc;
    s.plat(0, 0, 3, 14, 6, 1.6, { mat: 'wood' });
    s.plat(0, 0, far0 + 5, 14, 10, 1.6, { mat: 'wood' });
    const spacing = rng.range(5.0, 5.5);
    for (const lane of [-1, 1]) {
      const x = lane * 3.5;
      const pol = lane < 0 ? 1 : -1;
      s.box(x, 8.1, (2 + far0 + 4) / 2, 1.6, 1.0, far0 + 2, { mat: 'metal' });
      s.box(x, 3.8, 1.4, 1.0, 7.6, 1.0, { mat: 'metal' });
      s.box(x, 3.8, far0 + 3.4, 1.0, 7.6, 1.0, { mat: 'metal' });
      for (let z = 8 + (lane > 0 ? spacing / 2 : 0); ; z += spacing) {
        s.pad(x, 7.58, z, [0, -1, 0], pol);
        if (z >= far0 + 0.5) break;
      }
    }
    s.gem(0, 5.6, 6 + Lc / 2);
    // Exit gate needs both plates at once.
    const gz = far0 + 7;
    const P1 = s.plate(-4.5, 0, far0 + 3.5);
    const P2 = s.plate(4.5, 0, far0 + 3.5);
    const wc = s.color();
    s.box(-(15 + 2.7) / 2, 3.4, gz, 15 - 2.7, 8, 1, { color: wc });
    s.box((15 + 2.7) / 2, 3.4, gz, 15 - 2.7, 8, 1, { color: wc });
    s.box(0, 6.7, gz, 5.4, 1.4, 1, { color: wc });
    s.act('door', { op: 'all', in: [P1, P2] }, true, [
      { x: 0, y: 3, z: gz, sx: 5.3, sy: 6, sz: 0.6, move: [0, -6.4, 0] },
    ], { speed: 10, lamp: [0, 6.2, gz - 0.6] });
    s.wire(P1, [[-4.5, 0, far0 + 3.5], [-4.5, 0, gz - 1], [-2.6, 0, gz - 1]]);
    s.wire(P2, [[4.5, 0, far0 + 3.5], [4.5, 0, gz - 1], [2.6, 0, gz - 1]]);
    s.exit(far0 + 10, 0);
  },

  fanLift(s) {
    const { rng } = s;
    s.coop = true;
    s.hint = 'Co-op: stand on the plate to power the fan and blow your partner up the cliff. Up there, another plate runs a fan for you.';
    s.sign(0, 3.6, 1.2, 'The plate powers the fan —\nblow your partner sky-high!');
    const H = rng.range(12, 14);
    const side = rng.sign();
    const fx = -3 * side;
    s.plat(0, 0, 5, 12, 10, 1.6, { mat: 'wood' });
    s.box(0, (H - 1.6) / 2, 16, 14, H + 1.6, 12, { color: s.color() });
    s.plat(fx, 0.25, 8.4, 3.4, 3.4, 1.2, { mat: 'metal' });
    const P1 = s.plate(3.5 * side, 0, 3);
    const P2 = s.plate(fx, H, 13.6);
    s.fan(fx, 0.25, 8.4, 1.5, H + 1.0, 58, { op: 'any', in: [P1, P2] });
    s.wire(P1, [[3.5 * side, 0, 3], [3.5 * side, 0, 6.2], [fx, 0, 6.2]]);
    s.gem(fx, H + 3.2, 8.4);
    s.exit(22, H);
  },
};

export const SEGMENT_TYPES = Object.keys(SEGMENTS);
const SOLO = ['stones', 'movers', 'sweeper', 'bounce', 'blink', 'crumble', 'pendulum', 'conveyor', 'pistons', 'turntable', 'fanClimb', 'tower'];
const COOP = ['plateDoor', 'syncBridge', 'launch', 'ceiling', 'cannon', 'seesaw', 'lanes', 'rideControl', 'timedRace', 'magnetLanes', 'fanLift'];
const TUTORIAL = ['stones', 'plateDoor', 'bounce', 'launch', 'movers', 'seesaw', 'sweeper', 'cannon'];

// Every level after the tutorial is a chapter with its own featured
// mechanics, look and time of day. The first of each list is its signature.
export const CHAPTERS = [
  { key: 'clockwork', title: 'Clockwork Workshop', theme: 'workshop', sky: 'day',
    solo: ['blink', 'turntable', 'pendulum', 'movers'], coop: ['rideControl', 'syncBridge', 'timedRace', 'plateDoor', 'seesaw'] },
  { key: 'night', title: 'Magnet Night', theme: 'twilight', sky: 'night',
    solo: ['crumble', 'turntable', 'stones', 'bounce'], coop: ['magnetLanes', 'launch', 'ceiling', 'cannon', 'seesaw'] },
  { key: 'breeze', title: 'Updraft Garden', theme: 'garden', sky: 'sunset',
    solo: ['fanClimb', 'tower', 'bounce', 'crumble'], coop: ['fanLift', 'seesaw', 'launch', 'lanes', 'rideControl'] },
  { key: 'factory', title: 'Toy Factory', theme: 'candy', sky: 'day',
    solo: ['conveyor', 'pistons', 'pendulum', 'blink', 'sweeper'], coop: ['timedRace', 'rideControl', 'lanes', 'plateDoor', 'syncBridge'] },
  { key: 'dream', title: 'Dream Heights', theme: 'playroom', sky: 'dawn',
    solo: ['tower', 'turntable', 'fanClimb', 'blink', 'pistons'], coop: ['magnetLanes', 'fanLift', 'cannon', 'ceiling', 'timedRace'] },
  { key: 'hammer', title: 'Hall of Hammers', theme: 'ember', sky: 'dusk',
    solo: ['pendulum', 'pistons', 'sweeper', 'stones'], coop: ['syncBridge', 'rideControl', 'timedRace', 'plateDoor', 'seesaw'] },
  { key: 'ice', title: 'Cracked Ice Fields', theme: 'frost', sky: 'day',
    solo: ['crumble', 'blink', 'stones', 'movers'], coop: ['ceiling', 'lanes', 'cannon', 'launch', 'plateDoor'] },
  { key: 'bath', title: 'Bubble Bath Bay', theme: 'bath', sky: 'sunset',
    solo: ['bounce', 'movers', 'conveyor', 'turntable'], coop: ['cannon', 'seesaw', 'fanLift', 'rideControl', 'syncBridge'] },
  { key: 'space', title: 'Rocket Station', theme: 'space', sky: 'day',
    solo: ['turntable', 'tower', 'movers', 'fanClimb', 'blink'], coop: ['magnetLanes', 'launch', 'ceiling', 'cannon', 'fanLift'] },
  { key: 'gauntlet', title: 'The Ultimate Gauntlet', theme: 'workshop', sky: 'aurora',
    solo: ['pistons', 'crumble', 'pendulum', 'conveyor', 'tower'], coop: ['timedRace', 'magnetLanes', 'lanes', 'seesaw', 'fanLift'] },
];

// After the chapters, every level is a one-off remix with its own twist. The
// twist's word goes in the level's name.
const TWISTS = [
  { key: 'crumbly', words: ['Crumbly', 'Rickety', 'Tottering', 'Shaky'], text: 'Twist: lots of tiles crumble — keep moving!' },
  { key: 'speedy', words: ['Speedy', 'Whirling', 'Spinning', 'Zippy'], text: 'Twist: everything spins faster!' },
  { key: 'tiny', words: ['Tiny', 'Mini', 'Narrow', 'Pocket'], text: 'Twist: extra-small platforms!' },
  { key: 'hammer', words: ['Clanging', 'Clanking', 'Thumping', 'Rumbling'], text: 'Twist: more hammers, pistons and sweeping bars!' },
  { key: 'marathon', words: ['Endless', 'Winding', 'Tangled', 'Faraway'], text: 'Twist: two extra obstacles before the finish!' },
];

// Time-of-day overrides layered on top of a theme.
export const SKIES = {
  day: {},
  sunset: {
    skyTop: '#3d4fa8', skyHorizon: '#ff9a62', skyBottom: '#ffc49a', fog: '#eea887', sun: '#ffb27a', sunIntensity: 3.0,
    sunDir: [-0.8, 0.34, 0.5], hemiSky: '#a6b6ff', hemiGround: '#ffb08a', hemiIntensity: 1.25, stars: false,
  },
  night: {
    skyTop: '#090d2e', skyHorizon: '#3a3a8c', skyBottom: '#1f1745', fog: '#2b2b66', fogDensity: 0.0062, sun: '#c2ceff', sunIntensity: 2.2,
    sunDir: [0.35, 0.8, -0.45], hemiSky: '#8a98ff', hemiGround: '#4a3a7a', hemiIntensity: 1.9, stars: true, cloud: '#a6a3e8',
  },
  dawn: {
    skyTop: '#7aa7ff', skyHorizon: '#ffcfe0', skyBottom: '#ffeedd', fog: '#f2d4e4', sun: '#ffe0c8', sunIntensity: 2.8,
    sunDir: [0.78, 0.4, -0.3], hemiSky: '#d6e3ff', hemiGround: '#f6c6d6', hemiIntensity: 1.25, stars: false,
  },
  dusk: {
    skyTop: '#2b2d6e', skyHorizon: '#c77dff', skyBottom: '#f0a6ca', fog: '#b48ac9', fogDensity: 0.006, sun: '#ffc2e2', sunIntensity: 2.6,
    sunDir: [-0.6, 0.3, -0.7], hemiSky: '#b8a6ff', hemiGround: '#d98fb5', hemiIntensity: 1.35, stars: false,
  },
  aurora: {
    skyTop: '#04121f', skyHorizon: '#1f8a70', skyBottom: '#0d2a3a', fog: '#16455a', fogDensity: 0.006, sun: '#c8fff0', sunIntensity: 2.2,
    sunDir: [-0.3, 0.75, 0.5], hemiSky: '#7fe0c8', hemiGround: '#2c4a66', hemiIntensity: 1.9, stars: true, cloud: '#8fd6c8',
  },
};
const SKY_KEYS = Object.keys(SKIES);

// Remix k (0 = the first level after the chapters) of a world: its look,
// featured mechanics, twist and name. Pure, so earlier remixes are cheap to
// recompute when checking for repeats.
function remixSpec(seed, k) {
  const rng = new RNG(`${seed}:remixes`);
  // Every look not already used by a chapter, in a shuffled order: no two
  // remixes in a row (or within a full lap) look the same.
  const used = new Set(CHAPTERS.map((c) => `${c.theme}/${c.sky}`));
  const looks = [];
  for (const t of THEMES) for (const sky of SKY_KEYS) if (!used.has(`${t.key}/${sky}`)) looks.push([t.key, sky]);
  rng.shuffle(looks);
  const solos = rng.shuffle(SOLO.slice());
  const coops = rng.shuffle(COOP.slice());
  // Each lap through the twists comes in a fresh order.
  const lap = Math.floor(k / TWISTS.length);
  const order = (j) => new RNG(`${seed}:twists:${j}`).shuffle(TWISTS.slice());
  const twists = order(lap);
  if (lap > 0 && twists[0] === order(lap - 1)[TWISTS.length - 1]) twists.push(twists.shift());
  const [themeKey, sky] = looks[k % looks.length];
  const theme = THEMES.find((t) => t.key === themeKey);
  // 12 solo and 11 co-op mechanics, so the featured pair only repeats after 132 levels.
  const solo = [solos[k % solos.length], solos[(k + 5) % solos.length]];
  const coop = [coops[k % coops.length], coops[(k + 4) % coops.length]];
  const twist = twists[k % twists.length];
  const word = twist.words[lap % twist.words.length];
  const place = theme.names[(k * 3 + Math.floor(k / theme.names.length)) % theme.names.length];
  return { key: `remix${k}`, title: `${word} ${place}`, theme: themeKey, sky, solo, coop, twist };
}

function remixName(seed, k) {
  const title = remixSpec(seed, k).title;
  let n = 1;
  for (let j = 0; j < k; j++) if (remixSpec(seed, j).title === title) n++;
  return n === 1 ? title : `${title} ${['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || n}`;
}

// Keeps rising forever: about 0.2 by level 11, 0.6 by level 25, 0.9 by level 55.
export function levelHeat(index) {
  return index <= 5 ? 0 : 1 - Math.exp(-(index - 5) / 22);
}

// ---------------------------------------------------------------------------

class Generator {
  constructor(seed, index) {
    this.seed = seed;
    this.index = index;
    this.rng = new RNG(`${seed}:${index}`);
    this.nid = 1;
    this.chapter = null;
    this.twist = null;
    this.heat = levelHeat(index);
    if (index === 0) {
      // One of the original five looks, never the same as level 2's.
      let ti = hashString(String(seed)) % 5;
      if (THEMES[ti].key === CHAPTERS[0].theme) ti = (ti + 1) % 5;
      this.theme = { ...THEMES[ti], sky: 'day' };
    } else {
      let ch;
      if (index <= CHAPTERS.length) {
        ch = { ...CHAPTERS[index - 1], cycle: 0 };
      } else {
        const k = index - CHAPTERS.length - 1;
        ch = { ...remixSpec(seed, k), title: remixName(seed, k), cycle: 1 };
        this.twist = ch.twist;
      }
      const base = THEMES.find((t) => t.key === ch.theme);
      this.theme = { ...base, ...SKIES[ch.sky], sky: ch.sky };
      this.chapter = ch;
    }
    this.out = {
      solids: [], movers: [], plates: [], switches: [], acts: [], pads: [], seesaws: [], bouncers: [],
      fields: [], gems: [], signs: [], wires: [], checkpoints: [], segments: [], decor: [],
      blinks: [], crumbles: [], pendulums: [], conveyors: [], fans: [],
    };
    this.footprints = [];
    this.minTop = 0;
  }

  newId(prefix) {
    return `${prefix}${this.nid++}`;
  }

  // Transform and append a segment's items to the level.
  commit(seg, xf) {
    const o = this.out;
    const pt = (it) => {
      const [x, y, z] = xf.p(it.x, it.y, it.z);
      it.x = x; it.y = y; it.z = z;
      it.yaw = (it.yaw || 0) + xf.yaw;
      return it;
    };
    for (const s of seg.solids) o.solids.push(pt(s));
    for (const m of seg.movers) {
      m.yaw += xf.yaw;
      const mo = m.motion;
      if (mo.type === 'linear') {
        mo.a = xf.p(...mo.a);
        mo.b = xf.p(...mo.b);
      } else {
        mo.center = xf.p(...mo.center);
        mo.phase += xf.yaw;
      }
      o.movers.push(m);
    }
    for (const p of seg.plates) o.plates.push(pt(p));
    for (const w of seg.switches) o.switches.push(pt(w));
    for (const a of seg.acts) {
      pt(a);
      for (const p of a.parts) {
        pt(p);
        p.move = xf.v(p.move);
      }
      o.acts.push(a);
    }
    for (const p of seg.pads) {
      pt(p);
      p.n = xf.v(p.n);
      if (p.launch) p.launch = xf.v(p.launch);
      o.pads.push(p);
    }
    for (const e of seg.seesaws) o.seesaws.push(pt(e));
    for (const b of seg.bouncers) o.bouncers.push(pt(b));
    for (const f of seg.fields) o.fields.push(pt(f));
    for (const g of seg.gems) o.gems.push(pt(g));
    for (const s of seg.signs) o.signs.push(pt(s));
    for (const w of seg.wires) o.wires.push({ sig: w.sig, pts: w.pts.map((p) => xf.p(...p)) });
    for (const b of seg.blinks) o.blinks.push(pt(b));
    for (const c of seg.crumbles) o.crumbles.push(pt(c));
    for (const h of seg.pendulums) o.pendulums.push(pt(h));
    for (const v of seg.conveyors) {
      pt(v);
      v.beltYaw += xf.yaw;
      o.conveyors.push(v);
    }
    for (const f of seg.fans) o.fans.push(pt(f));
    for (const s of seg.solids) if (!s.deep) this.minTop = Math.min(this.minTop, s.y + s.sy / 2);
    for (const b of [...seg.blinks, ...seg.crumbles, ...seg.conveyors]) this.minTop = Math.min(this.minTop, b.y + b.sy / 2);
    for (const m of seg.movers) {
      const mo = m.motion;
      const ys = mo.type === 'linear' ? [mo.a[1], mo.b[1]] : [mo.center[1]];
      for (const y of ys) this.minTop = Math.min(this.minTop, y + m.sy / 2);
    }
  }

  worldRect(b, xf) {
    const pts = [xf.p(b.x0, 0, b.z0), xf.p(b.x1, 0, b.z0), xf.p(b.x0, 0, b.z1), xf.p(b.x1, 0, b.z1)];
    return {
      x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])),
      z0: Math.min(...pts.map((p) => p[2])), z1: Math.max(...pts.map((p) => p[2])),
      y0: xf.o[1] + b.y0, y1: xf.o[1] + b.y1,
    };
  }

  overlaps(r) {
    const m = 1.5;
    for (const f of this.footprints) {
      if (r.x0 - m < f.x1 && r.x1 + m > f.x0 && r.z0 - m < f.z1 && r.z1 + m > f.z0 && r.y0 - 8 < f.y1 && r.y1 + 8 > f.y0) {
        return true;
      }
    }
    return false;
  }

  addHub(center, top, size, q, idx, isGoal) {
    const xf = new Xf(center, q);
    const theme = this.theme;
    const id = this.newId('s');
    const hub = { id, x: center[0], y: top - 1.2, z: center[2], sx: size, sy: 2.4, sz: size, yaw: 0, mat: 'hub', color: theme.wood };
    this.out.solids.push(hub);
    this.minTop = Math.min(this.minTop, top);
    this.footprints.push({
      x0: center[0] - size / 2, x1: center[0] + size / 2, z0: center[2] - size / 2, z1: center[2] + size / 2, y0: top - 2.4, y1: top + 3,
    });
    if (isGoal) {
      this.out.goal = { id: this.newId('goal'), x: center[0], y: top, z: center[2], size: 7, yaw: xf.yaw };
      this.out.checkpoints.push({ id: this.newId('k'), idx, x: center[0], y: top, z: center[2], size, yaw: xf.yaw, goal: true,
        spawns: [[...xf.p(-1.6, 0, -4), xf.yaw], [...xf.p(1.6, 0, -4), xf.yaw]] });
      return;
    }
    const flag = xf.p(-size / 2 + 1.0, 0, -size / 2 + 1.0);
    this.out.checkpoints.push({
      id: this.newId('k'), idx, x: center[0], y: top, z: center[2], size, yaw: xf.yaw, flag,
      spawns: [[...xf.p(-1.6, 0, -0.5), xf.yaw], [...xf.p(1.6, 0, -0.5), xf.yaw]],
    });
  }

  sequence() {
    if (this.index === 0) return TUTORIAL.slice();
    const rng = this.rng.fork('sequence');
    const ch = this.chapter;
    // The chapter's own mechanics, plus a couple of guests for variety (more
    // guests in later cycles).
    const extra = (all, own, k) => rng.shuffle(all.filter((t) => !own.includes(t))).slice(0, k);
    const soloPool = [...ch.solo, ...extra(SOLO, ch.solo, 1 + ch.cycle)];
    const coopPool = [...ch.coop, ...extra(COOP, ch.coop, 2 + ch.cycle)];
    const deck = (pool, signature) => {
      // Draw without repeats; the signature mechanic comes first.
      let cards = [];
      let last = null;
      let first = true;
      return () => {
        if (!cards.length) {
          cards = rng.shuffle(pool.slice());
          if (first) {
            cards = [signature, ...cards.filter((c) => c !== signature)];
            first = false;
          } else if (cards[0] === last && cards.length > 1) cards.push(cards.shift());
        }
        last = cards.shift();
        return last;
      };
    };
    const nextSolo = deck(soloPool, ch.solo[0]);
    const nextCoop = deck(coopPool, ch.coop[0]);
    // Longer every few levels, up to 18 puzzles (20 on a marathon).
    let n = this.index <= 5 ? 8 + this.index : Math.min(18, 13 + Math.floor((this.index - 5) / 4));
    if (this.twist && this.twist.key === 'marathon') n += 2;
    // Harder levels lean on solo platforming: every other puzzle instead of every third.
    const soloEvery = this.heat > 0.45 ? 2 : 3;
    const seq = [];
    for (let i = 0; i < n; i++) seq.push(i % soloEvery === 0 ? nextSolo() : nextCoop());
    // Big finish: chapters with a tower end by climbing one.
    if (soloPool.includes('tower') && !seq.includes('tower')) seq[n - 1] = 'tower';
    return seq;
  }

  difficulty(i, total) {
    if (this.index === 0) return clamp(0.08 + (i / total) * 0.3, 0, 1);
    return clamp(0.2 + this.index * 0.13 + (i / total) * 0.3, 0, 1);
  }

  // Heat also climbs a little within the level.
  heatAt(i, total) {
    return this.heat * lerp(0.8, 1, i / Math.max(1, total - 1));
  }

  build() {
    const rng = this.rng;
    const types = this.sequence();
    const mainQ = rng.int(0, 3);
    let q = (mainQ + rng.pick([0, 1, 3])) % 4;
    let cursor = [0, 0, 0];
    const total = types.length;

    for (let i = 0; i < total; i++) {
      const type = types[i];
      const d = this.difficulty(i, total);
      const seg = new Seg(this, type, rng.fork(`seg${i}`), d, this.heatAt(i, total));
      seg.firstOfType = !types.slice(0, i).includes(type);
      SEGMENTS[type](seg);
      const lb = seg.bounds();

      const hubCenter = [cursor[0] + QUAD[q][1] * 5, cursor[1], cursor[2] + QUAD[q][0] * 5];
      // Pick a heading for the segment leaving this hub: straight, left or right,
      // never doubling back against the level's main direction. A turn may add a
      // walkway so the new segment clears the one we came from.
      const turns = rng.shuffle([0, 1, -1]);
      if (rng.chance(0.3)) turns.sort((a, b) => Math.abs(a) - Math.abs(b));
      const options = [];
      for (const turn of turns) for (const walk of turn === 0 ? [0] : [0, 7, 13]) options.push([turn, walk]);
      const place = (turn, walk) => {
        const nq = (((q + turn) % 4) + 4) % 4;
        const f = QUAD[nq];
        const origin = [hubCenter[0] + f[1] * (5 + walk), cursor[1], hubCenter[2] + f[0] * (5 + walk)];
        const xf = new Xf(origin, nq);
        const rect = this.worldRect(lb, xf);
        const walkRect = walk > 0 ? this.worldRect({ ...lb, x0: -2.2, x1: 2.2, z0: -walk, z1: 0 }, xf) : null;
        return { nq, xf, rect, walkRect, walk };
      };
      let chosen = null;
      for (const [turn, walk] of options) {
        const rel = (((q + turn - mainQ) % 4) + 4) % 4;
        if (rel === 2) continue;
        const c = place(turn, walk);
        if (!this.overlaps(c.rect) && !(c.walkRect && this.overlaps(c.walkRect))) {
          chosen = c;
          break;
        }
      }
      if (!chosen) chosen = place(0, 0);

      this.addHub(hubCenter, cursor[1], 10, chosen.nq, i, false);
      if (chosen.walk > 0) {
        const [x, y, z] = chosen.xf.p(0, -0.5, -chosen.walk / 2);
        this.out.solids.push({
          id: this.newId('s'), x, y, z, sx: 4.4, sy: 1.0, sz: chosen.walk + 0.2, yaw: chosen.xf.yaw, mat: 'wood', color: this.theme.wood,
        });
      }
      this.commit(seg, chosen.xf);
      if (chosen.walkRect) this.footprints.push(chosen.walkRect);
      this.footprints.push(chosen.rect);
      this.out.segments.push({ type, coop: seg.coop, hint: seg.hint, cp: i });
      cursor = chosen.xf.p(0, seg.exitY, seg.exitZ);
      q = chosen.nq;
    }

    const f = QUAD[q];
    const goalCenter = [cursor[0] + f[1] * 7, cursor[1], cursor[2] + f[0] * 7];
    this.addHub(goalCenter, cursor[1], 14, q, total, true);

    this.decorate();
    return this.finish();
  }

  decorate() {
    const rng = this.rng.fork('decor');
    const kinds = ['block', 'block', 'ball', 'crayon', 'ring', 'star', 'spool', 'button'];
    const fps = this.footprints;
    let placed = 0;
    for (let tries = 0; tries < 400 && placed < 34; tries++) {
      const a = rng.pick(fps);
      const cx = (a.x0 + a.x1) / 2, cz = (a.z0 + a.z1) / 2;
      const ang = rng.range(0, Math.PI * 2);
      const dist = rng.range(38, 120);
      const x = cx + Math.cos(ang) * dist;
      const z = cz + Math.sin(ang) * dist;
      const s = rng.range(5, 16) * (dist / 70);
      let ok = true;
      for (const f of fps) {
        const dx = Math.max(f.x0 - x, 0, x - f.x1);
        const dz = Math.max(f.z0 - z, 0, z - f.z1);
        if (Math.hypot(dx, dz) < 20 + s) { ok = false; break; }
      }
      if (!ok) continue;
      this.out.decor.push({
        kind: rng.pick(kinds), x, y: a.y0 + rng.range(-30, 26), z, s,
        yaw: rng.range(0, Math.PI * 2), tilt: rng.range(-0.5, 0.5),
        color: rng.pick(this.theme.blocks), color2: rng.pick(this.theme.blocks),
        spin: rng.range(-0.15, 0.15), bob: rng.range(0, Math.PI * 2),
        letter: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[rng.int(0, 25)],
      });
      placed++;
    }
  }

  finish() {
    const o = this.out;
    const b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity };
    for (const f of this.footprints) {
      b.minX = Math.min(b.minX, f.x0); b.maxX = Math.max(b.maxX, f.x1);
      b.minZ = Math.min(b.minZ, f.z0); b.maxZ = Math.max(b.maxZ, f.z1);
      b.minY = Math.min(b.minY, f.y0); b.maxY = Math.max(b.maxY, f.y1);
    }
    const nameRng = this.rng.fork('name');
    let name = `${nameRng.pick(ADJECTIVES)} ${nameRng.pick(this.theme.names)}`;
    if (this.chapter) name = this.chapter.title;
    const signals = [
      ...o.plates.map((p) => ({ id: p.id, kind: 'plate' })),
      ...o.switches.map((w) => ({ id: w.id, kind: 'switch', latch: w.latch, duration: w.duration })),
    ];
    return {
      version: 1,
      seed: this.seed,
      index: this.index,
      name,
      chapter: this.chapter ? this.chapter.key : 'tutorial',
      twist: this.twist ? { key: this.twist.key, text: this.twist.text } : null,
      heat: this.heat,
      theme: this.theme,
      killY: this.minTop - 16,
      bounds: b,
      signals,
      ...o,
    };
  }
}

export function generateLevel(seed, index = 0) {
  return new Generator(String(seed), index).build();
}

// Structural checks used by tests and the server.
export function validateLevel(level) {
  const errors = [];
  const ids = new Set();
  const all = [
    ...level.solids, ...level.movers, ...level.plates, ...level.switches, ...level.acts, ...level.pads,
    ...level.seesaws, ...level.bouncers, ...level.fields, ...level.gems, ...level.checkpoints,
    ...level.blinks, ...level.crumbles, ...level.pendulums, ...level.conveyors, ...level.fans,
    ...(level.traps || []), ...(level.items || []), ...(level.locks || []), ...(level.zones || []),
    ...(level.notes || []), ...(level.monsters || []),
  ];
  for (const it of all) {
    if (ids.has(it.id)) errors.push(`duplicate id ${it.id}`);
    ids.add(it.id);
    for (const k of ['x', 'y', 'z']) if (it[k] !== undefined && !Number.isFinite(it[k])) errors.push(`bad ${k} on ${it.id}`);
  }
  const sigs = new Set(level.signals.map((s) => s.id));
  for (const a of level.acts) for (const i of a.when.in) if (!sigs.has(i)) errors.push(`act ${a.id} references unknown signal ${i}`);
  for (const f of level.fans) if (f.when) for (const i of f.when.in) if (!sigs.has(i)) errors.push(`fan ${f.id} references unknown signal ${i}`);
  const items = new Set((level.items || []).map((i) => i.id));
  for (const l of level.locks || []) for (const i of l.accepts) if (!items.has(i)) errors.push(`lock ${l.id} wants unknown item ${i}`);
  for (const q of level.seqs || []) for (const i of q.ids) if (!level.switches.some((w) => w.id === i)) errors.push(`code ${q.id} uses unknown switch ${i}`);
  const sigRef = (what, id) => id && !sigs.has(id) && errors.push(`${what} references unknown signal ${id}`);
  for (const i of level.items || []) sigRef(`item ${i.id}`, i.when);
  for (const t of level.traps || []) {
    sigRef(`trap ${t.id}`, t.off);
    for (const r of [].concat(t.reveal || [])) sigRef(`trap ${t.id}`, r);
  }
  for (const l of level.lights || []) {
    sigRef('light', l.when);
    sigRef('light', l.off);
  }
  for (const m of level.monsters || []) {
    sigRef(`monster ${m.id}`, m.active);
    for (const [a, b] of m.edges || []) if (!m.nodes[a] || !m.nodes[b]) errors.push(`monster ${m.id} has a bad edge`);
    for (const p of m.patrol) if (!m.nodes[p]) errors.push(`monster ${m.id} patrols to a missing node`);
  }
  if (!level.goal) errors.push('missing goal');
  if (level.checkpoints.length !== level.segments.length + 1) errors.push('checkpoint count mismatch');
  return errors;
}
