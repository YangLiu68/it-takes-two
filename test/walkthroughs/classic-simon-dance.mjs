// Level 29 Memory Dance: the bots read the order from the level (that's the partner
// calling it out) and pound the buttons in it.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const sw = (id) => L.switches.find((w) => w.id === id);
  const [q1, qS, qL, q3, q4, q5] = L.seqs;
  const at = async (bot, y, what) => {
    const p = await bot.pos();
    if (p[1] < y - 0.6) throw new Error(`${bot.name} missed ${what}: at ${p.map((v) => v.toFixed(1)).join(',')}`);
  };
  const hop = async (bot, to, what, o = {}) => {
    await bot.jump({ to, double: true, ...o });
    await at(bot, to[1], what);
  };
  // Count presses per sequence (from the server's replies), so a pound that
  // missed its button is simply tried again.
  for (const b of [sol, luna]) {
    await b.page.evaluate(() => {
      if (window.__seqN) return;
      window.__seqN = {};
      window.__itt.app.net.on('fx', (m) => {
        if (m.kind === 'seq') window.__seqN[m.id] = m.n;
      });
    });
  }
  const seqOf = (id) => L.seqs.find((q) => q.ids.includes(id));
  const press = async (bot, id) => {
    const w = sw(id);
    const q = seqOf(id);
    for (let tries = 0; tries < 4; tries++) {
      const before = await bot.page.evaluate((qid) => window.__seqN[qid] ?? 0, q.id);
      await bot.go(w.x, w.z, { r: 0.3, stop: true });
      await bot.pound();
      const ok = await bot.until((g, b, a) => (window.__seqN[a.q] ?? 0) !== a.n, { q: q.id, n: before }, 1500).then(() => true, () => false);
      const after = await bot.page.evaluate((qid) => window.__seqN[qid] ?? 0, q.id);
      if (ok && after === before + 1) return;
      if (ok && after !== before + 1) throw new Error(`${bot.name}: wrong button in ${q.id} (step ${before + 1} → ${after})`);
    }
    throw new Error(`${bot.name}: couldn't press ${id}`);
  };

  // 1. Follow the lights.
  for (const id of q1.ids) await press(sol, id);
  await sol.waitSig(q1.id, 4000);
  await both((b) => b.path([[-1, 24], [-1, 28]]), (b) => b.path([[1, 24], [1, 28]]));

  // 2. Each reads the other's order off the wall.
  await both((b) => b.path([[-5, 30], [-5, 34]]), (b) => b.path([[5, 30], [5, 34]]));
  await both(async (b) => { for (const id of qS.ids) await press(b, id); }, async (b) => { for (const id of qL.ids) await press(b, id); });
  await sol.waitSig(qS.id, 4000);
  await luna.waitSig(qL.id, 4000);
  await sol.wait(800);
  await both((b) => b.path([[-5, 55], [-5, 59], [-3, 61]]), (b) => b.path([[5, 55], [5, 59], [3, 61]]));
  await shot('walls');

  // 3. Luna on the watch tower; Sol dances round the edge and times the bar.
  await luna.go(-8.6, 63, { r: 0.3, stop: true });
  await hop(luna, [-11.5, 1.5, 63], 'the tower step');
  await hop(luna, [-11.5, 3, 66.2], 'the watch tower');
  await luna.go(-11.5, 66.5, { r: 0.25, stop: true });
  const barId = L.movers.find((m) => m.motion.type === 'spin' && m.motion.center[2] === 73).id;
  // Wait until the bar has just swept past this point (so it's ~3 s away).
  const barPast = (bot, x, z) => bot.until((g, b, a) => {
    const m = g.world.movers.find((q) => q.def.id === a.id);
    const yaw = m.tf.yaw;
    const yp = Math.atan2(-(a.z - 73), a.x);
    const ahead = (((yp - yaw) % Math.PI) + Math.PI) % Math.PI;
    return ahead > 1.9 && ahead < 2.6;
  }, { id: barId, x, z }, 20000);
  // Corners are outside the bar's reach; go round the edge between them.
  const edge = { '-5.5,67.5': [-7.2, 65.4], '5.5,67.5': [7.2, 65.4], '-5.5,78.5': [-7.2, 80.4], '5.5,78.5': [7.2, 80.4] };
  let here = [0, 63];
  await sol.go(0, 64.8, { r: 0.3 });
  for (const id of q3.ids) {
    const w = sw(id);
    const key = `${w.x},${w.z}`;
    if (edge[key]) {
      const [ex, ez] = edge[key];
      // Along the outside of the floor.
      if (here[1] > 73 !== ez > 73) await sol.go(Math.sign(here[0] || ex) * 7.3, 73, { r: 0.5 });
      if (Math.sign(here[0]) !== Math.sign(ex) && here[0] !== 0) await sol.go(0, ez < 73 ? 65 : 81, { r: 0.6 });
      await sol.go(ex, ez, { r: 0.4 });
      await press(sol, id);
    } else {
      // The middle button: in, pound, out, between sweeps.
      await sol.go(0, 65, { r: 0.4 });
      await barPast(sol, w.x, w.z);
      await press(sol, id);
      await sol.go(0, 65, { r: 0.4 });
    }
    here = [w.x, w.z];
  }
  await sol.waitSig(q3.id, 4000);
  await sol.go(0, 81, { r: 0.6 });
  await sol.go(0, 85);
  await luna.go(-11.5, 65.4, { r: 0.3, stop: true });
  await hop(luna, [-11.5, 1.5, 63], 'the tower step', { double: false });
  await hop(luna, [-7.6, 0, 62.4], 'the floor');
  await luna.path([[-7.3, 65], [-7.3, 80.4], [-1.2, 81], [-1.2, 85]], { r: 0.6 });
  await shot('dance');

  // 4. The relay: whoever's button lights next, pounds.
  await both((b) => b.path([[-5, 88], [-5, 92]]), (b) => b.path([[5, 88], [5, 92]]));
  for (const id of q4.ids) await press(sw(id).x < 0 ? sol : luna, id);
  await sol.waitSig(q4.id, 4000);
  await sol.wait(800);
  await both((b) => b.path([[-5, 111], [-5, 114]]), (b) => b.path([[5, 111], [5, 114]]));

  // 5. Both up their stands to watch their half, then down to the islands.
  await both(async (b) => {
    await b.go(-6.8, 117, { r: 0.3, stop: true });
    await hop(b, [-8, 1.2, 117], 'the stand step');
    await hop(b, [-10.6, 2.5, 117.5], 'the stand');
    await b.go(-11, 117.5, { r: 0.25, stop: true });
    await b.wait(2500);
    await b.go(-9.4, 117.5, { r: 0.4 });
    await b.jump({ to: [-6, 0, 117.5] });
  }, async (b) => {
    await b.go(6.8, 117, { r: 0.3, stop: true });
    await hop(b, [8, 1.2, 117], 'the stand step');
    await hop(b, [10.6, 2.5, 117.5], 'the stand');
    await b.go(11, 117.5, { r: 0.25, stop: true });
    await b.wait(2500);
    await b.go(9.4, 117.5, { r: 0.4 });
    await b.jump({ to: [6, 0, 117.5] });
  });
  const isl = q5.ids.map((id) => sw(id));
  let on = null;
  const goIsland = async (bot, w) => {
    if (on === `${bot.name}${w.x},${w.z}`) return;
    const p = await bot.pos();
    if (p[2] < 121) await bot.go(w.x === 0 ? 0 : Math.sign(w.x) * 1.5, 119.4, { r: 0.3, stop: true });
    await hop(bot, [w.x, 0, w.z], 'an island');
    on = `${bot.name}${w.x},${w.z}`;
  };
  for (let k = 0; k < 8; k++) {
    const bot = k < 4 ? sol : luna;
    if (k === 4) {
      // Sol hops back to the edge, out of Luna's way; Luna takes over.
      const p = await sol.pos();
      await hop(sol, [p[0] < -1 ? -5 : p[0] > 1 ? 5 : -3, 0, 118.6], 'the edge');
      on = null;
    }
    await goIsland(bot, isl[k]);
    await press(bot, q5.ids[k]);
  }
  await sol.waitSig(q5.id, 4000);
  await shot('finale');
  await sol.wait(1500);
  // Everyone onto the last island and over the bridge.
  for (const b of [luna, sol]) {
    const p = await b.pos();
    if (p[2] < 121) {
      await b.go(p[0] < -1 ? -1.2 : 1.2, 119.4, { r: 0.3, stop: true });
      await hop(b, [0, 0, 124], 'the first island');
    }
    const q = await b.pos();
    if (Math.hypot(q[0], q[2] - 132) > 1.4) await hop(b, [0, 0, 132], 'the last island');
    await b.path([[0, 136], [b === sol ? -1.5 : 1.5, 152]], { r: 0.6 });
  }
}
