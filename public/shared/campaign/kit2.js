import { PHYS } from '../constants.js';

// Small building helpers shared by campaign levels 7–12.

// A floating slab described by its top surface.
export function slab(b, x, top, z, w, d, o = {}) {
  return b.floor(x, top, z, w, d, { t: o.t ?? 1.2, mat: o.mat ?? 'wood', color: o.color });
}

// Hazard piston that punches across a walkway from one side; the housing
// column goes down into the void. Returns the mover (set .stop / .run on it).
export function piston(b, side, zc, o = {}) {
  const reach = o.reach ?? 0.4;
  const out = o.out ?? 4.4;
  const y = o.y ?? 0.7;
  const x0 = o.x0 ?? 0;
  const m = b.mover(2.2, 1.3, 1.8, {
    type: 'linear', a: [x0 + side * out, y, zc], b: [x0 + side * reach, y, zc], period: o.period ?? 1.8, phase: o.phase ?? 0,
  }, { mat: 'hazard', color: '#ff5d5d', hazard: 'push', steady: true });
  b.box(x0 + side * (out + 0.8), y - 6.4, zc, 1.8, 14.6, 2.4, { mat: 'metal', deep: true });
  return m;
}

// A swinging hammer with its frame. It swings along x (yaw 0) or along z
// (yaw PI/2). Returns the pendulum def (set .stop on it).
export function hammer(b, x, top, z, o = {}) {
  const len = o.len ?? 6.4;
  const head = o.head ?? [1.4, 1.4, 2.0];
  const py = top + (o.lift ?? head[1] / 2 + 0.25) + len;
  b.pendulum(x, py, z, len, o.amp ?? 1.05, o.period ?? 2.6, o.phase ?? 0, head);
  const h = b.pendulums[b.pendulums.length - 1];
  const yaw = o.yaw ?? 0;
  h.yaw = yaw;
  const half = o.span ?? 3.8;
  // posts: 'along' the swing (beside a bridge), 'across' it, or 'none'.
  const posts = o.posts ?? 'along';
  if (posts === 'none') {
    b.box(x, py + 0.3, z, 0.9, 0.6, 0.9, { mat: 'metal' });
    return h;
  }
  const ax = (Math.abs(Math.cos(yaw)) > 0.5) === (posts === 'along');
  for (const side of [-1, 1]) {
    const px = ax ? x + side * half : x, pz = ax ? z : z + side * half;
    b.box(px, (py + 0.6 + top - 14) / 2, pz, 0.6, py - top + 14.6, 0.6, { mat: 'metal', deep: true });
  }
  b.box(x, py + 0.3, z, ax ? half * 2 + 0.6 : 0.6, 0.5, ax ? 0.6 : half * 2 + 0.6, { mat: 'metal' });
  return h;
}

// A two-value dial plus the signal that is on while it shows the second value.
export function toggle(b, x, top, z, o = {}) {
  const values = o.values || ['FWD', 'REV'];
  const dial = b.dial(x, top, z, { values, style: o.style || 'text', color: o.color, h: o.h });
  const on = b.combo([dial], [1], { latch: false });
  return { dial, on };
}

// A magnet cannon: a launch pad of colour `pol` that throws its owner from
// (x, top, z) to land on `to` = [x, y, z]. vy sets how high the arc goes.
// A small arrow on the ground shows where it's pointing.
export function cannonPad(b, x, top, z, pol, to, o = {}) {
  const vy = o.vy ?? 17;
  const g = PHYS.gravity, gf = PHYS.gravity * PHYS.fallGravityMul;
  const t1 = vy / g;
  const apex = (vy * vy) / (2 * g);
  const drop = Math.max(0.2, apex - (to[1] - top));
  const T = t1 + Math.sqrt((2 * drop) / gf);
  // You land still moving fast and slide a few metres: aim a bit short of `to`.
  const short = o.short ?? 2.5;
  const ax = to[0] - x, az = to[2] - z;
  const al = Math.hypot(ax, az);
  const dx = ax - (ax / al) * short, dz = az - (az / al) * short;
  const d = Math.hypot(dx, dz);
  // Launched players lose about 2.5 m/s² to drag: aim a touch long.
  const v = d / T + (PHYS.airDrag * T) / 2;
  const id = b.pad(x, top + 0.08, z, [0, 1, 0], pol, { launch: [(dx / d) * v, vy, (dz / d) * v] });
  const yaw = Math.atan2(dx, dz);
  b.box(x + Math.sin(yaw) * 1.7, top + 0.05, z + Math.cos(yaw) * 1.7, 0.3, 0.1, 1.2, { yaw, color: pol > 0 ? '#ff6b4a' : '#4f86ff' });
  return id;
}
