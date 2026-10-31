// Test bot: plays a character through the normal input path (stick, jump,
// pound, magnet, camera), so a walkthrough plays the real game — physics,
// puzzles, monsters and all — the way a person would. Loaded by test/play.mjs.
//
// Each task returns a promise that settles when it's done, or rejects if the
// character dies or the task times out.

import { inZone, redState } from './extras.js';

const wrap = (a) => {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};

export class Bot {
  constructor(itt) {
    this.itt = itt;
    this.task = null;
    this.aim = null; // [x, y, z] | 'monster' | null: where the camera (and flashlight) points
    this.pitch = 0.28;
    this.deaths = 0;
    this.wasDead = false;
    this.history = [];
    itt.app.input.bot = this;
  }

  get game() {
    return this.itt.game;
  }

  run(task) {
    return new Promise((resolve, reject) => {
      if (this.task) this.task.reject(new Error(`interrupted by ${task.type}`));
      const g = this.game;
      this.task = {
        ...task, resolve, reject, t: 0, started: performance.now(),
        timeout: task.timeout ?? (task.type === 'go' ? 25000 : task.type === 'until' ? 30000 : 8000),
        fn: task.fn ? new Function('g', 'bot', 'arg', `return (${task.fn})(g, bot, arg);`) : null,
        lastPos: g ? [g.player.pos.x, g.player.pos.z] : [0, 0], stuckT: 0, phase: 0,
      };
    });
  }

  state() {
    const g = this.game;
    if (!g) return null;
    const p = g.player;
    return { pos: [p.pos.x, p.pos.y, p.pos.z], dead: p.dead, grounded: p.grounded, deaths: this.deaths, task: this.task?.type || null };
  }

  finish(err) {
    const t = this.task;
    if (!t) return;
    this.task = null;
    if (err) t.reject(err);
    else t.resolve(this.state());
  }

  nearestMonster(p) {
    let best = null, bd = 18;
    for (const m of this.game.extras.monsters) {
      if (!m.cur || m.mode === 0 || m.mode === 7) continue;
      const d = m.pos.distanceTo(p);
      if (d < bd) {
        bd = d;
        best = m;
      }
    }
    return best;
  }

  // Called by Input.sample once per frame.
  apply(s) {
    const g = this.game;
    if (!g || g.mode !== 'play') return;
    // Level over: nothing left to do.
    if (g.complete && this.task) this.finish();
    const p = g.player;
    const rig = g.rig;
    // Teleported by a warp: the walk it was on is over.
    const moved = this.lastPos ? Math.hypot(p.pos.x - this.lastPos[0], p.pos.z - this.lastPos[1]) : 0;
    this.lastPos = [p.pos.x, p.pos.z];
    if (moved > 4 && this.task && !p.dead && (this.task.type === 'go' || this.task.type === 'jump')) {
      this.finish();
      return;
    }
    if (p.dead && !this.wasDead) {
      this.deaths++;
      (this.deathLog ||= []).push(`${p.pos.x.toFixed(1)},${p.pos.y.toFixed(1)},${p.pos.z.toFixed(1)} during ${this.task ? this.task.type : 'idle'}`);
    }
    this.wasDead = p.dead;
    const t = this.task;
    // Obey "stand still under the red light" like a careful player.
    let hold = false;
    if (!(t && t.ignoreRed)) {
      for (const z of g.extras.zones) {
        if (z.kind !== 'redlight' || !inZone(z, p.pos, 0.6)) continue;
        const r = redState(z, g.world.time);
        if (r.red || r.warn) hold = true;
      }
    }
    let want = null; // world direction to move in
    let swingAim = null;
    let speed = 1;
    if (t) {
      const now = performance.now();
      const dt = Math.min(0.05, (now - (t.last ?? now)) / 1000) || 1 / 60;
      t.last = now;
      t.t = (now - t.started) / 1000;
      if (p.dead && !t.allowDeath) {
        this.finish(new Error(`died during ${t.type} at ${p.pos.x.toFixed(1)},${p.pos.y.toFixed(1)},${p.pos.z.toFixed(1)}`));
        return;
      }
      if (performance.now() - t.started > t.timeout) {
        this.finish(new Error(`${t.type} timed out at ${p.pos.x.toFixed(1)},${p.pos.y.toFixed(1)},${p.pos.z.toFixed(1)}${t.x !== undefined ? ` (target ${t.x},${t.z})` : ''}`));
        return;
      }
      // attach: { id, local: [x, y, z] } — the target rides on a moving platform
      // (a point in that collider's frame, y measured from its top).
      if (t.attach) {
        const c = g.physics.byId.get(t.attach.id);
        if (c) {
          const [lx, ly, lz] = t.attach.local;
          const cs = Math.cos(c.yaw), sn = Math.sin(c.yaw);
          const wx = c.pos.x + lx * cs + lz * sn, wz = c.pos.z - lx * sn + lz * cs;
          if (t.type === 'go') {
            t.x = wx;
            t.z = wz;
          } else {
            t.to = [wx, c.pos.y + c.hy + (ly || 0), wz];
          }
        }
      }
      // doneIf: finish the task as soon as this in-page test is true.
      if (t.doneIf && !t.doneFn) t.doneFn = new Function('g', 'bot', 'arg', `return (${t.doneIf})(g, bot, arg);`);
      if (t.doneFn) {
        let done = false;
        try {
          done = t.doneFn(g, this, t.arg);
        } catch (e) {
          this.finish(e);
          return;
        }
        if (done) {
          this.finish();
          return;
        }
      }
      // poundIf: ground-pound whenever this in-page test says so (once per airtime).
      if (t.poundIf && !t.poundFn) t.poundFn = new Function('g', 'bot', 'arg', `return (${t.poundIf})(g, bot, arg);`);
      if (t.poundFn && !hold) {
        if (p.grounded || p.vel.y > 1) t.pounded = false;
        if (!t.pounded && !p.grounded && !p.pound) {
          try {
            if (t.poundFn(g, this, t.arg)) {
              s.poundPressed = true;
              t.pounded = true;
            }
          } catch (e) {
            this.finish(e);
            return;
          }
        }
      }
      // jumpIf: jump (while walking) whenever this in-page test says so.
      if (t.jumpIf && !t.jumpFn) t.jumpFn = new Function('g', 'bot', 'arg', `return (${t.jumpIf})(g, bot, arg);`);
      if (t.jumpFn && !hold) {
        t.jumpHoldT = (t.jumpHoldT || 0) - dt;
        if (t.jumpHoldT > 0) s.jumpHeld = true; // a full jump, not a hop
        else if (p.grounded) {
          try {
            if (t.jumpFn(g, this, t.arg)) {
              s.jumpPressed = s.jumpHeld = true;
              t.jumpHoldT = 0.35;
            }
          } catch (e) {
            this.finish(e);
            return;
          }
        }
      }
      switch (t.type) {
        case 'go': {
          // fn: hold still until it's true (checked every frame), then go.
          if (t.fn && !t.gateOpen) {
            let ok = false;
            try {
              ok = t.fn(g, this, t.arg);
            } catch (e) {
              this.finish(e);
              break;
            }
            if (!ok) {
              t.stuckT = 0;
              t.lastPos = [p.pos.x, p.pos.z];
              break;
            }
            t.gateOpen = true;
          }
          // rel: the target is a spot on whatever you're standing on (a moving platform).
          if (t.rel) {
            if (p.grounded && p.ground) {
              t.ax = p.ground.pos.x + t.x;
              t.az = p.ground.pos.z + t.z;
            }
            if (t.ax === undefined) break;
          }
          const tx = t.rel ? t.ax : t.x, tz = t.rel ? t.az : t.z;
          const dx = tx - p.pos.x, dz = tz - p.pos.z;
          const d = Math.hypot(dx, dz);
          const r = t.r ?? 0.45;
          if (d < r) {
            // hold: stay there (until doneIf says so) instead of finishing.
            const hs = Math.hypot(p.vel.x, p.vel.z);
            if (!t.hold && (!t.stop || hs < 0.5)) {
              this.finish();
              break;
            }
            // Told to stop dead but still drifting (in the air there's little
            // drag): push against the drift, like a person would.
            // (A small push the other way: the target velocity is then nearly
            // zero. On the ground, friction does it by itself.)
            if (t.stop && hs > 0.5 && !p.grounded) {
              want = [-p.vel.x / hs, -p.vel.z / hs];
              speed = 0.04;
            }
          } else {
            want = [dx / d, dz / d];
            // Ease in near the target so it doesn't overshoot onto a ledge.
            // (When it must stop dead in the air, where there's little drag,
            // ease in much more gently.)
            speed = Math.min(t.speed ?? 1, p.grounded || !t.stop ? Math.max(0.35, d / 1.6) : Math.max(0.06, d / 2.5));
          }
          // Stuck against something low: hop.
          t.stuckT += dt;
          if (hold) {
            t.stuckT = 0;
            t.lastPos = [p.pos.x, p.pos.z];
          } else if (t.stuckT > 0.8) {
            const moved = Math.hypot(p.pos.x - t.lastPos[0], p.pos.z - t.lastPos[1]);
            if (moved < 0.25 && d > r && t.hop !== false && p.grounded) s.jumpPressed = s.jumpHeld = true;
            t.stuckT = 0;
            t.lastPos = [p.pos.x, p.pos.z];
          }
          break;
        }
        case 'jump': {
          // fn: wait (standing) until it's true, then jump.
          if (t.fn && !t.gateOpen) {
            if (!t.fn(g, this, t.arg)) break;
            t.gateOpen = true;
            t.started = performance.now();
          }
          // at: [x, z] — run toward `to` first and take off on reaching that spot
          // (a running jump, full speed at the edge).
          if (t.phase === 0 && t.at && !t.ran) {
            const ax = t.at[0] - p.pos.x, az = t.at[1] - p.pos.z;
            const dir = [t.to[0] - t.at[0], t.to[2] - t.at[1]];
            const dl = Math.hypot(dir[0], dir[1]) || 1;
            // Past the take-off line (or on it): jump now.
            if (-(ax * dir[0] + az * dir[1]) / dl > -0.15 || Math.hypot(ax, az) < 0.2) {
              t.ran = true;
            } else {
              const d = Math.hypot(ax, az);
              want = [ax / d, az / d];
              break;
            }
          }
          // phase 0: take off · 1: rising · 2: falling / landing
          if (t.phase === 0) {
            s.jumpPressed = s.jumpHeld = true;
            t.phase = 1;
            t.air = 0;
          } else {
            s.jumpHeld = true;
            if (!p.grounded) t.air += dt;
            if (t.double && !t.didDouble && !p.grounded && p.vel.y < (t.doubleAt ?? 2)) {
              s.jumpPressed = true;
              t.didDouble = true;
            }
            if (t.dash && !t.didDash && (t.didDouble || !t.double) && p.vel.y < (t.dashAt ?? 0)) {
              s.dashPressed = true;
              t.didDash = true;
            }
            if (t.air > 0.12 && p.grounded) {
              this.finish();
              break;
            }
            // arrive: r — done once over `to` (e.g. inside an updraft), landed or not.
            if (t.arrive && t.to && t.air > 0.12 && Math.hypot(t.to[0] - p.pos.x, t.to[2] - p.pos.z) < t.arrive) {
              this.finish();
              break;
            }
          }
          if (t.to) {
            const dx = t.to[0] - p.pos.x, dz = t.to[2] - p.pos.z;
            const d = Math.hypot(dx, dz);
            if (d > 0.25) want = [dx / d, dz / d];
            speed = Math.min(1, d / 0.8);
          } else if (t.dir) {
            want = t.dir;
          }
          break;
        }
        case 'pound':
          if (t.phase === 0) {
            s.poundPressed = true;
            t.phase = 1;
          } else if (t.t > 0.25 && p.grounded && !p.pound) {
            this.finish();
          }
          break;
        case 'magnet':
          s.abilityHeld = true;
          if (t.dir) want = t.dir;
          if (t.to) {
            const dx = t.to[0] - p.pos.x, dz = t.to[2] - p.pos.z;
            const d = Math.hypot(dx, dz);
            if (d > 0.3) want = [dx / d, dz / d];
          }
          // stick: let go as soon as it's hanging from a pad (ms is then the limit).
          // (at: [x, z] of the pad meant, so hanging from the previous one doesn't count)
          if (t.t * 1000 >= t.ms || (t.stick && p.mag.mode === 2 && (!t.at || Math.hypot(p.pos.x - t.at[0], p.pos.z - t.at[1]) < 1.0))) this.finish();
          break;
        case 'wait':
          if (t.t * 1000 >= t.ms) this.finish();
          break;
        case 'swing': {
          // Magnet swing along ceiling pads, all in-page so no frame is lost:
          // hold E aimed at pad i until hanging from it, let go for a few
          // frames, aim at the next. After the last one, let go and land.
          if (t.i === undefined) Object.assign(t, { i: 0, rel: 0, since: t.t });
          const pad = t.pads[t.i];
          swingAim = pad;
          if (t.rel > 0) {
            t.rel--;
            if (!t.rel) t.since = t.t;
          } else if (pad) {
            s.abilityHeld = true;
            // The game may pick a pad further along than the one aimed at:
            // carry on from whichever one we're actually hanging from.
            const at = p.mag.mode === 2 ? t.pads.findIndex((q) => Math.hypot(p.pos.x - q[0], p.pos.z - q[2]) < 1) : -1;
            if (at >= t.i) {
              t.i = at + 1;
              t.rel = 4;
            } else if (t.t - t.since > 2.6) {
              t.i++;
              t.rel = 4;
            }
          } else if (p.grounded) {
            this.finish();
          }
          break;
        }
        case 'beat': {
          // Hop along blink blocks on the beat: blocks = [{ x, y, z, id }] (id
          // null = solid ground). Take off when the next block is solid for a
          // while yet, or about to appear before we land.
          if (t.i === undefined) Object.assign(t, { i: 0, air: false, airT: 0 });
          const blk = t.blocks[t.i];
          if (!blk) {
            this.finish();
            break;
          }
          const phase = (id) => {
            const bl = id && g.world.blinks.find((x) => x.def.id === id);
            if (!bl) return { solid: true, remain: 99 };
            const per = bl.def.period;
            const cyc = (((g.world.time / per) % 1) + 1) % 1;
            const first = cyc < 0.5;
            return { solid: bl.def.group === 0 ? first : !first, remain: (first ? 0.5 - cyc : 1 - cyc) * per };
          };
          if (!t.air) {
            const ph = phase(blk.id);
            const lead = t.lead ?? 0.5;
            if (p.grounded && (ph.solid ? ph.remain > 0.8 : ph.remain < lead)) {
              s.jumpPressed = s.jumpHeld = true;
              t.air = true;
              t.airT = 0;
            }
          } else {
            s.jumpHeld = true;
            if (!p.grounded) t.airT += dt;
            const dx = blk.x - p.pos.x, dz = blk.z - p.pos.z;
            const d = Math.hypot(dx, dz);
            if (d > 0.25) want = [dx / d, dz / d];
            speed = Math.min(1, d / 0.8);
            if (t.airT > 0.12 && p.grounded) {
              t.i++;
              t.air = false;
            }
          }
          break;
        }
        case 'bounce': {
          // Jump onto a drum and pound as you land (big bounce), then steer to
          // `to` and, if `pound`, pound again once above it.
          if (t.phase === 0) {
            s.jumpPressed = s.jumpHeld = true;
            t.phase = 1;
          }
          const tgt = t.phase < 3 ? t.drum : t.to;
          const dx = tgt[0] - p.pos.x, dz = tgt[2] - p.pos.z;
          const d = Math.hypot(dx, dz);
          if (d > 0.2) want = [dx / d, dz / d];
          speed = Math.min(1, d / 0.8);
          if (t.phase === 1 && p.vel.y < 0 && d < 0.8 && p.pos.y < t.drum[1] + 2.5) {
            s.poundPressed = true;
            t.phase = 2;
          } else if (t.phase === 2 && p.vel.y > 12) {
            t.phase = 3;
          } else if (t.phase === 3 && t.pound && d < 0.6 && p.vel.y < 1 && !p.pound) {
            s.poundPressed = true;
            t.phase = 4;
          } else if (t.phase >= 3 && p.grounded) {
            this.finish();
          }
          break;
        }
        case 'until':
          try {
            if (t.fn(g, this, t.arg)) this.finish();
          } catch (e) {
            this.finish(e);
          }
          break;
        default:
          this.finish(new Error(`unknown task ${t.type}`));
      }
    }

    if (hold) {
      want = null;
      s.jumpPressed = s.dashPressed = s.poundPressed = false;
    }

    // dodge: ids of spinning bars to hop over when they sweep at you (a full
    // jump: holding the button, so it isn't cut short).
    if (this.dodgeUntil && performance.now() < this.dodgeUntil) s.jumpHeld = true;
    if (this.dodge && p.grounded && !hold) {
      for (const mv of g.world.movers) {
        const d = mv.def;
        if (!this.dodge.includes(d.id)) continue;
        if (d.motion.type === 'linear') {
          // A sliding bar: hop when it's about to reach you.
          const mo = d.motion;
          const lead = this.dodgeLead ?? 0.3;
          for (let ahead = 0; ahead <= lead + 1e-6; ahead += 0.05) {
            const u = (1 - Math.cos(2 * Math.PI * ((g.world.time + ahead) / mo.period + mo.phase))) / 2;
            const cx = mo.a[0] + (mo.b[0] - mo.a[0]) * u, cy = mo.a[1] + (mo.b[1] - mo.a[1]) * u, cz = mo.a[2] + (mo.b[2] - mo.a[2]) * u;
            if (Math.abs(p.pos.x - cx) < d.sx / 2 + 0.55 && Math.abs(p.pos.z - cz) < d.sz / 2 + 0.55 && p.pos.y < cy + d.sy / 2 + 0.3 && p.pos.y + 1.55 > cy - d.sy / 2) {
              s.jumpPressed = s.jumpHeld = true;
              this.dodgeUntil = performance.now() + 350;
              break;
            }
          }
          continue;
        }
        if (d.motion.type !== 'spin') continue;
        const [cx, cy, cz] = d.motion.center;
        if (p.pos.y > cy + d.sy / 2 + 0.3) continue;
        const dx = p.pos.x - cx, dz = p.pos.z - cz;
        for (const ahead of [0, 0.08, 0.16, 0.24]) {
          const yaw = mv.tf.yaw + d.motion.speed * ahead;
          const lx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
          const lz = dx * Math.sin(yaw) + dz * Math.cos(yaw);
          if (Math.abs(lx) < d.sx / 2 + 0.5 && Math.abs(lz) < d.sz / 2 + 0.55) {
            s.jumpPressed = s.jumpHeld = true;
            this.dodgeUntil = performance.now() + 350;
            break;
          }
        }
      }
    }

    // Camera: look where we're going, unless told to watch something.
    let lookYaw = null;
    let aim = swingAim || this.aim;
    if (aim === 'monster') {
      const m = this.nearestMonster(p.pos);
      aim = m ? [m.pos.x, m.pos.y + 1.2, m.pos.z] : null;
    } else if (typeof aim === 'string' && aim.startsWith('monster:')) {
      // A particular monster (index into level.monsters), while it's about.
      const m = g.extras.monsters[Number(aim.slice(8))];
      const ok = m && m.cur && m.mode !== 0 && m.mode !== 7;
      const n = ok ? null : this.nearestMonster(p.pos);
      const t = ok ? m : n;
      aim = t ? [t.pos.x, t.pos.y + 1.2, t.pos.z] : null;
    }
    if (Array.isArray(aim)) lookYaw = Math.atan2(aim[0] - p.pos.x, aim[2] - p.pos.z);
    else if (want) lookYaw = Math.atan2(want[0], want[1]);
    if (lookYaw !== null) {
      // The camera sits behind the look direction: forward = (-sin yaw, -cos yaw).
      const target = lookYaw + Math.PI;
      s.lookX = wrap(rig.yaw - target);
    }
    let wantPitch = this.pitch;
    if (swingAim) {
      // Look up at the pad (as far as the camera allows).
      const dh = Math.hypot(swingAim[0] - p.pos.x, swingAim[2] - p.pos.z);
      wantPitch = Math.max(-0.55, Math.min(0.3, -Math.atan2(swingAim[1] - (p.pos.y + 1.35), dh)));
    }
    s.lookY = wantPitch - rig.pitch;
    if (want) {
      const cy = rig.yaw;
      const fx = -Math.sin(cy), fz = -Math.cos(cy);
      const rx = Math.cos(cy), rz = -Math.sin(cy);
      s.my = (want[0] * fx + want[1] * fz) * speed;
      s.mx = (want[0] * rx + want[1] * rz) * speed;
    } else if (this.task || this.aim) {
      s.mx = s.my = 0;
    }
  }
}
