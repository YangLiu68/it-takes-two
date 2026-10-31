// Obstacle courses with prank blocks: blocks that vanish, slide away,
// fling you the wrong way or punch you off — plus a reveal plate so one
// partner can see the tricks and call them out to the other.

import { LevelBuilder } from './build.js';

const PINK = '#ff7eb6';

function prankPark(index) {
  const b = new LevelBuilder({ mode: 'course', index, seed: 'prank-park', name: 'Prank Park', label: 'Course 1', theme: 'candy', sky: 'day' });
  const r = b.rng;

  // -- 0. Trust nothing ---------------------------------------------------------
  b.floor(0, 0, 0, 12, 12, { mat: 'wood' });
  b.checkpoint(0, 0, 0, 10, { hint: 'Trust nothing in Prank Park! One of you stands on the eye plate to see through the tricks — then tells the other where to step.' });
  const eye = b.plate(-3.5, 0, 3.5);
  b.sign(-3.5, 3.3, 3.5, 'Eye plate:\nstand here to see the tricks', { style: 'prank' });
  const rows = [9.5, 15, 20.5, 26, 31.5, 37];
  const mean = ['vanish', 'fake', 'drop', 'vanish', 'fake', 'drop'];
  rows.forEach((z, i) => {
    const bad = r.sign();
    for (const side of [-1, 1]) {
      const x = side * 3.5;
      const color = b.color();
      if (side === bad) b.trap(mean[i], x, 0, z, 3, 3, { reveal: eye, color });
      else b.floor(x, 0, z, 3, 3, { color, t: 1 });
      if (i === 2 && side === bad) b.gem(x, 2.2, z); // a button floating over a fake, of course
    }
  });
  // Far side: a button that raises a bridge for whoever stayed behind.
  b.floor(0, 0, 49, 12, 18, { mat: 'wood' });
  const sw = b.pswitch(3.5, 0, 44, true);
  const parts = [];
  for (let i = 0; i < 8; i++) parts.push({ x: 0, y: -0.3 - 9, z: 6.3 + (33.4 / 8) * (i + 0.5), sx: 2.4, sy: 0.6, sz: 33.4 / 8 - 0.06, move: [0, 9, 0], delay: i * 0.1 });
  b.act('bridge', { op: 'all', in: [sw] }, true, parts, { speed: 16, mat: 'toy', color: PINK, lamp: [3.5, 0.6, 41.6] });
  b.sign(3.5, 3.0, 44, 'Pound this button to raise\na bridge for your partner', { style: 'prank' });

  // -- 1. Springs ------------------------------------------------------------------
  b.checkpoint(0, 0, 52, 10, { hint: 'Springs! Only one is honest — the others fling you... somewhere else. Watch where your partner lands.' });
  const honest = r.int(0, 2);
  const liars = r.shuffle([[0, 15, -11], [0, 25, 0]]);
  [-4, 0, 4].forEach((x, i) => {
    const launch = i === honest ? [0, 16, 21] : liars.pop();
    b.trap('launch', x, 0.6, 55.5, 2.6, 2.6, { t: 0.6, look: 'spring', color: '#ffb7d5', launch, reset: 2 });
  });
  b.sign(0, 3.6, 57, 'Only ONE spring is honest!', { style: 'prank' });
  b.gem(0, 9.5, 66);
  b.floor(0, 0, 78, 12, 12, { mat: 'wood' });

  // -- 2. Slippery steps -----------------------------------------------------------
  b.checkpoint(0, 0, 78, 10, { hint: 'Some steps slide away, some drop, some vanish. Keep jumping — don\'t stand still!' });
  const kinds = ['safe', ...r.shuffle(['slide', 'slide', 'drop', 'vanish']), 'safe'];
  kinds.forEach((k, i) => {
    const z = 87 + i * 4.5;
    const x = [0, 1.2, -1.2, 0.6, -0.8, 0][i];
    const color = b.color();
    if (k === 'safe') b.floor(x, 0, z, 3, 3, { color });
    else if (k === 'slide') b.trap('slide', x, 0, z, 3, 3, { color, move: [r.sign() * 8, 0, 0], delay: 0.18, hold: 1.4 });
    else b.trap(k, x, 0, z, 3, 3, { color, delay: 0.2 });
  });
  b.gem(-0.8, 2.6, 105);
  b.floor(0, 0, 117, 12, 10, { mat: 'wood' });

  // -- 3. Punch alley ----------------------------------------------------------------
  b.checkpoint(0, 0, 117, 10, { hint: 'Boxing gloves hide in the posts! The red plate turns off the red gloves, the blue plate the blue ones. One stands, one runs — then swap.' });
  const red = b.plate(-3.5, 0, 119.5);
  const blue = b.plate(3.5, 0, 153);
  b.sign(-3.5, 3.0, 119.5, 'Red plate:\nturns off the RED gloves', { style: 'prank' });
  b.sign(3.5, 3.0, 153, 'Blue plate:\nturns off the BLUE gloves', { style: 'prank' });
  const tiles = [125.5, 131.5, 137.5, 143.5];
  let z0 = 122;
  tiles.forEach((z, i) => {
    b.floor(0, 0, (z0 + z - 1.5) / 2, 3, z - 1.5 - z0, { mat: 'wood' });
    const group = i % 2 ? blue : red;
    b.trap('punch', 0, 0, z, 3, 3, { side: i % 2 ? 1 : -1, delay: 0.04, off: group, postColor: i % 2 ? '#4f86ff' : '#ff5d5d', color: '#ffd6e8' });
    z0 = z + 1.5;
  });
  b.floor(0, 0, (z0 + 150) / 2, 3, 150 - z0, { mat: 'wood' });
  b.gem(0, 2.4, 140.5);
  b.floor(0, 0, 155, 12, 10, { mat: 'wood' });

  // -- 4. The big finish (it isn't) ---------------------------------------------------
  b.checkpoint(0, 0, 156, 10, { hint: 'The finish! At last... right?' });
  b.floor(0, 0, 163, 4, 6, { mat: 'wood' });
  b.trap('drop', 0, 0, 172, 12, 12, { delay: 0.35, reset: 4, color: '#fff0a8' });
  b.fakeGoals.push({ x: 0, y: 0, z: 172, yaw: 0 });
  // The pit you land in, and the way out: invisible stairs.
  b.floor(0, -12, 177, 22, 32, { mat: 'wood' });
  b.sign(0, -8.4, 168, 'Gotcha!\nThe real finish is up there.\nFind the invisible stairs!', { style: 'prank' });
  const pitEye = b.plate(-7, -12, 172);
  b.sign(-7, -9, 172, 'Eye plate', { style: 'prank' });
  let top = -12;
  for (let k = 0; k < 10; k++) {
    top += 1.8;
    const x = k % 2 ? 1.5 : 6;
    const z = 165 + k * 2.7;
    b.trap('hidden', x, top, z, 3, 3, { reveal: [pitEye, 'goalEye'], color: '#7dffb0' });
  }
  b.gem(6, -12 + 1.8 * 9 + 2, 165 + 8 * 2.7);
  b.floor(0, 6, 197, 12, 12, { mat: 'wood' });
  const topEye = b.plate(-4, 6, 193);
  for (const t of b.traps) if (Array.isArray(t.reveal)) t.reveal = [pitEye, topEye];
  b.sign(-4, 9, 193, 'Eye plate —\nshows your partner the stairs', { style: 'prank' });
  b.goal(2, 6, 198);
  return b.finish();
}

export const COURSES = [
  { key: 'prank-park', title: 'Prank Park', blurb: 'Vanishing blocks, lying springs, boxing gloves and a fake finish. Trust nothing.', build: prankPark },
];
