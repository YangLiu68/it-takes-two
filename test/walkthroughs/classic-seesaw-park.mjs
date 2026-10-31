// Seesaw Park: cliff + steps, over the hedge + gate, keys in the sky (swap),
// the gliding platform, drum bounce onto a seesaw you can't walk to.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const A = (s) => [s.x - 2.35, s.z]; // seesaw ends
  const B = (s) => [s.x + 2.35, s.z];
  const S = L.seesaws;
  const landed = (bot, y) => bot.until((g, b, yy) => g.player.grounded && g.player.pos.y > yy, y, 6000);
  // flyer on end A, pounder on end B (or the other way round with flip).
  const fling = async (flyer, pounder, s, flip = false) => {
    const [fa, pa] = flip ? [B(s), A(s)] : [A(s), B(s)];
    await flyer.go(fa[0], fa[1], { r: 0.25, stop: true });
    await pounder.go(pa[0], pa[1], { r: 0.3, stop: true });
    await pounder.pound();
  };
  const climb = async (bot, parts) => {
    for (const p of parts) await bot.jump({ to: [p.x + p.move[0], p.y + p.move[1] + p.sy / 2, p.z + p.move[2]] });
  };

  // Stage 1: Sol flies up the cliff, drops steps for Luna.
  await fling(sol, luna, S[0]);
  await sol.go(-2.35, 17.5, { r: 0.5, timeout: 4000 });
  await landed(sol, 9);
  await sol.go(M.sw1[0], M.sw1[2], { r: 0.3, stop: true });
  await sol.pound();
  const steps1 = L.acts.filter((a) => a.style === 'steps')[0];
  await luna.waitAct(steps1.id, 5000);
  await luna.wait(1600);
  await luna.go(steps1.parts[0].x, 11.6, { r: 0.3, stop: true });
  await climb(luna, steps1.parts);
  await luna.jump({ to: [1.4, 9.5, 17] });
  await shot('cliff');

  // Stage 2: Luna flies over the hedge and opens the gate.
  await both((b) => b.go(B(S[1])[0], 19.5, { r: 0.4 }), (b) => b.go(A(S[1])[0], 19.5, { r: 0.4 }));
  await fling(luna, sol, S[1]);
  await luna.go(-2.35, 34.6, { r: 0.6, timeout: 5000 });
  await landed(luna, 4);
  await luna.go(M.sw2[0], M.sw2[2], { r: 0.3, stop: true });
  await luna.pound();
  await sol.waitAct(L.acts.find((a) => a.style === 'gate').id, 5000);
  await sol.wait(1200);
  await sol.go(0, 24.3, { r: 0.25, stop: true });
  await sol.jump({ to: [0, 5, 35], double: true });
  await shot('hedge');

  // Stage 3: keys in the sky — Sol first, then Luna.
  await both((b) => b.go(-1, 44, { r: 0.5 }), (b) => b.go(1, 44, { r: 0.5 }));
  await fling(sol, luna, S[2]);
  await sol.waitHold(L.items.find((i) => i.who === 0).id, 6000);
  await landed(sol, 4);
  await sol.go(-3.2, 48, { r: 0.4, stop: true });
  await luna.go(B(S[2])[0], B(S[2])[1], { r: 0.25, stop: true });
  await sol.go(A(S[2])[0], A(S[2])[1], { r: 0.3, stop: true });
  await sol.pound();
  await luna.waitHold(L.items.find((i) => i.who === 1).id, 6000);
  await landed(luna, 4);
  await shot('keys');
  await both((b) => b.go(-1.2, 55.8, { r: 0.4 }), (b) => b.go(1.2, 55.8, { r: 0.4 }));
  await sol.waitSig(L.locks[0].id, 6000);
  await sol.wait(1500);

  // Stage 4: Sol lands on the gliding platform and rides it over.
  await both((b) => b.path([[-0.8, 60.5], [-0.8, 64]], { r: 0.5 }), (b) => b.path([[0.8, 60.5], [0.8, 64]], { r: 0.5 }));
  await sol.go(A(S[3])[0], A(S[3])[1], { r: 0.25, stop: true });
  await luna.go(B(S[3])[0], B(S[3])[1], { r: 0.3, stop: true });
  // Pound as the platform comes back toward this end: by the time Sol comes
  // down it has turned round and is right under him.
  const mv = L.movers[0].id;
  await luna.until((g, b, id) => {
    const m = g.world.movers.find((x) => x.def.id === id).def.motion;
    const z = (t) => m.a[2] + (m.b[2] - m.a[2]) * (1 - Math.cos(2 * Math.PI * (t / m.period + m.phase))) / 2;
    const t = g.world.time;
    return z(t) < m.a[2] + 1.2 && z(t + 0.1) < z(t);
  }, mv, 30000);
  await luna.pound();
  await sol.go(-2.35, 74.8, { r: 0.35, stop: true, timeout: 3000 });
  await landed(sol, 13.5);
  await shot('glide', sol.page);
  await sol.until((g, b, id) => g.world.movers.find((x) => x.def.id === id).tf.z > 89.9, mv, 20000);
  await sol.go(-2.35, 95, { r: 0.5 });
  await sol.go(M.sw4[0], M.sw4[2], { r: 0.3, stop: true });
  await sol.pound();
  const steps4 = L.acts.filter((a) => a.style === 'steps')[1];
  await luna.waitAct(steps4.id, 5000);
  await luna.wait(1600);
  await luna.go(3, 70.6, { r: 0.3, stop: true });
  await climb(luna, steps4.parts);
  await luna.jump({ to: [3, 14.5, 94.2] });

  // Stage 5: Sol climbs to the high seesaw; Luna bounces off the drum and pounds the far end.
  await sol.path([[-2, 101], [-2, 121.6], [-9.4, 121.6]], { r: 0.4 });
  for (const [z, top] of [[119, 16.1], [116.6, 17.7], [114.2, 19.3], [111.8, 20.9]]) await sol.jump({ to: [-9.4, top, z] });
  await sol.jump({ to: [A(S[4])[0], 22, A(S[4])[1]] });
  await sol.go(A(S[4])[0], A(S[4])[1], { r: 0.25, stop: true });
  await luna.path([[3, 101], [6.6, 113]], { r: 0.4 });
  await luna.go(6.6, 113, { r: 0.3, stop: true });
  await luna.bounce([M.drum[0], M.drum[1], M.drum[2]], [B(S[4])[0], 22, B(S[4])[1]], { pound: true, timeout: 8000 });
  await sol.go(-4, 122.4, { r: 0.6, timeout: 5000 });
  await landed(sol, 30);
  await shot('drum');
  await luna.go(3.5, 116, { r: 0.5 });
  await luna.go(M.lift[0], M.lift[2], { r: 0.3, stop: true });
  await sol.go(M.liftPlate[0], M.liftPlate[2], { r: 0.3, stop: true });
  await luna.until((g) => g.player.pos.y > 30.5, null, 10000);
  await luna.go(-2.5, 126, { r: 0.5 });
  await luna.go(-2.5, 131, { r: 0.6 });
  await sol.go(-5.5, 131, { r: 0.6 });
}
