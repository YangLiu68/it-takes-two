// Level 15 · Bounce Castle: pound-bounce, partner drums, pound together, red/blue drums, the rising drum.
import { stand, poundAt, bounceOn, landOn, bounceCount } from './ch3-lib.mjs';

export default async function ({ sol, luna, L, shot, sleep }) {
  const M = L.marks;
  const drums = L.bouncers.map((d) => d.id);
  const at = (id) => M[id];
  const H = M.L2[1];
  const [d1, d2, a1, a2, b1, b2, dL, dR] = drums;
  const colors = drums.slice(8, 12);
  const lift = drums[12];

  // 1. Bounce up, then pound-bounce up the high ledge (one after the other).
  for (const bot of [sol, luna]) {
    await bot.go(bot === sol ? -0.8 : 0.8, 4.2, { r: 0.4 });
    await bounceOn(bot, d1, at(d1));
    await landOn(bot, M.L1);
    await bounceOn(bot, d2, at(d2), { strong: true });
    await landOn(bot, [bot === sol ? -1.5 : 1.5, H, 21.5]);
  }
  await shot('s1');

  // 2. Partner drums: Luna holds the plate, Sol crosses; then Sol holds the island plate.
  await stand(luna, M.p0[0], M.p0[2]);
  await sol.go(0, 24, { r: 0.4 });
  await bounceOn(sol, a1, at(a1));
  await bounceOn(sol, a2, at(a2), { noJump: true });
  await landOn(sol, [1, H, 41.8]);
  await stand(sol, M.p1[0], M.p1[2]);
  await luna.go(0, 24, { r: 0.4 });
  await bounceOn(luna, a1, at(a1));
  await bounceOn(luna, a2, at(a2), { noJump: true });
  await landOn(luna, M.island);
  await luna.go(-1, 44.3, { r: 0.4 });
  await bounceOn(luna, b1, at(b1));
  await bounceOn(luna, b2, at(b2), { noJump: true });
  await landOn(luna, [0, H, 61]);
  await poundAt(luna, M.sw2[0], M.sw2[2]);
  await luna.go(-3, 62, { r: 0.5 });
  await sol.go(0, 44.3, { r: 0.4 });
  await bounceOn(sol, b1, at(b1));
  await bounceOn(sol, b2, at(b2), { noJump: true });
  await landOn(sol, [0, H, 61]);
  await shot('s2');

  // 3. Up the pillars with a pound-bounce each, then pound the buttons together.
  await Promise.all([
    (async () => {
      await sol.go(-4.5, 67.5, { r: 0.4 });
      await bounceOn(sol, dL, at(dL), { strong: true });
      await landOn(sol, M.pilL, { r: 0.5 });
      await stand(sol, M.pilL[0], M.pilL[2]);
    })(),
    (async () => {
      await luna.go(4.5, 67.5, { r: 0.4 });
      await bounceOn(luna, dR, at(dR), { strong: true });
      await landOn(luna, M.pilR, { r: 0.5 });
      await stand(luna, M.pilR[0], M.pilR[2]);
    })(),
  ]);
  const gate = L.acts.find((a) => a.style === 'door');
  for (let tries = 0; tries < 4; tries++) {
    await Promise.all([sol.pound(), luna.pound()]);
    if (await sol.sig(gate.id).catch(() => false) || await sol.until((g, b, a) => g.world.state.act[a] === 1, gate.id, 1500).then(() => true, () => false)) break;
  }
  await sol.waitAct(gate.id, 3000);
  await shot('s3');
  await Promise.all([sol.path([[-4.5, 78.5], [-1, 80], [-0.6, 84]]), luna.path([[4.5, 78.5], [1, 80], [0.6, 84]])]);

  // 4. Red/blue: Luna swaps the drums every time Sol leaves one.
  await stand(luna, M.dial[0], M.dial[2]);
  await sol.go(colors[0] && at(colors[0])[0], 87.8, { r: 0.4 });
  await bounceOn(sol, colors[0], at(colors[0]));
  for (let i = 1; i <= colors.length; i++) {
    // Sol is in the air: Luna switches colour while he heads for the next drum.
    const swap = i < colors.length ? luna.pound() : null;
    if (i < colors.length) await bounceOn(sol, colors[i], at(colors[i]), { noJump: true });
    else await landOn(sol, [0, H, 117]);
    if (swap) await swap;
  }
  await poundAt(sol, M.sw4[0], M.sw4[2]);
  await luna.path([[2, 86.5], [5.5, 87.6], [5.5, 116], [1, 118]], { r: 0.4 });
  await shot('s4');

  // 5. The rising drum: Sol gets on it, Luna raises it, Sol pound-bounces onto the castle.
  await sol.go(0, 127.5, { r: 0.4 });
  const raised = H + 0.5 - 0.35 + 6.5;
  // (Poll the bounce counter directly: the bot is busy with its bounce task.)
  const waitBounce = async (bot, n) => {
    for (let k = 0; k < 100 && (await bounceCount(bot)) <= n; k++) await sleep(100);
  };
  const n0 = await bounceCount(sol);
  const solUp = bounceOn(sol, lift, at(lift), { strong: true, raised, timeout: 30000 });
  await waitBounce(sol, n0);
  await stand(luna, M.pb[0], M.pb[2]);
  await solUp;
  await landOn(sol, M.castle);
  await sol.go(-3.5, M.castle[2] + 3, { r: 0.5 });
  await luna.go(-1, 127.5, { r: 0.4 });
  const n1 = await bounceCount(luna);
  const lunaUp = bounceOn(luna, lift, at(lift), { strong: true, raised, timeout: 30000 });
  await waitBounce(luna, n1);
  await stand(sol, M.pt[0], M.pt[2]);
  await lunaUp;
  await landOn(luna, [1, M.castle[1], M.castle[2]]);
  await shot('s5');
  const g = L.goal;
  await Promise.all([sol.go(g.x - 1.4, g.z + 1, { r: 0.5 }), luna.go(g.x + 1.4, g.z + 1, { r: 0.5 })]);
}
