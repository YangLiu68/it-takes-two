// Level 23 Night Run: fireflies over fake tiles, light glass (own light, partner's
// light in turns, both lanes at once), the lighthouse stairs and two-light bridge.
import { sleep } from './lib.mjs';

export default async function ({ sol, luna, L, shot }) {
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const hop = (bot, x, y, z) => bot.jump({ to: [x, y, z], double: true });
  const plate = (x, z) => L.plates.find((p) => p.x === x && p.z === z);

  // 1. Luna holds the jar; Sol follows the fireflies. Then the other way round.
  const ff = L.marks.fireflies;
  const jarA = plate(-4, 10.5), jarB = plate(4, 39);
  await luna.go(jarA.x, jarA.z, { r: 0.3, stop: true });
  await sol.go(ff[0][0], 10.8, { r: 0.4 });
  for (const p of ff) await hop(sol, ...p);
  await hop(sol, 0, 0, 37.5);
  await sol.go(jarB.x, jarB.z, { r: 0.3, stop: true });
  await luna.go(ff[0][0], 10.8, { r: 0.4 });
  for (const p of ff) await hop(luna, ...p);
  await hop(luna, -1, 0, 37.5);
  await shot('fireflies', luna.page);

  // 2. Glass you light yourself (the camera faces where you jump).
  const g2 = L.marks.g2;
  const cross = async (bot, pts, end) => {
    for (const p of pts) {
      await bot.face([p[0], p[1], p[2]]);
      await sleep(150);
      await hop(bot, ...p);
    }
    await bot.face(null);
    await hop(bot, ...end);
  };
  await sol.go(1.5, 40.5, { r: 0.4 });
  await cross(sol, g2, [-1, 0, 66.5]);
  await luna.go(1.5, 40.5, { r: 0.4 });
  await cross(luna, g2, [1, 0, 66.5]);
  await shot('glass');

  // 3. Turns: Luna lights Sol's blue glass, then Sol lights Luna's red glass.
  const g3 = L.marks.g3;
  const lightFor = async (crosser, lighter, x, end) => {
    for (let i = 0; i < g3.length; i++) {
      const z = g3[i];
      await lighter.face([x, 0, z]);
      await sleep(250);
      await hop(crosser, x, 0, z);
    }
    await lighter.face([x, 0, g3[g3.length - 1] + 2]);
    await hop(crosser, ...end);
    await lighter.face(null);
  };
  await both((b) => b.go(-4, 69.8, { r: 0.3, stop: true }), (b) => b.go(4, 69.8, { r: 0.3, stop: true }));
  await lightFor(sol, luna, -4, [-4, 0, 97]);
  await sol.go(-2.5, 97.5, { r: 0.4 });
  await lightFor(luna, sol, 4, [3, 0, 97]);
  await shot('turns');

  // 4. Side by side, each lighting the other's way.
  const g4 = L.marks.g4;
  await both((b) => b.go(-3.5, 99.8, { r: 0.3, stop: true }), (b) => b.go(3.5, 99.8, { r: 0.3, stop: true }));
  const solX = (k) => -3.5 + g4[k][0];
  const lunaX = (k) => 3.5 - g4[k][0];
  for (let k = 0; k < g4.length; k++) {
    const z = g4[k][1];
    const zPrev = k ? g4[k - 1][1] : z - 3;
    // Aim between the partner's current block and the next one.
    await sol.face([lunaX(k), 0, (z + zPrev) / 2 + 1]);
    await luna.face([solX(k), 0, (z + zPrev) / 2 + 1]);
    await sleep(250);
    await both((b) => hop(b, solX(k), 0, z), (b) => hop(b, lunaX(k), 0, z));
  }
  await sol.face([3, 0, 143]);
  await luna.face([-3, 0, 143]);
  await sleep(200);
  await both((b) => hop(b, -2.5, 0, 143.5), (b) => hop(b, 2.5, 0, 143.5));
  await sol.face(null);
  await luna.face(null);
  await shot('together');

  // 5. Lighthouse: spiral glass stairs, then the two-light bridge, then both lamps.
  const st = L.marks.stairs;
  const [TX, TOP, TZ] = L.marks.tower;
  const climb = async (bot) => {
    await bot.go(st[0][0] + 0.5, st[0][2] - 3, { r: 0.4 });
    for (const p of st) await hop(bot, ...p);
    await hop(bot, TX - 1.2, TOP, TZ);
  };
  await climb(sol);
  await sol.go(TX - 1, TZ + 1.6, { r: 0.4 });
  await climb(luna);
  await luna.go(TX + 1, TZ + 1.6, { r: 0.4 });
  await both((b) => b.face([TX, TOP, TZ + 8]), (b) => b.face([TX, TOP, TZ + 8]));
  await sleep(600);
  await both((b) => b.path([[TX - 1, TZ + 4], [TX - 1, TZ + 12], [TX - 1, TZ + 18]], { r: 0.5 }),
    (b) => b.path([[TX + 1, TZ + 4], [TX + 1, TZ + 12], [TX + 1, TZ + 18]], { r: 0.5 }));
  await both((b) => b.face(null), (b) => b.face(null));
  const [lampA, lampB] = L.switches.filter((w) => w.latch && Math.abs(w.y - TOP) < 0.1).sort((a, b) => a.x - b.x);
  await both((b) => b.go(lampA.x, lampA.z, { r: 0.3, stop: true }), (b) => b.go(lampB.x, lampB.z, { r: 0.3, stop: true }));
  await both((b) => b.pound(), (b) => b.pound());
  const finale = L.acts.find((a) => a.style === 'bridge');
  await sol.waitAct(finale.id, 5000);
  await sleep(1800);
  await shot('lighthouse');
  await both((b) => b.path([[-0.8, TZ + 22], [-0.8, TZ + 34], [-1.5, TZ + 40]], { r: 0.4 }), (b) => b.path([[0.8, TZ + 22], [0.8, TZ + 34], [1.5, TZ + 40]], { r: 0.4 }));
}
