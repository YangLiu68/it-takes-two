// The locally controlled character. Each client is authoritative over its own
// player and streams the result to its partner.

import * as THREE from 'three';
import { PHYS } from '../shared/constants.js';
import { wrapAngle } from './physics.js';

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

export class LocalPlayer {
  constructor(game, slot) {
    this.game = game;
    this.slot = slot;
    this.pol = slot === 0 ? 1 : -1;
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.dashDir = new THREE.Vector3();
    this.ctx = { pol: this.pol, self: null };
    this.res = {};
    this.reset();
  }

  reset() {
    this.vel.set(0, 0, 0);
    this.grounded = false;
    this.ground = null;
    this.coyote = 0;
    this.jumpBuf = 0;
    this.airJumps = 1;
    this.airDash = 1;
    this.jumping = false;
    this.dashT = 0;
    this.dashCD = 0;
    this.pound = 0; // 0 none, 1 hang, 2 falling, 3 recovering
    this.poundT = 0;
    this.stomp = false; // hopped from the ground; pounds at the top of the hop
    this.stunT = 0;
    this.momentum = false;
    this.mag = { mode: 0, target: null, held: false, holdStart: 0, exclId: null, exclT: 0, used: false, pullT: 0 };
    this.dead = false;
    this.deadT = 0;
  }

  spawnAt(sp) {
    this.reset();
    this.pos.set(sp[0], sp[1] + 0.02, sp[2]);
    this.yaw = sp[3];
  }

  get dashing() {
    return this.dashT > 0;
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.deadT = 1.1;
    this.vel.set(0, 0, 0);
    this.mag.mode = 0;
    this.game.onLocal('die');
  }

  update(dt, inp, view) {
    if (this.dead) {
      this.deadT -= dt;
      if (this.deadT <= 0) this.game.respawnLocal();
      return;
    }
    if (this.grounded && this.ground && this.ground.dynamic) this.carry(this.ground);
    if (this.grounded && this.ground && this.ground.belt) {
      // Conveyor belts carry you along.
      this.pos.x += this.ground.belt.x * dt;
      this.pos.z += this.ground.belt.z * dt;
    }
    const n = Math.min(8, Math.max(1, Math.ceil(dt / (1 / 120))));
    const h = dt / n;
    for (let i = 0; i < n; i++) this.step(h, inp, view, i === 0);
    if (this.pos.y < this.game.level.killY) this.die();
  }

  // Ride moving / rotating platforms (and the partner's head).
  carry(c) {
    this.pos.x += c.pos.x - c.prev.x;
    this.pos.y += c.pos.y - c.prev.y;
    this.pos.z += c.pos.z - c.prev.z;
    const dyaw = wrapAngle(c.yaw - c.prevYaw);
    if (dyaw !== 0) {
      const rx = this.pos.x - c.pos.x;
      const rz = this.pos.z - c.pos.z;
      const cs = Math.cos(dyaw), sn = Math.sin(dyaw);
      this.pos.x = c.pos.x + rx * cs + rz * sn;
      this.pos.z = c.pos.z - rx * sn + rz * cs;
      this.yaw += dyaw;
    }
  }

  step(h, inp, view, first) {
    const P = PHYS;
    const jumpPressed = first && inp.jumpPressed;
    const dashPressed = first && inp.dashPressed;
    const poundPressed = first && inp.poundPressed;
    this.coyote -= h;
    this.jumpBuf -= h;
    this.dashCD -= h;
    this.stunT -= h;
    this.mag.exclT -= h;
    if (jumpPressed) this.jumpBuf = P.jumpBuffer;

    // Camera-relative wish direction.
    const cy = view.yaw;
    const fx = -Math.sin(cy), fz = -Math.cos(cy);
    const rx = Math.cos(cy), rz = -Math.sin(cy);
    let wx = rx * inp.mx + fx * inp.my;
    let wz = rz * inp.mx + fz * inp.my;
    let wl = Math.hypot(wx, wz);
    if (wl > 1) {
      wx /= wl;
      wz /= wl;
      wl = 1;
    }
    if (this.stunT > 0 || this.pound === 3) {
      wx = wz = wl = 0;
    }

    this.updateMagnet(inp);
    if (this.mag.mode) {
      this.stepMagnet(h, jumpPressed, view);
      return;
    }

    if (this.pound === 1) {
      this.vel.set(0, 0, 0);
      this.poundT -= h;
      if (this.poundT <= 0) {
        this.pound = 2;
        this.vel.y = -P.poundSpeed;
      }
      return;
    }
    if (this.pound === 2) {
      this.vel.set(0, -P.poundSpeed, 0);
      this.integrate(h);
      return;
    }
    if (this.pound === 3) {
      this.poundT -= h;
      if (this.poundT <= 0) this.pound = 0;
    }

    if (this.dashT > 0) {
      this.dashT -= h;
      this.vel.x = this.dashDir.x * P.dashSpeed;
      this.vel.z = this.dashDir.z * P.dashSpeed;
      if (this.grounded) this.vel.y = Math.min(this.vel.y, 0) - P.gravity * h;
      else this.vel.y = 0;
      if (this.jumpBuf > 0 && (this.grounded || this.coyote > 0)) {
        // Jumping out of a dash keeps normal run speed (no long-jump cheese).
        this.dashT = 0;
        this.vel.x = this.dashDir.x * P.runSpeed;
        this.vel.z = this.dashDir.z * P.runSpeed;
        this.doJump();
      } else if (this.dashT <= 0) {
        this.vel.x = this.dashDir.x * P.runSpeed;
        this.vel.z = this.dashDir.z * P.runSpeed;
      }
      this.integrate(h);
      return;
    }

    // Horizontal control.
    const hs = Math.hypot(this.vel.x, this.vel.z);
    if (this.grounded && this.ground && this.ground.ice) {
      // Ice: slow to get going, slower to stop.
      this.momentum = false;
      this.approachH(wx * P.runSpeed * 1.15, wz * P.runSpeed * 1.15, (wl > 0.05 ? P.groundAccel * 0.16 : P.groundDecel * 0.035) * h);
    } else if (this.grounded) {
      this.momentum = false;
      this.approachH(wx * P.runSpeed, wz * P.runSpeed, (wl > 0.05 ? P.groundAccel : P.groundDecel) * h);
    } else if (this.momentum && hs > P.runSpeed + 0.1) {
      // Launched: steer, but never speed up.
      this.vel.x += wx * P.airAccel * 0.6 * h;
      this.vel.z += wz * P.airAccel * 0.6 * h;
      const ns = Math.hypot(this.vel.x, this.vel.z);
      const cap = Math.max(P.runSpeed, hs - P.airDrag * h);
      if (ns > cap) {
        this.vel.x *= cap / ns;
        this.vel.z *= cap / ns;
      }
    } else {
      this.momentum = false;
      if (wl > 0.05) this.approachH(wx * P.runSpeed, wz * P.runSpeed, P.airAccel * h);
      else this.approachH(0, 0, P.airDrag * h);
    }

    // Updrafts from fans lift you (and give your double jump back).
    const wind = this.game.world ? this.game.world.windAt(this.pos) : 0;
    if (wind) {
      this.jumping = false;
      this.airJumps = 1;
      this.airDash = 1;
    }

    // Gravity, with a short-hop cut and a snappier fall.
    // Low-gravity zones scale it (gmul is set by the game each frame).
    const gm = this.gmul ?? 1;
    let g = P.gravity * gm;
    if (this.vel.y > 0 && this.jumping && !inp.jumpHeld) g *= P.jumpCutGravityMul;
    else if (this.vel.y < 0) g *= P.fallGravityMul;
    this.vel.y = Math.max(this.vel.y - g * h, -P.maxFall * Math.sqrt(gm));
    if (wind) this.vel.y = Math.min(10.5, this.vel.y + wind * h);

    if (this.jumpBuf > 0 && (this.grounded || this.coyote > 0)) this.doJump();
    else if (jumpPressed && !this.grounded && this.airJumps > 0) this.doDoubleJump(wx, wz, wl);

    if (dashPressed && this.dashCD <= 0 && (this.grounded || this.airDash > 0)) this.startDash(wx, wz, wl);
    if (poundPressed && this.pound === 0 && !this.stomp) {
      if (!this.grounded) this.startPound();
      else this.startStomp();
    }
    if (this.stomp && !this.grounded && this.vel.y <= 0 && this.pound === 0) {
      this.stomp = false;
      this.startPound();
    }

    this.integrate(h);

    // Turn to face movement.
    const fxv = wl > 0.1 ? wx : this.vel.x;
    const fzv = wl > 0.1 ? wz : this.vel.z;
    if (Math.hypot(fxv, fzv) > 0.4 && this.pound === 0) {
      const target = Math.atan2(fxv, fzv);
      this.yaw += wrapAngle(target - this.yaw) * (1 - Math.exp(-14 * h));
    }
  }

  approachH(tx, tz, maxDelta) {
    const dx = tx - this.vel.x;
    const dz = tz - this.vel.z;
    const d = Math.hypot(dx, dz);
    if (d <= maxDelta || d < 1e-6) {
      this.vel.x = tx;
      this.vel.z = tz;
    } else {
      this.vel.x += (dx / d) * maxDelta;
      this.vel.z += (dz / d) * maxDelta;
    }
  }

  approachV(target, maxDelta) {
    _b.subVectors(target, this.vel);
    const d = _b.length();
    if (d <= maxDelta) this.vel.copy(target);
    else this.vel.addScaledVector(_b, maxDelta / d);
  }

  doJump() {
    this.vel.y = PHYS.jumpVel;
    if (this.ground && this.ground.dynamic) {
      // Keep the platform's motion when leaving it.
      const gv = this.ground.velAt(this.pos.x, this.pos.z, _a);
      this.vel.x += gv.x;
      this.vel.z += gv.z;
      this.vel.y += Math.max(0, gv.y);
      if (Math.hypot(this.vel.x, this.vel.z) > PHYS.runSpeed + 0.1) this.momentum = true;
    }
    this.grounded = false;
    this.ground = null;
    this.coyote = 0;
    this.jumpBuf = 0;
    this.jumping = true;
    this.game.onLocal('jump');
  }

  doDoubleJump(wx, wz, wl) {
    this.vel.y = PHYS.doubleJumpVel;
    this.airJumps--;
    this.jumping = true;
    if (wl > 0.1) {
      // Let the double jump redirect you, like in the classics.
      const hs = Math.hypot(this.vel.x, this.vel.z);
      const sp = this.momentum ? hs : Math.max(Math.min(hs, PHYS.runSpeed), PHYS.runSpeed * wl * 0.85);
      this.vel.x = wx / wl * sp;
      this.vel.z = wz / wl * sp;
    }
    this.game.onLocal('djump');
  }

  startDash(wx, wz, wl) {
    let dx = wx, dz = wz;
    if (wl < 0.1) {
      dx = Math.sin(this.yaw);
      dz = Math.cos(this.yaw);
    }
    const l = Math.hypot(dx, dz) || 1;
    this.dashDir.set(dx / l, 0, dz / l);
    this.dashT = PHYS.dashTime;
    this.dashCD = PHYS.dashCooldown + PHYS.dashTime;
    if (!this.grounded) {
      this.airDash--;
      this.vel.y = 0;
    }
    this.momentum = false;
    this.yaw = Math.atan2(this.dashDir.x, this.dashDir.z);
    this.game.onLocal('dash');
  }

  // Ground pound from standing: a small hop that turns into a pound, so
  // "stand on it and press C" works on switches and seesaws.
  startStomp() {
    this.vel.y = 7.5;
    if (this.ground && this.ground.dynamic) {
      // Stay with a moving platform during the hop.
      const gv = this.ground.velAt(this.pos.x, this.pos.z, _a);
      this.vel.x += gv.x;
      this.vel.z += gv.z;
    }
    this.grounded = false;
    this.ground = null;
    this.coyote = 0;
    this.jumpBuf = 0;
    this.jumping = false;
    this.stomp = true;
    this.game.onLocal('jump');
  }

  startPound() {
    this.pound = 1;
    this.poundT = PHYS.poundHang;
    this.vel.set(0, 0, 0);
    this.dashT = 0;
    this.game.onLocal('poundStart');
  }

  integrate(h) {
    const wasGrounded = this.grounded;
    const vy = this.vel.y;
    this.pos.addScaledVector(this.vel, h);
    const r = this.res;
    this.game.physics.resolve(this.pos, this.vel, PHYS.radius, PHYS.height, this.ctx, r);
    this.grounded = r.grounded;
    this.ground = r.ground;
    if (r.grounded) {
      this.coyote = PHYS.coyote;
      if (!wasGrounded) this.land(vy, r.ground);
    }
    if (r.pusher) this.pushed(r);
  }

  land(vy, c) {
    this.airJumps = 1;
    this.airDash = 1;
    this.jumping = false;
    this.momentum = false;
    this.stomp = false;
    if (c.kind === 'bounce') {
      const strong = this.pound === 2;
      this.vel.y = strong ? PHYS.bouncePoundVel : PHYS.bounceVel;
      this.pound = 0;
      this.grounded = false;
      this.ground = null;
      this.coyote = 0;
      this.game.onLocal('bounce', { collider: c, strong });
      return;
    }
    if (this.pound === 2) {
      this.pound = 3;
      this.poundT = PHYS.poundRecover;
      this.game.onLocal('poundLand', { collider: c });
    } else {
      this.game.onLocal('land', { impact: -vy, collider: c });
    }
  }

  pushed(r) {
    if (this.stunT > 0) return;
    const v = r.pusher.velAt(this.pos.x, this.pos.z, _a);
    this.vel.set(v.x * 1.1 + r.pushNx * 7, 8, v.z * 1.1 + r.pushNz * 7);
    this.grounded = false;
    this.ground = null;
    this.stunT = 0.45;
    this.pound = 0;
    this.dashT = 0;
    this.momentum = true;
    this.jumping = false;
    this.game.onLocal('hit');
  }

  // External launch (magnet repel, seesaw).
  launch(vx, vy, vz, source) {
    this.vel.set(vx, vy, vz);
    this.grounded = false;
    this.ground = null;
    this.coyote = 0;
    this.jumpBuf = 0;
    this.momentum = Math.hypot(vx, vz) > PHYS.runSpeed;
    this.jumping = false;
    this.airJumps = 1;
    this.airDash = 1;
    this.pound = 0;
    this.dashT = 0;
    this.game.onLocal('launch', { source });
  }

  // -- magnets ---------------------------------------------------------------

  updateMagnet(inp) {
    const m = this.mag;
    const held = inp.abilityHeld;
    if (held && !m.held) {
      m.held = true;
      m.holdStart = this.game.net.serverNow();
    } else if (!held && m.held) {
      m.held = false;
      m.used = false;
      if (m.mode === 1 || m.mode === 2) {
        m.exclId = m.target.id;
        m.exclT = 0.45;
        this.game.onLocal('magnetOff');
      } else if (m.mode === 3) {
        this.momentum = true;
        this.game.onLocal('bondOff');
      }
      m.mode = 0;
      m.target = null;
    }
    if (!m.held || m.used || m.mode) return;
    const t = this.game.magnetTarget;
    if (!t) return;
    if (t.kind === 'pad') {
      if (t.pad.pol === this.pol) {
        if (t.inReach) {
          m.used = true;
          this.launch(...t.pad.launch, t.pad);
        }
      } else if (!t.pad.launch) {
        m.mode = 1;
        m.target = t.pad;
        m.pullT = 0;
        this.pound = 0;
        this.dashT = 0;
        this.game.onLocal('attract', { pad: t.pad });
      }
    } else if (t.kind === 'partner' && t.canBond) {
      m.mode = 3;
      m.target = t;
      m.pullT = 0;
      this.pound = 0;
      this.dashT = 0;
      this.game.onLocal('bond');
    }
  }

  stickPoint(pad, out) {
    const n = pad.normal;
    if (n.y < -0.5) return out.set(pad.x, pad.y - 0.06 - PHYS.height, pad.z);
    if (n.y > 0.5) return out.set(pad.x, pad.y + 0.1, pad.z);
    return out.set(pad.x + n.x * (PHYS.radius + 0.08), pad.y - PHYS.height * 0.55, pad.z + n.z * (PHYS.radius + 0.08));
  }

  stepMagnet(h, jumpPressed, view) {
    const m = this.mag;
    const P = PHYS;
    m.pullT += h;

    if (m.mode === 3) {
      const partner = this.game.remote;
      if (!partner.present || !partner.magHeld) {
        m.mode = 0;
        m.used = true;
        this.momentum = true;
        this.game.onLocal('bondOff');
        this.integrate(h);
        return;
      }
      _a.copy(partner.pos);
      _a.y += 0.6;
      _a.sub(this.pos);
      const dist = _a.length();
      if (dist < 1.9 || m.pullT > 3) {
        m.mode = 0;
        m.used = true;
        this.vel.multiplyScalar(0.2);
        this.vel.y = 5;
        this.airJumps = 1;
        this.airDash = 1;
        this.game.onLocal('bondArrive');
        return;
      }
      _a.multiplyScalar(P.bondSpeed / dist);
      this.approachV(_a, 70 * h);
      this.integrate(h);
      this.yaw = Math.atan2(this.vel.x, this.vel.z);
      return;
    }

    const pad = m.target;
    this.stickPoint(pad, _b);
    if (m.mode === 1) {
      _a.subVectors(_b, this.pos);
      const dist = _a.length();
      if (dist < 0.3) {
        m.mode = 2;
        this.pos.copy(_b);
        this.vel.set(0, 0, 0);
        this.airJumps = 1;
        this.airDash = 1;
        this.game.onLocal('stick', { pad });
        return;
      }
      if (m.pullT > 2.5) {
        // Something is in the way; give up.
        m.mode = 0;
        m.used = true;
        this.game.onLocal('magnetOff');
        return;
      }
      _a.multiplyScalar(Math.min(P.attractSpeed, dist * 8 + 3) / dist);
      this.approachV(_a, 90 * h);
      this.integrate(h);
      return;
    }

    // Stuck to the pad.
    this.pos.copy(_b);
    this.vel.set(0, 0, 0);
    this.grounded = false;
    this.ground = null;
    this.yaw += wrapAngle(Math.atan2(-Math.sin(view.yaw), -Math.cos(view.yaw)) - this.yaw) * (1 - Math.exp(-6 * h));
    if (jumpPressed) {
      m.mode = 0;
      m.used = true;
      m.exclId = pad.id;
      m.exclT = 0.45;
      this.vel.set(-Math.sin(view.yaw) * 6, 9, -Math.cos(view.yaw) * 6);
      this.jumping = true;
      this.airJumps = 1;
      this.game.onLocal('jump');
    }
  }
}
