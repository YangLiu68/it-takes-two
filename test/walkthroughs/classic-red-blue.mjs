// Level 20 Red & Blue: rests, mid-air flips, flip-your-partner lanes, the swapping
// maze with a guide, and the timed door with self-flipping.
import { sleep } from './lib.mjs';

export default async function ({ sol, luna, L, shot }) {
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const dialAt = (x, z, yMin = -1) => L.dials.find((d) => Math.abs(d.x - x) < 0.1 && Math.abs(d.z - z) < 0.1 && d.y > yMin);
  const value = (bot, id) => bot.dialValue(id);
  // Pound the button you're standing next to and wait until `target` changes.
  const press = async (bot, btn, target) => {
    await bot.go(btn.x, btn.z, { r: 0.3, stop: true });
    const v = await value(bot, target);
    await bot.pound();
    await bot.until((g, b, a) => (g.extras.dialState[a[0]] ?? 0) !== a[1], [target, v], 4000);
  };
  const hop = (bot, x, y, z) => bot.jump({ to: [x, y, z], double: true });

  // 1. Rests: Luna flips while Sol waits on grey.
  const d1 = dialAt(-3, 13);
  await both((b) => b.go(2, 14.4, { r: 0.4 }), (b) => b.go(d1.x, d1.z, { r: 0.3, stop: true }));
  await hop(sol, 2, 0, 18);
  await hop(sol, 2, 0, 22.5);
  await press(luna, d1, d1.id);
  await hop(sol, 2, 0, 27);
  await hop(sol, 2, 0, 31.5);
  await press(luna, d1, d1.id);
  await hop(sol, 2, 0, 36);
  await hop(sol, 2, 0, 40);
  const f1 = dialAt(3, 41.5);
  await luna.go(2, 14.4, { r: 0.4 });
  await hop(luna, 2, 0, 18);
  await hop(luna, 2, 0, 22.5);
  await press(sol, f1, d1.id);
  await hop(luna, 2, 0, 27);
  await hop(luna, 2, 0, 31.5);
  await press(sol, f1, d1.id);
  await hop(luna, 2, 0, 36);
  await hop(luna, 0.5, 0, 40);
  await shot('rests');

  // 2. Mid-air: flip right after the jumper takes off.
  const d2 = dialAt(-3, 42.5);
  const c2 = L.marks.c2;
  const flipMidAir = async (jumper, flipper, btn, target, to) => {
    const v = await value(flipper, target);
    await Promise.all([hop(jumper, ...to), (async () => {
      await sleep(120);
      await flipper.pound();
    })()]);
    const now = await value(flipper, target);
    if (now === v) throw new Error('the colour did not change in mid-air');
  };
  await both((b) => b.go(0, 43.6, { r: 0.3 }), (b) => b.go(d2.x, d2.z, { r: 0.3, stop: true }));
  await hop(sol, c2[0][0], c2[0][1], c2[0][2]);
  for (const [x, t, z] of c2.slice(1)) await flipMidAir(sol, luna, d2, d2.id, [x, t, z]);
  await hop(sol, 1, 2.4, 69);
  const f2 = dialAt(3, 70.5);
  await press(sol, f2, d2.id); // back to red for Luna
  await luna.go(0, 43.6, { r: 0.3 });
  await hop(luna, c2[0][0], c2[0][1], c2[0][2]);
  for (const [x, t, z] of c2.slice(1)) await flipMidAir(luna, sol, f2, d2.id, [x, t, z]);
  await hop(luna, -1, 2.4, 69);
  await shot('midair');

  // 3. Lanes: each flips the other's lane from their own islands.
  const [dL, dR] = L.marks.dLR;
  const T = 2.4;
  const flipOn = (x, z) => L.dials.find((d) => Math.abs(d.x - x) < 0.1 && Math.abs(d.z - z) < 0.1);
  await both((b) => b.go(-3.5, 72.6, { r: 0.3 }), (b) => b.go(3.5, 72.6, { r: 0.3 }));
  await both((b) => hop(b, -3.5, T, 76), (b) => hop(b, 3.5, T, 76));
  // Sol: 81 → 86, flip Luna's lane.
  await hop(sol, -3.5, T, 81);
  await hop(sol, -3.5, T, 86);
  await press(sol, flipOn(-3.5, 86), dR);
  await hop(luna, 3.5, T, 81);
  await hop(luna, 3.5, T, 86);
  await press(luna, flipOn(3.5, 86), dL);
  await hop(sol, -3.5, T, 91);
  await hop(sol, -3.5, T, 96);
  await press(sol, flipOn(-3.5, 96), dR);
  await hop(luna, 3.5, T, 91);
  await hop(luna, 3.5, T, 96);
  await press(luna, flipOn(3.5, 96), dL);
  await hop(sol, -3.5, T, 101);
  await hop(sol, -3.5, T, 106);
  await press(sol, flipOn(-3.5, 106), dR);
  await hop(luna, 3.5, T, 101);
  await hop(luna, 3.5, T, 106);
  await both((b) => hop(b, -2.5, T, 110), (b) => hop(b, 2.5, T, 110));
  await shot('lanes');

  // 4. Maze: Luna guides from the balcony, Sol walks; then they swap.
  const d4 = L.dials.find((d) => Math.abs(d.x - 7.5) < 0.1);
  await luna.go(5.6, 113.4, { r: 0.3 });
  await hop(luna, 7.5, T + 1.5, 113.5);
  await hop(luna, d4.x, d4.y, d4.z);
  await luna.go(d4.x, d4.z, { r: 0.3, stop: true });
  const mz = L.marks.maze;
  const zDoor = (i) => mz.MZ0 + (i + 1) * mz.ROOM;
  const zRoom = (i) => mz.MZ0 + mz.ROOM / 2 + i * mz.ROOM;
  const walkMaze = async (walker, flipper, btn) => {
    await walker.path([[0, 113], [0, 115.4], [0, zDoor(0) - 1.2]], { r: 0.4 });
    await press(flipper, btn, d4.id); // blue: door 1 opens
    await walker.go(0, zDoor(1) - 1.0, { r: 0.4 });
    await press(flipper, btn, d4.id); // red: door 2 opens, room 2's floor goes
    await hop(walker, 0, T + 0.03, zRoom(2));
    await walker.go(0, zRoom(2), { r: 0.3, stop: true });
    await press(flipper, btn, d4.id); // blue: room 2's floor back, door 3 opens
    await walker.go(0, zDoor(2) - 0.8, { r: 0.4 });
    await hop(walker, 0, T + 0.03, zRoom(3));
    await walker.go(0, zRoom(3), { r: 0.3, stop: true });
    await press(flipper, btn, d4.id); // red: room 3's floor back, door 4 opens
    await walker.path([[0, zRoom(4)], [0, 147.5]], { r: 0.5 });
  };
  await walkMaze(sol, luna, d4);
  await sol.go(-1.5, 148.5, { r: 0.5 });
  await shot('maze');
  // Luna comes down and walks it; Sol flips from the exit.
  await hop(luna, 7.5, T + 1.5, 113.5);
  await hop(luna, 4, T, 111.5);
  const fx = flipOn(-3.5, 149.5);
  await sol.go(fx.x, fx.z, { r: 0.3, stop: true });
  await walkMaze(luna, sol, fx);
  await luna.go(1.5, 148.5, { r: 0.5 });

  // 5. Timed door: Luna starts the timer, Sol flips his own way across.
  const [t5a, t5b] = L.switches.filter((w) => !w.dial && w.duration === 18).sort((a, b) => a.z - b.z);
  const c5 = L.marks.c5;
  const d5 = L.dials.find((d) => d.y < -50 && Math.abs(d.z - 150) < 0.1);
  const run = async (bot) => {
    await bot.go(0, 151.6, { r: 0.3 });
    for (const [x, z, k] of c5) {
      await hop(bot, x, T, z);
      if (k === 'i') await press(bot, flipOn(x, z), d5.id);
    }
    await hop(bot, 0, T, 191);
    await bot.path([[0, 193.4], [0, 196]], { r: 0.4 });
  };
  await luna.go(t5a.x, t5a.z, { r: 0.3, stop: true });
  await luna.pound();
  await run(sol);
  await shot('door');
  // Back to red for Luna, then Sol opens the door from the far side.
  await press(luna, flipOn(3, 151.5), d5.id);
  await sol.go(t5b.x, t5b.z, { r: 0.3, stop: true });
  await sol.pound();
  await run(luna);
  await luna.go(1.5, 200.5, { r: 0.5 });
  await sol.go(-1.5, 200.5, { r: 0.5 });
}
