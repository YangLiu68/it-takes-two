// Level 30 Grand Finale: ice + swap bridges, the moon seesaw and the lift, the lava
// tower with pads and the rope, portals against the clock, lights + drums,
// and the last two-plate gate.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const at = async (bot, y, what) => {
    const p = await bot.pos();
    if (p[1] < y - 0.6) throw new Error(`${bot.name} missed ${what}: at ${p.map((v) => v.toFixed(1)).join(',')}`);
  };
  const above = (bot, h, ms = 8000) => bot.until((g, b, a) => g.player.pos.y > a && g.player.grounded, h, ms);
  const partnerPast = (bot, z) => bot.until((g, b, a) => g.remote.pos.z > a, z, 20000);
  // Haul: keep walking away (into the wall behind you) until your partner is up.
  const haul = (bot, x, z, y) => bot.go(x, z, { r: 0.2, hold: true, timeout: 12000, doneIf: ((g, b, a) => g.remote.pos.y > a && g.remote.grounded).toString(), arg: y - 0.3 });
  const [d1, d2] = L.dials;

  // 1. Ice + swap bridges: Luna switches the bridges for Sol, then Sol for Luna.
  await luna.go(d1.x, d1.z, { r: 0.3, stop: true });
  const slide = (b) => b.path([[0, 8], [0, 30], [0, 52], [0, 58.6]], { r: 1.2, timeout: 20000 });
  const switcher = async (b, dial) => {
    await b.go(dial.x, dial.z, { r: 0.3, stop: true });
    await partnerPast(b, 23.4);
    await b.pound();
    await partnerPast(b, 36.4);
    await b.pound();
  };
  await sol.go(0, 6.4, { r: 0.3, stop: true });
  await Promise.all([slide(sol), switcher(luna, d1)]);
  await at(sol, -0.2, 'the far side');
  await sol.go(1, 59.5, { r: 0.5 });
  await luna.go(0, 6.4, { r: 0.3, stop: true });
  await Promise.all([slide(luna), switcher(sol, d2)]);
  await at(luna, -0.2, 'the far side');
  await shot('ice');

  // 2. The moon seesaw: Luna flies up to the sky island; Sol rides the lift up.
  await both((b) => b.go(-1.2, 64.5), (b) => b.go(1.2, 64.5));
  await luna.go(M.saw[0] - 3.4, M.saw[2], { r: 0.3, stop: true });
  await sol.go(M.saw[0] + 3.4, M.saw[2], { r: 0.3, stop: true });
  await sol.pound();
  await luna.go(-1, 85.5, { r: 0.8, timeout: 9000 });
  await above(luna, 17.5, 6000);
  await sol.go(1.2, 75.6, { r: 0.3, stop: true });
  await sol.jump({ to: [M.lift[0], 0, M.lift[2]] });
  await sol.go(M.lift[0], M.lift[2], { r: 0.3, stop: true });
  const plate = L.plates[0];
  await luna.go(plate.x, plate.z, { r: 0.25, stop: true });
  await sol.until((g) => g.player.pos.y > 17.5, null, 8000);
  await sol.go(-1.5, 84.5, { r: 0.4 });
  await shot('sky', luna.page);

  // 3. The lava tower: pad up, haul, swap, again.
  await both((b) => b.go(-0.8, 92.6), (b) => b.go(0.8, 92.6));
  await luna.go(-0.4, 97.6, { r: 0.3 });
  await sol.go(M.pad1[0], M.pad1[2] - 0.3, { r: 0.25, stop: true });
  await sol.magnet(300, { to: [-2.5, 25, 100.5] });
  await sol.go(-2.5, 100.5, { r: 0.6, timeout: 6000 });
  await above(sol, 24.5, 3000);
  await haul(sol, -2.5, 106, 25);
  await above(luna, 24.5, 4000);
  await luna.go(M.pad2[0], M.pad2[2] - 0.3, { r: 0.25, stop: true });
  await sol.go(1.0, 103.4, { r: 0.3 });
  await luna.magnet(300, { to: [2.5, 32, 106.5] });
  await luna.go(2.5, 106.5, { r: 0.6, timeout: 6000 });
  await above(luna, 31.5, 3000);
  await haul(luna, 2.5, 112, 32);
  await above(sol, 31.5, 4000);
  await sol.go(M.pad3[0], M.pad3[2] - 0.3, { r: 0.25, stop: true });
  await luna.go(-1.0, 109.4, { r: 0.3 });
  await sol.magnet(300, { to: [-2.5, 39, 112.5] });
  await sol.go(-2.5, 112.5, { r: 0.6, timeout: 6000 });
  await above(sol, 38.5, 3000);
  await haul(sol, -2.5, 119, 39);
  await above(luna, 38.5, 4000);
  await both((b) => b.go(-1.5, 116.5), (b) => b.go(1.5, 116.5));
  await shot('tower');

  // 4. Portals against the clock: Luna starts the clock, Sol runs A then B.
  const pa = M.portalA, pb = M.portalB;
  const timer = L.switches.find((w) => w.duration === 10 && w.z < 130);
  const timer2 = L.switches.find((w) => w.duration === 10 && w.z > 160);
  const door = L.acts.find((a) => a.style === 'door' && a.z === 160);
  const runPortals = async (b) => {
    await b.go(pa[0], 133.9, { r: 0.4, timeout: 6000 });
    const p1 = await b.pos();
    if (p1[2] < 138) throw new Error(`${b.name} didn't go through portal A`);
    await b.go(pb[0], 148.9, { r: 0.4, timeout: 6000 });
    const p2 = await b.pos();
    if (p2[2] < 153) throw new Error(`${b.name} didn't go through portal B`);
    await b.waitAct(door.id, 6000);
    await b.path([[0, 159], [0, 163]], { r: 0.5, timeout: 8000 });
  };
  await sol.go(pa[0], 131.6, { r: 0.3, stop: true });
  await luna.go(timer.x, timer.z, { r: 0.3, stop: true });
  await luna.pound();
  await runPortals(sol);
  await sol.go(timer2.x, timer2.z, { r: 0.3, stop: true });
  await luna.go(pa[0], 131.6, { r: 0.3, stop: true });
  await sol.pound();
  await runPortals(luna);
  await shot('portals');

  // 5. Lights + drums: Luna watches, Sol bounces up the pillars in order.
  const watch = L.plates.find((p) => p.z === 172);
  await luna.go(watch.x, watch.z, { r: 0.25, stop: true });
  for (const b of [sol, luna]) {
    await b.page.evaluate(() => {
      if (window.__seqN) return;
      window.__seqN = {};
      window.__itt.app.net.on('fx', (m) => {
        if (m.kind === 'seq') window.__seqN[m.id] = m.n;
      });
    });
  }
  const q = L.seqs[0];
  for (const id of q.ids) {
    const w = L.switches.find((s) => s.id === id);
    for (let tries = 0; ; tries++) {
      if (tries > 3) throw new Error(`Sol couldn't press the button on the pillar at ${w.x},${w.z}`);
      const before = await sol.page.evaluate((qid) => window.__seqN[qid] ?? 0, q.id);
      await sol.go(w.x, w.z - 5, { r: 0.4, stop: true });
      await sol.jump({ to: [w.x, 39.5, w.z - 2.8], doneIf: ((g) => g.player.vel.y > 12).toString(), timeout: 4000 });
      await sol.go(w.x, w.z, { r: 0.35, timeout: 4000 });
      await at(sol, 43.4, 'the pillar top');
      await sol.go(w.x, w.z, { r: 0.25, stop: true });
      await sol.pound();
      const ok = await sol.until((g, b, a) => (window.__seqN[a.q] ?? 0) !== a.n, { q: q.id, n: before }, 1500).then(() => true, () => false);
      const after = await sol.page.evaluate((qid) => window.__seqN[qid] ?? 0, q.id);
      await sol.go(w.x, w.z - 4.8, { r: 0.5 });
      if (ok && after === before + 1) break;
      if (ok) throw new Error(`wrong pillar (step ${before + 1} → ${after})`);
    }
  }
  await sol.waitSig(q.id, 4000);
  await shot('drums');

  // 6. The last gate: both plates at once.
  const [p6a, p6b] = L.plates.filter((p) => p.z === 198);
  await sol.wait(800);
  await both((b) => b.path([[-0.8, 190.5], [-0.8, 194], [p6a.x, p6a.z]], { r: 0.3 }), (b) => b.path([[0.8, 190.5], [0.8, 194], [p6b.x, p6b.z]], { r: 0.3 }));
  await both((b) => b.go(p6a.x, p6a.z, { r: 0.25, stop: true }), (b) => b.go(p6b.x, p6b.z, { r: 0.25, stop: true }));
  const last = L.acts.find((a) => a.toast === 'You did it together!');
  await sol.waitAct(last.id, 4000);
  await sol.wait(800);
  await both((b) => b.path([[-1.4, 203], [-1.4, 208.5]]), (b) => b.path([[1.4, 203], [1.4, 208.5]]));
}
