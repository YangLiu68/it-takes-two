// Zone tests shared by the server (monsters, hiding) and clients (rules).

// Is a player standing at (x, y, z) (feet) inside the zone?
export function inside(z, x, y, zz, pad = 0) {
  return Math.abs(x - z.x) < z.sx / 2 + pad && Math.abs(y + 0.8 - z.y) < z.sy / 2 + pad && Math.abs(zz - z.z) < z.sz / 2 + pad;
}

// "Stand still when the lights turn red": true while red, warn shortly before.
export function redState(z, t) {
  const per = z.period || 9;
  const red = z.red || 3;
  const ph = (((t + (z.offset || 0)) % per) + per) % per;
  return { red: ph >= per - red, warn: ph >= per - red - 1.4 && ph < per - red, since: ph - (per - red) };
}
