// Level 17 Ice Slide: the ice path, thin ice into the wall, the sliding maze, curling into the corners.
import { stand, poundAt, slide } from './ch3-lib.mjs';

export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const c = (i, j) => M[`c${i}${j}`];

  // 1. The ice path, slowly, turning early.
  for (const bot of [sol, luna]) {
    const dx = bot === sol ? -0.4 : 0.4;
    await bot.go(dx, 3.5, { r: 0.4 });
    for (const [x, z] of [[dx, 13.6], [8.6, 15.5], [9 + dx, 27.8], [-2.6, 28.6], [-3 + dx, 41]]) {
      await bot.go(x, z, { r: 0.9, speed: 0.42, timeout: 20000 });
    }
    await bot.go(-3 + dx * 4, 43, { r: 0.5 });
  }
  await shot('s1');

  // 2. Luna raises the wall; Sol races over the thin ice into it.
  await stand(luna, M.hold[0], M.hold[2]);
  await sol.go(-3, 47.2, { r: 0.3 });
  await slide(sol, -3, 95);
  await poundAt(sol, M.sw2[0], M.sw2[2]);
  await luna.path([[-4, 46.5], [2.5, 47.4], [2.5, 80.6], [0.65, 84], [0.65, 88.6], [0.6, 90.5]], { r: 0.5 });
  await sol.go(-0.8, 90.5, { r: 0.5 });
  await shot('s2');

  // 3. The sliding maze: Luna takes the short way to B, Sol the long way to A.
  await luna.go(c(2, 0)[0] + 0.6, c(2, 0)[2], { r: 0.4 });
  await slide(luna, 30, c(2, 0)[2]);
  await slide(luna, (await luna.pos())[0], 130);
  await stand(luna, c(4, 2)[0], c(4, 2)[2]);
  await sol.go(c(2, 0)[0], c(2, 0)[2], { r: 0.4 });
  await slide(sol, c(2, 0)[0], 130);
  await slide(sol, -30, (await sol.pos())[2]);
  await slide(sol, (await sol.pos())[0], 130);
  await stand(sol, c(0, 4)[0], c(0, 4)[2]);
  const door = L.acts.filter((a) => a.style === 'door')[0];
  for (let tries = 0; tries < 4; tries++) {
    await Promise.all([sol.pound(), luna.pound()]);
    if (await sol.until((g, b, a) => g.world.state.act[a] === 1, door.id, 1500).then(() => true, () => false)) break;
  }
  await shot('s3');
  // Sol slides round to the door.
  await slide(sol, 30, (await sol.pos())[2]);
  await slide(sol, (await sol.pos())[0], 80);
  await luna.path([[9.8, c(4, 2)[2]], [15, c(4, 2)[2] - 1]], { r: 0.5 });
  await sol.path([[9.8, c(4, 2)[2]], [15, c(4, 2)[2] + 1]], { r: 0.5 });

  // 4. Curling: along the fence to the right row, then slide into the corner.
  const rz = M.rink[2];
  const curl = async (bot, z) => {
    await bot.go(M.rink[0] + 1.2, rz, { r: 0.6, speed: 0.5 });
    await bot.go(M.rink[0] + 1.2, z, { r: 0.6, speed: 0.4, timeout: 20000 });
    await bot.until((g) => Math.hypot(g.player.vel.x, g.player.vel.z) < 0.6, null, 8000);
    await slide(bot, 60, z);
  };
  await curl(luna, M.pB[2]);
  await curl(sol, M.pA[2]);
  const exit = L.acts.filter((a) => a.style === 'door')[1];
  await sol.waitAct(exit.id, 6000);
  await shot('s4');
  for (const [bot, z] of [[sol, M.pA[2]], [luna, M.pB[2]]]) {
    await bot.go(35.3, z, { r: 0.5, speed: 0.4 });
    await bot.go(37.6, rz, { r: 0.6, speed: 0.5, timeout: 15000 });
  }
  const g = L.goal;
  await sol.path([[41, rz - 0.6], [g.x, g.z - 1.4]], { r: 0.5 });
  await luna.path([[41, rz + 0.6], [g.x, g.z + 1.4]], { r: 0.5 });
}
