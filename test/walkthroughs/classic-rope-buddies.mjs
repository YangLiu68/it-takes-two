// Level 25 Rope Buddies: stones one at a time, gaps jumped together, hauling each other
// up cliffs, dragging each other up reverse belts, the seesaw tower.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const y = async (bot) => (await bot.pos())[1];
  const above = (bot, h, ms = 8000) => bot.until((g, b, a) => g.player.pos.y > a && g.player.grounded, h, ms);
  // Haul: keep walking away until your partner is up (stop and the rope drags you back).
  const haul = (bot, x, z, y) => bot.go(x, z, { r: 0.2, hold: true, timeout: 12000, doneIf: ((g, b, a) => g.remote.pos.y > a && g.remote.grounded).toString(), arg: y - 0.3 });

  // 1. Stepping stones: leapfrog, never more than one stone apart.
  const stones = [[0, 12.5], [2.6, 17], [-1, 21.5], [2.2, 26], [-1.6, 30.5], [1, 35], [0, 41]];
  let [ax, az] = [0, 8];
  await both((b) => b.go(-0.8, 7.8), (b) => b.go(0.8, 7.8));
  for (const [i, [x, z]] of stones.entries()) {
    for (const b of [sol, luna]) {
      const off = b === sol ? -0.6 : 0.6;
      await b.jump({ to: [x + off, 0, z], double: true });
      const p = await b.pos();
      if (p[1] < -0.5) throw new Error(`${b.name} missed stone ${i + 1}`);
      await b.go(x + off, z - 0.2, { r: 0.4 });
    }
    [ax, az] = [x, z];
  }
  await shot('stones');

  // 2. Gaps longer than the rope: run and jump at the same moment.
  const together = async (from, toZ, toY, opts) => {
    await both((b) => b.go(-1.2, from - 2.5, { r: 0.3, stop: true }), (b) => b.go(1.2, from - 2.5, { r: 0.3, stop: true }));
    await both((b) => b.jump({ at: [-1.2, from], to: [-1.2, toY, toZ], double: true, ...opts }),
      (b) => b.jump({ at: [1.2, from], to: [1.2, toY, toZ], double: true, ...opts }));
    for (const b of [sol, luna]) if ((await y(b)) < toY - 0.5) throw new Error(`${b.name} fell short of z ${toZ}`);
  };
  await together(M.gap1[2], 57.5, 0, {});
  await together(M.gap2[2], 70.5, 1.2, { dash: true });
  await together(M.gap3[2], 85.5, 1.2, { dash: true });
  await shot('gaps');

  // 3. Cliffs: Sol pads up, walks off and hauls Luna; then Luna pads up and hauls Sol.
  await luna.go(-0.4, 91.9, { r: 0.3 });
  await sol.go(M.pad1[0], M.pad1[2] - 0.3, { r: 0.25, stop: true });
  await sol.magnet(300, { to: [-2.5, 8.2, 95] });
  await sol.go(-2.5, 95, { r: 0.6, timeout: 6000 });
  await above(sol, 7.5, 3000);
  await haul(sol, -2.5, 102, 8.2);
  await above(luna, 7.5, 4000);
  await shot('haul1');
  await luna.go(M.pad2[0], M.pad2[2] - 0.3, { r: 0.25, stop: true });
  await sol.go(0.4, 101.9, { r: 0.3 });
  await luna.magnet(300, { to: [2.5, 14.6, 105] });
  await luna.go(2.5, 105, { r: 0.6, timeout: 6000 });
  await above(luna, 14, 3000);
  await haul(luna, 2.5, 113.5, 14.6);
  await above(sol, 14, 4000);
  await both((b) => b.go(-1.5, 112.5), (b) => b.go(1.5, 112.8));

  // 4. Reverse belts: Sol walks his solid lane and drags Luna up hers (and keeps
  // pulling until she's off it); then the other way round.
  await both((b) => b.go(M.laneS[0], 114.8, { r: 0.4 }), (b) => b.go(M.laneL[0], 114.8, { r: 0.4 }));
  await luna.go(M.laneL[0], 116.8, { r: 0.4, timeout: 3000 }).catch(() => {});
  // Keep pulling until the partner is off the belt (stop early and it drags you both back).
  const drag = (bot, x, z, offZ) => bot.go(x, z, { r: 0.2, hold: true, timeout: 25000, doneIf: ((g, b, a) => g.remote.pos.z > a && g.remote.grounded).toString(), arg: offZ });
  await sol.go(M.laneS[0], 129.5, { r: 0.6, timeout: 20000 });
  await drag(sol, -1.5, 136.8, 131.1);
  await luna.go(1.5, 135.6, { r: 0.4 });
  await shot('belt1');
  await sol.go(-1.5, 136.4, { r: 0.4 });
  await sol.go(M.laneS[0], 138, { r: 0.4, timeout: 3000 }).catch(() => {});
  await luna.go(1.5, 149.5, { r: 0.6, timeout: 20000 });
  await drag(luna, 1.5, 166, 151.1);
  await both((b) => b.go(-1.5, 154), (b) => b.go(1.5, 154.5));

  // 5. The tower: Luna on the seesaw, Sol pounds; she hauls him up; one last jump together.
  const saw = M.saw;
  await luna.go(saw[0] - 3.4, saw[2], { r: 0.3, stop: true });
  await sol.go(saw[0] + 3.4, saw[2], { r: 0.3, stop: true });
  await sol.pound();
  await luna.go(-2.5, 166, { r: 0.6, timeout: 6000 });
  await above(luna, 25, 3000);
  await shot('tower', luna.page);
  await sol.go(0, 162.4, { r: 0.3 });
  await haul(luna, 0, 178.5, 25.6);
  await above(sol, 25, 4000);
  const edge = M.towerEdge;
  await both((b) => b.go(-1.2, edge[2] - 3, { r: 0.3, stop: true }), (b) => b.go(1.2, edge[2] - 3, { r: 0.3, stop: true }));
  await both((b) => b.jump({ at: [-1.2, edge[2]], to: [-1.2, edge[1], 191.5], double: true, dash: true }),
    (b) => b.jump({ at: [1.2, edge[2]], to: [1.2, edge[1], 191.5], double: true, dash: true }));
  await both((b) => b.go(-1.2, 193.5), (b) => b.go(1.2, 193.5));
}
