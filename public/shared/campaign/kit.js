// Small helpers shared by the first campaign levels (1–6). Everything is in
// world space; levels run along +Z unless they say otherwise.

// A wooden hub with a checkpoint on it. Returns the checkpoint index.
export function hub(b, x, top, z, w, d, o = {}) {
  b.floor(x, top, z, w, d, { mat: 'wood', t: o.t ?? 1.4, deep: o.deep });
  return b.checkpoint(x, top, z, Math.max(3, Math.min(w, d) - 1.2), { hint: o.hint || '', yaw: o.yaw || 0, flag: o.flag });
}

// A pillar-like block: its top is at `top`, it reaches all the way down.
export function pillar(b, x, top, z, w, d, o = {}) {
  return b.plat(x, top, z, w, d, o.depth ?? 18, { ...o, deep: true });
}

// Steps that slide out of a wall face (like the classic seesaw stage) once
// `signal` is on: n steps from `fromTop` up to `toTop`, laid out along X from
// x0 by dx, against a wall face at z = faceZ (they slide toward -Z by default).
export function wallSteps(b, signal, { x0, dx = 2.3, faceZ, fromTop, toTop, n, out = -1, color }) {
  const parts = [];
  for (let i = 0; i < n; i++) {
    const top = fromTop + ((toTop - fromTop) * (i + 1)) / (n + 1);
    parts.push({ x: x0 + i * dx, y: top - 0.4, z: faceZ - out * 1.0, sx: 2.2, sy: 0.8, sz: 2, move: [0, 0, out * 2.0], delay: i * 0.15 });
  }
  return b.act('steps', { op: 'all', in: [signal] }, true, parts, { speed: 3, mat: 'toy', color: color || b.color(), lamp: [x0, fromTop + 0.3, faceZ + out * 1.5] });
}

// A bridge of planks that rises from below while `when` holds (latched by default).
export function bridge(b, when, { x = 0, top = 0, z0, z1, w = 3.6, latch = true, color, drop = 9 }) {
  const n = Math.max(2, Math.round((z1 - z0) / 2.6));
  const pl = (z1 - z0) / n;
  const parts = [];
  for (let i = 0; i < n; i++) {
    parts.push({ x, y: top - 0.3 - drop, z: z0 + pl * (i + 0.5), sx: w, sy: 0.6, sz: pl - 0.06, move: [0, drop, 0], delay: i * 0.1 });
  }
  return b.act('bridge', when, latch, parts, { speed: 16, mat: 'toy', color: color || b.color(), lamp: [x, top + 0.6, z0 - 0.4] });
}

// A wall across X at z with a door gap; the door slides down while `when` holds.
export function gateWall(b, when, { z, top = 0, half = 7, doorW = 4, h = 7, latch = true, color }) {
  const c = color || b.color();
  const side = (half - doorW / 2);
  b.box(-(half + doorW / 2) / 2, top + h / 2, z, side, h, 1, { color: c });
  b.box((half + doorW / 2) / 2, top + h / 2, z, side, h, 1, { color: c });
  const dh = Math.min(h - 1, 4.8);
  b.box(0, top + dh + (h - dh) / 2, z, doorW, h - dh, 1, { color: c });
  return b.act('door', when, latch, [{ x: 0, y: top + dh / 2, z, sx: doorW - 0.1, sy: dh, sz: 0.6, move: [0, -(dh + 0.3), 0] }], { speed: 12, lamp: [0, top + dh + 0.5, z - 0.6] });
}
