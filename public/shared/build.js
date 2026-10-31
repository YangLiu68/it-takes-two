// World-space builder for hand-designed levels (courses, puzzles, horror
// stories). It reuses the procedural generator's piece helpers (platforms,
// plates, switches, doors, ...) and adds keys, locks, prank traps, zones,
// lights, story notes and monsters. Pure data, shared by server and clients.
//
// Yaw 0 faces +Z, yaw PI/2 faces +X (same as the generator's hubs).

import { Seg, THEMES, SKIES } from './levelgen.js';
import { RNG } from './rng.js';

const rot = (yaw, lx, lz) => {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return [lx * c + lz * s, -lx * s + lz * c];
};

export class LevelBuilder extends Seg {
  constructor({ mode, index, seed = '', name, label, theme = 'playroom', sky = 'day', d = 0.5, overrides = {} }) {
    let n = 1;
    const base = THEMES.find((t) => t.key === theme) || THEMES[0];
    const fullTheme = { ...base, ...(SKIES[sky] || {}), ...overrides, sky };
    const gen = { newId: (p) => `${p}${n++}`, theme: fullTheme, twist: null };
    super(gen, 'custom', new RNG(`${mode}:${index}:${seed}`), d, 0);
    this.firstOfType = true; // signs always show
    this.meta = { mode, index, seed, name, label };
    this.theme = fullTheme;
    for (const k of ['traps', 'swaps', 'floats', 'glasses', 'items', 'locks', 'seqs', 'dials', 'combos', 'zones', 'lights', 'notes', 'monsters', 'figures', 'checkpoints', 'sections', 'decor', 'fakeGoals']) this[k] = [];
    this.marks = {};
    this.goalDef = null;
    this.story = null;
    this.objectives = [];
    this.killY = null;
  }

  // -- geometry --------------------------------------------------------------

  // Platform by its top surface (thin by default).
  floor(x, top, z, w, d, o = {}) {
    return this.plat(x, top, z, w, d, o.t || 1, o);
  }

  // Wall along X at z, from x0 to x1, standing on y0.
  wallX(x0, x1, z, h, o = {}) {
    const t = o.t || 0.4;
    const y0 = o.y ?? 0;
    return this.box((x0 + x1) / 2, y0 + h / 2, z, Math.abs(x1 - x0), h, t, o);
  }

  // Wall along Z at x, from z0 to z1.
  wallZ(z0, z1, x, h, o = {}) {
    const t = o.t || 0.4;
    const y0 = o.y ?? 0;
    return this.box(x, y0 + h / 2, (z0 + z1) / 2, t, h, Math.abs(z1 - z0), o);
  }

  // Wall along one axis with door gaps: gaps = [[center, width], ...].
  wallGapsX(x0, x1, z, h, gaps, o = {}) {
    const cuts = gaps.map(([c, w]) => [c - w / 2, c + w / 2]).sort((a, b) => a[0] - b[0]);
    let x = x0;
    for (const [a, b] of cuts) {
      if (a > x + 0.05) this.wallX(x, a, z, h, o);
      // Lintel over the gap.
      if (o.lintel) this.wallX(a, b, z, h - o.lintel, { ...o, y: (o.y ?? 0) + o.lintel });
      x = b;
    }
    if (x1 > x + 0.05) this.wallX(x, x1, z, h, o);
  }

  wallGapsZ(z0, z1, x, h, gaps, o = {}) {
    const cuts = gaps.map(([c, w]) => [c - w / 2, c + w / 2]).sort((a, b) => a[0] - b[0]);
    let z = z0;
    for (const [a, b] of cuts) {
      if (a > z + 0.05) this.wallZ(z, a, x, h, o);
      if (o.lintel) this.wallZ(a, b, x, h - o.lintel, { ...o, y: (o.y ?? 0) + o.lintel });
      z = b;
    }
    if (z1 > z + 0.05) this.wallZ(z, z1, x, h, o);
  }

  // Four walls around a rectangle. doors: { n|s|e|w: [[center, width], ...] }
  // (n = +Z side, e = +X side); null skips that wall (it's shared).
  room(x0, z0, x1, z1, h, doors = {}, o = {}) {
    if (doors.s !== null) this.wallGapsX(x0, x1, z0, h, doors.s || [], o);
    if (doors.n !== null) this.wallGapsX(x0, x1, z1, h, doors.n || [], o);
    if (doors.w !== null) this.wallGapsZ(z0, z1, x0, h, doors.w || [], o);
    if (doors.e !== null) this.wallGapsZ(z0, z1, x1, h, doors.e || [], o);
  }

  // A door that opens (slides down into the floor) while `when` holds.
  door(x, z, w, h, when, o = {}) {
    const along = o.axis === 'z';
    const t = o.t || 0.5;
    const y0 = o.y ?? 0;
    return this.act(o.style || 'door', when, o.latch ?? true, [{
      x, y: y0 + h / 2, z, sx: along ? t : w - 0.1, sy: h, sz: along ? w - 0.1 : t, move: o.up ? [0, h + 0.2, 0] : [0, -(h + 0.3), 0],
    }], { speed: o.speed || 8, lamp: o.lamp || [x, y0 + h + 0.4, z], color: o.color, mat: o.mat });
  }

  // Floating sign. fixed: a poster facing `yaw` instead of turning to the camera.
  sign(x, y, z, text, o = {}) {
    const def = { x, y, z, yaw: o.yaw ?? Math.PI, text };
    if (o.style) def.style = o.style;
    if (o.fixed) def.fixed = true;
    if (o.w) def.w = o.w;
    if (o.fit) def.fit = true; // canvas as wide as the text: short labels come out big
    this.signs.push(def);
  }

  // -- new pieces -------------------------------------------------------------

  // A block that looks ordinary until someone stands on it.
  //   vanish: disappears   drop: falls away   slide: shoots along `move`
  //   launch: throws you with velocity `launch`   punch: a glove knocks you off
  //   fake: was never solid   hidden: invisible but solid
  trap(kind, x, top, z, w, d, o = {}) {
    const t = o.t || 1;
    const id = this.id('t');
    const def = {
      id, kind, x, y: top - t / 2, z, sx: w, sy: t, sz: d, yaw: o.yaw || 0,
      color: o.color || this.color(), mat: o.mat || 'toy',
      delay: o.delay ?? (kind === 'launch' || kind === 'drop' ? 0.05 : 0.15),
      reset: o.reset ?? 3,
      hold: o.hold ?? 1.2,
      reveal: o.reveal || null,
    };
    if (o.seer) def.seer = o.seer; // eye plate(s) that show it only to the one standing there
    if (o.move) def.move = o.move;
    if (o.launch) def.launch = o.launch;
    if (o.look) def.look = o.look;
    if (o.off) def.off = o.off; // signal that switches this trap off
    if (o.on) def.on = o.on; // only works while this signal is on
    if (kind === 'punch') {
      // Glove waits inside a post on one side and sweeps across the top.
      const side = o.side || 1;
      const yaw = def.yaw;
      const [ax, az] = rot(yaw, side * (w / 2 + 1.1), 0);
      const [bx, bz] = rot(yaw, -side * (w / 2 + 0.2), 0);
      def.glove = { from: [x + ax, top + 0.9, z + az], to: [x + bx, top + 0.9, z + bz], size: 1.3 };
      this.box(x + ax * 1.15, top + 0.9, z + az * 1.15, 1.6, 2.4 + t, 1.6, o.postColor ? { color: o.postColor, yaw } : { mat: 'metal', yaw });
    }
    this.traps.push(def);
    return id;
  }

  // Color barrier across a doorway in a wall that runs along Z (only that
  // character can pass: pol 1 = Sol, -1 = Luna).
  fieldZ(x, y, z, w, h, pol) {
    const id = this.field(x, y, z, w, h, 0.3, pol);
    this.fields[this.fields.length - 1].yaw = Math.PI / 2;
    return id;
  }

  // Something to carry. who: 0 = only Sol, 1 = only Luna, null = anyone.
  // when: signal that makes it appear (e.g. a drawer opening).
  item(kind, x, y, z, o = {}) {
    const id = this.id('i');
    this.items.push({ id, kind, x, y, z, color: o.color || '#ffd166', who: o.who ?? null, label: o.label || kind, when: o.when || null });
    return id;
  }

  // Socket that takes the listed items; its signal turns on once all are in.
  lock(x, y, z, accepts, o = {}) {
    const id = this.id('L');
    this.locks.push({ id, x, y, z, accepts, label: o.label || 'Lock', radius: o.radius || 2.2, yaw: o.yaw || 0, style: o.style || 'keyhole' });
    return id;
  }

  // Order puzzle: pound these switches in this order. Wrong press resets.
  seq(ids) {
    const id = this.id('q');
    this.seqs.push({ id, ids });
    return id;
  }

  // A wheel you pound to turn: each pound shows the next value. values are
  // strings (digits, arrows, words) or, with style 'color', CSS colors.
  // links: other dials that turn along with this one (lights-out puzzles).
  dial(x, top, z, o = {}) {
    const id = this.id('d');
    const values = o.values || ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    this.switches.push({ id, x, y: top, z, yaw: 0, latch: false, duration: 0, dial: true, color: o.color || null });
    this.dials.push({ id, x, y: top, z, values, start: o.start ?? 0, style: o.style || 'text', links: o.links || [], label: o.label || '', h: o.h ?? 1.9 });
    return id;
  }

  // On (and latched, by default) once every dial shows its target value
  // (targets are indices into each dial's values).
  combo(dials, targets, o = {}) {
    const id = this.id('Q');
    this.combos.push({ id, dials, targets, latch: o.latch ?? true });
    return id;
  }

  // Box-shaped region. kinds:
  //   trigger: latches a signal the first time anyone walks in (fx plays then)
  //   kill: touching it is a fall (with `scare` text: a jump scare)
  //   hide: monsters can't see you inside      safe: monsters give up on you here
  //   redlight: "stand still when the lights turn red" (rule zone)
  //   warp: moves you to `to` = [x, y, z, yaw] (both: your partner too).
  //     portal: a colour — draws it as a glowing portal, with a ring where you
  //     come out; keep: come out moving as fast as you went in (or at least
  //     `keep` m/s), in the `to` yaw direction; fling: [vx, vy, vz] out;
  //     side: how far apart the two of you come out (default 1.1 each side)
  //   gravity: jumps float (`g` = gravity multiplier, e.g. 0.35)
  //   tether: inside it you two are tied together by a rope `len` metres long
  //   (flood zones come from flood())
  zone(kind, x, y, z, sx, sy, sz, o = {}) {
    const id = this.id('z');
    const def = { id, kind, x, y, z, sx, sy, sz };
    for (const k of ['fx', 'text', 'period', 'red', 'offset', 'monster', 'at', 'look', 'to', 'both', 'scare', 'when', 'until', 'quiet', 'cone', 'say', 'g', 'len', 'portal', 'keep', 'fling', 'side', 'pulse']) if (o[k] !== undefined) def[k] = o[k];
    this.zones.push(def);
    return id;
  }

  // Rising lava or water over the rectangle (x, z, sx, sz): it climbs from y0
  // to y1 at `speed` m/s, starting when `when` turns on (or at the start), and
  // drains away once `until` is on, and stops rising while `hold` is on
  // (a signal id, or a list: any of them).
  // Touching it is a fall; when anyone falls, it drops back and starts again
  // after `grace` seconds.
  flood(x, z, sx, sz, o = {}) {
    const y0 = o.y0 ?? -2, y1 = o.y1 ?? 10;
    const id = this.zone('flood', x, (y0 + y1) / 2, z, sx, y1 - y0, sz);
    Object.assign(this.zones[this.zones.length - 1], {
      y0, y1, speed: o.speed ?? 0.6, when: o.when || null, until: o.until || null, hold: o.hold || null, grace: o.grace ?? 2.5, look: o.look || 'lava',
    });
    return id;
  }

  // Bounce drum. when: only there while that signal is on. move + moveWhen:
  // slides by `move` while moveWhen is on (a partner can put it in place).
  drum(x, top, z, r, o = {}) {
    const id = this.bouncer(x, top, z, r);
    const d = this.bouncers[this.bouncers.length - 1];
    if (o.when) d.when = o.when;
    if (o.move) Object.assign(d, { move: o.move, moveWhen: o.moveWhen, speed: o.speed || 5 });
    return id;
  }

  // Conveyor belt (dir = [dx, dz] it carries you); flip: signal (or list of
  // signals, any of them) that reverses it.
  belt(x, top, z, w, d, speed, dir, o = {}) {
    this.conveyor(x, top, z, w, d, speed, dir);
    const v = this.conveyors[this.conveyors.length - 1];
    if (o.flip) v.flip = o.flip;
    return v.id;
  }

  // A raft that floats on a flood's surface (flood: one id or a list — it rides
  // the highest). It rests with its top at `base` while the water is lower.
  float(x, z, w, d, o = {}) {
    const id = this.id('F');
    const t = o.t ?? 0.5;
    this.floats.push({ id, x, z, sx: w, sy: t, sz: d, base: o.base ?? 0, offset: o.offset ?? 0.25, flood: [].concat(o.flood || []), color: o.color || '#c9955a' });
    return id;
  }

  // Light glass: solid only while a flashlight shines on it (dark levels).
  // who: 0 = only Sol's light counts, 1 = only Luna's, null = anyone's.
  // need: how many lights at once (standing on it counts as lighting it).
  glass(x, top, z, w, d, o = {}) {
    const t = o.t || 0.5;
    const id = this.id('y');
    const who = o.who ?? null;
    this.glasses.push({ id, x, y: top - t / 2, z, sx: w, sy: t, sz: d, yaw: o.yaw || 0, who, need: o.need ?? 1, color: o.color || (who === 0 ? '#ff9a7a' : who === 1 ? '#8fb4ff' : '#e8f4ff') });
    return id;
  }

  // Red/blue block: solid only while dial `dial` shows value index `on`
  // (a two-value dial makes a switch that swaps which blocks are there).
  swap(x, top, z, w, d, o = {}) {
    const t = o.t || 0.8;
    const id = this.id('x');
    this.swaps.push({ id, x, y: top - t / 2, z, sx: w, sy: t, sz: d, yaw: o.yaw || 0, dial: o.dial, on: o.on ?? 0, color: o.color || (o.on ? '#4f86ff' : '#ff5d5d') });
    return id;
  }

  // A figure that just stands there (mannequins, dolls, things in the corner).
  // when / until: signals that make it appear / go away. watch: its head
  // turns to follow you.
  figure(x, y, z, o = {}) {
    this.figures.push({ x, y, z, yaw: o.yaw || 0, look: o.look || 'tall', when: o.when || null, until: o.until || null, watch: !!o.watch, scale: o.scale || 1 });
  }

  // A named spot, for walkthroughs and tests (not shown in the game).
  mark(name, x, y, z) {
    this.marks[name] = [x, y, z];
  }

  // Light source. fixture: 'tube' | 'bulb' | 'candle' | 'none'.
  // when: only lit while that signal is on; rule: a redlight zone it follows.
  light(x, y, z, o = {}) {
    this.lights.push({
      x, y, z, color: o.color || '#fff2d6', intensity: o.intensity ?? 6, dist: o.dist ?? 14,
      flicker: o.flicker ?? 0, fixture: o.fixture || 'bulb', when: o.when || null, off: o.off || null, rule: o.rule || null,
      // pulse: [period, phase, duty] — blinks on for `duty` of each period (for showing a pattern).
      pulse: o.pulse || null,
      size: o.size || 1, // fixture size (big glowing orbs for showing patterns)
    });
  }

  // A page of the story lying around.
  note(x, y, z, title, text) {
    const id = this.id('n');
    this.notes.push({ id, x, y, z, title, text });
    return id;
  }

  // Server-run chaser. nodes: walkable waypoints, edges: pairs of node indices,
  // patrol: node loop, active: signal that wakes it (null = from the start).
  monster(def) {
    const id = this.id('M');
    this.monsters.push({ id, speed: 3.2, chase: 6.0, sight: 16, catchR: 1.2, look: 'tall', patrol: [], active: null, until: null, giveUp: 14, rest: 6, narrow: 0.45, light: true, ...def });
    return id;
  }

  // Section start: a checkpoint pad where both players respawn.
  checkpoint(x, top, z, size, o = {}) {
    const yaw = o.yaw || 0;
    const idx = this.checkpoints.length;
    const sp = (lx, lz) => {
      const [dx, dz] = rot(yaw, lx, lz);
      return [x + dx, top, z + dz, yaw];
    };
    const [fx, fz] = rot(yaw, -size / 2 + 0.8, -size / 2 + 0.8);
    this.checkpoints.push({
      id: this.id('k'), idx, x, y: top, z, size, yaw,
      flag: o.flag === false ? null : [x + fx, top, z + fz],
      spawns: [sp(-1.4, o.back ?? -0.5), sp(1.4, o.back ?? -0.5)],
    });
    this.sections.push({ type: o.type || this.meta.mode, coop: o.coop ?? true, hint: o.hint || '', cp: idx });
    return idx;
  }

  goal(x, top, z, yaw = 0, o = {}) {
    this.goalDef = { x, y: top, z, yaw, style: o.style || 'arch' };
  }

  // -- output -----------------------------------------------------------------

  finish() {
    const g = this.goalDef;
    const checkpoints = this.checkpoints.slice();
    let goal = null;
    if (g) {
      goal = { id: this.id('goal'), x: g.x, y: g.y, z: g.z, size: 7, yaw: g.yaw, style: g.style };
      const sp = (lx) => {
        const [dx, dz] = rot(g.yaw, lx, -2);
        return [g.x + dx, g.y, g.z + dz, g.yaw];
      };
      checkpoints.push({ id: this.id('k'), idx: checkpoints.length, x: g.x, y: g.y, z: g.z, size: 7, yaw: g.yaw, goal: true, spawns: [sp(-1.4), sp(1.4)] });
    }
    let minTop = Infinity;
    const b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity };
    const add = (x, y, z, hx, hy, hz) => {
      b.minX = Math.min(b.minX, x - hx); b.maxX = Math.max(b.maxX, x + hx);
      b.minZ = Math.min(b.minZ, z - hz); b.maxZ = Math.max(b.maxZ, z + hz);
      b.minY = Math.min(b.minY, y - hy); b.maxY = Math.max(b.maxY, y + hy);
    };
    for (const s of [...this.solids, ...this.traps, ...this.swaps, ...this.glasses, ...this.crumbles, ...this.blinks]) {
      const r = Math.hypot(s.sx, s.sz) / 2;
      add(s.x, s.deep ? s.y + s.sy / 2 : s.y, s.z, r, s.deep ? 0 : s.sy / 2, r);
      minTop = Math.min(minTop, s.y + s.sy / 2);
    }
    for (const c of checkpoints) minTop = Math.min(minTop, c.y);
    if (!Number.isFinite(minTop)) minTop = 0;
    const signals = [
      ...this.plates.map((p) => ({ id: p.id, kind: 'plate' })),
      ...this.switches.map((w) => (w.dial ? { id: w.id, kind: 'dial' } : { id: w.id, kind: 'switch', latch: w.latch, duration: w.duration })),
      ...this.combos.map((c) => ({ id: c.id, kind: 'combo' })),
      ...this.locks.map((l) => ({ id: l.id, kind: 'lock' })),
      ...this.seqs.map((q) => ({ id: q.id, kind: 'seq' })),
      ...this.zones.filter((z) => z.kind === 'trigger').map((z) => ({ id: z.id, kind: 'zone' })),
    ];
    const m = this.meta;
    return {
      version: 1,
      mode: m.mode,
      seed: m.seed,
      index: m.index,
      name: m.name,
      label: m.label,
      chapter: m.mode,
      twist: null,
      heat: 0,
      theme: this.theme,
      killY: this.killY ?? minTop - 16,
      bounds: b,
      signals,
      solids: this.solids, movers: this.movers, plates: this.plates, switches: this.switches, acts: this.acts,
      pads: this.pads, seesaws: this.seesaws, bouncers: this.bouncers, fields: this.fields, gems: this.gems,
      signs: this.signs, wires: this.wires, checkpoints, segments: this.sections, decor: this.decor,
      blinks: this.blinks, crumbles: this.crumbles, pendulums: this.pendulums, conveyors: this.conveyors, fans: this.fans,
      goal,
      fakeGoals: this.fakeGoals,
      traps: this.traps, swaps: this.swaps, floats: this.floats, glass: this.glasses, items: this.items, locks: this.locks, seqs: this.seqs, dials: this.dials, combos: this.combos, zones: this.zones,
      lights: this.lights, notes: this.notes, monsters: this.monsters, figures: this.figures, marks: this.marks,
      story: this.story, objectives: this.objectives,
    };
  }
}
