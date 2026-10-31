// Pressure Plates: hold the door, leapfrog bridges, crossed stairs, weights, the director.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const stand = (bot, p) => bot.go(p[0], p[2], { r: 0.3, stop: true });
  const actAt = (style, z) => L.acts.find((a) => a.style === style && Math.abs(a.parts[0].z - z) < 0.6);
  const up = async (bot, act) => {
    await bot.waitAct(act.id, 6000);
    await bot.wait(900);
  };

  // Stage 1: hold the door from outside, then from inside.
  await stand(sol, M.pOut);
  await sol.waitAct(L.acts.find((a) => a.style === 'door').id, 5000);
  await luna.path([[0, 6], [0, 10], [M.pIn[0], M.pIn[2]]], { r: 0.4 });
  await stand(luna, M.pIn);
  await sol.path([[0, 6], [0, 10], [-1, 16]], { r: 0.4 });
  await luna.go(1, 17, { r: 0.4 });

  // Stage 2: leapfrog over the bridges.
  const P = M.leap;
  const br = L.acts.filter((a) => a.style === 'bridge');
  await stand(sol, P[0]);
  await up(luna, br[0]);
  await luna.path([[-0.6, 26.5], [-0.6, 41]], { r: 0.5 });
  await stand(luna, P[1]);
  await up(sol, br[1]);
  await sol.path([[0.8, 26.5], [0.8, 41], [1.7, 43.5], [0.8, 46.5], [0.8, 61]], { r: 0.5 });
  await stand(sol, P[2]);
  await up(luna, br[2]);
  await luna.path([[-0.8, 46.5], [-0.8, 61], [-1.7, 63.5], [-0.8, 66.5], [-0.8, 81]], { r: 0.5 });
  await stand(luna, P[3]);
  await sol.path([[0.8, 66.5], [0.8, 81], [2, 84]], { r: 0.5 });
  await shot('leapfrog');

  // Stage 3: crossed stairs.
  await stand(luna, M.pA);
  const stA = L.acts.filter((a) => a.style === 'steps')[0];
  await up(sol, stA);
  const top = (p) => [p.x + p.move[0], p.y + p.sy / 2, p.z + p.move[2]];
  await sol.go(-6, 85.6, { r: 0.3, stop: true });
  for (const p of stA.parts) await sol.jump({ to: top(p) });
  await sol.jump({ to: [-1.5, 8, 90.6] });
  await stand(sol, M.pB);
  const stB = L.acts.filter((a) => a.style === 'steps')[1];
  await up(luna, stB);
  await luna.go(6, 85.6, { r: 0.3, stop: true });
  for (const p of stB.parts) await luna.jump({ to: top(p) });
  await luna.jump({ to: [1.5, 8, 90.6] });
  await shot('stairs');

  // Stage 4: the cage weight, the shelf weight, then one of you on the plate.
  const [w1, w2] = L.items;
  await stand(luna, M.pC);
  const cage = actAt('door', 104.4);
  await up(sol, cage);
  await sol.path([[-5.5, 101], [-5.5, 106]], { r: 0.4 });
  await sol.waitHold(w1.id);
  await sol.path([[-5.5, 102.5], [-2, 103], [-2, 111.6]], { r: 0.4 });
  await sol.waitUsed(w1.id);
  await stand(sol, M.shelf);
  await luna.go(M.shelf[0], 106.4, { r: 0.3, stop: true });
  await luna.jump({ to: [M.shelf[0], C(9.6), M.shelf[2]] });
  await luna.jump({ to: [5.5, 13, 111.5], double: true });
  await luna.waitHold(w2.id);
  await luna.jump({ to: [3.5, 8, 106] });
  await luna.go(-1.2, 111.8, { r: 0.4 });
  await luna.waitUsed(w2.id);
  await stand(sol, M.pV);
  await sol.waitAct(actAt('door', 116).id, 5000);
  await sol.wait(800);
  await shot('vault');

  // Stage 5: Luna directs from the balcony, Sol walks the gates.
  await both((b) => b.path([[1, 117.5], [0.5, 125]], { r: 0.4 }), (b) => b.path([[-1, 117.5], [-6.5, 118.4]], { r: 0.4 }));
  for (const p of M.stairs) await luna.jump({ to: p });
  await luna.jump({ to: [-5.5, 13, 127.4] });
  const gates = [130, 135, 140, 145].map((z) => actAt('door', z));
  const cells = [132.5, 137.5, 142.5, 148];
  for (let k = 0; k < 4; k++) {
    await stand(luna, k % 2 ? M.dB : M.dA);
    await up(sol, gates[k]);
    await sol.go(0, cells[k], { r: 0.4, stop: true });
  }
  await shot('director');
  await sol.go(M.done[0], M.done[2], { r: 0.3, stop: true });
  await sol.pound();
  await luna.waitAct(actAt('door', 150).id, 5000);
  await luna.wait(1000);
  await luna.path([[-5.5, 148.5], [-5.5, 153]], { r: 0.5 });
  await both((b) => b.go(-1.2, 156.5), (b) => b.go(1.2, 156.5));
}

const C = (y) => y;
