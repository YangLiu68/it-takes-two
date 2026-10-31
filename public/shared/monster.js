// Chasers for the horror stories, simulated by the server so both players
// see the same monster. Pure logic: no three.js.
//
// The rules that keep a chase fair:
//  - It only walks where there is floor: across a gap it has to take the same
//    beam you did, and on anything narrow it slows right down.
//  - It sees along clear sight lines only (walls and shut doors block it);
//    lockers and wardrobes hide you, and in a safe room it gives up.
//  - A chase has a start (`active`, a signal) and an end (`until`): after
//    that it is gone for good. It also gives up after `giveUp` seconds, or as
//    soon as you leave its `area`, and walks back to where it came from.
//  - A flashlight beam on it (or, with `seen`, just looking at it) freezes it.
//  - After it catches someone it walks home and won't see anyone for a bit.

const EYE = 1.3;

// Modes, as sent to clients.
export const MON = { asleep: 0, patrol: 1, search: 2, chase: 3, stun: 4, home: 5, frozen: 6, gone: 7 };

// Does the segment a→b (XZ) pass through the rotated box w?
function segHitsBox(ax, az, bx, bz, w) {
  const l = (x, z) => {
    const dx = x - w.x, dz = z - w.z;
    return [dx * w.c - dz * w.s, dx * w.s + dz * w.c];
  };
  const [x1, z1] = l(ax, az);
  const [x2, z2] = l(bx, bz);
  let t0 = 0, t1 = 1;
  const dx = x2 - x1, dz = z2 - z1;
  for (const [p, d, h] of [[x1, dx, w.hx], [z1, dz, w.hz]]) {
    if (Math.abs(d) < 1e-9) {
      if (p < -h || p > h) return false;
    } else {
      let ta = (-h - p) / d, tb = (h - p) / d;
      if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta);
      t1 = Math.min(t1, tb);
      if (t0 > t1) return false;
    }
  }
  return true;
}

const boxOf = (s, extra = {}) => {
  const yaw = s.yaw || 0;
  return { x: s.x, z: s.z, hx: s.sx / 2, hz: s.sz / 2, c: Math.cos(yaw), s: Math.sin(yaw), ...extra };
};

export function makeWalls(level, y) {
  const walls = [];
  const lo = y + 0.6, hi = y + 2.0;
  const push = (s, extra = {}) => {
    if (s.y - s.sy / 2 > hi || s.y + s.sy / 2 < lo) return;
    if (Math.min(s.sx, s.sz) < 0.05) return;
    walls.push(boxOf(s, extra));
  };
  for (const s of level.solids) push(s);
  // Doors block sight (and the way) while shut.
  for (const a of level.acts) if (a.style === 'door' || a.style === 'gate') for (const p of a.parts) push(p, { act: a.id });
  return walls;
}

// Everything it can stand on at height y: floors, beams, bridges.
export function makeFloors(level, y) {
  const out = [];
  for (const s of level.solids) {
    const top = s.y + s.sy / 2;
    if (top < y - 0.45 || top > y + 0.4) continue;
    out.push(boxOf(s, { narrow: Math.min(s.sx, s.sz) < 1.4 }));
  }
  return out;
}

export function sightClear(walls, acts, a, b) {
  for (const w of walls) {
    if (w.act && acts && acts[w.act] === 1) continue;
    if (segHitsBox(a[0], a[2], b[0], b[2], w)) return false;
  }
  return true;
}

const onBox = (w, x, z, pad) => {
  const dx = x - w.x, dz = z - w.z;
  const lx = dx * w.c - dz * w.s, lz = dx * w.s + dz * w.c;
  return Math.abs(lx) <= w.hx + pad && Math.abs(lz) <= w.hz + pad;
};

const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[2] - b[2]) ** 2;

const inRect = (r, p) => p[0] >= r[0] && p[0] <= r[2] && p[2] >= r[1] && p[2] <= r[3];

export class MonsterSim {
  constructor(level, def) {
    this.def = def;
    this.level = level;
    this.y = def.y ?? (def.nodes.length ? def.nodes[0][1] : 0);
    this.walls = makeWalls(level, this.y);
    this.floors = makeFloors(level, this.y);
    this.adj = def.nodes.map(() => []);
    for (const [i, j] of def.edges || []) {
      this.adj[i].push(j);
      this.adj[j].push(i);
    }
    const start = def.start ?? def.patrol[0] ?? 0;
    this.pos = [...def.nodes[start]];
    this.pos[1] = this.y;
    this.home = def.home || def.wakeAt || [...def.nodes[start]];
    this.yaw = 0;
    this.awake = !def.active;
    this.mode = this.awake ? 'patrol' : 'asleep';
    this.patrolI = Math.max(0, def.patrolStart ?? 0);
    this.path = [];
    this.pathT = 0;
    this.target = -1;
    this.lastSeen = null;
    this.timer = 0;
    this.chaseT = 0;
    this.blind = 0; // seconds it ignores everyone (after a catch or giving up)
    this.speedNow = 0;
    this.frozen = false;
  }

  wake(at) {
    if (this.mode === 'gone') return;
    if (at) this.pos = [at[0], this.y, at[2]];
    this.awake = true;
    if (this.mode === 'asleep') this.mode = 'patrol';
    this.path = [];
  }

  // The chase is over for good.
  vanish() {
    this.mode = 'gone';
    this.awake = false;
    this.target = -1;
  }

  ground(x, z, pad = 0.15) {
    for (const f of this.floors) if (onBox(f, x, z, pad)) return f;
    return null;
  }

  // Can it walk straight from a to b? Nothing in the way, floor all along
  // (checked strictly, so it lines up with a plank before stepping on).
  walkable(a, b, acts) {
    if (!sightClear(this.walls, acts, a, b)) return false;
    const d = Math.sqrt(dist2(a, b));
    const n = Math.ceil(d / 0.25);
    for (let i = 1; i <= n; i++) {
      const u = i / n;
      if (!this.ground(a[0] + (b[0] - a[0]) * u, a[2] + (b[2] - a[2]) * u, 0)) return false;
    }
    return true;
  }

  nearestNode(p, acts, needWalk = true) {
    let best = -1, bd = Infinity;
    this.def.nodes.forEach((n, i) => {
      const d = dist2(n, p);
      if (d < bd && (!needWalk || this.walkable(n, p, acts))) {
        bd = d;
        best = i;
      }
    });
    if (best < 0 && needWalk) return this.nearestNode(p, acts, false);
    return best;
  }

  // Breadth-first path between nodes.
  route(from, to) {
    if (from < 0 || to < 0) return [];
    const prev = new Map([[from, -1]]);
    const q = [from];
    while (q.length) {
      const n = q.shift();
      if (n === to) break;
      for (const m of this.adj[n]) if (!prev.has(m)) {
        prev.set(m, n);
        q.push(m);
      }
    }
    if (!prev.has(to)) return [];
    const out = [];
    for (let n = to; n !== -1; n = prev.get(n)) out.unshift(n);
    return out;
  }

  inArea(p) {
    const a = this.def.area;
    return !a || a.some((r) => inRect(r, p));
  }

  canSee(p, acts) {
    if (!p.present || !p.alive || p.hidden || p.safe || p.grace) return false;
    const pp = p.pos;
    if (Math.abs(pp[1] - this.y) > 3.5) return false;
    if (!this.inArea(pp)) return false;
    if (dist2(pp, this.pos) > this.def.sight ** 2) return false;
    return sightClear(this.walls, acts, [this.pos[0], this.y + EYE, this.pos[2]], pp);
  }

  // Is anyone's flashlight on it (or, for `seen` monsters, anyone looking)?
  lit(players, acts) {
    const d = this.def;
    if (d.light === false && !d.seen) return false;
    const range = d.seen ? 24 : d.lightRange ?? 11;
    const cone = d.seen ? 0.62 : d.lightCone ?? 0.4;
    for (const p of players) {
      if (!p || !p.present || !p.alive || p.look === undefined || p.look === null) continue;
      if (!d.seen && !p.torch) continue;
      const dx = this.pos[0] - p.pos[0], dz = this.pos[2] - p.pos[2];
      const dd = Math.hypot(dx, dz);
      if (dd > range || Math.abs(p.pos[1] - this.y) > 3) continue;
      // Close up, any glance in its direction counts.
      let da = Math.atan2(dx, dz) - p.look;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      if (Math.abs(da) > cone + Math.min(0.5, 0.5 / Math.max(0.5, dd))) continue;
      if (!sightClear(this.walls, acts, p.pos, this.pos)) continue;
      return true;
    }
    return false;
  }

  // Head toward a world point: straight if it can walk there, else along the graph.
  steer(goal, speed, dt, acts) {
    let aim = goal;
    if (!this.walkable(this.pos, goal, acts)) {
      this.pathT -= dt;
      if (this.pathT <= 0 || !this.path.length) {
        this.pathT = 0.5;
        this.path = this.route(this.nearestNode(this.pos, acts), this.nearestNode(goal, acts));
      }
      while (this.path.length && dist2(this.def.nodes[this.path[0]], this.pos) < 0.35 * 0.35) this.path.shift();
      // Skip ahead to the furthest node it can already walk to.
      for (let k = this.path.length - 1; k > 0; k--) {
        if (this.walkable(this.pos, this.def.nodes[this.path[k]], acts)) {
          this.path.splice(0, k);
          break;
        }
      }
      if (this.path.length) aim = this.def.nodes[this.path[0]];
      else aim = this.pos; // nowhere to go: wait
    } else {
      this.path = [];
    }
    const dx = aim[0] - this.pos[0], dz = aim[2] - this.pos[2];
    const d = Math.hypot(dx, dz);
    if (d > 1e-3) {
      // Slow on beams and planks.
      const f = this.ground(this.pos[0], this.pos[2], 0.05);
      const v = speed * (f && f.narrow ? this.def.narrow ?? 0.45 : 1);
      const step = Math.min(d, v * dt);
      const nx = this.pos[0] + (dx / d) * step, nz = this.pos[2] + (dz / d) * step;
      // Never step off the floor. If something leaves it stuck at an edge,
      // forget the shortcut and head for the next node.
      if (this.ground(nx, nz, 0.05) || !this.ground(this.pos[0], this.pos[2], 0.05)) {
        this.pos[0] = nx;
        this.pos[2] = nz;
        this.speedNow = v;
        this.stuckT = 0;
      } else if ((this.stuckT = (this.stuckT || 0) + dt) > 0.5) {
        this.stuckT = 0;
        this.path = [];
        this.pathT = 0;
      }
      const want = Math.atan2(dx, dz);
      let dy = want - this.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      this.yaw += dy * Math.min(1, dt * 8);
    }
    return Math.hypot(goal[0] - this.pos[0], goal[2] - this.pos[2]);
  }

  goHome(ev, why) {
    if (this.mode === 'chase' || this.mode === 'search') ev.push({ kind: 'gaveup', slot: this.target, why });
    this.mode = 'home';
    this.target = -1;
    this.path = [];
    this.chaseT = 0;
  }

  // players[slot] = { pos, look, torch, alive, hidden, safe, present, grace }.
  // o: { frozen (a rule holds it still), over (its `until` signal is on) }. Returns events.
  update(dt, players, acts, o = {}) {
    const ev = [];
    const def = this.def;
    this.speedNow = 0;
    this.frozen = false;
    if (this.mode === 'gone') return ev;
    if (o.over) {
      this.vanish();
      ev.push({ kind: 'vanish' });
      return ev;
    }
    if (!this.awake) return ev;
    this.blind = Math.max(0, this.blind - dt);
    if (this.mode === 'stun') {
      this.timer -= dt;
      if (this.timer <= 0) this.mode = 'home';
      return ev;
    }
    // The light's hold lingers a moment, so sweeping the beam past it (or
    // walking right by it) doesn't let it lunge.
    if (this.lit(players, acts)) this.litT = def.lightHold ?? 0.5;
    else this.litT = Math.max(0, (this.litT || 0) - dt);
    if (o.frozen || this.litT > 0) {
      // Held still. A chase still runs out while it's held.
      this.frozen = true;
      if (this.mode === 'chase') {
        this.chaseT += dt;
        if (this.chaseT > (def.giveUp ?? 14)) {
          this.blind = def.rest ?? 6;
          this.goHome(ev, 'tired');
        }
      }
      return ev;
    }

    // Look for someone (stick with the current target while they're in view).
    let seen = -1, bd = Infinity;
    if (this.blind <= 0) {
      players.forEach((p, i) => {
        if (!p || !this.canSee(p, acts)) return;
        const d = dist2(p.pos, this.pos) - (i === this.target ? 9 : 0);
        if (d < bd) {
          bd = d;
          seen = i;
        }
      });
    }
    if (seen >= 0) {
      if (this.mode !== 'chase') {
        ev.push({ kind: 'spotted', slot: seen });
        this.chaseT = 0;
      }
      this.mode = 'chase';
      this.target = seen;
      this.lastSeen = [...players[seen].pos];
      this.timer = 0;
    } else if (this.mode === 'chase') {
      const t = players[this.target];
      if (t && (t.safe || !this.inArea(t.pos))) {
        // Into a safe room or out of its territory: it gives up at once.
        this.blind = def.rest ?? 6;
        this.goHome(ev, t.safe ? 'safe' : 'area');
      } else {
        this.mode = 'search';
        this.timer = def.search ?? 3;
      }
    }

    if (this.mode === 'chase') {
      const t = players[this.target];
      this.chaseT += dt;
      const left = this.steer(t.pos, def.chase, dt, acts);
      if (left < def.catchR && Math.abs(t.pos[1] - this.y) < 1.6) {
        ev.push({ kind: 'caught', slot: this.target });
        this.mode = 'stun';
        this.timer = def.stun ?? 1.2;
        this.blind = def.rest ?? 6;
        this.target = -1;
        this.path = [];
        this.chaseT = 0;
      } else if (this.chaseT > (def.giveUp ?? 14)) {
        this.blind = def.rest ?? 6;
        this.goHome(ev, 'tired');
      }
    } else if (this.mode === 'search') {
      const left = this.steer(this.lastSeen, def.speed * 1.3, dt, acts);
      if (left < 0.6 || this.speedNow === 0) this.timer -= dt;
      if (this.timer <= 0) this.goHome(ev, 'lost');
    } else if (this.mode === 'home') {
      const left = this.steer(this.home, def.speed * 1.2, dt, acts);
      if (left < 0.5) {
        this.mode = 'patrol';
        this.path = [];
        // Pick up the patrol at the nearest stop.
        if (def.patrol.length) {
          let bi = 0, bdd = Infinity;
          def.patrol.forEach((n, i) => {
            const dd = dist2(def.nodes[n], this.pos);
            if (dd < bdd) {
              bdd = dd;
              bi = i;
            }
          });
          this.patrolI = bi;
        }
      }
    } else if (def.patrol.length) {
      const goal = def.nodes[def.patrol[this.patrolI % def.patrol.length]];
      const left = this.steer(goal, def.speed, dt, acts);
      if (left < 0.4) this.patrolI++;
    }
    this.pos[1] = this.y;
    return ev;
  }

  state() {
    const m = this.frozen && this.mode !== 'gone' ? MON.frozen : MON[this.mode];
    return [Math.round(this.pos[0] * 100) / 100, Math.round(this.pos[1] * 100) / 100, Math.round(this.pos[2] * 100) / 100, Math.round(this.yaw * 100) / 100, m];
  }
}
