// Level 11 · Cannon Coast: own cannons; one cannon + a pull; the right cannon of three;
// the alternating chain; the mid-air catch; firing onto the raft.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const pos = (bot) => bot.pos();
  // Stand on your cannon, hold E, steer to the landing spot.
  const fire = async (bot, pad, to, r = 1.4) => {
    await bot.go(pad[0], pad[2], { r: 0.3, stop: true });
    await bot.magnet(450);
    await bot.go(to[0], to[1], { r, timeout: 6000 });
  };
  // The one across calls (holds E); the other holds E and flies over.
  const pull = async (caller, flier) => {
    const c = await pos(caller);
    const hold = caller.magnet(4800);
    await flier.wait(250);
    await flier.face([c[0], c[1] + 1, c[2]]);
    await flier.magnet(3400);
    await hold;
    await flier.face(null);
  };

  // 1. Each fires their own cannon.
  await fire(sol, M.p1, [-2, 27]);
  await fire(luna, M.p2, [2, 27]);
  await shot('first-shot');

  // 2. Luna fires; Sol gets pulled over.
  await sol.go(-3.5, 31.4, { r: 0.4 });
  await fire(luna, M.p3, [0, 51]);
  await luna.go(0, 48.2, { r: 0.4, stop: true });
  await pull(luna, sol);
  await sol.go(-2, 51, { r: 0.6 });
  await luna.go(2, 51, { r: 0.6 });

  // 3. The middle red cannon reaches the red switch; Luna's goes to the blue one.
  await fire(sol, M.r2, [-8, 77], 1.2);
  await sol.go(M.swQ[0], M.swQ[2], { r: 0.3, stop: true });
  await sol.pound();
  await fire(luna, M.bS, [8, 77], 1.2);
  await luna.go(M.swS[0], M.swS[2], { r: 0.3, stop: true });
  await luna.pound();
  await sol.waitAct(L.acts.find((a) => a.style === 'door').id, 6000);
  await shot('switches');
  await sol.go(-8, 80.4, { r: 0.4 });
  await sol.jump({ to: [-6, 0, 87.5], double: true });
  await luna.go(8, 80.4, { r: 0.4 });
  await luna.jump({ to: [6, 0, 87.5], double: true });
  await luna.path([[1.5, 89], [0, 91.5], [1.5, 94]], { r: 0.5 });

  // 4. The chain: Sol fires, Luna is pulled; Luna fires, Sol is pulled; and again.
  await sol.path([[-1.5, 89], [0, 91.5]], { r: 0.5 });
  await fire(sol, M.c1, [0, 112.5], 1.2);
  await sol.go(-2.4, 111.4, { r: 0.4, stop: true });
  await pull(sol, luna);
  await luna.go(1.5, 113, { r: 0.5 });
  await fire(luna, M.c2, [0, 135.5], 1.2);
  await luna.go(2.4, 134.4, { r: 0.4, stop: true });
  await sol.go(-2.4, 117, { r: 0.4 });
  await pull(luna, sol);
  await sol.go(-1.5, 136, { r: 0.5 });
  await fire(sol, M.c3, [0, 159], 1.2);
  await sol.go(-2.4, 157.6, { r: 0.4, stop: true });
  await luna.go(2.4, 140, { r: 0.4 });
  await pull(sol, luna);
  await shot('chain');

  // 5. Luna's high cannon to the cliff; Sol's short one, and a catch in mid-air.
  await fire(luna, M.high, [3, 182], 1.2);
  await luna.go(-1, 179.45, { r: 0.25, stop: true });
  const lunaAt = await pos(luna);
  await sol.go(M.short[0], M.short[2], { r: 0.3, stop: true });
  await sol.face([lunaAt[0], lunaAt[1] + 1, lunaAt[2]]);
  await sol.pitch(-0.2);
  const hold = luna.magnet(5000);
  await sol.wait(300);
  await sol.magnet(150);
  await sol.wait(80); // let go of E for a moment...
  await sol.magnet(3400); // ...and hold it again, now aimed at Luna
  await hold;
  await sol.face(null);
  await sol.pitch(0.28);
  await luna.go(-3, 183, { r: 0.6 });
  await sol.go(2, 183, { r: 0.6 });
  await shot('catch', sol.page);

  // 6. Fire onto the raft as it comes in.
  const raftNear = (g, b, a) => {
    const m = g.world.movers.find((q) => q.def.motion.a && Math.abs(q.def.motion.a[2] - 210) < 0.1).def.motion;
    const u = (1 - Math.cos(2 * Math.PI * ((g.world.time + a) / m.period + m.phase))) / 2;
    return m.a[2] + (m.b[2] - m.a[2]) * u < 210.6;
  };
  const ride = async (bot, pad) => {
    await bot.go(pad[0], pad[2], { r: 0.3, stop: true });
    await bot.until(raftNear, 1.15, 15000);
    await bot.magnet(400);
    await bot.go(0, 210, { r: 1.0, timeout: 5000 });
    await bot.until((g) => g.player.grounded && g.player.pos.z > 226, null, 15000);
    await bot.go(bot === sol ? -2 : 2, 235, { r: 0.6 });
  };
  await ride(sol, M.raftR);
  await ride(luna, M.raftB);
  await shot('raft');
  await sol.go(L.goal.x - 1.5, L.goal.z, { r: 0.8 });
  await luna.go(L.goal.x + 1.5, L.goal.z, { r: 0.8 });
}
