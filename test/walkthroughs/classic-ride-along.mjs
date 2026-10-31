// Level 10 · Ride Along: ferry; crane parked by the real pillar; carriage stopped for the
// gate switches; the timed lift; cargo through the pistons.

// In-page helpers: a mover's current position, by the z (or x) it starts at.
const MOVER = (g, b, a) => {
  const m = g.world.movers.find((q) => q.def.motion.a && Math.abs(q.def.motion.a[2] - a.z) < 0.1 && Math.abs(q.def.motion.a[0] - a.x) < 0.1);
  return a.test(m.tf);
};

export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  // Hop the ferry bar; on the lift and the cargo boat we step clear instead.
  const hazards = L.movers.filter((m) => m.hazard && Math.abs(m.motion.a[2] - 15) < 0.1).map((m) => m.id);
  for (const bot of [sol, luna]) await bot.page.evaluate((ids) => {
    window.__bot.dodge = ids;
    window.__bot.dodgeLead = 0.15; // these bars are quick: jump late so the jump covers the whole pass
  }, hazards);
  // Wait until a mover (found by its start point) satisfies a test on its position.
  const moverUntil = (bot, start, test, timeout = 20000) => bot.until((g, b, a) => {
    const m = g.world.movers.find((q) => q.def.motion.a && Math.abs(q.def.motion.a[2] - a.z) < 0.1 && Math.abs(q.def.motion.a[0] - a.x) < 0.1);
    return new Function('p', `return (${a.test})`)(m.tf);
  }, { x: start[0], z: start[1], test }, timeout);
  const moverPos = (bot, start) => bot.page.evaluate((a) => {
    const m = window.__itt.game.world.movers.find((q) => q.def.motion.a && Math.abs(q.def.motion.a[2] - a[1]) < 0.1 && Math.abs(q.def.motion.a[0] - a[0]) < 0.1);
    return [m.tf.x, m.tf.y, m.tf.z];
  }, start);
  const off = (bot, x, z) => bot.go(x, z, { r: 0.4 });

  // 1. The ferry: Luna drives Sol over, then Sol drives Luna.
  await sol.go(0, 7.3, { r: 0.5 });
  await luna.go(M.fA[0], M.fA[2], { r: 0.3, stop: true });
  await sol.until((g) => g.player.pos.z > 21.5, null, 15000);
  await sol.go(-1, 27, { r: 0.6 });
  await off(luna, -3.5, 4.4);
  await luna.until((g, b, id) => g.world.state.act[id] === 0, L.acts.find((a) => a.style === 'carrier').id, 3000).catch(() => {});
  await sol.wait(4500);
  await luna.go(0, 7.3, { r: 0.5 });
  await sol.go(M.fB[0], M.fB[2], { r: 0.3, stop: true });
  await luna.until((g) => g.player.pos.z > 21.5, null, 15000);
  await luna.go(1, 27, { r: 0.6 });
  await off(sol, 1.5, 27);
  await shot('ferry');

  // 2. The crane: Luna checks the pillars from the eye plate, then parks the crane.
  const craneStart = [-10, 37];
  await luna.go(M.pEye[0], M.pEye[2], { r: 0.3, stop: true });
  await shot('eye', luna.page);
  await luna.go(M.pCrane[0], M.pCrane[2], { r: 0.3, stop: true });
  await moverUntil(luna, craneStart, 'p.x > -0.8');
  await off(luna, -4.5, 28.6);
  await sol.go(0, 32.6, { r: 0.4 });
  const c0 = await moverPos(sol, craneStart);
  await sol.jump({ to: [c0[0], 0, 37] });
  // Drive on until the crane is in front of the real pillar.
  await luna.go(M.pCrane[0], M.pCrane[2], { r: 0.3, stop: true });
  await moverUntil(luna, craneStart, `Math.abs(p.x - (${M.real[0]})) < 0.7`, 25000);
  await off(luna, -4.5, 28.6);
  await luna.wait(400);
  const c1 = await moverPos(sol, craneStart);
  await sol.go(c1[0], 35.6, { r: 0.4 });
  await sol.jump({ at: [c1[0], 38.2], to: [M.real[0], M.real[1], M.real[2]], double: true });
  await sol.jump({ to: [M.real[0], 4.5, 53], double: true });
  await sol.go(M.lower[0], M.lower[2], { r: 0.3, stop: true });
  await sol.pound();
  await luna.waitAct(L.acts.find((a) => a.style === 'bridge').id, 6000);
  await luna.go(12.5, 31.5, { r: 0.4 });
  for (let k = 0; k < 4; k++) await luna.jump({ to: M[`plank${k}`], double: true });
  await luna.jump({ to: [12, 4.5, 52.5], double: true });
  await shot('crane', sol.page);

  // 3. The carriage: Luna drives, stops by each switch pillar; Sol hops off and back.
  const carStart = [0, 61];
  await sol.go(0, 58.4, { r: 0.4 });
  await sol.go(0, 61, { r: 0.5 });
  await luna.go(M.pDrive[0], M.pDrive[2], { r: 0.3, stop: true });
  for (const [k, sz] of [[0, 69], [1, 83]]) {
    await moverUntil(luna, carStart, `p.z > ${sz - 0.8}`, 25000);
    await off(luna, -9, 53.6);
    await luna.wait(400);
    const c = await moverPos(sol, carStart);
    await sol.jump({ to: [M[`sw${k}`][0], M[`sw${k}`][1], M[`sw${k}`][2]], double: true });
    await sol.pound();
    await sol.jump({ to: [0.6, 4.5, c[2]], double: true });
    await luna.go(M.pDrive[0], M.pDrive[2], { r: 0.3, stop: true });
  }
  await moverUntil(luna, carStart, 'p.z > 100.5', 25000);
  await sol.go(0, 104.5, { r: 0.6 });
  await shot('carriage', sol.page);
  // Sol brings the carriage back for Luna, then drives her over.
  await sol.go(M.pFar[0], M.pFar[2], { r: 0.3, stop: true });
  await off(luna, -6, 56);
  await moverUntil(sol, carStart, 'p.z < 61.8', 40000);
  await off(sol, 2, 104.5);
  await luna.wait(400);
  await luna.go(0, 58.4, { r: 0.4 });
  await luna.go(0, 61, { r: 0.5 });
  await sol.go(M.pFar[0], M.pFar[2], { r: 0.3, stop: true });
  await moverUntil(sol, carStart, 'p.z > 100.5', 40000);
  await luna.go(-1, 104.5, { r: 0.6 });

  // 4. The timed lift: Luna pounds, Sol rides and hops the bars.
  const liftStart = [0, 115];
  await off(sol, 1.5, 108);
  await sol.go(0, 112.4, { r: 0.4 });
  await sol.go(0, 116.2, { r: 0.3, stop: true }); // the half the low bar can't reach
  await luna.go(M.tSw[0], M.tSw[2], { r: 0.3, stop: true });
  const tSw = L.switches.find((w) => Math.abs(w.x - M.tSw[0]) < 0.1 && Math.abs(w.z - M.tSw[2]) < 0.1).id;
  // Once the lift is past the low bar, Sol steps to the front half (away from the high bar).
  const pastLow = (g, b, a) => {
    const m = g.world.movers.find((q) => q.def.motion.a && Math.abs(q.def.motion.a[2] - 115) < 0.1 && Math.abs(q.def.motion.a[0]) < 0.1);
    return m.tf.y > a;
  };
  const solSwap = sol.goWhen(0, 113.8, pastLow, M.tSw[1] + 8.6, { r: 0.3, stop: true, timeout: 120000 });
  for (let k = 0; k < 6; k++) {
    await luna.pound();
    await luna.until((g, b, id) => g.world.sig(id), tSw, 3000).catch(() => {});
    const reached = await moverUntil(luna, liftStart, `p.y > ${M.pTop[1] - 0.5}`, 4600).then(() => true, () => false);
    if (reached) break;
    await luna.until((g, b, id) => !g.world.sig(id), tSw, 6000);
  }
  await solSwap;
  await sol.go(0, 119.6, { r: 0.5 });
  await shot('lift', sol.page);
  // Sol holds the top plate to bring the lift down, lets go at the bottom, then brings Luna up.
  await sol.go(M.pTop[0], M.pTop[2], { r: 0.3, stop: true });
  await moverUntil(sol, liftStart, `p.y < ${M.tSw[1] - 0.25}`, 30000);
  await off(sol, -0.5, 120.4);
  await luna.wait(300);
  await luna.go(0, 112.4, { r: 0.4 });
  await luna.go(0, 116.2, { r: 0.3, stop: true });
  const lunaSwap = luna.goWhen(0, 113.8, pastLow, M.tSw[1] + 8.6, { r: 0.3, stop: true, timeout: 60000 });
  await sol.go(M.pTop[0], M.pTop[2], { r: 0.3, stop: true });
  await lunaSwap;
  await moverUntil(sol, liftStart, `p.y > ${M.pTop[1] - 0.6}`, 30000);
  await luna.go(1.5, 119.6, { r: 0.5 });
  await off(sol, -1.5, 121.4);

  // 5. Cargo through the pistons.
  const red = L.items.find((i) => i.who === 0), blue = L.items.find((i) => i.who === 1);
  await sol.go(red.x, red.z - 0.4, { r: 0.4 });
  await sol.waitHold(red.id);
  // On the boat: stand on the side the next piston can't reach.
  const rideCargo = async (bot) => {
    for (const [after, x] of [[128.2, 1.5], [133.1, -1.5], [138.8, 1.5]]) {
      await bot.goWhen(x, 0, (g, b, a) => g.world.acts.find((q) => q.def.style === 'carrier' && q.def.parts[0].y > 20).parts[0].c.pos.z > a, after, { rel: true, r: 0.2, stop: true, timeout: 30000 });
    }
    await bot.until((g) => g.player.pos.z > 144.2, null, 20000);
  };
  await sol.go(0, 127.4, { r: 0.5, stop: true });
  const solRide = rideCargo(sol);
  await luna.go(M.pS[0], M.pS[2], { r: 0.3, stop: true });
  await solRide;
  await sol.go(-3, 153.6, { r: 0.5 });
  await sol.waitUsed(red.id);
  await off(luna, 1.5, 121);
  await luna.go(blue.x, blue.z - 0.4, { r: 0.4 });
  await luna.waitHold(blue.id);
  await luna.wait(5200);
  await luna.go(0, 127.4, { r: 0.5, stop: true });
  const lunaRide = rideCargo(luna);
  await sol.go(M.pE[0], M.pE[2], { r: 0.3, stop: true });
  await lunaRide;
  await luna.go(-2.4, 153.8, { r: 0.5 });
  await luna.waitUsed(blue.id);
  await shot('cargo');
  await sol.go(L.goal.x - 1.5, L.goal.z, { r: 0.8 });
  await luna.go(L.goal.x + 1.5, L.goal.z, { r: 0.8 });
  void both; void MOVER;
}
