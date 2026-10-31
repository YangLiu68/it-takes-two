// Collision world: boxes that can be rotated about Y (yaw) and moved, against
// an upright cylinder (the characters). Small and deterministic enough for a
// platformer, and it supports riding rotating and moving platforms.

import * as THREE from 'three';
import { PHYS } from '../shared/constants.js';

export function wrapAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export class Collider {
  constructor(id, hx, hy, hz, opts = {}) {
    this.id = id;
    this.hx = hx;
    this.hy = hy;
    this.hz = hz;
    this.br = Math.hypot(hx, hz);
    this.pos = new THREE.Vector3();
    this.prev = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.prevYaw = 0;
    this.angVel = 0;
    this.cos = 1;
    this.sin = 0;
    this.enabled = true;
    this.dynamic = !!opts.dynamic;
    this.kind = opts.kind || 'solid';
    this.ref = opts.ref || null;
    this.hazard = opts.hazard || null;
    this.filter = opts.filter || null; // (ctx) => boolean: does this block?
    this.noCamera = !!opts.noCamera;
  }

  set(x, y, z, yaw = this.yaw) {
    this.pos.set(x, y, z);
    this.yaw = yaw;
    this.cos = Math.cos(yaw);
    this.sin = Math.sin(yaw);
  }

  beginMove() {
    this.prev.copy(this.pos);
    this.prevYaw = this.yaw;
  }

  endMove(dt) {
    if (dt > 0) {
      this.vel.subVectors(this.pos, this.prev).multiplyScalar(1 / dt);
      this.angVel = wrapAngle(this.yaw - this.prevYaw) / dt;
    }
  }

  // Velocity of the surface at a world point (linear + rotation about Y).
  velAt(px, pz, out) {
    out.set(this.vel.x + this.angVel * (pz - this.pos.z), this.vel.y, this.vel.z - this.angVel * (px - this.pos.x));
    return out;
  }

  toLocal(p, out) {
    const dx = p.x - this.pos.x;
    const dz = p.z - this.pos.z;
    out.set(dx * this.cos - dz * this.sin, p.y - this.pos.y, dx * this.sin + dz * this.cos);
    return out;
  }

  toWorld(l, out) {
    out.set(
      this.pos.x + l.x * this.cos + l.z * this.sin,
      this.pos.y + l.y,
      this.pos.z - l.x * this.sin + l.z * this.cos,
    );
    return out;
  }

  top() {
    return this.pos.y + this.hy;
  }
}

export class Physics {
  constructor() {
    this.colliders = [];
    this.byId = new Map();
  }

  add(c) {
    this.colliders.push(c);
    this.byId.set(c.id, c);
    return c;
  }

  remove(c) {
    const i = this.colliders.indexOf(c);
    if (i >= 0) this.colliders.splice(i, 1);
    this.byId.delete(c.id);
  }

  // Push the cylinder (feet at p, radius r, height h) out of all colliders.
  // Mutates p and v. Fills `out` with contact info.
  resolve(p, v, r, h, ctx, out) {
    out.grounded = false;
    out.ground = null;
    out.ceiling = false;
    out.wall = false;
    out.pusher = null;
    const stepUp = PHYS.stepUp;
    for (let iter = 0; iter < 4; iter++) {
      let any = false;
      for (let i = 0; i < this.colliders.length; i++) {
        const c = this.colliders[i];
        if (!c.enabled || c === ctx.self) continue;
        const top = c.pos.y + c.hy;
        const bot = c.pos.y - c.hy;
        if (p.y >= top || p.y + h <= bot) continue;
        const dx = p.x - c.pos.x;
        const dz = p.z - c.pos.z;
        const reach = c.br + r;
        if (dx > reach || dx < -reach || dz > reach || dz < -reach) continue;
        if (c.filter && !c.filter(ctx)) continue;

        const lx = dx * c.cos - dz * c.sin;
        const lz = dx * c.sin + dz * c.cos;
        const qx = lx < -c.hx ? -c.hx : lx > c.hx ? c.hx : lx;
        const qz = lz < -c.hz ? -c.hz : lz > c.hz ? c.hz : lz;
        const ex = lx - qx;
        const ez = lz - qz;
        const d2 = ex * ex + ez * ez;
        if (d2 >= r * r) continue;

        let sidePen, nx, nz;
        if (d2 > 1e-10) {
          const d = Math.sqrt(d2);
          sidePen = r - d;
          nx = ex / d;
          nz = ez / d;
        } else {
          const px = c.hx - Math.abs(lx);
          const pz = c.hz - Math.abs(lz);
          if (px < pz) {
            sidePen = px + r;
            nx = lx >= 0 ? 1 : -1;
            nz = 0;
          } else {
            sidePen = pz + r;
            nx = 0;
            nz = lz >= 0 ? 1 : -1;
          }
        }
        const upPen = top - p.y;
        const downPen = p.y + h - bot;
        const relVy = v.y - (c.dynamic ? c.vel.y : 0);
        const canStep = upPen <= stepUp && relVy <= 2.5;

        if ((upPen <= sidePen || canStep) && upPen <= downPen) {
          p.y += upPen;
          if (v.y < 0) v.y = 0;
          out.grounded = true;
          out.ground = c;
        } else if (downPen < sidePen && relVy > -1) {
          p.y -= downPen;
          if (v.y > 0) v.y = 0;
          out.ceiling = true;
        } else {
          const wx = nx * c.cos + nz * c.sin;
          const wz = -nx * c.sin + nz * c.cos;
          p.x += wx * sidePen;
          p.z += wz * sidePen;
          const vn = v.x * wx + v.z * wz;
          if (vn < 0) {
            v.x -= wx * vn;
            v.z -= wz * vn;
          }
          out.wall = true;
          if (c.hazard) {
            out.pusher = c;
            out.pushNx = wx;
            out.pushNz = wz;
          }
        }
        any = true;
      }
      if (!any) break;
    }
  }

  // Ray against all colliders. Returns { t, collider, normal } or null.
  raycast(o, d, maxT, ignore) {
    let best = maxT;
    let hit = null;
    let hitAxis = 0;
    let hitSign = 1;
    for (let i = 0; i < this.colliders.length; i++) {
      const c = this.colliders[i];
      if (!c.enabled || (ignore && ignore(c))) continue;
      const ox = o.x - c.pos.x;
      const oy = o.y - c.pos.y;
      const oz = o.z - c.pos.z;
      // Cheap sphere reject.
      const rr = c.br + c.hy;
      const tc = ox * -d.x + oy * -d.y + oz * -d.z;
      const cx = ox + d.x * Math.max(0, Math.min(maxT, tc));
      const cy = oy + d.y * Math.max(0, Math.min(maxT, tc));
      const cz = oz + d.z * Math.max(0, Math.min(maxT, tc));
      if (cx * cx + cy * cy + cz * cz > rr * rr) continue;

      const lox = ox * c.cos - oz * c.sin;
      const loz = ox * c.sin + oz * c.cos;
      const ldx = d.x * c.cos - d.z * c.sin;
      const ldz = d.x * c.sin + d.z * c.cos;
      let tmin = -Infinity;
      let tmax = Infinity;
      let axis = 0;
      let sign = 1;
      const slab = (o1, d1, h1, ax) => {
        if (Math.abs(d1) < 1e-9) return o1 >= -h1 && o1 <= h1;
        let t1 = (-h1 - o1) / d1;
        let t2 = (h1 - o1) / d1;
        let s = -1;
        if (t1 > t2) {
          const tmp = t1;
          t1 = t2;
          t2 = tmp;
          s = 1;
        }
        if (t1 > tmin) {
          tmin = t1;
          axis = ax;
          sign = s;
        }
        if (t2 < tmax) tmax = t2;
        return tmin <= tmax;
      };
      if (!slab(lox, ldx, c.hx, 0) || !slab(oy, d.y, c.hy, 1) || !slab(loz, ldz, c.hz, 2)) continue;
      if (tmax < 0) continue;
      const t = tmin >= 0 ? tmin : 0;
      if (t < best) {
        best = t;
        hit = c;
        hitAxis = axis;
        hitSign = sign;
      }
    }
    if (!hit) return null;
    const n = new THREE.Vector3();
    if (hitAxis === 1) n.set(0, hitSign, 0);
    else {
      const lx = hitAxis === 0 ? hitSign : 0;
      const lz = hitAxis === 2 ? hitSign : 0;
      n.set(lx * hit.cos + lz * hit.sin, 0, -lx * hit.sin + lz * hit.cos);
    }
    return { t: best, collider: hit, normal: n };
  }
}
