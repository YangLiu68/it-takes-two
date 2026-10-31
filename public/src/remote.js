// The partner as seen on this machine: snapshots are buffered and rendered
// ~100 ms in the past so motion stays smooth. When the partner stands on a
// moving platform we place them relative to that platform, so they ride it
// without jitter even though the platform is simulated locally.

import * as THREE from 'three';
import { PHYS } from '../shared/constants.js';
import { Collider, wrapAngle } from './physics.js';

const DELAY = 110;
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _l = new THREE.Vector3();

export const FLAG = { grounded: 1, dashing: 2, stuck: 4, magHeld: 8, dead: 16, stunned: 32 };

export class RemotePlayer {
  constructor(game, slot) {
    this.game = game;
    this.slot = slot;
    this.pol = slot === 0 ? 1 : -1;
    this.snaps = [];
    this.present = false;
    this.pos = new THREE.Vector3(0, -9999, 0);
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.flags = 0;
    this.pound = 0;
    this.magMode = 0;
    this.magTarget = null;
    this.magT = 0;
    this.lastEv = null;
    this.collider = new Collider('partner', 0.36, PHYS.height / 2, 0.36, { dynamic: true, kind: 'partner' });
    this.collider.enabled = false;
    game.physics.add(this.collider);
  }

  get grounded() {
    return (this.flags & FLAG.grounded) !== 0;
  }
  get magHeld() {
    return (this.flags & FLAG.magHeld) !== 0;
  }
  get stuck() {
    return (this.flags & FLAG.stuck) !== 0;
  }
  get dead() {
    return (this.flags & FLAG.dead) !== 0;
  }
  get anchored() {
    return this.grounded || this.stuck;
  }

  push(msg) {
    const s = this.snaps;
    if (s.length && msg.ts <= s[s.length - 1].ts) return;
    s.push(msg);
    if (s.length > 40) s.shift();
    if (!this.present) {
      this.present = true;
      this.pos.set(...msg.p);
    }
  }

  setGone() {
    this.present = false;
    this.snaps.length = 0;
    this.collider.enabled = false;
  }

  // World position of a snapshot, following its support if it was on a mover.
  snapPos(s, out) {
    if (s.g) {
      const c = this.game.physics.byId.get(s.g);
      if (c && c.dynamic && c.kind !== 'partner') {
        _l.set(s.l[0], s.l[1], s.l[2]);
        return c.toWorld(_l, out);
      }
    }
    return out.set(s.p[0], s.p[1], s.p[2]);
  }

  update(dt, serverNow) {
    const c = this.collider;
    c.beginMove();
    if (!this.present || !this.snaps.length) {
      c.enabled = false;
      return;
    }
    const rt = serverNow - DELAY;
    const s = this.snaps;
    let a = s[0], b = s[0];
    for (let i = s.length - 1; i >= 0; i--) {
      if (s[i].ts <= rt) {
        a = s[i];
        b = s[i + 1] || s[i];
        break;
      }
    }
    let k = 0;
    if (b !== a) k = Math.max(0, Math.min(1, (rt - a.ts) / (b.ts - a.ts)));
    this.snapPos(a, _a);
    this.snapPos(b, _b);
    // Big jumps (respawn) snap instead of sliding across the level.
    if (_a.distanceToSquared(_b) > 36) _a.copy(_b);
    this.pos.lerpVectors(_a, _b, k);
    if (b === a && rt > a.ts && !(a.g && this.game.physics.byId.get(a.g)?.dynamic)) {
      // Extrapolate a little when packets are late.
      const ex = Math.min(0.15, (rt - a.ts) / 1000);
      this.pos.x += a.v[0] * ex;
      this.pos.y += a.v[1] * ex;
      this.pos.z += a.v[2] * ex;
    }
    this.vel.set(
      a.v[0] + (b.v[0] - a.v[0]) * k,
      a.v[1] + (b.v[1] - a.v[1]) * k,
      a.v[2] + (b.v[2] - a.v[2]) * k,
    );
    this.yaw = a.y + wrapAngle(b.y - a.y) * k;
    const cur = k > 0.5 ? b : a;
    this.flags = cur.f;
    this.pound = cur.pd;
    this.magMode = cur.m;
    this.magTarget = cur.mt;
    this.magT = cur.ms;
    this.processEvents(cur.ev);

    // Drop snapshots we no longer need.
    while (s.length > 2 && s[1].ts < rt - 200) s.shift();

    c.enabled = !this.dead;
    c.set(this.pos.x, this.pos.y + PHYS.height / 2, this.pos.z, 0);
    c.endMove(dt);
  }

  processEvents(ev) {
    if (!ev) return;
    const prev = this.lastEv;
    this.lastEv = ev;
    if (!prev) return;
    for (const key of Object.keys(ev)) {
      if (ev[key] > (prev[key] || 0)) this.game.onRemote(key);
    }
  }
}
