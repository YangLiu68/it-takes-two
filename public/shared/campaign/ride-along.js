// Level 10 · Ride Along: one of you rides, the other drives — and every stage
// drives differently: a ferry that runs while you hold a plate, a crane you
// park over the one real pillar, a carriage you stop so your rider can hop
// off and hit the gate switches, a lift that only climbs while a timer runs,
// and a cargo run through pistons where each of you carries what only you can.

import { LevelBuilder } from '../build.js';
import { slab, piston } from './kit2.js';

export function rideAlong(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'ride-along', name: 'Ride Along', label: `Level ${index + 1}`, theme: 'bath', sky: 'day' });
  const r = b.rng;
  const deck = '#7fd1e8';

  // -- 0. Start -------------------------------------------------------------------------
  slab(b, 0, 0, 0, 12, 10);
  b.checkpoint(0, 0, -0.5, 8, { hint: 'The ferry: while someone stands on the plate, it sails across; with nobody on it, it comes back. One drives the ferry over with their partner aboard, then the partner holds the plate on the far side to fetch them!' });

  // -- 1. The ferry ---------------------------------------------------------------------------
  const fA = b.plate(-3.5, 0, 2.2);
  const fB = b.plate(3.5, 0, 28);
  b.act('carrier', { op: 'any', in: [fA, fB] }, false, [
    { x: 0, y: -0.3, z: 7.3, sx: 4.2, sy: 0.6, sz: 4.2, move: [0, 0, 15.4] },
  ], { speed: 4.2, mat: 'toy', color: deck, lamp: [0, 0.6, 6.2] });
  b.mover(0.7, 0.7, 10, { type: 'linear', a: [-6, 1.05, 15], b: [6, 1.05, 15], period: 3.6, phase: 0.25 }, { mat: 'hazard', color: '#ff5d5d', hazard: 'push', steady: true });
  b.sign(0, 3.3, 4.2, 'The plate drives the ferry—\njump when the bar comes!', { style: 'prank' });
  b.wire(fA, [[-3.5, 0, 2.2], [-3.5, 0, 4.6], [-1.4, 0, 4.6]]);
  b.gem(0, 2.6, 15);
  b.mark('fA', -3.5, 0, 2.2);
  b.mark('fB', 3.5, 0, 28);

  // -- 2. The crane over the pillars ------------------------------------------------------------
  slab(b, 0, 0, 29, 12, 8);
  slab(b, 10, 0, 29, 8, 8); // east wing for the bridge
  b.checkpoint(-1, 0, 29.5, 6, { hint: 'The crane: hold the plate and it slides sideways; step off and it stops. Only one pillar is real — stand on the "eye" plate to spot the fakes. Park the crane in front of the real pillar so your partner can jump across!' });
  const pCrane = b.plate(-4.5, 0, 31.4);
  const pEye = b.plate(4.5, 0, 31.4);
  const crane = b.mover(3.6, 0.8, 3.6, { type: 'linear', a: [-10, -0.4, 37], b: [10, -0.4, 37], period: 12, phase: 0 }, { steady: true, color: deck });
  crane.run = [pCrane];
  const real = r.int(0, 6);
  const px = (i) => -9 + 3 * i;
  const PZ = 46, PT = 2.5;
  for (let i = 0; i < 7; i++) {
    if (i === real) slab(b, px(i), PT, PZ, 2, 2, { mat: 'toy', t: 16 });
    else b.trap('fake', px(i), PT, PZ, 2, 2, { t: 16, reveal: [pEye] });
  }
  b.gem(px(real), PT + 1.2, PZ);
  b.sign(-4.5, 2.6, 33.2, 'Crane plate\n(hold: move, step off: stop)', { style: 'prank' });
  b.sign(4.5, 2.6, 33.2, '"Eye" plate\nspots the fake pillars', { style: 'prank' });
  const Y3 = 4.5;
  slab(b, 1.5, Y3, 55, 27, 8, { t: 3 }); // the far side (x -12..15, z 51..59)
  const lower = b.pswitch(11, Y3, 53, true);
  const planks = [];
  for (let k = 0; k < 4; k++) planks.push({ x: 13.5, y: 1.1 * (k + 1) - 0.6 - 9, z: 35.25 + 4.5 * k, sx: 3, sy: 1.2, sz: 4.5, move: [0, 9, 0], delay: k * 0.1 });
  b.act('bridge', { op: 'all', in: [lower] }, true, planks, { speed: 14, mat: 'toy', lamp: [13.5, 0.6, 33.6] });
  b.sign(11, Y3 + 2.8, 54.6, 'Pound the button:\nsteps for your partner', { style: 'prank' });
  b.mark('pCrane', -4.5, 0, 31.4);
  b.mark('pEye', 4.5, 0, 31.4);
  b.mark('real', px(real), PT, PZ);
  b.mark('lower', 11, Y3, 53);
  planks.forEach((p, k) => b.mark(`plank${k}`, p.x, p.y + 9 + 0.6, p.z));

  // -- 3. The carriage: stop so your rider can open the gates --------------------------------------
  b.checkpoint(-4, Y3, 55.5, 6, { hint: 'The car only moves while someone holds the plate. Two gates are shut ahead — the driver stops next to each switch pillar, and the rider hops over, pounds the switch and hops back on!' });
  const pDrive = b.plate(-9, Y3, 56);
  const pFar = b.plate(4, Y3, 106);
  const car = b.mover(4, 0.8, 3.6, { type: 'linear', a: [0, Y3 - 0.4, 61], b: [0, Y3 - 0.4, 101.2], period: 24, phase: 0 }, { steady: true, color: deck });
  car.run = [pDrive, pFar];
  const gateSw = [];
  for (const [gz, sz] of [[74, 69], [88, 83]]) {
    const sw = b.pswitch(5, Y3, sz, true);
    gateSw.push(sw);
    slab(b, 5, Y3, sz, 2.2, 2.2, { mat: 'metal', t: 14 });
    const frame = { color: '#3f7f9a' };
    b.box(-3.2, Y3 - 2, gz, 1.2, 16, 0.6, frame);
    b.box(3.2, Y3 - 2, gz, 1.2, 16, 0.6, frame);
    b.box(0, Y3 + 5.2, gz, 5.2, 1.6, 0.6, frame);
    b.act('door', { op: 'all', in: [sw] }, true, [{ x: 0, y: Y3 + 2.3, z: gz, sx: 5.2, sy: 3.8, sz: 0.5, move: [0, 4.2, 0] }], { speed: 8, color: '#ffd166', lamp: [2.4, Y3 + 4.6, gz - 0.5] });
  }
  b.gem(5, Y3 + 1.2, 83);
  b.sign(-9, Y3 + 2.6, 57.6, 'Drive plate', { style: 'prank' });
  slab(b, 0, Y3, 108, 12, 10); // the end dock (z 103..113)
  b.mark('pDrive', -9, Y3, 56);
  b.mark('pFar', 4, Y3, 106);
  b.mark('sw0', 5, Y3, 69);
  b.mark('sw1', 5, Y3, 83);

  // -- 4. The timed lift --------------------------------------------------------------------------
  b.checkpoint(0, Y3, 107, 5, { hint: 'The lift only moves while the timer switch is lit, just a short way each time. Each bar sweeps only half the lift — when it stops, the rider moves to the other half and waits for their partner to pound the switch again!' });
  const Y5 = Y3 + 20;
  const tSw = b.pswitch(-4, Y3, 111, false, 4);
  const pTop = b.plate(-3, Y5, 121);
  const lift = b.mover(3.6, 0.8, 3.6, { type: 'linear', a: [0, Y3 - 0.4, 115], b: [0, Y5 - 0.4, 115], period: 20, phase: 0 }, { steady: true, color: deck });
  lift.run = [tSw, pTop];
  // Each bar sweeps only one half of the lift: when it stops, stand on the other half.
  for (const [dy, bz, period] of [[7.6, 114, 2.4], [18.6, 116, 2.6]]) {
    b.mover(0.7, 0.7, 2, { type: 'linear', a: [-5, Y3 + dy, bz], b: [5, Y3 + dy, bz], period, phase: 0 }, { mat: 'hazard', color: '#ff5d5d', hazard: 'push', steady: true });
  }
  b.box(0, Y3 + 10, 118.5, 6, 20, 0.6, { color: '#b9e3ef' }); // the tower face behind the lift
  slab(b, 0, Y5, 121.5, 10, 7); // top ledge (z 118..125)
  b.sign(-4, Y3 + 2.6, 112.6, 'Timer switch: lift runs 4 sec', { style: 'prank' });
  b.gem(0, Y3 + 12.5, 115);
  b.mark('tSw', -4, Y3, 111);
  b.mark('pTop', -3, Y5, 121);

  // -- 5. Cargo through the pistons -----------------------------------------------------------------
  b.checkpoint(0.6, Y5, 119.9, 4, { hint: "Two crates: only Sol can carry the red one, only Luna the blue one. One drives the raft, the other holds a crate and stands on the side the pistons can't reach — get both crates to the shelf on the far side!" });
  const red = b.item('crate', -3.5, Y5 + 1, 123.6, { who: 0, color: '#ff6b4a', label: 'Red Crate' });
  const blue = b.item('crate', 3.5, Y5 + 1, 123.6, { who: 1, color: '#4f86ff', label: 'Blue Crate' });
  const pS = b.plate(4, Y5, 120);
  const pE = b.plate(3.6, Y5, 151);
  b.act('carrier', { op: 'any', in: [pS, pE] }, false, [
    { x: 0, y: Y5 - 0.3, z: 127.4, sx: 4.2, sy: 0.6, sz: 4.2, move: [0, 0, 18.4] },
  ], { speed: 3.2, mat: 'toy', color: deck, lamp: [0, Y5 + 0.6, 125.4] });
  [131, 136.5, 142].forEach((zc, i) => piston(b, i % 2 ? 1 : -1, zc, { y: Y5 + 0.7, period: 2.2, phase: i * 0.33, reach: 1.1 }));
  slab(b, 0, Y5, 153, 12, 10); // the far dock (z 148..158)
  const shelf = b.lock(-3, Y5, 155, [red, blue], { label: 'Cargo Shelf' });
  const wc = '#3f7f9a';
  b.box(-4.4, Y5 + 3, 158.5, 5.2, 6, 0.6, { color: wc });
  b.box(4.4, Y5 + 3, 158.5, 5.2, 6, 0.6, { color: wc });
  b.act('door', { op: 'all', in: [shelf] }, true, [{ x: 0, y: Y5 + 2.2, z: 158.5, sx: 3.6, sy: 4.4, sz: 0.5, move: [0, -4.8, 0] }], { speed: 8, lamp: [0, Y5 + 5, 158] });
  b.sign(0, Y5 + 3.4, 124.8, 'Red crate: Sol\nBlue crate: Luna', { style: 'prank' });
  b.gem(0, Y5 + 2.4, 136);
  slab(b, 0, Y5, 163, 10, 8);
  b.mark('pS', 4, Y5, 120);
  b.mark('pE', 3.6, Y5, 151);
  b.mark('shelf', -3, Y5, 155);
  b.goal(0, Y5, 164);

  b.objectives = [
    { text: 'Drive the ferry and take turns carrying each other across', done: { cp: 1 } },
    { text: 'Park the crane by the real pillar, jump over and lower the bridge', done: { sig: lower } },
    { text: 'Stop the car so your partner can hop off and open both gates', done: { cp: 3 } },
    { text: 'Run the lift with the timer switch and dodge the bars to the top', done: { cp: 4 } },
    { text: 'Deliver the red and blue crates to the far shelf', done: { sig: shelf } },
    { text: 'Reach the goal', done: {} },
  ];
  void gateSw;
  return b.finish();
}
