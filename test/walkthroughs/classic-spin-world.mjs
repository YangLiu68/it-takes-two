// Level 14 · Spin World: crosses, the clock, the partner-turned bridge, orbit rings, jump rope.
import { hop, stand, nearPoint, barSoon, found } from './ch3-lib.mjs';

export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const mv = L.movers;
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const tips = (ms, l) => ms.flatMap((m) => [[m.id, l, 0], [m.id, -l, 0]]);

  // Board whatever comes within reach, riding on its point.
  const board = async (bot, pts, r, o = {}) => {
    for (let tries = 0; ; tries++) {
      await bot.until(nearPoint, { pts, r }, o.timeout ?? 40000);
      const [id, lx, lz] = await found(bot);
      if (process.env.DBG) console.log('    board', id, JSON.stringify(await bot.pos()));
      await bot.jump({ attach: { id, local: [lx, 0, lz] }, double: o.double ?? false });
      if (process.env.DBG) console.log('    landed', JSON.stringify(await bot.pos()));
      // Made it up there? (Falling short onto something lower: try again.)
      const top = await bot.page.evaluate((i) => { const c = window.__itt.game.physics.byId.get(i); return c.pos.y + c.hy; }, id);
      const y = (await bot.pos())[1];
      if (Math.abs(y - top) > 0.5) {
        if (tries >= 3) throw new Error(`${bot.name}: missed ${id} three times`);
        continue;
      }
      // Settle on the point (it keeps moving).
      await bot.go(0, 0, { attach: { id, local: [lx, 0, lz] }, r: 0.45, timeout: 5000 });
      return [id, lx, lz];
    }
  };

  // 1. Spinning crosses, one bot after the other.
  const crosses = [0, 1, 2].map((k) => mv.slice(k * 2, k * 2 + 2));
  for (const bot of [sol, luna]) {
    await bot.go(bot === sol ? -0.8 : 0.8, 3.4, { r: 0.3 });
    for (const c of crosses) await board(bot, tips(c, 4.65), 3.3);
    await bot.until((g) => g.player.pos.z > 37.3 && Math.abs(g.player.pos.x) < 2.2, null, 40000);
    await hop(bot, [0, 0, 42.4], { double: true });
    await bot.go(bot === sol ? -1.5 : 1.5, 44, { r: 0.5 });
  }
  await shot('s1');

  // 2. The clock: ride the hour hand, jump the minute hand, hop off at twelve.
  const hour = mv[6], minute = mv[7];
  const zc2 = M.clock[2];
  const bar = { id: minute.id, cx: 0, cz: zc2, w: -0.85, wp: 0.28, lo: 0.18, hi: 0.36, half: 9.5 };
  for (const bot of [sol, luna]) {
    await bot.go(0, 48.3, { r: 0.25 });
    await bot.until((g, b, a) => {
      const p = g.player.pos;
      const c = g.physics.byId.get(a.hour);
      const m = g.physics.byId.get(a.minute);
      // The minute hand catches up from one side: only board once it has just gone by.
      const gap = ((((m.yaw - c.yaw) % Math.PI) + Math.PI) % Math.PI);
      if (gap < 1.4) return false;
      const cs = Math.cos(c.yaw), sn = Math.sin(c.yaw);
      for (const l of [7.4, -7.4]) {
        const x = c.pos.x + l * cs, z = c.pos.z - l * sn;
        if (Math.hypot(x - p.x, z - p.z) < 3.7) {
          b.found = [a.hour, l, 0];
          return true;
        }
      }
      return false;
    }, { hour: hour.id, minute: minute.id }, 60000);
    const [, lx] = await found(bot);
    await bot.jump({ attach: { id: hour.id, local: [lx, 0, 0] } });
    await bot.go(0, 0, {
      attach: { id: hour.id, local: [lx, 0, 0] }, hold: true, r: 0.4, timeout: 45000, arg: bar,
      jumpIf: barSoon.toString(),
      doneIf: ((g, b, a) => g.player.grounded && g.player.pos.z > a.cz + 6.6 && Math.abs(g.player.pos.x) < 2.4).toString(),
    });
    await hop(bot, [0, 0, zc2 + 11.4], { double: true });
    await bot.go(bot === sol ? -1.5 : 1.5, zc2 + 13, { r: 0.5 });
  }
  await shot('s2');

  // 3. The bridge: Luna turns it until it lines up, Sol crosses; then the other way.
  const bridge = mv[8];
  const aligned = (g, b, a) => {
    const c = g.physics.byId.get(a.id);
    const k = ((((c.yaw - Math.PI / 2) % Math.PI) + Math.PI) % Math.PI);
    return k > Math.PI - 0.07 || k < 0.01;
  };
  await stand(luna, M.plA[0], M.plA[2]);
  await luna.until(aligned, { id: bridge.id }, 30000);
  await luna.go(M.plA[0], M.plA[2] - 2.2, { r: 0.4 });
  await sol.path([[0, M.bridge[2] - 9.6], [0, M.bridge[2] + 9.8]], { r: 0.4 });
  await stand(sol, M.plB[0], M.plB[2]);
  await sol.wait(1500);
  await sol.until(aligned, { id: bridge.id }, 30000);
  await sol.go(M.plB[0], M.plB[2] + 2.2, { r: 0.4 });
  await luna.path([[0, M.bridge[2] - 9.6], [0, M.bridge[2] + 9.8]], { r: 0.4 });
  await shot('s3');

  // 4. The rings: hop up ring by ring to the top of the tower.
  const zc4 = M.rings[2];
  const ring = (k) => mv.filter((m) => m.ring === k);
  for (const bot of [sol, luna]) {
    await bot.go(bot === sol ? -0.6 : 0.6, zc4 - 10.2, { r: 0.3 });
    await board(bot, ring(0).map((m) => [m.id, 0, 0]), 2.9);
    await board(bot, ring(1).map((m) => [m.id, 0, 0]), 4.3);
    await board(bot, ring(2).map((m) => [m.id, 0, 0]), 4.3);
    await board(bot, ring(3).map((m) => [m.id, 0, 0]), 4.3);
    // Up onto the tower: double-jump early, so it's high before it gets to the wall.
    for (let tries = 0; ; tries++) {
      await bot.jump({ to: [0, M.tower[1], M.tower[2]], double: true, doubleAt: 7 });
      if ((await bot.pos())[1] > M.tower[1] - 0.3) break;
      if (tries > 3) throw new Error(`${bot.name}: can't get onto the tower`);
      await bot.wait(300);
    }
    // Onto the spring, then steer for the deck.
    await bot.go(M.spring[0], M.spring[2], { r: 0.5, timeout: 6000, doneIf: ((g) => !g.player.grounded && g.player.vel.y > 5).toString() });
    await bot.go(bot === sol ? -1.2 : 1.2, M.deck[2] + 0.5, { r: 0.6, timeout: 8000 });
    await bot.until((g) => g.player.grounded, null, 5000);
    await bot.go(bot === sol ? -1.9 : 1.9, M.deck[2] + 2.2, { r: 0.4 }); // off the stop plate
  }
  await shot('s4');

  // 5. Jump rope: both onto their plates, jumping only the red bar.
  const zd = M.disc[2];
  const rope = { id: mv[21].id, cx: 0, cz: zd, w: 1.1, wp: 0, lo: 0.1, hi: 0.3, half: 6.6 };
  await both((b) => b.path([[-1.6, zc4 + 6], [-1.2, zd - 7.1]], { r: 0.4 }), (b) => b.path([[1.6, zc4 + 6], [1.2, zd - 7.1]], { r: 0.4 }));
  const exit = L.acts.find((a) => a.style === 'bridge');
  const onPlate = (bot, x) => bot.go(x, zd, {
    hold: true, r: 0.3, timeout: 40000, arg: { ...rope, exit: exit.id },
    jumpIf: barSoon.toString(),
    doneIf: ((g, b, a) => g.world.state.act[a.exit] === 1 && g.player.grounded).toString(),
  });
  await both((b) => onPlate(b, M.ropeL[0]), (b) => onPlate(b, M.ropeR[0]));
  await shot('s5');
  const away = (bot, x) => bot.go(x, zd + 7.3, { r: 0.4, timeout: 20000, arg: rope, jumpIf: barSoon.toString() });
  await both((b) => away(b, -0.8), (b) => away(b, 0.8));
  const g = L.goal;
  await both((b) => b.path([[-0.8, zd + 12], [g.x - 1.4, g.z]], { r: 0.5 }), (b) => b.path([[0.8, zd + 12], [g.x + 1.4, g.z]], { r: 0.5 }));
}
