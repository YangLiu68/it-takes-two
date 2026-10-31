// Small building helpers shared by campaign levels 19–24.

// A wall slab along X (at z) or along Z (at x), from y0 to y1, with at most one
// rectangular opening [a0, a1, oy0, oy1] (a along the wall).
export function wallX(b, x0, x1, z, y0, y1, open = null, o = {}) {
  const t = o.t || 0.5;
  const box = (a0, a1, b0, b1) => {
    if (a1 - a0 > 0.05 && b1 - b0 > 0.05) b.box((a0 + a1) / 2, (b0 + b1) / 2, z, a1 - a0, b1 - b0, t, o);
  };
  if (!open) return box(x0, x1, y0, y1);
  const [a0, a1, oy0, oy1] = open;
  box(x0, a0, y0, y1);
  box(a1, x1, y0, y1);
  box(a0, a1, y0, oy0);
  box(a0, a1, oy1, y1);
}

export function wallZ(b, z0, z1, x, y0, y1, open = null, o = {}) {
  const t = o.t || 0.5;
  const box = (a0, a1, b0, b1) => {
    if (a1 - a0 > 0.05 && b1 - b0 > 0.05) b.box(x, (b0 + b1) / 2, (a0 + a1) / 2, t, b1 - b0, a1 - a0, o);
  };
  if (!open) return box(z0, z1, y0, y1);
  const [a0, a1, oy0, oy1] = open;
  box(z0, a0, y0, y1);
  box(a1, z1, y0, y1);
  box(a0, a1, y0, oy0);
  box(a0, a1, oy1, y1);
}

// Four walls around [x0, x1] × [z0, z1]; open = { n, s, e, w } openings.
export function shaft(b, x0, x1, z0, z1, y0, y1, open = {}, o = {}) {
  wallX(b, x0 - 0.25, x1 + 0.25, z0 - 0.25, y0, y1, open.s, o);
  wallX(b, x0 - 0.25, x1 + 0.25, z1 + 0.25, y0, y1, open.n, o);
  wallZ(b, z0, z1, x0 - 0.25, y0, y1, open.w, o);
  wallZ(b, z0, z1, x1 + 0.25, y0, y1, open.e, o);
}

// A square stepping block by its top.
export const step = (b, x, top, z, s = 3, o = {}) => b.floor(x, top, z, s, s, { t: o.t || 0.8, ...o });
