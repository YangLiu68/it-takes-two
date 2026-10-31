// Level 2 · Magnet Pals: everything magnets can do, one idea per stage.
//   1. opposite colours attract: each of you swings along your own lane
//   2. same colour repels: launch pads, then bring your partner up (roles swap)
//   3. partner bond: only Sol can cross, then he calls Luna over
//   4. colour barriers split you up: Sol crosses a pit on wall pads, Luna swings up
//      ceiling pads, and each opens the other's door
//   5. relay islands: a pad flings you up to the next island, then you call your partner over; swap

import { LevelBuilder } from '../build.js';
import { PHYS } from '../constants.js';
import { hub, pillar, wallSteps } from './kit.js';

const SOL = 1, LUNA = -1; // pad polarity: Sol is drawn to LUNA pads, and vice versa
const DOWN = [0, -1, 0], UP = [0, 1, 0];

export function magnetPals(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'magnet-pals', name: 'Magnet Pals', label: `Level ${index + 1}`, theme: 'twilight', sky: 'night' });
  const wall = { color: '#5b4f8f' };
  const hook = (x, y, z) => b.box(x, y + 0.3, z, 1.4, 0.6, 1.4, { mat: 'metal' });

  // -- Stage 1: opposite colours attract -------------------------------------------------
  hub(b, 0, 0, 0, 14, 10, { hint: 'Opposites attract: blue magnets pull Sol, red magnets pull Luna. Look at a magnet and hold E; let go, then aim at the next one.' });
  b.sign(0, 3.2, 3.4, 'Hold E: zip to the other color\nLet go of E, aim at the next');
  for (const [x, pol] of [[-3.5, LUNA], [3.5, SOL]]) {
    b.box(x, 8.1, 15.5, 1.6, 1.0, 22, { mat: 'metal' });
    // Held up from the far end and from the side, so nothing blocks the view of the first pad.
    b.box(x * 1.6, 3.8, 4.6, 0.9, 7.6, 0.9, { mat: 'metal' });
    b.box(x * 1.3, 8.1, 4.6, Math.abs(x) * 0.6 + 0.9, 0.5, 0.6, { mat: 'metal' });
    b.box(x * 1.6, 3.8, 26.4, 0.9, 7.6, 0.9, { mat: 'metal' });
    b.box(x * 1.3, 8.1, 26.4, Math.abs(x) * 0.6 + 0.9, 0.5, 0.6, { mat: 'metal' });
    for (const z of [6.5, 11.5, 16.5, 21.5, 25.5]) b.pad(x, 7.58, z, DOWN, pol);
  }
  b.sign(-3.5, 4.4, 4.8, 'Sol: this way\n(blue magnets)', { w: 2.8 });
  b.sign(3.5, 4.4, 4.8, 'Luna: this way\n(red magnets)', { w: 2.8 });
  b.mark('lane', 3.5, 7.58, 0);

  // -- Stage 2: same colour repels ---------------------------------------------------------
  hub(b, 0, 0, 29.5, 14, 13, { hint: 'Same colors repel: Sol, stand on the red pad and hold E to shoot up. Up top, stand on the plate to raise the lift for Luna.' });
  b.gem(5.5, 1.2, 31.5);
  b.sign(-3, 3.0, 31, 'Same colors repel!\nSol: stand on red, hold E', { w: 3.6 });
  b.pad(-3, 0.08, 33.2, UP, SOL, { launch: [0, PHYS.repelSpeed, 0] });
  // Cliff A (7 m) with a lift shaft at x = 3.6.
  const H1 = 7;
  b.box(-2.6, (H1 - 1.6) / 2, 43, 8.8, H1 + 1.6, 14, wall); // x -7..1.8
  b.box(6.2, (H1 - 1.6) / 2, 43, 1.6, H1 + 1.6, 14, wall); // x 5.4..7
  b.box(3.6, (H1 - 1.6) / 2, 44.8, 3.6, H1 + 1.6, 10.4, wall); // behind the shaft
  const liftPlate = b.plate(3.6, H1, 41.4);
  b.act('lift', { op: 'any', in: [liftPlate] }, false, [
    { x: 3.6, y: -0.08, z: 37.8, sx: 3.4, sy: 0.4, sz: 3.4, move: [0, H1 - 0.12, 0] },
  ], { speed: 4.5, lamp: [3.6, H1 + 0.2, 39.4] });
  b.sign(3.6, 2.6, 34.6, 'Luna: wait on the lift\nfor Sol to hold the plate', { w: 3.4 });
  b.gem(-5.5, H1 + 1.2, 47.5);
  // Cliff B (another 7 m): now it's Luna's turn.
  const H2 = 14;
  b.box(0, (H2 - 1.6) / 2 + 0.5, 56, 14, H2 + 0.6, 12, wall);
  b.pad(3, H1 + 0.08, 47.4, UP, LUNA, { launch: [0, PHYS.repelSpeed, 0] });
  b.sign(3, H1 + 3.0, 46, 'Swap!\nLuna: stand on blue, hold E', { w: 3.6 });
  const stepSw = b.pswitch(-4.5, H2, 52.4, true);
  b.sign(-4.5, H2 + 2.6, 52.4, 'Pound the button:\nsteps for Sol', { w: 3 });
  wallSteps(b, stepSw, { x0: -5.6, dx: 2.3, faceZ: 50, fromTop: H1, toTop: H2, n: 3 });
  b.mark('padSol', -3, 0, 33.2);
  b.mark('liftPlate', 3.6, H1, 41.4);
  b.mark('lift', 3.6, 0, 37.8);
  b.mark('padLuna', 3, H1, 47.4);
  b.mark('stepSw', -4.5, H2, 52.4);

  // -- Stage 3: partner bond ----------------------------------------------------------------
  hub(b, 0, H2, 57, 14, 6, { hint: 'Only blue magnets here, so only Sol can swing across. On the far side, Sol holds E to call, then Luna holds E and flies over!' });
  b.sign(0, H2 + 3.2, 58.4, 'Partner pull:\nOne across holds E to call,\nthe other holds E to fly', { w: 4.4 });
  b.box(0, H2 + 8.1, 70, 1.6, 1.0, 22, { mat: 'metal' });
  for (const z of [59.6, 80.6]) {
    b.box(-2.4, H2 + 3.8, z, 0.9, 7.6, 0.9, { mat: 'metal' });
    b.box(-1.2, H2 + 8.1, z, 2.4, 0.5, 0.6, { mat: 'metal' });
  }
  for (const z of [65, 70, 75, 79.5]) b.pad(0, H2 + 7.58, z, DOWN, LUNA);
  b.gem(0, H2 + 6.4, 72.5);
  b.mark('bondFrom', 0, H2, 61.2);
  b.marks.bondPads = [65, 70, 75, 79.5].map((z) => [0, H2 + 7.58, z]);

  // -- Stage 4: colour barriers ----------------------------------------------------------------
  const F = H2, U = H2 + 7; // floor of the rooms, the ledges above
  hub(b, 0, F, 82, 21, 10, { hint: "Red barriers only let Sol through, blue ones only Luna. Each of you climbs up to a ledge and pounds the button that opens the other's door!" });
  b.wallGapsX(-10.5, 10.5, 87, 16, [[-5, 4], [5, 4]], { y: F, t: 0.6, lintel: 6, ...wall });
  b.field(-5, F + 3, 87, 4, 6, 0.3, SOL);
  b.field(5, F + 3, 87, 4, 6, 0.3, LUNA);
  b.sign(-5, F + 7.2, 86.4, 'Sol', { w: 1.4 });
  b.sign(5, F + 7.2, 86.4, 'Luna', { w: 1.4 });
  b.wallZ(87, 110, 0, 16, { y: F, t: 0.6, ...wall });
  b.wallZ(87, 120, -10.5, 18, { y: F, t: 0.6, ...wall });
  b.wallZ(87, 120, 10.5, 18, { y: F, t: 0.6, ...wall });
  // Sol's side: a pit, crossed on wall pads (blue) along the west wall, then his launch pad.
  b.floor(-5.25, F, 88.5, 10.5, 3, { t: 1.4 });
  b.floor(-5.25, F, 101.5, 10.5, 5, { t: 1.4 });
  const wallPads = [92, 95.5, 99, 102].map((z) => [-10.14, F + 3.0, z]);
  for (const [x, y, z] of wallPads) b.pad(x, y, z, [1, 0, 0], LUNA);
  b.sign(-5, F + 3.2, 89.4, 'Blue magnets on the wall:\nzip from one to the next', { w: 3.4 });
  b.pad(-5, F + 0.08, 102, UP, SOL, { launch: [0, PHYS.repelSpeed, 0] });
  // Luna's side: ceiling pads (red) climbing up and over the ledge.
  b.floor(5.25, F, 95.5, 10.5, 17, { t: 1.4 });
  const ceil = [[5, F + 5.5, 91], [5, F + 7.0, 95.5], [5, F + 8.5, 100], [5, U + 2.0, 106.5]];
  for (const [x, y, z] of ceil) {
    hook(x, y, z);
    b.pad(x, y - 0.02, z, DOWN, SOL);
  }
  b.gem(5, F + 6.9, 97.8);
  // The ledges, 7 m up.
  pillar(b, -5.25, U, 107, 10.5, 6, { depth: 9, ...wall });
  pillar(b, 5.25, U, 107, 10.5, 6, { depth: 9, ...wall });
  // Each side's button opens the other side's door.
  const swW = b.pswitch(-5, U, 108, true);
  const swE = b.pswitch(5, U, 108, true);
  b.sign(-5, U + 2.5, 108, "Pound: opens Luna's door", { w: 2.6 });
  b.sign(5, U + 2.5, 108, "Pound: opens Sol's door", { w: 2.6 });
  b.act('door', { op: 'all', in: [swE] }, true, [{ x: -5.25, y: U + 2.5, z: 110, sx: 10.4, sy: 5, sz: 0.6, move: [0, -5.4, 0] }], { speed: 8, lamp: [-5.25, U + 5.3, 109.6] });
  b.act('door', { op: 'all', in: [swW] }, true, [{ x: 5.25, y: U + 2.5, z: 110, sx: 10.4, sy: 5, sz: 0.6, move: [0, -5.4, 0] }], { speed: 8, lamp: [5.25, U + 5.3, 109.6] });
  b.wallX(-10.5, 10.5, 110, 4, { y: U + 5, t: 0.6, ...wall });
  b.mark('swW', -5, U, 108);
  b.mark('swE', 5, U, 108);
  b.mark('padSol2', -5, F, 102);
  b.marks.wallPads = wallPads;
  b.marks.ceil = ceil.map(([x, y, z]) => [x, y - 0.02, z]);

  // -- Stage 5: relay islands ------------------------------------------------------------------
  hub(b, 0, U, 117, 21, 14, { hint: "Relay: Luna's blue pad flings her up to the high island ahead, then she holds E to call Sol. On the island, swap: Sol launches, then calls Luna." });
  b.sign(-5.5, U + 3.4, 114, 'Up top: hold E to call\nDown below: hold E too', { w: 4 });
  const fling = [0, PHYS.repelSpeed, 9];
  b.pad(-3, U + 0.08, 122.4, UP, LUNA, { launch: fling });
  const T1 = U + 7, T2 = U + 14;
  pillar(b, 0, T1, 133, 20, 6, { depth: 9, ...wall });
  b.pad(3, T1 + 0.08, 134.4, UP, SOL, { launch: fling });
  pillar(b, 0, T2, 147, 20, 10, { depth: 9, ...wall });
  b.gem(0, T1 + 5.2, 127);
  b.goal(0, T2, 148, Math.PI);
  b.mark('relayLuna', -3, U, 122.4);
  b.mark('relaySol', 3, T1, 134.4);

  b.objectives = [
    { text: 'Take your own magnet lane: hold E to zip to the other color', done: { cp: 1 } },
    { text: 'Same colors repel: shoot up the cliff, then bring your partner up', done: { cp: 2 } },
    { text: 'Sol swings across, then calls Luna over', done: { cp: 3 } },
    { text: "Split up, climb the ledges and open each other's doors", done: { cp: 4 } },
    { text: 'Relay: launch up to the high islands and call your partner over', done: {} },
  ];
  return b.finish();
}
