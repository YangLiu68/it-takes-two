// Helpers shared by the walkthroughs of campaign levels 13–18.

// Jump onto a spot ([x, top, z]) and settle on it. Double-jumps when it's far or high.
export async function hop(bot, [x, y, z], o = {}) {
  const p = await bot.pos();
  const d = Math.hypot(x - p[0], z - p[2]);
  const dy = y - p[1];
  await bot.jump({ to: [x, y, z], double: o.double ?? (d > 3.4 || dy > 0.9), ...o });
  if (o.settle !== false) await bot.go(x, z, { r: o.r ?? 0.35, timeout: 4000 });
}

export async function hops(bot, pts, o = {}) {
  for (const p of pts) await hop(bot, p, o);
}

// Stand still on a plate (or any spot) until told otherwise.
export const stand = (bot, x, z) => bot.go(x, z, { r: 0.3, stop: true });

export async function poundAt(bot, x, z) {
  await stand(bot, x, z);
  await bot.pound();
}

export const marks = (M, prefix) => {
  const out = [];
  for (let i = 0; M[`${prefix}${i}`]; i++) out.push(M[`${prefix}${i}`]);
  return out;
};

// -- in-page tests (passed to until/jumpIf/doneIf; must be self-contained) -----------

// Is one of a.pts = [[colliderId, localX, localZ], ...] within a.r of me (on the
// ground plane)? Remembers which in bot.found.
export function nearPoint(g, b, a) {
  const p = g.player.pos;
  for (const [id, lx, lz] of a.pts) {
    const c = g.physics.byId.get(id);
    if (!c) continue;
    const cs = Math.cos(c.yaw), sn = Math.sin(c.yaw);
    const x = c.pos.x + lx * cs + lz * sn, z = c.pos.z - lx * sn + lz * cs;
    if (Math.hypot(x - p.x, z - p.z) < a.r) {
      b.found = [id, lx, lz];
      return true;
    }
  }
  return false;
}

// Seconds until a spinning bar (a.id, centre a.cx/a.cz, angular speed a.w)
// sweeps over me, if I turn at a.wp myself. Infinity if I'm out of its reach.
export function barTime(g, a) {
  const p = g.player.pos;
  const c = g.physics.byId.get(a.id);
  if (!c) return Infinity;
  const dx = p.x - a.cx, dz = p.z - a.cz;
  const r = Math.hypot(dx, dz);
  if (r > a.half + 0.6 || r < 0.3) return Infinity;
  const phi = Math.atan2(-dz, dx);
  const d = ((((phi - c.yaw) % Math.PI) + Math.PI) % Math.PI);
  const rel = a.w - (a.wp || 0);
  return rel > 0 ? d / rel : (Math.PI - d) / -rel;
}

// jumpIf: a bar is about to reach me.
export function barSoon(g, b, a) {
  const p = g.player.pos;
  const c = g.physics.byId.get(a.id);
  if (!c) return false;
  const dx = p.x - a.cx, dz = p.z - a.cz;
  const r = Math.hypot(dx, dz);
  if (r > a.half + 0.6 || r < 0.3) return false;
  const phi = Math.atan2(-dz, dx);
  const d = ((((phi - c.yaw) % Math.PI) + Math.PI) % Math.PI);
  const rel = a.w - (a.wp || 0);
  const tau = rel > 0 ? d / rel : (Math.PI - d) / -rel;
  return tau > a.lo && tau < a.hi;
}

// The bot found a moving target with nearPoint: what it was.
export const found = (bot) => bot.page.evaluate(() => window.__bot.found);

// -- drums ----------------------------------------------------------------------------

export const bounceCount = (bot) => bot.page.evaluate(() => window.__itt.game.ev.bounce);

// Get onto drum `id` (at [x, top, z]) and bounce on it once — strong: pound
// at the top of a bounce first, for the big one. raised: only pound once the
// drum's collider is above that height (for drums that rise).
export async function bounceOn(bot, id, at, o = {}) {
  const [x, , z] = at;
  const n0 = await bounceCount(bot);
  await bot.go(x, z, {
    hold: true, r: 0.25, timeout: o.timeout ?? 15000,
    arg: { id, n0, strong: !!o.strong, raised: o.raised ?? null, x, z },
    jumpIf: o.noJump ? undefined : ((g) => g.player.grounded).toString(),
    poundIf: o.strong ? ((g, b, a) => g.player.vel.y < 0.6 && Math.hypot(g.player.pos.x - a.x, g.player.pos.z - a.z) < 1.3
      && g.lastBounce === a.id && (a.raised === null || g.world.bouncers.get(a.id).c.pos.y > a.raised)).toString() : undefined,
    doneIf: ((g, b, a) => g.lastBounce === a.id && g.ev.bounce > a.n0 && (!a.strong || g.lastBounceStrong)).toString(),
  });
}

// Steer (in the air or on foot) to [x, top, z] and stop once standing on that level.
export const landOn = (bot, [x, top, z], o = {}) => bot.go(x, z, {
  hold: true, r: o.r ?? 0.6, timeout: o.timeout ?? 10000, arg: top,
  doneIf: ((g, b, a) => g.player.grounded && g.player.pos.y > a - 0.4 && g.player.pos.y < a + 1.0).toString(),
});

// -- ice ---------------------------------------------------------------------------------

// Slide toward (x, z) until something stops you: a wall, a rock, or stepping onto snow.
export const slide = (bot, x, z, o = {}) => bot.go(x, z, {
  hold: true, r: 0.2, timeout: o.timeout ?? 15000, speed: o.speed, arg: {},
  doneIf: ((g, b, a) => {
    const p = g.player;
    a.n = (a.n || 0) + 1;
    if (a.n < 20) return false; // let it get going first
    const onSnow = p.grounded && p.ground && !p.ground.ice;
    return onSnow || (p.grounded && Math.hypot(p.vel.x, p.vel.z) < 0.25);
  }).toString(),
});
