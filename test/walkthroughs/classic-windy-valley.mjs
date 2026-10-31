// Level 8 · Windy Valley: climb the updrafts; power the fan for each other; hop the wind
// columns; switch red/blue fans for the one crossing; open the shaft hatches.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const y = (bot) => bot.pos().then((p) => p[1]);
  const riseTo = (bot, h, timeout = 12000) => bot.until((g, b, a) => g.player.pos.y > a, h, timeout);
  // Ride an updraft to the top of its bob before stepping off.
  const peak = (bot, top, timeout = 12000) => bot.until((g, b, a) => g.player.pos.y > a && g.player.vel.y < 2.5, top, timeout);
  // Steer into the middle of an updraft and hold still there while it lifts you.
  const hold = (bot, x, z) => bot.go(x, z, { r: 0.4, stop: true, timeout: 8000 });

  // 1. Climb the wind (one at a time).
  for (const bot of [sol, luna]) {
    await bot.go(0, 3, { r: 0.6 });
    await hold(bot, M.fan1[0], M.fan1[2]);
    await riseTo(bot, 8.6);
    await bot.go(0, 12, { r: 0.8 });
    await hold(bot, M.fan2[0], M.fan2[2]);
    await riseTo(bot, 15.2);
    await bot.go(bot === sol ? -2 : 2, 22, { r: 0.8 });
  }
  await shot('climb');

  // 2. Sol powers the fan for Luna; Luna powers it back from the cliff.
  await sol.go(M.PA[0], M.PA[2], { r: 0.3, stop: true });
  await hold(luna, M.fanA[0], M.fanA[2]);
  await riseTo(luna, 27.4);
  await luna.go(M.PB[0], M.PB[2], { r: 0.3, stop: true });
  await hold(sol, M.fanA[0], M.fanA[2]);
  await riseTo(sol, 27.4);
  await sol.go(1, 37, { r: 0.8 });
  await luna.go(-1, 38, { r: 0.8 });
  await shot('cliff');

  // 3. Hop the columns across the gorge.
  const cols = [0, 1, 2, 3].map((i) => M[`col${i}`]);
  const hop = async (bot, list, from, land) => {
    await bot.go(from[0], from[1] - 3, { r: 0.6 });
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (i === 0) await bot.jump({ at: from, to: [c[0], c[1], c[2]], double: true, arrive: 1.3, timeout: 6000 });
      else await bot.jump({ to: [c[0], c[1], c[2]], double: true, arrive: 1.3, timeout: 6000 });
      await hold(bot, c[0], c[2]);
      await peak(bot, c[1] + 0.3, 8000);
    }
    await bot.jump({ to: land, double: true, timeout: 6000 });
  };
  await hop(luna, cols, [0, 43.2], [0, 27, 89]);
  await luna.go(2, 90, { r: 0.8 });
  await hop(sol, cols, [0, 43.2], [0, 27, 89]);
  await shot('columns');

  // 4. Sol works the red/blue switch while Luna hops; then Luna holds the plate.
  await sol.go(M.switch[0], M.switch[2], { r: 0.3, stop: true });
  const tog = [0, 1, 2, 3].map((i) => M[`tog${i}`]);
  await luna.go(0, 93, { r: 0.6 });
  await luna.jump({ at: [0, 95.6], to: tog[0], double: true, arrive: 1.3, timeout: 6000 });
  await hold(luna, tog[0][0], tog[0][2]);
  await peak(luna, tog[0][1] + 0.3);
  for (let i = 1; i < 4; i++) {
    const hopNext = luna.jump({ to: tog[i], double: true, arrive: 1.3, timeout: 6000 });
    await sol.pound();
    await hopNext;
    await hold(luna, tog[i][0], tog[i][2]);
    await peak(luna, tog[i][1] + 0.3);
  }
  await luna.jump({ to: [0, 27, 141], double: true, timeout: 6000 });
  await luna.go(M.far[0], M.far[2], { r: 0.3, stop: true });
  await shot('toggle', luna.page);
  await sol.go(0, 93, { r: 0.6 });
  await sol.jump({ at: [0, 95.6], to: tog[0], double: true, arrive: 1.3, timeout: 6000 });
  await hold(sol, tog[0][0], tog[0][2]);
  await peak(sol, tog[0][1] + 0.3);
  for (let i = 1; i < 4; i++) {
    await sol.jump({ to: tog[i], double: true, arrive: 1.3, timeout: 6000 });
    await hold(sol, tog[i][0], tog[i][2]);
    await peak(sol, tog[i][1] + 0.3);
  }
  await sol.jump({ to: [-1, 27, 141], double: true, timeout: 6000 });

  // 5. The hatch shaft: Luna floats up inside, Sol opens the hatches from the stairs.
  const s0 = M.shaft[1];
  await luna.go(0, 151, { r: 0.5 });
  await hold(luna, M.shaft[0], M.shaft[2]);
  await sol.go(3.2, 149.4, { r: 0.5 });
  const plateAt = { 3: 8, 8: 16, 13: 24 };
  for (let k = 0; k < 14; k++) {
    const st = M[`step${k}`];
    await sol.jump({ to: st, double: true, timeout: 6000 });
    if (plateAt[k]) {
      await sol.go(st[0], st[2], { r: 0.3, stop: true });
      await luna.until((g, b, h) => g.player.pos.y > h, s0 + plateAt[k] + 0.6, 12000);
    }
  }
  await riseTo(luna, s0 + 32.6);
  await luna.go(0, 161.5, { r: 0.8 });
  await luna.go(M.master[0], M.master[2], { r: 0.3, stop: true });
  await luna.pound();
  await shot('shaft-top', luna.page);
  // Sol drops off the stairs, walks into the shaft and rides it up.
  await sol.go(-7.2, 153, { r: 0.6 });
  await sol.until((g) => g.player.grounded && g.player.pos.y < 27.6, null, 6000);
  await sol.go(0, 151, { r: 0.5 });
  await hold(sol, M.shaft[0], M.shaft[2]);
  await riseTo(sol, s0 + 32.6);
  await sol.go(L.goal.x - 1.5, L.goal.z, { r: 0.8 });
  await luna.go(L.goal.x + 1.5, L.goal.z, { r: 0.8 });
  void y;
}
