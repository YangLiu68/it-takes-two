// Level 28 Map Maze: the guide stands on the eye plate (or reads the map) and the
// walker follows. The bots know the way from the level data — that's the
// partner talking them through.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const pts = (prefix) => Object.keys(M).filter((k) => k.startsWith(prefix)).sort((a, b) => Number(a.slice(prefix.length)) - Number(b.slice(prefix.length))).map((k) => M[k]);
  const at = async (bot, y, what) => {
    const p = await bot.pos();
    if (p[1] < y - 0.6) throw new Error(`${bot.name} missed ${what}: at ${p.map((v) => v.toFixed(1)).join(',')}`);
  };
  const hop = async (bot, to, what, o = {}) => {
    await bot.jump({ to, double: true, ...o });
    await at(bot, to[1], what);
  };
  const walk = async (bot, list, y, what) => {
    for (const p of list) await bot.go(p[0], p[2], { r: 0.45 });
    await at(bot, y, what);
  };

  // 1. Luna up the eye tower; Sol walks the invisible bridge.
  await luna.go(-4.6, 3.4, { r: 0.3, stop: true });
  await hop(luna, [-4.6, 2, 5.2], 'the tower step');
  await hop(luna, [-4.6, 4.2, 8.6], 'the eye tower');
  await luna.go(-4.6, 8.8, { r: 0.25, stop: true });
  await sol.go(0, 6, { r: 0.3 });
  await walk(sol, pts('s1_'), -0.2, 'the invisible bridge');
  await sol.go(0, 38.5);
  await sol.go(4, 39.5, { r: 0.3, stop: true });
  await sol.pound();
  await shot('bridge1');
  await luna.waitAct(L.acts[0].id, 4000);
  await luna.wait(1200);
  await luna.path([[-4.6, 6], [6, 5], [8.2, 7], [8.2, 37], [2, 41]]);

  // 2. Sol into his booth with the map; Luna walks the safe squares.
  await sol.path([[8.6, 43.6], [9.5, 46.2], [13, 47.5]], { r: 0.4 });
  const s2 = pts('s2_');
  await luna.go(s2[0][0], 44.4, { r: 0.3 });
  await walk(luna, s2, -0.2, 'the safe squares');
  await luna.go(s2[s2.length - 1][0], 61);
  await luna.go(-4, 62, { r: 0.3, stop: true });
  await luna.pound();
  await sol.waitAct(L.acts[1].id, 4000);
  await sol.wait(1200);
  await sol.path([[9.5, 47.5], [7.2, 47.5], [7.2, 59.5], [2, 64]]);
  await shot('map', sol.page);

  // 3. The maze: Luna to the balcony eye plate, Sol in for the key and out north.
  await luna.path([[-8, 66], [-13.5, 68.6], [-15, 69.2]], { r: 0.35 });
  await hop(luna, [-15, 2.2, 72.2], 'balcony step 1');
  await hop(luna, [-15, 4.4, 75.2], 'balcony step 2');
  await hop(luna, [-15, 6.4, 77.8], 'balcony step 3');
  await hop(luna, [-15, 7, 80], 'the balcony');
  await luna.go(-15, 81, { r: 0.25, stop: true });
  await sol.go(0, 69, { r: 0.4 });
  await walk(sol, pts('m_'), -0.2, 'the maze');
  await sol.waitUsed(L.items.find((i) => i.label === 'Maze key').id, 5000);
  const door = L.acts.find((a) => a.toast === 'The maze gate is open!');
  await sol.waitAct(door.id, 4000);
  await sol.wait(800);
  await sol.path([[0, 93], [4, 95]], { r: 0.4 });
  await sol.go(4, 95, { r: 0.25, stop: true });
  await sol.pound();
  await luna.waitAct(L.acts.find((a) => a.style === 'bridge' && a.parts[0].x === -15).id, 4000);
  await luna.wait(1500);
  await luna.path([[-15, 84.6], [-15, 93.4], [-15, 96.5], [-8, 97]], { r: 0.5 });
  await shot('maze', sol.page);

  // 4. Sol on the ground eye plate; Luna climbs the invisible staircase.
  await sol.go(-6, 97.5, { r: 0.25, stop: true });
  await luna.go(3.4, 99.3, { r: 0.3, stop: true });
  for (const [i, s] of pts('s4_').entries()) await hop(luna, s, `stair ${i + 1}`);
  await hop(luna, [0.2, 14, 105.2], 'the ledge');
  await sol.path([[2, 98], [M.lift[0], 98.6], [M.lift[0], M.lift[2]]], { r: 0.4 });
  await sol.go(M.lift[0], M.lift[2], { r: 0.3, stop: true });
  await luna.go(-4, 106, { r: 0.25, stop: true });
  await sol.until((g) => g.player.pos.y > 13.5, null, 10000);
  await sol.go(8.5, 104.6, { r: 0.4 });
  await sol.go(3, 107, { r: 0.4 });
  await shot('stairs', luna.page);

  // 5. The relay: Luna eye plate to eye plate, Sol section by section.
  await luna.go(-6.2, 110, { r: 0.3, stop: true });
  await hop(luna, [-9, 15.6, 110], 'the step');
  await hop(luna, [-9, 17, M.g5_0[2] - 1.5], 'the first lookout');
  for (let k = 0; k < 3; k++) {
    await luna.go(M[`g5_${k}`][0], M[`g5_${k}`][2], { r: 0.25, stop: true });
    if (k === 0) await sol.go(0, 111.4, { r: 0.4 });
    await walk(sol, pts(`s5_${k}_`), 13.8, `section ${k + 1}`);
    await sol.go(0, M[`i5_${k}`][2], { r: 0.4 });
    await sol.go(1.2, M[`i5_${k}`][2], { r: 0.25, stop: true });
    await sol.pound();
    await sol.wait(1400);
    if (k < 2) await luna.path([[-9, M[`g5_${k}`][2] + 3], [-9, M[`g5_${k + 1}`][2] - 2]], { r: 0.5 });
  }
  await luna.path([[-9, 152], [-9, 160], [-9, 163]], { r: 0.5 });
  await both((b) => b.go(-4.4, 167), (b) => b.go(-1.6, 167));
}
