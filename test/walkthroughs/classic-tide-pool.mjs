// Level 27 Tide Pool: out of the basin before the tide (boost + steps), two valves
// drain the hall, the water lift, bobbing rafts with the two islands, and the
// two pools that fill each other.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const at = async (bot, y, what) => {
    const p = await bot.pos();
    if (p[1] < y - 0.6) throw new Error(`${bot.name} missed ${what}: at ${p.map((v) => v.toFixed(1)).join(',')}`);
  };
  const hop = async (bot, to, what, o = {}) => {
    await bot.jump({ to, double: true, ...o });
    await at(bot, to[1], what);
  };

  // 1. The tide: up the ledges, Sol jumps off Luna's head, then lets the steps out.
  await both((b) => b.path([[-1.5, 10], [-1.5, 17.6]]), (b) => b.path([[1.5, 10], [1.5, 17.6]]));
  await both((b) => hop(b, [-1.5, 2, 20.5], 'ledge 1'), (b) => hop(b, [1.5, 2, 20.5], 'ledge 1'));
  await both((b) => hop(b, [-1.5, 4, 23.2], 'ledge 2'), (b) => hop(b, [M.boost[0], 4, M.boost[2]], 'ledge 2'));
  await luna.go(M.boost[0], M.boost[2], { r: 0.2, stop: true });
  await sol.go(0, 22.6, { r: 0.3, stop: true });
  await sol.jump({ to: [M.boost[0], 5.55, M.boost[2]] });
  await at(sol, 5.3, "Luna's head");
  await hop(sol, [0, 9, 26.6], 'the top');
  await sol.go(-2.5, 28, { r: 0.3, stop: true });
  await sol.pound();
  await luna.waitAct(L.acts[0].id, 4000);
  await luna.wait(400);
  await luna.go(3.4, 23.0, { r: 0.3 });
  await hop(luna, [3.6, 5.7, 24.2], 'step 1', { double: false });
  await hop(luna, [1.0, 7.4, 24.2], 'step 2', { double: false });
  await hop(luna, [1.0, 9, 26.6], 'the top');
  await shot('tide');
  await both((b) => b.go(-1, 31), (b) => b.go(1, 31));

  // 2. The flooded hall: Sol takes the left valve, Luna the right.
  const dial = (id) => L.dials.find((d) => d.id === id);
  const valves = L.combos[0];
  await sol.go(-0.4, 32.6, { r: 0.3, stop: true });
  await hop(sol, [-0.4, 11.2, 36], 'pillar 1');
  await hop(sol, [-3, 11.2, 40], 'the left pillar');
  await hop(sol, [M.valveL[0], 11.2, M.valveL[2]], 'the left valve');
  await luna.go(0.4, 32.6, { r: 0.3, stop: true });
  await hop(luna, [0.4, 11.2, 36], 'pillar 1');
  await hop(luna, [3, 11.2, 40], 'the right pillar');
  await hop(luna, [M.valveR[0], 11.2, M.valveR[2]], 'the right valve');
  await both((b) => b.setDial(dial(valves.dials[0]), 1), (b) => b.setDial(dial(valves.dials[1]), 1));
  await sol.waitSig(valves.id, 4000);
  await sol.wait(1200);
  await both((b) => b.path([[-4, 50], [-1, 57], [-1, 61.5]]), (b) => b.path([[4, 50], [1, 57], [1, 61.5]]));
  await shot('drained');

  // 3. The water lift: Luna on the raft, Sol up the stairs to the valve.
  await luna.path([[4.6, 63.5], [4.6, 76.5], [2.5, 77.4]], { r: 0.4 });
  await hop(luna, [M.raft3[0], M.raft3[1], M.raft3[2]], 'the raft', { double: false });
  await sol.go(2.0, 64.6, { r: 0.3, stop: true });
  const stairs = [[2.0, 10.85, 66.5], [-0.5, 12.7, 66.5], [-3.0, 14.55, 66.5], [-5.0, 16.4, 67.9], [-2.6, 18.25, 69.3], [M.pillar3[0], 20, M.pillar3[2]]];
  for (const [i, s] of stairs.entries()) await hop(sol, s, `stair ${i + 1}`);
  await sol.go(M.pillar3[0], M.pillar3[2], { r: 0.3, stop: true });
  await sol.pound();
  await luna.until((g) => g.player.pos.y > 19.2, null, 30000);
  await hop(luna, [2.5, 20, 83.6], 'the exit ledge', { double: false });
  await luna.go(2.4, 85, { r: 0.3, stop: true });
  await luna.pound();
  await sol.waitAct(L.acts.find((a) => a.style === 'bridge').id, 5000);
  await sol.wait(1500);
  await sol.path([[-4.6, 75], [-4.6, 81], [-2, 85]], { r: 0.5 });
  await shot('lift');

  // 4. The swell: hop the rafts as they rise, both stand on the islands, then on.
  const bobs = (x) => L.movers.filter((m) => m.motion.type === 'linear' && m.motion.a[1] === 17.9 && m.motion.a[0] === x).sort((a, b) => a.motion.a[2] - b.motion.a[2]);
  const rising = (bot, m) => bot.until((g, b, a) => {
    const ph = (((g.world.time / a.P + a.ph) % 1) + 1) % 1;
    return ph > 0.2 && ph < 0.36;
  }, { P: m.motion.period, ph: m.motion.phase }, 12000);
  const ride = async (bot, x, from, to) => {
    for (const m of bobs(x).slice(from, to)) {
      await rising(bot, m);
      await bot.jump({ to: [x, 20, m.motion.a[2]], double: true });
      const p = await bot.pos();
      if (p[1] < 19.2 || Math.abs(p[2] - m.motion.a[2]) > 1.4) throw new Error(`${bot.name} missed a raft at z ${m.motion.a[2]}: ${p.map((v) => v.toFixed(1))}`);
    }
  };
  await both((b) => b.go(-3, 89.4, { r: 0.3, stop: true }), (b) => b.go(3, 89.4, { r: 0.3, stop: true }));
  // Never wait on a raft: each of you goes straight on to the next solid spot.
  const lane = (x) => async (b) => {
    await ride(b, x, 0, 2);
    await hop(b, [x, 20.2, 102.4], 'the island');
    await b.go(x, 102.4, { r: 0.3, stop: true });
  };
  await both(lane(-3), lane(3));
  const gates = L.acts.filter((a) => a.style === 'door' && a.y > 20);
  for (const gt of gates) await sol.waitAct(gt.id, 5000);
  await sol.wait(600);
  const lane2 = (x) => async (b) => {
    await b.go(x, 104.1, { r: 0.3, stop: true });
    await ride(b, x, 2, 4);
    await hop(b, [x, 20, 118], 'the far ledge');
  };
  await both(lane2(-3), lane2(3));
  await shot('swell');

  // 5. Two pools: Luna on her raft, Sol's valve fills her pool; then turn about.
  await luna.path([[3.5, 122], [3.5, 133]], { r: 0.4 });
  await hop(luna, [M.raftL[0], M.raftL[1], M.raftL[2]], 'her raft', { double: false });
  await sol.path([[-3.5, 122], [-3.5, 128]], { r: 0.3 });
  await sol.go(-3.5, 128, { r: 0.25, stop: true });
  await sol.pound();
  await sol.go(-3.5, 133, { r: 0.4 });
  await hop(sol, [M.raftS[0], M.raftS[1], M.raftS[2]], 'his raft', { double: false });
  await luna.until((g) => g.player.pos.y > 26.1, null, 20000);
  await luna.go(3.5, 137.6, { r: 0.25, stop: true });
  await luna.pound();
  await luna.go(3.5, 135, { r: 0.3 });
  await sol.until((g) => g.player.pos.y > 26.1, null, 20000);
  await sol.go(-3.5, 137.6, { r: 0.25, stop: true });
  await sol.pound();
  await sol.go(-3.5, 135, { r: 0.3 });
  await luna.until((g) => g.player.pos.y > 32.1, null, 25000);
  await luna.go(3.5, 140.4, { r: 0.25, stop: true });
  await luna.pound();
  await sol.until((g) => g.player.pos.y > 32.1, null, 25000);
  await shot('pools');
  await both((b) => b.path([[-3.5, 139.5], [-1.5, 147.5]]), (b) => b.path([[3.5, 141.5], [1.5, 147.5]]));
}
