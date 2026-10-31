// Small building blocks shared by campaign levels 13–18.

// Planks that rise out of the pit to make a bridge along z while `when` is on.
export function plankBridge(b, x, z0, z1, top, when, o = {}) {
  const n = Math.max(2, Math.ceil((z1 - z0) / 3));
  const pl = (z1 - z0) / n;
  const parts = [];
  for (let i = 0; i < n; i++) {
    parts.push({ x, y: top - 0.3 - 9, z: z0 + pl * (i + 0.5), sx: o.w || 2.4, sy: 0.6, sz: pl - 0.06, move: [0, 9, 0], delay: i * 0.08 });
  }
  return b.act('bridge', { op: 'any', in: [].concat(when) }, o.latch ?? true, parts, {
    speed: 16, mat: 'toy', color: o.color || b.color(), lamp: o.lamp || [x, top + 0.6, z0 - 0.6],
  });
}

// Same, along x.
export function plankBridgeX(b, z, x0, x1, top, when, o = {}) {
  const n = Math.max(2, Math.ceil((x1 - x0) / 3));
  const pl = (x1 - x0) / n;
  const parts = [];
  for (let i = 0; i < n; i++) {
    parts.push({ x: x0 + pl * (i + 0.5), y: top - 0.3 - 9, z, sx: pl - 0.06, sy: 0.6, sz: o.w || 2.4, move: [0, 9, 0], delay: i * 0.08 });
  }
  return b.act('bridge', { op: 'any', in: [].concat(when) }, o.latch ?? true, parts, {
    speed: 16, mat: 'toy', color: o.color || b.color(), lamp: o.lamp || [x0 - 0.6, top + 0.6, z],
  });
}

// A simple staircase of boxes from (x, z) rising by `rise` per step toward +z (dir) or another direction.
export function stairs(b, x, z, n, rise, o = {}) {
  const [dx, dz] = o.dir || [0, 1];
  const step = o.step || 2;
  const w = o.w || 2.2;
  const base = o.base ?? 0;
  for (let i = 0; i < n; i++) {
    const top = base + rise * (i + 1);
    b.box(x + dx * step * i, top / 2 + (base - base) / 2, z + dz * step * i, dz ? w : step, top, dx ? w : step, { color: o.color, mat: o.mat });
  }
}
