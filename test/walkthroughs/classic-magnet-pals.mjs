// Magnet Pals: magnet lanes, launch pads + lift/steps, partner bond, split rooms
// (wall pads / ceiling pads), relay tower with bonds.
export default async function ({ sol, luna, L, shot, sleep }) {
  const M = L.marks;
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  // Stand on your own launch pad, hold E and steer for the ledge while you fly.
  const launch = async (bot, pad, y, to) => {
    for (let k = 0; k < 3; k++) {
      await bot.go(pad[0], pad[2], { r: 0.25, stop: true });
      await bot.magnet(1600, { to });
      const up = await bot.until((g, b, yy) => g.player.grounded && g.player.pos.y > yy, y, 3000).then(() => true, () => false);
      if (up) return;
    }
    throw new Error(`${bot.name}: launch pad never got me up`);
  };
  const lanePads = (x) => L.pads.filter((p) => p.x === x && p.n[1] < -0.5 && p.z < 30).sort((a, b) => a.z - b.z).map((p) => [p.x, p.y, p.z]);
  // Call your partner over: the caller holds E first, then the flyer.
  const bond = async (caller, flyer) => {
    const call = caller.magnet(5000);
    await sleep(500);
    await flyer.magnet(3200);
    await call;
  };

  // Stage 1: each swings along their own lane.
  await both((b) => b.go(-3.5, 3.6, { r: 0.3, stop: true }), (b) => b.go(3.5, 3.6, { r: 0.3, stop: true }));
  // One after the other: holding E together on the ground reads as "calling" each other.
  const lunaSwing = luna.swing(lanePads(3.5));
  await sol.until((g) => g.remote.magMode === 2, null, 5000);
  await sol.swing(lanePads(-3.5));
  await lunaSwing;
  await shot('lanes');

  // Stage 2: Sol launches up, holds the lift plate for Luna; then Luna launches and drops steps.
  await luna.go(M.lift[0], 34.5, { r: 0.4 });
  await luna.go(M.lift[0], M.lift[2], { r: 0.3, stop: true });
  await launch(sol, M.padSol, 6.5, [-3, 0, 39]);
  await sol.go(M.liftPlate[0], M.liftPlate[2], { r: 0.3, stop: true });
  await luna.until((g) => g.player.grounded && g.player.pos.y > 6.5, null, 8000);
  await luna.go(1, 44, { r: 0.4 });
  await sol.go(-1, 44, { r: 0.4 });
  await launch(luna, M.padLuna, 13.5, [3, 0, 53]);
  await luna.go(M.stepSw[0], M.stepSw[2], { r: 0.3, stop: true });
  await luna.pound();
  const steps = L.acts.find((a) => a.style === 'steps');
  await sol.waitAct(steps.id, 5000);
  await sol.wait(1500);
  const sp = steps.parts.map((p) => [p.x + p.move[0], p.y + p.sy / 2, p.z + p.move[2]]);
  await sol.go(sp[0][0], 46.6, { r: 0.3, stop: true });
  for (const p of sp) await sol.jump({ to: p });
  await sol.jump({ to: [sp[2][0], 14, 51.6] });
  await shot('cliffs');

  // Stage 3: Sol swings over, then calls Luna.
  await both((b) => b.go(0, 60.8, { r: 0.3, stop: true }), (b) => b.go(1.5, 58, { r: 0.4 }));
  await sol.swing(M.bondPads);
  await sol.go(0, 77.6, { r: 0.3, stop: true });
  await luna.go(0, 61.4, { r: 0.3, stop: true });
  await bond(sol, luna);
  await luna.until((g) => g.player.grounded && g.player.pos.z > 76, null, 4000);
  await shot('bond');

  // Stage 4: split up through the colour barriers.
  await both((b) => b.path([[-5, 85], [-7, 89]], { r: 0.4 }), (b) => b.path([[5, 85], [5, 89]], { r: 0.4 }));
  const solSide = (async () => {
    await sol.swing(M.wallPads);
    await sol.until((g) => g.player.grounded && g.player.pos.z > 99, null, 4000);
    await launch(sol, M.padSol2, 20.5, [-5, 0, 106]);
  })();
  const lunaSide = (async () => {
    await luna.swing(M.ceil);
    await luna.until((g) => g.player.grounded && g.player.pos.y > 20.5, null, 4000);
  })();
  await Promise.all([solSide, lunaSide]);
  await shot('ledges');
  await both((b) => b.go(M.swW[0], M.swW[2], { r: 0.3, stop: true }), (b) => b.go(M.swE[0], M.swE[2], { r: 0.3, stop: true }));
  await both((b) => b.pound(), (b) => b.pound());
  const doors = L.acts.filter((a) => a.style === 'door');
  for (const d of doors) await sol.waitAct(d.id, 5000);
  await sol.wait(800);

  // Stage 5: relay islands.
  await both((b) => b.path([[-5, 112], [-3, 117]], { r: 0.4 }), (b) => b.path([[5, 112], [M.relayLuna[0], 120]], { r: 0.3 }));
  await luna.go(M.relayLuna[0], M.relayLuna[2], { r: 0.25, stop: true });
  await luna.magnet(1200);
  await luna.until((g) => g.player.grounded && g.player.pos.y > 27.5, null, 5000);
  await luna.go(-3, 130.7, { r: 0.25, stop: true });
  await sol.go(-3, 117, { r: 0.3, stop: true });
  await bond(luna, sol);
  await sol.until((g) => g.player.grounded && g.player.pos.y > 27.5, null, 4000);
  await sol.go(M.relaySol[0], M.relaySol[2], { r: 0.25, stop: true });
  await sol.magnet(1200);
  await sol.until((g) => g.player.grounded && g.player.pos.y > 34.5, null, 5000);
  await sol.go(3, 142.7, { r: 0.25, stop: true });
  await luna.go(3, 131, { r: 0.3, stop: true });
  await bond(sol, luna);
  await luna.until((g) => g.player.grounded && g.player.pos.y > 34.5, null, 4000);
  await shot('tower');
  await both((b) => b.go(-1.2, 148), (b) => b.go(1.2, 148));
}
