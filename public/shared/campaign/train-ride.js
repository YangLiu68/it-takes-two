// Level 26 · Runaway Train: trains that don't wait for you.
//   1. the first train — ride it across, jumping the low bars that sweep over
//   2. the gatekeeper — a gate blocks the line; one holds it open, the other rides, then swap
//   3. run the train — board at the back, run forward car to car while it moves,
//      jump off the front at the far end
//   4. the dispatcher — Luna in the signal box sends one of three trains; only
//      she can see which one goes to the exit; Sol rides it
//   5. the last stretch — two cars side by side; blocks come down on one track
//      or the other, so you hop across to stay on board

import { LevelBuilder } from '../build.js';

export function trainRide(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'train-ride', name: 'Runaway Train', label: `Level ${index + 1}`, theme: 'workshop', sky: 'sunset' });
  const r = b.rng;
  const steel = '#7d8794', red = '#d9534f', cream = '#efe2c4', plat = '#c7b49a';
  const car = (sx, sz, motion, color = red) => b.mover(sx, 0.6, sz, motion, { steady: true, color, mat: 'toy' });
  // A low bar across the line at head height: jump it as it comes.
  const bar = (x, z, w, y = 1.0) => {
    b.mover(w, 0.6, 0.6, { type: 'linear', a: [x, y, z], b: [x, y, z], period: 10, phase: 0 }, { steady: true, mat: 'hazard', color: '#ff5d5d', hazard: 'push' });
    for (const s of [-1, 1]) b.box(x + s * (w / 2 + 0.25), y - 6, z, 0.4, 13.2, 0.4, { mat: 'metal' });
  };
  const station = (z0, z1, w = 12, top = 0) => b.floor(0, top, (z0 + z1) / 2, w, z1 - z0, { color: plat });

  // -- Start ----------------------------------------------------------------------------------
  station(-1, 7);
  b.checkpoint(0, 0, 2.5, 6, { hint: 'The train won\'t wait for you! Board once it pulls in, and jump the low bars while you ride.' });

  // -- 1. The first train ------------------------------------------------------------------------
  const c1 = car(4, 7, { type: 'linear', a: [0, -0.3, 10.6], b: [0, -0.3, 49.4], period: 14, phase: 0 });
  for (const z of [21, 31, 41]) bar(0, z, 5);
  station(53, 61);
  b.sign(0, 3, 6.4, 'Board when it pulls in!\nJump when you see a bar', { style: 'prank' });
  b.gem(0, 2.6, 26);
  b.mark('c1', 0, 0, 0);

  // -- 2. The gatekeeper ---------------------------------------------------------------------------
  b.checkpoint(0, 0, 57, 6, { hint: 'A gate blocks the line. One stands on the plate to hold it open while the other rides through; then the rider stands on the far plate so the partner can ride.' });
  const c2 = car(4, 7, { type: 'linear', a: [0, -0.3, 64.6], b: [0, -0.3, 97.4], period: 12, phase: 0.5 }, '#4f86ff');
  const plateB = b.plate(-4.5, 0, 58);
  station(101, 109);
  const plateC = b.plate(-4.5, 0, 105);
  b.door(0, 81, 5, 3.2, { op: 'any', in: [plateB, plateC] }, { y: 0.15, up: true, latch: false, speed: 9, color: steel });
  b.box(0, 7.3, 81, 6.6, 0.6, 0.6, { mat: 'metal' });
  for (const s of [-1, 1]) b.box(s * 3.05, -2.2, 81, 0.5, 19.6, 0.5, { mat: 'metal' });
  b.sign(-4.5, 2.6, 58, 'Stand here:\ngate opens', { style: 'prank' });
  b.sign(-4.5, 2.6, 105, 'Stand here:\ngate opens', { style: 'prank' });
  b.gem(0, 2.6, 90);

  // -- 3. Run the train ------------------------------------------------------------------------------
  b.checkpoint(0, 0, 105.5, 6, { hint: 'A long train: board the last car and run forward while it moves, jumping the gaps between cars and the bars. At the end, jump off the front!' });
  const D = 34, P3 = 14;
  const cars3 = [];
  for (let k = 0; k < 4; k++) {
    const z = 111.3 + k * 4.6;
    // 3.6 m cars with 1 m between them: the train lurches as it starts, so the gaps stay small.
    cars3.push(car(3, 3.6, { type: 'linear', a: [0, -0.3, z], b: [0, -0.3, z + D], period: P3, phase: 0 }, k === 3 ? '#ffd166' : red));
  }
  for (const z of [131, 146]) bar(0, z, 4.2);
  station(162, 170);
  b.sign(0, 3, 107, 'Board the last car,\nrun to the front!', { style: 'prank' });
  b.gem(0, 1.4, 150);
  b.mark('cars3', 0, 0, 0);

  // -- 4. The dispatcher -----------------------------------------------------------------------------
  b.checkpoint(0, 0, 165.5, 6, { hint: 'Luna climbs the signal tower on the left: only from inside can you see which train goes to the exit. She sets the train number and pounds the green GO switch; Sol boards that train first.' });
  const lines = [-3.5, 0, 3.5];
  const good = r.int(0, 2);
  // The signal box, high on the left.
  b.floor(-9.5, 3, 166, 4, 5, { t: 3, color: cream });
  b.floor(-7, 1.4, 163.4, 2, 2, { t: 1.4, color: cream });
  b.room(-11.5, 163.5, -7.5, 168.5, 6, { e: [[166, 2.2]], n: [[-9.5, 2]] }, { color: cream, t: 0.3, y: 3, lintel: 2.8 });
  b.box(-9.5, 9.15, 166, 4.2, 0.3, 5.2, { color: cream });
  const lever = b.dial(-9.5, 3, 165, { values: ['#1', '#2', '#3'], start: (good + 1) % 3 });
  const go = b.pswitch(-10.4, 3, 167.2, false, 14, '#3fd17a');
  b.sign(-11.25, 5.0, 166, `Tonight's last train\nto the EXIT is:\nTrain #${good + 1}`, { fixed: true, yaw: Math.PI / 2, style: 'paper', w: 2.6 });
  b.sign(-9.5, 7.6, 163.2, 'Signal tower', { style: 'prank' });
  const trains = lines.map((x, k) => {
    const pick = b.combo([lever], [k], { latch: false });
    b.sign(x, 2.2, 170.4, `#${k + 1}`, { style: 'prank', w: 1.2 });
    return b.act('carrier', { op: 'all', in: [pick, go] }, false, [
      { x, y: -0.3, z: 173.2, sx: 2.6, sy: 0.6, sz: 5, move: [0, 0, 30] },
    ], { speed: 4, mat: 'toy', color: ['#ff4d5e', '#ffd23f', '#3f8cff'][k], lamp: [x, 0.8, 170.4] });
  });
  for (const s of [-1, 1]) b.box(s * 1.75, 1.5, 199, 0.4, 3, 18, { color: steel });
  // Destination platforms: only the right one goes on; the others send you back.
  lines.forEach((x, k) => {
    b.floor(x, 0, 208.5, 3, 5, { color: plat });
    if (k !== good) {
      b.box(x, 1.5, 211.2, 3, 3, 0.4, { color: steel });
      b.zone('warp', x, 1.5, 208.5, 3.2, 3, 5, { to: [0, 0, 165, 0], text: 'Wrong train... back to the platform you go.' });
      b.sign(x, 2.6, 207.5, 'Dead end', { style: 'prank', w: 1.6 });
    }
  });
  station(211, 219);
  const bridgeSw = b.pswitch(lines[good] + (good === 2 ? -1.2 : 1.2), 0, 213.5, true);
  b.act('bridge', { op: 'all', in: [bridgeSw] }, true, [
    { x: -9.5, y: -5.4, z: 189.5, sx: 2, sy: 0.8, sz: 42.2, move: [0, 8, 0] }, // from the box's north door
  ], { speed: 7, mat: 'toy', color: cream, lamp: [-9.5, 3.6, 171] });
  b.floor(-8, 0, 213, 6, 4, { t: 1, color: plat }); // where the footbridge comes down
  b.sign(0, 3, 216.5, 'Made it? Pound the switch\nto bridge the signal tower!', { style: 'prank' });
  b.gem(-9.5, 4.4, 190);
  b.mark('box', -9.5, 3, 166);
  b.mark('good', lines[good], 0, 173.2);

  // -- 5. The last stretch: two cars, blocks on alternate tracks ---------------------------------------
  b.checkpoint(0, 0, 215, 6, { hint: 'Last stretch: two cars run side by side. Blocks ahead close off one track — hop to the other car to dodge them!' });
  const P5 = 16, D5 = 38;
  const left = car(2.4, 6, { type: 'linear', a: [-2.2, -0.3, 222.4], b: [-2.2, -0.3, 222.4 + D5], period: P5, phase: 0 }, '#ff9a3f');
  const right = car(2.4, 6, { type: 'linear', a: [2.2, -0.3, 222.4], b: [2.2, -0.3, 222.4 + D5], period: P5, phase: 0 }, '#b06bff');
  const blocks = [[-2.2, 233], [2.2, 243], [-2.2, 252]];
  for (const [x, z] of blocks) b.mover(2.6, 2.4, 1, { type: 'linear', a: [x, 1.35, z], b: [x, 1.35, z], period: 10, phase: 0 }, { steady: true, mat: 'hazard', color: '#ff5d5d', hazard: 'push' });
  b.floor(0, 0, 269.4, 12, 8, { color: plat }); // the end of the line, z 265.4–273.4
  b.gem(2.2, 1.4, 238);
  b.gem(-2.2, 1.4, 248);
  b.goal(0, 0, 270);
  b.mark('left', -2.2, 0, 0);
  b.mark('right', 2.2, 0, 0);

  b.objectives = [
    { text: 'Board when the train is in, ride across, jump the bars', done: { cp: 2 } },
    { text: 'One holds the gate, the other rides; then swap', done: { cp: 3 } },
    { text: 'Run from the last car to the front, jump off at the end', done: { cp: 4 } },
    { text: 'Read the train in the tower and dispatch it; the rider bridges the tower', done: { act: b.acts.find((a) => a.style === 'bridge').id } },
    { text: 'Two cars side by side: hop across to dodge the blocks, ride to the goal', done: {} },
  ];
  void c1; void c2; void cars3; void trains; void left; void right;
  return b.finish();
}
