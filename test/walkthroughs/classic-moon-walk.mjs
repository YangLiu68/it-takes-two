// Level 18 Moon Walk: craters, the gravity cliff, the magnet launch + partner bond, the tide, the rope.
import { hop, stand, landOn } from './ch3-lib.mjs';

export default async function ({ sol, luna, L, shot, sleep }) {
  const M = L.marks;
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);

  // 1. Craters: big floaty single jumps.
  for (const bot of [sol, luna]) {
    const dx = bot === sol ? -0.5 : 0.5;
    await bot.go(dx, 4.2, { r: 0.4 });
    for (let i = 0; i < 4; i++) {
      const [x, y, z] = M[`isle${i}`];
      await hop(bot, [x + dx, y, z], { double: false });
    }
    await hop(bot, [dx * 2, 12, 69.5], { double: false });
  }
  await shot('s1');

  // 2. Luna holds the low gravity; Sol double-jumps up the cliff, then returns the favour.
  const climb = async (bot) => {
    await bot.go(bot === sol ? -1 : 1, M.cliffBase[2], { r: 0.3, stop: true });
    await bot.jump({ to: [bot === sol ? -1 : 1, 22, 84], double: true, doubleAt: 3 });
    await landOn(bot, [bot === sol ? -1 : 1, 22, 84.5]);
  };
  await stand(luna, M.p1[0], M.p1[2]);
  await climb(sol);
  await stand(sol, M.p2[0], M.p2[2]);
  await climb(luna);
  await shot('s2');

  // 3. Sol launches into the sky, then raises the lift for Luna.
  await stand(sol, M.pad[0], M.pad[2]);
  await sol.magnet(700);
  await landOn(sol, [0, M.high[1], 106], { r: 0.6, timeout: 8000 });
  await luna.path([[2, 96], [M.lift[0], M.lift[2]]], { r: 0.3 });
  await stand(luna, M.lift[0], M.lift[2]);
  await stand(sol, M.liftPlate[0], M.liftPlate[2]);
  await luna.until((g) => g.player.grounded && g.player.pos.y > 35.6, null, 10000);
  await luna.go(1, 106, { r: 0.5 });
  await sol.go(-1.5, 107, { r: 0.5 });
  await shot('s3');
  // Glide down to the far moon.
  for (const bot of [sol, luna]) {
    const dx = bot === sol ? -1 : 1;
    await bot.go(dx, 109.4, { r: 0.4 });
    await hop(bot, [dx, 30, 130.5], { double: true });
  }

  // 4. The tide: jump only as the lights come on.
  const per = M.tide[2];
  for (const bot of [sol, luna]) {
    const dx = bot === sol ? -0.6 : 0.6;
    await bot.go(dx, 139.4, { r: 0.4 });
    for (let i = 0; i < 3; i++) {
      await bot.until((g, b, a) => ((g.world.time / a) % 1) < 0.06, per, 15000);
      const [x, y, z] = M[`col${i}`];
      await hop(bot, [x + dx, y, z], { double: false });
    }
    await bot.until((g, b, a) => ((g.world.time / a) % 1) < 0.06, per, 15000);
    await hop(bot, [dx, 45, 190.5], { double: true });
  }
  await shot('s4');

  // 5. Tied together: jump at the same time.
  await both((b) => b.go(-1, 198.4, { r: 0.4 }), (b) => b.go(1, 198.4, { r: 0.4 }));
  for (let i = 0; i < 4; i++) {
    const [x, y, z] = M[`rock${i}`];
    await both((b) => hop(b, [x - 1.2, y, z], { double: false }), (b) => hop(b, [x + 1.2, y, z], { double: false }));
  }
  await both((b) => hop(b, [-1.4, 47, 254], { double: false }), (b) => hop(b, [1.4, 47, 254], { double: false }));
  await shot('s5');
  const g = L.goal;
  await both((b) => b.go(g.x - 1.4, g.z, { r: 0.5 }), (b) => b.go(g.x + 1.4, g.z, { r: 0.5 }));
}
