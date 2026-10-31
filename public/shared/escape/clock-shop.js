// Puzzle 2 · Clock Shop. Six clockwork rooms:
//   0 shop door: Luna reads a stopped floor clock, Sol sets the time (dials)
//   1 cuckoo clocks: Sol reads who calls least to most, Luna presses in order
//   2 two bridges: Sol dodges pendulums, Luna hops crumbling tiles; each
//     brings back a gear only they can carry
//   3 the movement: a fan blows one of you up to the gold gear; three gears
//     start the clockwork
//   4 linked gears: four hands, turning one turns its neighbours (lights-out),
//     two on each side of a wall
//   5 clock tower: hold a plate to push the upper steps out of the column,
//     climb, then lock them out for your partner

import { LevelBuilder } from '../build.js';

const SOL_RED = '#ff6b4a';
const LUNA_BLUE = '#4f86ff';
const GOLD = '#ffc94a';

export function clockShop(index) {
  const b = new LevelBuilder({ mode: 'puzzle', index, seed: 'clock-shop', name: 'Clock Shop', label: 'Room 2', theme: 'workshop', sky: 'sunset' });
  const r = b.rng;
  const H = 12;
  const wall = { color: '#d8c09a', t: 0.5 };
  const door = { ...wall, lintel: 5 };
  const tallZ = (z0, z1, x, top = 26) => b.box(x, top / 2, (z0 + z1) / 2, 0.5, top, Math.abs(z1 - z0), wall);
  const tallX = (x0, x1, z, top = 26) => b.box((x0 + x1) / 2, top / 2, z, Math.abs(x1 - x0), top, 0.5, wall);

  // -- 0 · The shop door: what time is it? -------------------------------------------------
  b.floor(0, 0, 10, 28, 20, { mat: 'wood' });
  b.wallX(-14, 14, 0, H, wall);
  b.wallZ(0, 20, -14, H, wall);
  b.wallZ(0, 20, 14, H, wall);
  b.box(0, H / 2, 15, 4, H, 10, wall); // between the two alcoves
  b.checkpoint(0, 0, 4, 6, { hint: 'The shop clock has stopped. Luna reads the clock in the east, Sol sets the time in the west.' });
  b.sign(0, 3.8, 8, 'Clock Shop\nSol: west   ·   Luna: east', { style: 'prank', w: 4 });
  b.field(-8, H / 2, 10, 12, H, 0.3, 1);
  b.field(8, H / 2, 10, 12, H, 0.3, -1);
  b.sign(-8, 4.4, 10, 'Sol only', { style: 'prank', w: 2.4 });
  b.sign(8, 4.4, 10, 'Luna only', { style: 'prank', w: 2.4 });
  // Luna's side: a big clock lying on the floor, stopped at some time.
  const hour = r.int(1, 11);
  const minute = r.pick([0, 15, 30, 45]);
  const CX = 8, CZ = 15.2;
  b.box(CX, 0.05, CZ, 7.2, 0.1, 7.2, { color: '#fff4dc' });
  for (let i = 0; i < 12; i++) {
    const th = (i / 12) * Math.PI * 2;
    const big = i % 3 === 0;
    b.box(CX - Math.sin(th) * 3.0, 0.13, CZ + Math.cos(th) * 3.0, big ? 0.4 : 0.22, 0.06, big ? 0.8 : 0.5, { color: '#3a2b4f', yaw: -th });
  }
  const hand = (turns, len, w, y, color) => {
    const th = turns * Math.PI * 2;
    b.box(CX - Math.sin(th) * len / 2, y, CZ + Math.cos(th) * len / 2, w, 0.06, len, { color, yaw: -th });
  };
  hand((hour + minute / 60) / 12, 1.7, 0.5, 0.16, '#1e1530');
  hand(minute / 60, 2.75, 0.3, 0.22, '#e8202a');
  b.box(CX, 0.26, CZ, 0.5, 0.08, 0.5, { color: '#c9a35a' });
  for (const [t, a] of [['12', 0], ['3', 0.25], ['6', 0.5], ['9', 0.75]]) {
    const th = a * Math.PI * 2;
    b.sign(CX - Math.sin(th) * 3.95, 1.1, CZ + Math.cos(th) * 3.95, t, { style: 'prank', w: 1.0 });
  }
  b.sign(12.3, 4.2, 11.4, 'The shop clock has stopped\nTell Sol what time it shows\n(short black hand: hours,\nlong red hand: minutes)', { style: 'prank', w: 3.4 });
  // Sol's side: the hour and minute wheels.
  const hours = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
  const mins = ['00', '15', '30', '45'];
  const dH = b.dial(-10, 0, 15, { values: hours });
  const dM = b.dial(-6, 0, 15, { values: mins });
  b.sign(-10, 3.2, 15, 'Hour', { style: 'prank', w: 0.9 });
  b.sign(-6, 3.2, 15, 'Min', { style: 'prank', w: 0.9 });
  b.sign(-8, 3.8, 18.8, 'Set the right time\nPound a wheel (C) to turn it\nWhat time? Ask Luna!', { style: 'prank', w: 3.8 });
  const time = b.combo([dH, dM], [hour % 12, minute / 15]);
  b.wallGapsX(-14, 14, 20, H, [[-8, 3], [8, 3]], door);
  b.door(-8, 20, 3, 5, { op: 'all', in: [time] }, { latch: true, color: '#ffb59e' });
  b.door(8, 20, 3, 5, { op: 'all', in: [time] }, { latch: true, color: '#8fb4ff' });
  b.acts[b.acts.length - 1].toast = 'Ding! The shop door opens!';
  b.gem(-12.5, 1.2, 2);
  b.mark('dH', -10, 0, 15);
  b.mark('dM', -6, 0, 15);

  // -- 1 · Cuckoo clocks: least to most --------------------------------------------------
  b.floor(0, 0, 30, 28, 20, { color: '#ffe6c4' });
  b.wallZ(20, 40, -14, H, wall);
  b.wallZ(20, 40, 14, H, wall);
  b.wallZ(25, 40, 0, H, wall);
  b.checkpoint(0, 0, 22.5, 4, { hint: 'Now swap: Sol reads the cuckoo clocks in the east, Luna pounds the buttons in the west.' });
  b.field(-7, H / 2, 25, 14, H, 0.3, -1);
  b.field(7, H / 2, 25, 14, H, 0.3, 1);
  b.sign(-7, 4.4, 25, 'Luna only', { style: 'prank', w: 2.4 });
  b.sign(7, 4.4, 25, 'Sol only', { style: 'prank', w: 2.4 });
  const roofs = [['red', '#e8202a'], ['green', '#2fa84f'], ['yellow', '#ffc400'], ['blue', '#1f4fe0']];
  const calls = r.shuffle([1, 2, 3, 4]);
  roofs.forEach(([, color], i) => {
    const x = 3.4 + i * 2.75;
    b.box(x, 3.2, 39.35, 1.8, 1.8, 0.7, { mat: 'wood', color: '#8a5a3a' });
    b.box(x, 4.35, 39.3, 2.3, 0.5, 0.9, { color });
    b.box(x, 3.0, 38.98, 0.7, 0.9, 0.05, { color: '#2a1a10' });
    b.box(x, 1.75, 39.5, 0.08, 1.1, 0.08, { mat: 'metal' });
    b.sign(x, 1.55, 38.95, Array(calls[i]).fill('coo').join(' '), { fixed: true, yaw: Math.PI, style: 'prank', w: 1.8 });
  });
  b.sign(7, 3.8, 30, 'Cuckoos come out from fewest\ncalls to most. Tell Luna\nthe roof colors in order', { style: 'prank', w: 4.2 });
  const layout = r.shuffle(roofs.map((x, i) => i));
  const birds = {};
  layout.forEach((ri, k) => {
    birds[ri] = b.pswitch(-11.5 + k * 2.7, 0, 33, false, 0.6, roofs[ri][1]);
  });
  const byCalls = [0, 1, 2, 3].sort((a, c) => calls[a] - calls[c]);
  const cuckoo = b.seq(byCalls.map((ri) => birds[ri]));
  b.sign(-7, 3.8, 29, 'Pound in cuckoo order\nAsk Sol for the order!', { style: 'prank', w: 3.8 });
  b.wallGapsX(-14, 14, 40, H, [[-6, 3], [6, 3]], door);
  b.door(-6, 40, 3, 5, { op: 'all', in: [cuckoo] }, { latch: true, color: '#8fb4ff' });
  b.door(6, 40, 3, 5, { op: 'all', in: [cuckoo] }, { latch: true, color: '#ffb59e' });
  b.acts[b.acts.length - 1].toast = 'Cuckoo! Cuckoo! The doors open.';
  b.gem(12.5, 1.2, 27);
  b.gem(-12.5, 1.2, 37.5);

  // -- 2 · Two bridges -----------------------------------------------------------------------
  tallZ(40, 65, -14);
  tallZ(40, 65, 14);
  b.floor(-6, 0, 41.75, 6, 3.5, { mat: 'wood' });
  b.floor(6, 0, 41.75, 6, 3.5, { mat: 'wood' });
  b.checkpoint(6, 0, 41.75, 3, { hint: 'Sol: the big pendulums will knock you off! Time your run and grab the red gear.' });
  b.checkpoint(-6, 0, 41.75, 3, { hint: 'Luna: crumbly tiles drop soon after you land on them. Keep hopping! Grab the blue gear.' });
  // Sol's bridge, under three pendulums.
  b.floor(6, 0, 54.25, 3.2, 21.5, { mat: 'wood', t: 1.2 });
  const py = 0.95 + 6.4;
  [48, 54, 60].forEach((zc, k) => {
    b.pendulum(6, py, zc, 6.4, 1.05, 2.7 + k * 0.25, k * 0.31, [1.4, 1.4, 2.0]);
    for (const side of [-1, 1]) b.box(6 + side * 3.8, (py + 0.6 - 14) / 2, zc, 0.6, py + 14.6, 0.6, { mat: 'metal', deep: true });
    b.box(6, py + 0.3, zc, 8.2, 0.5, 0.6, { mat: 'metal' });
  });
  b.sign(6, 4.2, 44.5, 'Sol: dodge the pendulums!', { style: 'prank', w: 2.6 });
  // Luna's bridge: crumbling tiles with one safe stone in the middle.
  const tiles = [];
  for (let k = 0; k < 6; k++) {
    const z = 45.7 + k * 3.4;
    const x = -6 + (k % 2 ? 0.9 : -0.9);
    if (k === 3) b.floor(x, 0, z, 2.8, 2.8, { mat: 'wood', t: 1.2 });
    else b.crumble(x, 0, z, 2.4, 2.4);
    tiles.push([x, z]);
  }
  b.sign(-6, 4.2, 44.5, 'Luna: keep hopping!', { style: 'prank', w: 2.6 });
  b.gem(-6, 2.6, 55.9);
  tiles.forEach(([x, z], k) => b.mark(`tile${k}`, x, 0, z));
  b.mark('solBridge', 6, 0, 43);

  // -- 3 · The movement: three gears ----------------------------------------------------------
  b.floor(0, 0, 77.5, 28, 25, { mat: 'wood' });
  tallZ(65, 90, -14);
  tallZ(65, 90, 14);
  b.checkpoint(0, 0, 70.5, 5, { hint: "Put all three gears in the clockwork: red is Sol's, blue is Luna's, and the gold one sits on the high shelf. Use the fan!" });
  for (const [x, who, color, label] of [[6, 0, SOL_RED, 'Red gear'], [-6, 1, LUNA_BLUE, 'Blue gear']]) {
    b.box(x, 0.35, 67.6, 1, 0.7, 1, { mat: 'metal' });
    b.item('gear', x, 1.05, 67.6, { who, color, label });
  }
  const redGear = b.items[b.items.length - 2].id;
  const blueGear = b.items[b.items.length - 1].id;
  // The high shelf and the fan that gets you up there.
  b.box(11, 3.75, 85.5, 6, 7.5, 9, { color: '#c9a35a' });
  const goldGear = b.item('gear', 12, 8.4, 87, { color: GOLD, label: 'Gold gear' });
  b.plat(6.2, 0.25, 85, 3.4, 3.4, 1.2, { mat: 'metal' });
  const fanLow = b.plate(-3, 0, 85.5);
  const fanTop = b.plate(11.5, 7.5, 83.4);
  b.fan(6.2, 0.25, 85, 1.5, 9.8, 58, { op: 'any', in: [fanLow, fanTop] });
  b.wire(fanLow, [[-3, 0, 85.5], [4.4, 0, 85.5]]);
  b.sign(-3, 3.0, 87.4, 'Hold the plate: the fan blows\nyour partner up to the shelf!', { style: 'prank', w: 3.4 });
  // The movement itself.
  b.box(0, 1.5, 88.4, 7, 3, 2.4, { mat: 'metal', color: '#b08d57' });
  b.sign(0, 3.9, 87.1, 'Clockwork', { fixed: true, yaw: Math.PI, style: 'prank', w: 2.6 });
  const movement = b.lock(0, 0, 80, [redGear, blueGear, goldGear], { label: 'Clockwork', radius: 2.4 });
  b.wallGapsX(-14, 14, 90, H, [[-5, 3], [5, 3]], door);
  const door3 = b.door(-5, 90, 3, 5, { op: 'all', in: [movement] }, { latch: true, color: '#c9a35a' });
  b.door(5, 90, 3, 5, { op: 'all', in: [movement] }, { latch: true, color: '#c9a35a' });
  b.acts[b.acts.length - 1].toast = 'Tick-tock... the clockwork is running!';
  b.gem(-12, 1.2, 80);
  b.mark('fanLow', -3, 0, 85.5);
  b.mark('fan', 6.2, 0.25, 85);

  // -- 4 · Linked gears (lights-out) -------------------------------------------------------------
  b.floor(0, 0, 99, 28, 18, { color: '#ffe6c4' });
  b.wallZ(90, 108, -14, H, wall);
  b.wallZ(90, 108, 14, H, wall);
  b.wallZ(94, 108, 0, H, wall);
  b.checkpoint(0, 0, 92, 3.5, { hint: 'Linked gears: turn one and its neighbors turn too. The gears on both sides are connected, so plan it together!' });
  b.field(-7, H / 2, 94, 14, H, 0.3, -1);
  b.field(7, H / 2, 94, 14, H, 0.3, 1);
  b.sign(-7, 4.4, 94, 'Luna only', { style: 'prank', w: 2.4 });
  b.sign(7, 4.4, 94, 'Sol only', { style: 'prank', w: 2.4 });
  const arrows = ['↑', '→', '↓', '←'];
  const gx = [-9.5, -4, 4, 9.5];
  // Scramble from solved by turning each gear p times: always solvable.
  const presses = gx.map(() => r.int(0, 3));
  if (presses.every((p) => p === 0)) presses[1] = 1;
  const start = gx.map((_, j) => [j - 1, j, j + 1].filter((i) => i >= 0 && i < 4).reduce((s, i) => s + presses[i], 0) % 4);
  const gears = gx.map((x, j) => b.dial(x, 0, 101, { values: arrows, start: start[j] }));
  gears.forEach((id, j) => {
    b.dials.find((d) => d.id === id).links = [gears[j - 1], gears[j + 1]].filter(Boolean);
    b.sign(gx[j], 3.2, 101, `Gear ${j + 1}`, { style: 'prank', w: 1.4 });
  });
  const linked = b.combo(gears, [0, 0, 0, 0]);
  b.sign(-7, 3.8, 105.5, 'Turning a gear turns its\nneighbors too. Gears 2 and 3\nare linked through the wall.\nPoint all four hands up ↑', { style: 'prank', w: 4.2 });
  b.sign(7, 3.8, 105.5, 'Turning a gear turns its\nneighbors too. Gears 2 and 3\nare linked through the wall.\nPoint all four hands up ↑', { style: 'prank', w: 4.2 });
  b.wallGapsX(-14, 14, 108, H, [[-7, 3], [7, 3]], door);
  b.door(-7, 108, 3, 5, { op: 'all', in: [linked] }, { latch: true, color: '#8fb4ff' });
  b.door(7, 108, 3, 5, { op: 'all', in: [linked] }, { latch: true, color: '#ffb59e' });
  b.acts[b.acts.length - 1].toast = 'All four hands point up! The clock tower opens.';
  gears.forEach((id, j) => b.mark(`gear${j}`, gx[j], 0, 101));

  // -- 5 · The clock tower ---------------------------------------------------------------------
  b.floor(0, 0, 124, 28, 32, { mat: 'wood' });
  tallZ(108, 140, -14, 30);
  tallZ(108, 140, 14, 30);
  tallX(-14, 14, 140, 30);
  b.checkpoint(0, 0, 110.5, 4, { hint: 'The upper steps are tucked inside the column: one holds the plate to push them out, the other climbs and pounds the button at the top to keep them out!' });
  const R = 6.2, cz = 124, n = 11, step = 1.45;
  b.plat(0, 13.6, cz, 4.2, 4.2, 30, { deep: true, color: '#b08d57' });
  b.sign(0, 9, cz - 2.2, 'Clock Tower', { fixed: true, yaw: 0, style: 'prank', w: 2.2 });
  const towerLow = b.plate(5.5, 0, 113);
  b.sign(5.5, 2.8, 113, 'Hold the plate to\npush out the upper steps', { style: 'prank', w: 2.8 });
  const parts = [];
  const stepAt = [];
  let lastTop = 0;
  for (let k = 0; k < n; k++) {
    const th = -Math.PI / 2 + k * ((Math.PI * 3) / (n - 1));
    const x = Math.cos(th) * R, z = cz + Math.sin(th) * R;
    lastTop = 0.8 + k * step;
    stepAt.push([x, lastTop, z]);
    if (k < 6) {
      if (k === 2 || k === 5) b.crumble(x, lastTop, z, 3.1, 3.1);
      else b.plat(x, lastTop, z, 3.1, 3.1, 1.6, { color: '#ffd166' });
    } else {
      // Tucked into the column until someone holds the plate.
      const r0 = 2.6;
      parts.push({
        x: Math.cos(th) * r0, y: lastTop - 0.4, z: cz + Math.sin(th) * r0, sx: 3.1, sy: 0.8, sz: 3.1,
        move: [Math.cos(th) * (R - r0), 0, Math.sin(th) * (R - r0)], delay: (k - 6) * 0.12,
      });
    }
  }
  const ez = cz + R + 1.55 + 1.2;
  const exitTop = lastTop + 0.8;
  b.plat(0, exitTop, ez + 3, 9, 6, 1.4, { mat: 'wood' });
  const towerTop = b.pswitch(-2.8, exitTop, ez + 4, true);
  const towerSteps = b.act('steps', { op: 'any', in: [towerLow, towerTop] }, false, parts, { speed: 3.2, mat: 'toy', color: '#ffb347', lamp: [3.2, exitTop + 0.4, ez + 1] });
  b.sign(-2.8, exitTop + 3.2, ez + 4.6, 'Pound this button\nto keep the steps out', { style: 'prank', w: 2.4 });
  b.gem(0, exitTop + 3, cz);
  b.goal(2.2, exitTop, ez + 3.6);
  stepAt.forEach((p, k) => b.mark(`step${k}`, ...p));
  b.mark('towerLow', 5.5, 0, 113);
  b.mark('towerTop', -2.8, exitTop, ez + 4);

  b.objectives = [
    { text: 'Luna reads the clock, Sol sets the time: open the shop door', done: { sig: time } },
    { text: 'Cuckoos come out from fewest calls to most: Sol reads, Luna pounds', done: { sig: cuckoo } },
    { text: 'Sol: dodge the pendulums and get the red gear', done: { item: redGear } },
    { text: 'Luna: hop across the crumbly tiles and get the blue gear', done: { item: blueGear } },
    { text: 'Use the fan to blow one of you up to the shelf for the gold gear', done: { item: goldGear } },
    { text: 'Put all three gears in the clockwork', done: { act: door3 } },
    { text: 'Linked gears: point all four hands up (plan it together)', done: { sig: linked } },
    { text: 'One holds the plate to push out the steps, the other climbs to the top', done: { sig: towerTop } },
    { text: 'Both climb the tower and step into the goal!', done: {} },
  ];
  void towerSteps;
  return b.finish();
}
