// Crumbling Path: crumbling columns, the held bridge, planks over the gaps, twin
// towers, the collapsing arena.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const pt = ([x, y, z]) => ({ x, y, z, id: null });
  const hop = (bot, pts) => bot.beat(pts.map(pt)); // keep moving: no stopping on crumbles
  const brAt = (z) => L.acts.find((a) => a.style === 'bridge' && Math.abs(a.parts[0].z - z) < 1.5);

  // Stage 1: one column each.
  await both((b) => b.go(-1.6, 4.4, { r: 0.25, stop: true }), (b) => b.go(1.6, 4.4, { r: 0.25, stop: true }));
  await both((b) => hop(b, [...M.row1.map(([z, t]) => [-1.6, t, z]), [-1.6, 1.2, 31]]), (b) => hop(b, [...M.row1.map(([z, t]) => [1.6, t, z]), [1.6, 1.2, 31]]));
  await shot('columns');

  // Stage 2: Sol runs the crumbles and holds the plate for Luna's bridge.
  await sol.go(-3, 35.9, { r: 0.25, stop: true });
  await hop(sol, [...M.row2, [-2, 1.2, 56.6]]);
  await sol.go(M.holdPlate[0], M.holdPlate[2], { r: 0.3, stop: true });
  const held = brAt(38.5);
  await luna.waitAct(held.id, 5000);
  await luna.wait(1200);
  await luna.path([[3, 36], [3, 55.6], [1.5, 58.5]], { r: 0.4 });

  // Stage 3: Luna raises the planks, Sol runs.
  await both((b) => b.go(-3, 61.6, { r: 0.25, stop: true }), (b) => b.go(4.5, 61.6, { r: 0.3 }));
  const R = M.runner;
  await luna.go(M.S1[0], M.S1[2], { r: 0.3, stop: true });
  await luna.pound();
  await sol.waitAct(brAt(77.65).id, 4000);
  await sol.wait(500);
  // Luna runs ahead to the second switch while Sol crosses the first plank.
  await Promise.all([hop(sol, R.slice(0, 4).map(([x, y, z]) => [x, y, z])), luna.go(M.S2[0], M.S2[2], { r: 0.3, stop: true })]);
  await luna.pound();
  await sol.waitAct(brAt(98.65).id, 4000);
  await sol.wait(400);
  await hop(sol, [...R.slice(4).map(([x, y, z]) => [x, y, z]), [-3, 1.2, 117]]);
  await luna.go(4.5, 113, { r: 0.4 });
  await luna.go(3, 118, { r: 0.4 });
  await shot('planks', sol.page);

  // Stage 4: twin towers, side by side.
  await both((b) => b.go(-6, 123.4, { r: 0.25, stop: true }), (b) => b.go(6, 123.4, { r: 0.25, stop: true }));
  await both((b) => hop(b, [...M.towers[0], [-6, 13.2, 132]]), (b) => hop(b, [...M.towers[1], [6, 13.2, 132]]));
  await shot('towers');

  // Stage 5: across the arena to the corner plates, then up the steps.
  await both((b) => b.path([[-2.5, 132], [-0.6, 134], [-0.6, 140.6]], { r: 0.4 }), (b) => b.path([[2.5, 132], [0.6, 134], [0.6, 140.6]], { r: 0.4 }));
  const A = 13.2;
  await both(
    (b) => hop(b, [[-2.8, A, 142.9], [-5.6, A, 145.7], [-8.4, A, 148.5], [-8.4, A, 151.3], [-8.4, A, 154.1], [-8.4, A, 156.9], [M.cA[0], A, M.cA[2]]]),
    (b) => hop(b, [[2.8, A, 142.9], [5.6, A, 145.7], [8.4, A, 148.5], [8.4, A, 151.3], [8.4, A, 154.1], [8.4, A, 156.9], [M.cB[0], A, M.cB[2]]]),
  );
  await both((b) => b.go(M.cA[0], M.cA[2], { r: 0.3, stop: true }), (b) => b.go(M.cB[0], M.cB[2], { r: 0.3, stop: true }));
  const steps = L.acts.find((a) => a.style === 'steps');
  await sol.waitAct(steps.id, 5000);
  await sol.wait(1500);
  const sp = steps.parts.map((p) => [p.x + p.move[0], p.y + p.sy / 2, p.z + p.move[2]]);
  await both((b) => b.path([[-8, 163.2], [sp[0][0], 163.4]], { r: 0.3 }), (b) => b.path([[8, 163.2], [3, 163.2]], { r: 0.4 }));
  await sol.go(sp[0][0], 163.4, { r: 0.25, stop: true });
  for (const p of sp) await sol.jump({ to: p });
  await sol.jump({ to: [4.5, 19.2, 168.2] });
  await luna.go(sp[0][0], 163.4, { r: 0.25, stop: true });
  for (const p of sp) await luna.jump({ to: p });
  await luna.jump({ to: [4.5, 19.2, 168.2] });
  await both((b) => b.go(-1.2, 171), (b) => b.go(1.2, 171));
}
