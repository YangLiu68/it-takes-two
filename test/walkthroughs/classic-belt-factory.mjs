// Level 7 · Conveyor Factory: ride belts; turn the fast belt round for each other; freeze
// the pistons; steer the belt railway with dials; leapfrog up the twin lanes.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const retracted = (g) => g.world.movers.filter((m) => m.def.stop).every((m) => Math.abs(m.tf.x) > 3.8);

  // 1. Ride the belts: with you, sideways, against you.
  const ride = async (bot, x, endX) => {
    await bot.go(x, 11, { r: 0.6 });
    await bot.jump({ at: [x, 16.4], to: [x, 0, 22.5], double: true });
    // Lean into the sideways belt.
    await bot.go(-2.2, 25.5, { r: 0.6 });
    await bot.go(-1.8, 28.5, { r: 0.6 });
    await bot.jump({ at: [-1.6, 31.4], to: [x, 0, 37.5], double: true });
    await bot.go(x, 48.2, { r: 0.6 }); // along the belt (it's only 4 wide)
    await bot.go(endX, 50, { r: 0.6 });
  };
  await ride(sol, -1, -3);
  await ride(luna, -1, 1.5);
  await shot('belts');

  // 2. The fast belt: Luna turns it round for Sol, Sol turns it round for Luna.
  await luna.go(M.plateA[0], M.plateA[2], { r: 0.3, stop: true });
  const cross = async (bot) => {
    await bot.go(0, 57, { r: 0.6 });
    await bot.go(0, 73, { r: 0.6 });
    await bot.go(0, 74.2, { r: 0.4 });
    await bot.jump({ to: [0, 0, 79.5] });
    await bot.go(0, 93.5, { r: 0.6 });
  };
  await cross(sol);
  await sol.go(M.plateB[0], M.plateB[2], { r: 0.3, stop: true });
  await cross(luna);
  await shot('fast-belt');

  // 3. The press line: Luna freezes the pistons when they're all pulled back.
  await luna.go(M.plateC[0], M.plateC[2] - 2.3, { r: 0.3, stop: true });
  await luna.until(retracted, null, 10000);
  await luna.go(M.plateC[0], M.plateC[2], { r: 0.4 });
  await luna.until((g, b, id) => g.world.sig(id), L.plates.find((p) => Math.abs(p.x - M.plateC[0]) < 0.1 && Math.abs(p.z - M.plateC[2]) < 0.1).id, 4000);
  await sol.go(0, 100.5, { r: 0.5 });
  await sol.go(0, 133, { r: 0.6 });
  await shot('pistons', sol.page);
  // Sol holds the far plate (they're frozen already, so no timing needed), then Luna comes.
  await sol.go(M.plateD[0], M.plateD[2], { r: 0.3, stop: true });
  await luna.go(0, 100.5, { r: 0.5 });
  await luna.go(0, 133, { r: 0.6 });

  // 4. The belt railway: Luna works the dials, Sol rides.
  const dial = (mark) => L.dials.find((d) => Math.abs(d.x - M[mark][0]) < 0.1 && Math.abs(d.z - M[mark][2]) < 0.1);
  await luna.setDial(dial('dialA'), 1);
  await luna.setDial(dial('dialB'), 1);
  await sol.go(0, 141, { r: 0.5 });
  await sol.go(0, 145, { r: 0.5 });
  await sol.go(0, 163, { r: 0.6, timeout: 15000 });
  await sol.go(-18, 163, { r: 0.6, timeout: 15000 });
  await shot('railway', sol.page);
  // Now red goes back to FWD so the last belt runs north.
  await luna.setDial(dial('dialA'), 0);
  await sol.go(-18, 182, { r: 0.6, timeout: 15000 });
  await sol.go(M.lower[0], M.lower[2], { r: 0.3, stop: true });
  await sol.pound();
  await luna.waitAct(L.acts.find((a) => a.style === 'bridge').id, 6000);
  await luna.path([[-4, 135.5], [-20, 135.5], [-39, 135.5], [-39, 188], [-24, 188], [-16, 186]], { r: 0.6 });

  // 5. Twin lanes: each plate drives the partner's next stretch.
  await luna.go(M.pL1[0], M.pL1[2], { r: 0.3, stop: true });
  await sol.go(-21, 192, { r: 0.5 });
  await sol.go(-21, 208.5, { r: 0.4, stop: true });
  await luna.go(-15, 192, { r: 0.5 });
  await luna.go(-15, 208.5, { r: 0.4, stop: true });
  await sol.go(-21, 225.5, { r: 0.4, stop: true });
  await luna.go(-15, 225.5, { r: 0.4, stop: true });
  await sol.go(M.pR3[0], M.pR3[2], { r: 0.4, stop: true });
  await luna.go(-15, 244, { r: 0.5 });
  await shot('lanes');
  await luna.go(L.goal.x + 1.5, L.goal.z, { r: 0.6 });
  await sol.go(L.goal.x - 1.5, L.goal.z, { r: 0.6 });
}
