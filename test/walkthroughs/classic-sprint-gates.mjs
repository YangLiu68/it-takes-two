// Level 12 · Sprint Gates: far switch + sprint; two switches at once; the bridge built
// beside you; the 14-second countdown; three switches for two players.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const actOpen = (g, b, id) => g.world.state.act[id] === 1;
  const doorAt = (z) => L.acts.find((a) => a.style === 'door' && Math.abs(a.parts[0].z - z) < 0.6).id;

  // 1. Sol pounds the far switch; Luna sprints through before the door shuts.
  await luna.go(0, 4.6, { r: 0.4, stop: true });
  await sol.go(7, 0, { r: 0.5 });
  await sol.go(M.S1[0], M.S1[2], { r: 0.3, stop: true });
  const run1 = luna.goWhen(0, 9.3, actOpen, doorAt(22), { r: 0.5 }).then(async () => {
    await luna.jump({ at: [0, 9.6], to: [0, 0, 13.4] });
    await luna.jump({ at: [0, 15.6], to: [0, 0, 19.4] });
    await luna.go(0, 24.5, { r: 0.6 });
  });
  await sol.pound();
  await run1;
  await luna.go(M.S2[0], M.S2[2], { r: 0.3, stop: true });
  await luna.pound();
  await sol.path([[7, 0], [0, 4.6], [0, 9.3]], { r: 0.5 });
  await sol.jump({ at: [0, 9.6], to: [0, 0, 13.4] });
  await sol.jump({ at: [0, 15.6], to: [0, 0, 19.4] });
  await sol.go(-1.5, 25.5, { r: 0.6 });
  await shot('far-switch');

  // 2. Both switches at the same moment.
  await both((b) => b.path([[-1, 31], [M.L[0], M.L[2]]], { r: 0.3, stop: true }), (b) => b.path([[1, 31], [M.R[0], M.R[2]]], { r: 0.3, stop: true }));
  await both((b) => b.go(M.L[0], M.L[2], { r: 0.25, stop: true }), (b) => b.go(M.R[0], M.R[2], { r: 0.25, stop: true }));
  const sync = doorAt(44.5);
  for (let tries = 0; tries < 4; tries++) {
    await both((b) => b.pound(), (b) => b.pound());
    if (await sol.waitAct(sync, 2000).then(() => true, () => false)) break;
  }
  await sol.waitAct(sync, 1000);
  await both((b) => b.path([[-1.2, 43], [-1.2, 48]], { r: 0.5 }), (b) => b.path([[1.2, 43], [1.2, 48]], { r: 0.5 }));
  await shot('sync');

  // 3. Sol builds the bridge a piece at a time from the side path; Luna follows on it.
  const segOf = (k) => L.acts.find((a) => a.style === 'bridge' && Math.abs(a.parts[0].z - M[`seg${k}`][2]) < 0.1).id;
  const segUp = (g, b, id) => {
    const a = g.world.acts.find((q) => q.def.id === id);
    return g.world.state.act[id] === 1 && a.parts[0].u >= 1;
  };
  await luna.go(0, 54, { r: 0.4, stop: true });
  await sol.path([[-6, 50], [-22, 50], [-24, 54]], { r: 0.6 });
  for (let k = 0; k < 6; k++) {
    await sol.go(M[`T${k}`][0], M[`T${k}`][2], { r: 0.3, stop: true });
    const step = luna.goWhen(0, M[`seg${k}`][2], segUp, segOf(k), { r: 0.5, stop: true });
    await sol.pound();
    await step;
  }
  await luna.go(0, 87.5, { r: 0.6 });
  await luna.go(M.F[0], M.F[2], { r: 0.3, stop: true });
  await luna.pound();
  await shot('bridge', luna.page);
  await sol.path([[-24, 52], [-22, 50], [-6, 50], [0, 54]], { r: 0.6 });
  for (let k = 0; k < 6; k++) await sol.goWhen(0, M[`seg${k}`][2], segUp, segOf(k), { r: 0.6 });
  await sol.go(-1.5, 87.5, { r: 0.6 });

  // 4. The countdown: Luna pounds, both run the course side by side.
  await sol.go(-1, 93.5, { r: 0.4, stop: true });
  await luna.go(M.C[0], M.C[2], { r: 0.3, stop: true });
  await luna.pound();
  await luna.go(1, 93.5, { r: 0.5 });
  const lane = async (bot, x) => {
    await bot.go(x, 100.4, { r: 0.4 });
    await bot.jump({ to: [x, 0.6, 104] });
    await bot.jump({ to: [x, 1.2, 108.5] });
    await bot.jump({ to: [x, 1.8, 113.4] });
  };
  await both((b) => lane(b, -1), (b) => lane(b, 1));
  // The shuttle: step on when it's at this end, off at the other.
  const shuttleZ = (g) => g.world.movers.find((m) => m.def.motion.a && Math.abs(m.def.motion.a[2] - 116.3) < 0.1).tf.z;
  await both((b) => b.goWhen(-1, 116.8, (g) => g.world.movers.find((m) => m.def.motion.a && Math.abs(m.def.motion.a[2] - 116.3) < 0.1).tf.z < 116.7, null, { r: 0.4 }),
    (b) => b.goWhen(1, 116.8, (g) => g.world.movers.find((m) => m.def.motion.a && Math.abs(m.def.motion.a[2] - 116.3) < 0.1).tf.z < 116.7, null, { r: 0.4 }));
  await sol.until((g) => g.world.movers.find((m) => m.def.motion.a && Math.abs(m.def.motion.a[2] - 116.3) < 0.1).tf.z > 120.9, null, 6000);
  await both((b) => b.go(-1, 125, { r: 0.6 }), (b) => b.go(1, 125, { r: 0.6 }));
  await both((b) => b.go(-1, 142, { r: 0.6 }), (b) => b.go(1, 142, { r: 0.6 }));
  await shot('countdown');
  void shuttleZ;

  // 5. Three switches: Sol does two, Luna the third.
  await both((b) => b.path([[-1, 149], [M.A[0], M.A[2]]], { r: 0.3, stop: true }), (b) => b.path([[1, 149], [M.D[0], M.D[2]]], { r: 0.3, stop: true }));
  const tri = doorAt(170.5);
  for (let tries = 0; tries < 4; tries++) {
    await sol.go(M.A[0], M.A[2], { r: 0.3, stop: true });
    await sol.pound();
    await sol.go(M.B[0], M.B[2], { r: 0.3, stop: true });
    await both((b) => b.pound(), (b) => b.pound());
    if (await sol.waitAct(tri, 2000).then(() => true, () => false)) break;
  }
  await sol.waitAct(tri, 1000);
  await both((b) => b.path([[-1.2, 168], [-1.2, 174]], { r: 0.6 }), (b) => b.path([[1.2, 168], [1.2, 174]], { r: 0.6 }));
  await sol.go(L.goal.x - 1.5, L.goal.z, { r: 0.8 });
  await luna.go(L.goal.x + 1.5, L.goal.z, { r: 0.8 });
}
