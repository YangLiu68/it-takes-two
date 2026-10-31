// Level 16 Piston Workshop: dodge, 4-second stepping stones, fire over the sweeper, Sol's stairs, lights-out bridge.
import { hop, stand, poundAt, landOn } from './ch3-lib.mjs';

export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const mv = L.movers;

  // 1. The piston corridor: wait for each piston to pull back, then dash past.
  const away = (g, b, a) => {
    const c = g.physics.byId.get(a.id);
    return a.side * c.pos.x > 3.0 && a.side * c.vel.x > 0;
  };
  for (const bot of [sol, luna]) {
    await bot.go(0, 3.4, { r: 0.4 });
    for (let k = 0; k < 5; k++) {
      const [side, , z] = M[`pis${k}`];
      await bot.go(0, z - 2.25, { r: 0.3 });
      await bot.until(away, { id: mv[k].id, side }, 15000);
      await bot.go(0, z + 2.25, { r: 0.4 });
    }
    await bot.go(bot === sol ? -1.5 : 1.5, 33, { r: 0.5 });
  }
  await shot('s1');

  // 2. Four seconds of stepping stones, each way.
  const stones = [0, 1, 2, 3].map((i) => M[`st${i}`]);
  const pistonAct = L.acts.find((a) => a.style === 'piston');
  const run = async (runner) => {
    await runner.waitAct(pistonAct.id, 5000);
    await runner.wait(450);
    for (const s of stones) await hop(runner, s, { settle: false, double: false });
    await hop(runner, [0, 0, 59.4], { settle: false, double: false });
  };
  await sol.go(0, 37.4, { r: 0.3 });
  await poundAt(luna, M.swA[0], M.swA[2]);
  await run(sol);
  await poundAt(sol, M.swB[0], M.swB[2]);
  // Luna went to the edge while Sol ran.
  await luna.go(0, 37.4, { r: 0.3 });
  await sol.go(M.swB[0], M.swB[2], { r: 0.3, stop: true });
  await sol.pound();
  await run(luna);
  await shot('s2');

  // 3. Luna fires Sol over the sweeping piston, then Sol lifts Luna up.
  const sweeper = mv[5];
  await stand(sol, M.launcher[0], M.launcher[2]);
  await luna.go(M.fire[0], M.fire[2] - 2, { r: 0.3, stop: true });
  await luna.until((g, b, a) => {
    const c = g.physics.byId.get(a);
    return Math.abs(c.pos.x) > 4.5 && c.pos.x * c.vel.x > 0;
  }, sweeper.id, 15000);
  await luna.go(M.fire[0], M.fire[2], { r: 0.4 });
  await sol.until((g) => !g.player.grounded && g.player.vel.y > 10, null, 4000);
  await landOn(sol, M.ledge, { timeout: 6000 });
  await shot('s3', sol.page);
  await luna.go(M.lift[0], M.lift[2] - 3, { r: 0.4 });
  await stand(luna, M.lift[0], M.lift[2]);
  await stand(sol, M.liftPlate[0], M.liftPlate[2]);
  await luna.until((g) => g.player.pos.y > 8.7, null, 8000);
  await luna.go(8, 78, { r: 0.5 });
  await sol.go(6.5, 80.5, { r: 0.5 });

  // 4. Sol holds the plate in his booth; Luna climbs, then keeps the stairs out for him.
  await sol.path([[5.6, 85], [M.booth[0], M.booth[2]]], { r: 0.3 });
  await stand(sol, M.booth[0], M.booth[2]);
  const steps = [0, 1, 2, 3].map((i) => M[`step${i}`]);
  const bars = [mv[6]];
  // (helper is inlined in the in-page test below)
  const climb = async (bot) => {
    for (let tries = 0; ; tries++) {
      await bot.go(steps[0][0], 88.4, { r: 0.3 });
      let fell = false;
      for (let i = 0; i < steps.length && !fell; i++) {
        // Onto the punched steps only once their pistons are most of the way back in.
        // (The second piston lags the first a little: go straight on up.)
        if (i === 1) {
          await bot.until((g, b, a) => {
            const c = g.physics.byId.get(a);
            return c.vel.z > 0.3 && c.pos.z > 91.9;
          }, bars[0].id, 15000).catch(() => {});
        }
        if (process.env.DBG) console.log('    step', i, 'from', JSON.stringify((await bot.pos()).map((v) => +v.toFixed(2))));
        const peak = bot.page.evaluate(async () => { let m = -1e9; const g = window.__itt.game; const t0 = performance.now(); while (performance.now() - t0 < 1500) { m = Math.max(m, g.player.pos.y); await new Promise((r) => requestAnimationFrame(r)); } return [m, g.player.pos.x, g.player.pos.z]; });
        await hop(bot, steps[i], { settle: false, double: true, doubleAt: 4 }).catch((e) => process.env.DBG && console.log('    hop err', e.message));
        if (process.env.DBG) console.log('    step', i, 'to', JSON.stringify((await bot.pos()).map((v) => +v.toFixed(2))), 'peak', JSON.stringify(await peak));
        // Knocked off by a piston? Back down on the ledge: start again.
        if ((await bot.pos())[1] < steps[i][1] - 1) fell = true;
      }
      if (!fell) break;
      if (tries > 3) throw new Error(`${bot.name}: keeps getting knocked off the stairs`);
      await bot.until((g) => g.player.grounded, null, 6000);
    }
    await hop(bot, [steps[3][0], 21, 94], { r: 0.5 });
  };
  await climb(luna);
  await poundAt(luna, M.topSw[0], M.topSw[2]);
  await luna.go(-3, 96, { r: 0.5 });
  await sol.path([[5.6, 85], [3, 88.4]], { r: 0.4 });
  await climb(sol);
  await shot('s4');

  // 5. Lights-out: one press each, on the second and fifth switches.
  await sol.path([[-0.85, 97.4], [-0.85, 99.6]], { r: 0.4 });
  await luna.path([[0.85, 97.4], [0.85, 99.6]], { r: 0.4 });
  await Promise.all([poundAt(sol, M.dial1[0], M.dial1[2]), poundAt(luna, M.dial4[0], M.dial4[2])]);
  const cols = L.acts.filter((a) => a.style === 'piston' && a.parts.length === 1 && a.parts[0].sy === 12);
  for (const c of cols) await sol.waitAct(c.id, 6000);
  await shot('s5');
  await Promise.all([sol.path([[-0.8, 101.6], [-0.8, 104], [-0.8, 126.5]], { r: 0.4 }), luna.path([[0.8, 101.6], [0.8, 104.5], [0.8, 126.5]], { r: 0.4 })]);
  const g = L.goal;
  await Promise.all([sol.go(g.x - 1.4, g.z, { r: 0.5 }), luna.go(g.x + 1.4, g.z, { r: 0.5 })]);
}
