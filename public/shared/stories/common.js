// Shared pieces for the horror stories: the dark look and furniture.
// Furniture is plain boxes (solid, so you can stand on desks and beds); the
// hiding spots add a 'hide' zone that monsters can't see into.

// Pitch-dark interiors; flashlights and a few bulbs do the lighting.
export const DARK = {
  dark: true, indoor: true, stars: false,
  skyTop: '#000000', skyHorizon: '#050409', skyBottom: '#000000',
  fog: '#030305', fogDensity: 0.055,
  sun: '#7c88ff', sunIntensity: 0.06, sunDir: [0.3, 1, 0.2],
  hemiSky: '#1d2236', hemiGround: '#0d0b0e', hemiIntensity: 0.42,
  wood: '#3b2f27', felt: '#2b2b2e', metal: '#6a6f75', cloud: '#111111',
  blocks: ['#4c524a', '#57514c', '#434a54', '#4f4642', '#5a564e', '#414944'],
};

export const WALL = '#4a4f47';
export const KEY = '#d9b25a';

// Shared furniture -------------------------------------------------------------------

export function desk(b, x, z, yaw = 0) {
  b.box(x, 0.72, z, 1.3, 0.08, 0.75, { mat: 'wood', color: '#5a4636', yaw });
  for (const [dx, dz] of [[-0.58, -0.3], [0.58, -0.3], [-0.58, 0.3], [0.58, 0.3]]) b.box(x + dx, 0.34, z + dz, 0.06, 0.68, 0.06, { mat: 'metal', color: '#3c3f44' });
  b.box(x, 0.45, z - 0.75, 0.5, 0.06, 0.45, { mat: 'wood', color: '#4a3a2d' });
}

export function shelf(b, x, z, sx, sz, h = 3.2) {
  b.box(x, h / 2, z, sx, h, sz, { mat: 'wood', color: '#3a2c22' });
}

// A locker you can step into: walls on three sides, a hide zone inside.
// side: -1 = recess into the west wall at x, +1 = into the east wall.
export function locker(b, x, z, side, h) {
  const d = 1.1;
  const cx = x + side * d / 2;
  b.box(cx, h / 2, z - 0.75, d, h, 0.12, { mat: 'metal', color: '#4d5560' });
  b.box(cx, h / 2, z + 0.75, d, h, 0.12, { mat: 'metal', color: '#4d5560' });
  b.box(x + side * (d + 0.06), h / 2, z, 0.12, h, 1.6, { mat: 'metal', color: '#4d5560' });
  b.box(cx, 2.4, z, d, 0.1, 1.5, { mat: 'metal', color: '#5a636e' });
  // Slatted half-door that you can squeeze past.
  b.box(x + side * 0.05, 1.9, z - 0.6, 0.06, 0.9, 0.24, { mat: 'metal', color: '#6a7480' });
  b.zone('hide', cx, 1.2, z, d + 0.2, 2.4, 1.4);
}

// A freestanding wardrobe to hide in; the open side faces `facing` ('n','s','e','w').
export function wardrobe(b, x, z, facing, h = 2.6) {
  const m = { mat: 'wood', color: '#3a2c22' };
  const W = 1.5, D = 1.2, t = 0.12;
  const open = { n: [0, 1], s: [0, -1], e: [1, 0], w: [-1, 0] }[facing];
  // Back + two sides.
  if (open[1] !== 0) {
    b.box(x, h / 2, z - open[1] * D / 2, W, h, t, m);
    b.box(x - W / 2, h / 2, z, t, h, D, m);
    b.box(x + W / 2, h / 2, z, t, h, D, m);
  } else {
    b.box(x - open[0] * D / 2, h / 2, z, t, h, W, m);
    b.box(x, h / 2, z - W / 2, D, h, t, m);
    b.box(x, h / 2, z + W / 2, D, h, t, m);
  }
  b.box(x, h + 0.05, z, open[1] !== 0 ? W : D, 0.1, open[1] !== 0 ? D : W, m);
  b.zone('hide', x, 1.2, z, open[1] !== 0 ? W - 0.2 : D - 0.1, 2.4, open[1] !== 0 ? D - 0.1 : W - 0.2);
}

export function bed(b, x, z, along) {
  const [sx, sz] = along === 'z' ? [1.1, 2.1] : [2.1, 1.1];
  b.box(x, 0.3, z, sx, 0.6, sz, { mat: 'metal', color: '#3c4046' });
  b.box(x, 0.66, z, sx - 0.1, 0.14, sz - 0.1, { color: '#8a8f86' });
}

