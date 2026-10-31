// First Steps: jumps, double jump, dash, switches (one, then two together), standing
// on your partner's head, two plates at once.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  // Hop along a list of [x, top, z] blocks.
  const hops = async (bot, list, o = {}) => {
    for (const p of list) await bot.jump({ to: p, ...o });
  };

  // Stage 1: walk and jump.
  for (const [bot, dx] of [[sol, 0], [luna, 0.6]]) {
    await bot.go(dx, 4.4, { r: 0.3 });
    await hops(bot, [[dx, 1, 8], [dx, 2, 13.5], [2 + dx * 0.5, 2, 19], [dx, 2, 24.5]]);
  }
  await shot('stage2');
  // Stage 2: double jump up the wall and over the gap.
  await both((b) => b.go(-1.5, 30.4, { r: 0.3 }), (b) => b.go(1.5, 30.4, { r: 0.3 }));
  await both((b) => b.jump({ to: [-1.5, 5.6, 33], double: true }), (b) => b.jump({ to: [1.5, 5.6, 33], double: true }));
  await both((b) => b.go(-1.5, 37.5, { r: 0.25 }), (b) => b.go(1.5, 37.5, { r: 0.25 }));
  await both((b) => b.jump({ to: [-1.5, 5.6, 47], double: true }), (b) => b.jump({ to: [1.5, 5.6, 47], double: true }));
  // Stage 3: jump, double jump, dash.
  // Fell short onto the net? Climb the stairs and try again, like anyone would.
  const dashOver = async (bot, x) => {
    for (let k = 0; k < 3; k++) {
      await bot.go(x, 53.05, { r: 0.2, stop: true });
      await bot.jump({ to: [x, 5, 67], double: true, dash: true });
      const [, y] = await bot.pos();
      if (y > 4) return;
      await bot.path([[-4, 62.5], [-8, 63.6]], { r: 0.4 });
      for (const [z, top] of [[61, 0.1], [58.6, 1.7], [56.2, 3.3], [53.8, 4.9]]) await bot.jump({ to: [-8, top, z] });
      await bot.jump({ to: [-4.5, 5.6, 51.5] });
    }
    throw new Error(`${bot.name}: never made the dash jump`);
  };
  await dashOver(sol, -1.5);
  await dashOver(luna, 1.5);
  await shot('dash');
  // Stage 4: one switch, then two at once.
  await sol.go(M.sw1[0], M.sw1[2], { r: 0.3, stop: true });
  await sol.pound();
  await sol.waitAct(L.acts.find((a) => a.style === 'bridge').id, 5000);
  await sol.wait(1500); // let the planks finish rising
  await both((b) => b.path([[-0.8, 74], [-0.8, 88], [M.swA[0], M.swA[2]]], { r: 0.3 }), (b) => b.path([[0.8, 74], [0.8, 88], [M.swB[0], M.swB[2]]], { r: 0.3 }));
  await both((b) => b.go(M.swA[0], M.swA[2], { r: 0.25, stop: true }), (b) => b.go(M.swB[0], M.swB[2], { r: 0.25, stop: true }));
  const bridge2 = L.acts.filter((a) => a.style === 'bridge')[1];
  for (let k = 0; k < 4 && !(await sol.page.evaluate((id) => window.__itt.game.world.state.act[id] === 1, bridge2.id)); k++) {
    await both((b) => b.pound(), (b) => b.pound());
    await sol.wait(300);
  }
  await sol.waitAct(bridge2.id, 4000);
  await sol.wait(1500);
  await both((b) => b.path([[-0.8, 98], [-0.8, 112], [-1.5, 116]], { r: 0.4 }), (b) => b.path([[0.8, 98], [0.8, 112], [M.s5base[0], 117]], { r: 0.4 }));
  await shot('wall');
  // Stage 5: Luna stands at the wall, Sol climbs onto her head and up.
  await luna.go(M.s5base[0], M.s5base[2], { r: 0.2, stop: true });
  await sol.go(M.s5base[0], 117.4, { r: 0.25, stop: true });
  await sol.jump({ to: [M.s5base[0], 6.6, M.s5base[2]] });
  await sol.jump({ to: [M.s5top[0], 10, M.s5top[2]], double: true });
  await sol.go(M.s5sw[0], M.s5sw[2], { r: 0.3, stop: true });
  await sol.pound();
  const steps = L.acts.find((a) => a.style === 'steps');
  await luna.waitAct(steps.id, 5000);
  await luna.wait(1200);
  await luna.go(2.0, 117.8, { r: 0.25, stop: true });
  for (const p of steps.parts) await luna.jump({ to: [p.x + p.move[0], p.y + p.sy / 2, p.z + p.move[2]] });
  await luna.jump({ to: [4.4, 10, 122.8] });
  // Stage 6: both plates, then the goal.
  await both((b) => b.path([[0, 128], [M.pA[0], M.pA[2]]], { r: 0.3 }), (b) => b.path([[1, 128], [M.pB[0], M.pB[2]]], { r: 0.3 }));
  await both((b) => b.go(M.pA[0], M.pA[2], { r: 0.25, stop: true }), (b) => b.go(M.pB[0], M.pB[2], { r: 0.25, stop: true }));
  await sol.waitAct(L.acts.find((a) => a.style === 'door').id, 5000);
  await shot('gate');
  await both((b) => b.path([[-0.8, 140], [-1.2, 148]]), (b) => b.path([[0.8, 140], [1.2, 148]]));
}
