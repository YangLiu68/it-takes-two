// Level 19 · Rising Lava (lava-rise): the lava is always coming up. Five ways of
// dealing with it — race it, hold it back for your partner, take turns holding
// each other's, throw each other up cliffs before it arrives, and a last sprint.

import { LevelBuilder } from '../build.js';
import { PHYS } from '../constants.js';
import { shaft, step, wallX, wallZ } from './kit4.js';

const ROCK = '#5a3a32';
const DARK = '#3a2622';
const WALL = { color: '#4a2c26' };

export function lavaRise(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'lava-rise', name: 'Rising Lava', label: `Level ${index + 1}`, theme: 'ember', sky: 'dusk' });

  // -- Start ---------------------------------------------------------------------
  b.floor(0, 0, 4.5, 12, 11, { color: ROCK });
  b.checkpoint(0, 0, 3, 6, { hint: 'The lava is rising! Touch it and you\'re back at the checkpoint — but the lava drains too, then rises again.' });
  b.sign(0, 3.2, 8, 'The lava is rising!\nTouch it: back to checkpoint.\nIt drains, then rises again.', {});

  // -- 1. Race it to the valve -------------------------------------------------------
  // A shaft with a spiral of steps; the first one up pounds the valve and the lava drains.
  b.floor(0, 0, 17, 12, 14, { color: DARK });
  shaft(b, -6, 6, 10, 24, 0, 16, { s: [-2, 2, 0, 3.4], n: [-3, 3, 12, 15.5] }, WALL);
  const trig1 = b.zone('trigger', 0, 1.5, 11, 4, 3, 2);
  const s1 = [[3.5, 1.4, 12.5], [3.5, 2.8, 17], [3.5, 4.2, 21.5], [-0.5, 5.6, 21.5], [-4, 7.0, 21.5], [-4, 8.4, 17], [-4, 9.8, 12.5], [0.5, 11.0, 15.5], [0, 11.6, 20]];
  s1.forEach(([x, t, z]) => step(b, x, t, z, 3, { color: ROCK }));
  b.gem(-0.5, 7.6, 21.5);
  b.floor(0, 12, 27, 6, 6, { color: ROCK }); // exit ledge
  const valve1 = b.pswitch(0, 12, 28.2, true, 1, '#4fd1ff');
  b.flood(0, 17, 12, 14, { y0: -3, y1: 11.4, speed: 0.5, when: trig1, until: valve1 });
  b.sign(0, 15.2, 26, 'Pressure valve: pound it (C)\nto drain the lava below', { style: 'prank' });
  b.mark('s1', 0, 0, 0);

  // -- 2. Hold it back ------------------------------------------------------------------
  // The lava here rises far too fast to outclimb — unless someone stands on the
  // cooling plate on the balcony. Then it stops dead, and the climber has all the time in the world.
  b.checkpoint(0, 12, 28.8, 4, { hint: 'The lava rises fast here! One of you jumps onto the right balcony and stands on the cooling plate to stop it; then the other climbs.' });
  b.floor(0, 8, 40, 16, 18, { color: DARK, t: 1 }); // pit floor
  shaft(b, -8, 8, 31, 49, 8, 30, { s: [-3, 8, 12, 16], n: [-4, 8, 24, 28] }, WALL);
  // Pillar under the ledge so the pit wall reads.
  b.floor(6.5, 13.6, 32.6, 3, 3, { color: ROCK, t: 5.6 }); // balcony
  const hold2 = b.plate(6.5, 13.6, 32.6);
  b.sign(6.5, 16.2, 32.6, 'Cooling plate\nStand here: lava stops', { style: 'prank' });
  step(b, -3, 13.2, 33.6, 3, { color: ROCK });
  const trig2 = b.zone('trigger', -3, 14.6, 33.6, 3, 2.4, 3);
  b.mover(3, 0.8, 3, { type: 'linear', a: [-5, 14.0, 38.2], b: [1, 14.0, 38.2], period: 5, phase: 0 }, { steady: true, color: '#c76b3a' });
  step(b, 4.5, 15.6, 41.6, 3, { color: ROCK });
  b.mover(3, 0.8, 3, { type: 'linear', a: [0, 15.2, 45], b: [0, 20.4, 45], period: 6, phase: 0 }, { steady: true, color: '#c76b3a' });
  step(b, -5, 22.4, 46, 3, { color: ROCK });
  b.gem(-2, 16.4, 38.2);
  b.floor(2, 24, 53, 12, 8, { color: ROCK }); // exit ledge
  const top2 = b.pswitch(2.2, 24, 51, true, 1, '#4fd1ff');
  b.sign(2.2, 26.6, 51, 'Pound it:\nlava drains, stairs come out', { style: 'prank' });
  // Steps slide out of the east wall from the balcony up to the top.
  const parts = [];
  for (let i = 0; i < 6; i++) {
    const top = 15.0 + i * 1.5;
    parts.push({ x: 10.2, y: top - 0.4, z: 35.6 + i * 2.4, sx: 2.2, sy: 0.8, sz: 2, move: [-4, 0, 0], delay: i * 0.12 });
  }
  b.act('steps', { op: 'all', in: [top2] }, true, parts, { speed: 4, mat: 'toy', color: '#ffb347', lamp: [7.6, 16.6, 34] });
  b.flood(0, 40, 16, 18, { y0: 6, y1: 23, speed: 1.3, when: trig2, hold: hold2, until: top2 });
  b.mark('ledge2', 0, 12, 29);

  // -- 3. Take turns ------------------------------------------------------------------------
  // Two shafts side by side, one each. Your lava only stops while your partner
  // stands on one of the plates in THEIR shaft — so you climb in turns.
  b.checkpoint(0, 24, 54.5, 5, { hint: 'Sol takes the red door, Luna the blue one. The lava under you only stops while your partner stands on a plate on their side — take turns standing and climbing!' });
  const B3 = 24;
  b.floor(0, B3, 58.5, 18, 3, { color: ROCK }); // corridor
  b.floor(-4, B3, 65, 8, 10, { color: DARK });
  b.floor(4, B3, 65, 8, 10, { color: DARK });
  wallZ(b, 60, 70, -8.25, B3, B3 + 20, null, WALL);
  wallZ(b, 60, 70, 8.25, B3, B3 + 20, null, WALL);
  wallX(b, -8.5, 8.5, 70.25, B3, B3 + 20, [-8, 8, B3 + 15, B3 + 19], WALL);
  // South wall with a door into each shaft.
  for (const [a0, a1] of [[-8.5, -5.5], [-2.5, 2.5], [5.5, 8.5]]) b.box((a0 + a1) / 2, B3 + 10, 59.75, a1 - a0, 20, 0.5, WALL);
  b.box(-4, B3 + 12, 59.75, 3, 16, 0.5, WALL);
  b.box(4, B3 + 12, 59.75, 3, 16, 0.5, WALL);
  b.box(0, B3 + 10, 65, 0.4, 20, 10, { color: '#7a4a40' }); // divider
  b.field(-4, B3 + 2, 59.75, 3, 4, 0.3, 1);
  b.field(4, B3 + 2, 59.75, 3, 4, 0.3, -1);
  b.sign(-4, B3 + 5, 59.4, 'Sol', { style: 'prank', w: 1.6 });
  b.sign(4, B3 + 5, 59.4, 'Luna', { style: 'prank', w: 1.6 });
  const trig3 = b.zone('trigger', 0, B3 + 1.5, 61.5, 16, 3, 2);
  // Spiral of steps: every 4th step is above the first, 6 m up.
  const corners = [[2, 62.5], [6, 62.5], [6, 67.5], [2, 67.5]];
  const climb = (side) => {
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const [cx, cz] = corners[i % 4];
      pts.push([side * cx, B3 + 1.5 * (i + 1), cz]);
    }
    return pts;
  };
  const solPts = climb(-1), lunaPts = climb(1);
  for (const [x, t, z] of [...solPts, ...lunaPts]) step(b, x, t, z, 3, { color: ROCK });
  // Plates: Sol's at +3, +9, Luna's at +6, +12; the top ledge has one more for Sol.
  const sP1 = b.plate(solPts[1][0], solPts[1][1], solPts[1][2]);
  const sP2 = b.plate(solPts[5][0], solPts[5][1], solPts[5][2]);
  const lP1 = b.plate(lunaPts[3][0], lunaPts[3][1], lunaPts[3][2]);
  const lP2 = b.plate(lunaPts[7][0], lunaPts[7][1], lunaPts[7][2]);
  b.floor(0, B3 + 15, 73, 18, 6, { color: ROCK }); // top ledge
  const sP3 = b.plate(-4, B3 + 15, 72.4);
  b.sign(-4, B3 + 17.4, 72.4, 'Sol, stand here\nto hold Luna\'s lava', { style: 'prank' });
  const trig4 = b.zone('trigger', 0, B3 + 16.5, 75.2, 18, 3, 1.5);
  b.flood(-4, 65, 8, 10, { y0: B3 - 2.5, y1: B3 + 13.8, speed: 0.7, when: trig3, hold: [lP1, lP2], until: trig4 });
  b.flood(4, 65, 8, 10, { y0: B3 - 2.5, y1: B3 + 13.8, speed: 0.7, when: trig3, hold: [sP1, sP2, sP3], until: trig4 });
  b.gem(solPts[6][0], solPts[6][1] + 1.6, solPts[6][2]);
  b.marks.solPts = solPts;
  b.marks.lunaPts = lunaPts;

  // -- 4. Throw each other up ---------------------------------------------------------------
  // Cliffs too tall to climb. One stands on a seesaw end, the other pounds the
  // other end; whoever flies up pounds the switch that lets the steps out.
  const B4 = B3 + 15; // 39
  b.checkpoint(0, B4, 78, 6, { hint: 'The cliff is too tall to climb: one stands on one end of the seesaw, the other pounds the other end (C) to fling them up. Whoever is up top pounds the switch to let the stairs out! The lava is slowly rising.' });
  b.floor(0, B4, 81, 16, 10, { color: ROCK }); // 76..86
  const cliff = (base, z, label) => {
    // Seesaw at z, cliff face 5 m beyond it, 8.6 m above the seesaw.
    b.seesaw(0, base + 1.0, z, 9.2, 2.4);
    const H = 9.6;
    const face = z + 5;
    b.box(0, base + H / 2 - 0.5, face + 4, 16, H + 1, 8, { color: ROCK });
    const sw = b.pswitch(-4.5, base + H, face + 3.5, true);
    const steps = [];
    for (let i = 0; i < 5; i++) {
      const top = base + (H * (i + 1)) / 6;
      steps.push({ x: -5.5 + i * 2.3, y: top - 0.4, z: face + 1.6, sx: 2.2, sy: 0.8, sz: 2, move: [0, 0, -2.6], delay: i * 0.15 });
    }
    b.act('steps', { op: 'all', in: [sw] }, true, steps, { speed: 3, mat: 'toy', color: '#ffd166', lamp: [-4.5, base + H + 0.3, face - 0.4] });
    b.sign(-4.5, base + H + 2.6, face + 3.5, label, { style: 'prank' });
    return { sw, top: base + H, face };
  };
  const c1 = cliff(B4, 81, 'Pound the switch:\nstairs for your partner');
  b.floor(0, c1.top, 98.5, 16, 9, { color: ROCK }); // 94..103, in front of cliff 2 (joins cliff 1's top)
  const c2 = cliff(c1.top, 98, 'Pound it again!');
  const trig5 = b.zone('trigger', 0, B4 + 1.5, 77, 16, 3, 2);
  b.flood(0, 93, 16, 34, { y0: B4 - 6, y1: c1.top + 7.6, speed: 0.22, when: trig5, until: c2.sw });
  b.gem(5.5, c1.top + 1.4, 92);
  b.marks.cliffs = [[0, B4, 81, c1.face, c1.top], [0, c1.top, 98, c2.face, c2.top]];

  // -- 5. The last climb --------------------------------------------------------------------
  const B5 = c2.top; // 57.8
  b.checkpoint(0, B5, 113, 6, { hint: 'Last stretch! The lava starts rising the moment you step on the first block. Race to the summit and both stand on the two plates.' });
  b.floor(0, B5, 113, 16, 6, { color: ROCK }); // 110..116 (joins cliff 2's top 103..111)
  const run = [[3, 1.4, 119], [-1, 2.8, 123.5], [-5, 4.2, 128], [-1, 5.6, 132.5], [3, 7.0, 137], [-1, 8.4, 141.5], [-5, 9.8, 146]];
  run.forEach(([x, dt, z]) => step(b, x, B5 + dt, z, 3, { color: ROCK }));
  const trig6 = b.zone('trigger', run[0][0], B5 + run[0][1] + 1.2, run[0][2], 3, 2.4, 3);
  const SUM = B5 + 11.2;
  b.floor(0, SUM, 153, 16, 8, { color: ROCK }); // 149..157
  const pA = b.plate(-5, SUM, 154);
  const pB = b.plate(5, SUM, 154);
  const both = b.act('bridge', { op: 'all', in: [pA, pB] }, true, [
    { x: 0, y: SUM - 0.4 - 6, z: 160, sx: 4, sy: 0.8, sz: 6, move: [0, 6, 0] },
  ], { speed: 4, mat: 'toy', color: '#4fd1ff', lamp: [0, SUM + 0.6, 157.4] });
  b.flood(0, 133, 16, 32, { y0: B5 - 3, y1: SUM - 0.3, speed: 0.6, when: trig6, until: pA });
  b.sign(0, SUM + 2.8, 152, 'Both of you,\nstand on the plates', { style: 'prank' });
  b.gem(-5, B5 + 11.6, 146);
  b.floor(0, SUM, 168, 10, 10, { color: ROCK });
  b.goal(0, SUM, 168);
  b.marks.run = run.map(([x, dt, z]) => [x, B5 + dt, z]);

  b.objectives = [
    { text: 'Climb to the top and pound the valve', done: { sig: valve1 } },
    { text: 'One holds the cooling plate, the other climbs and pounds the switch', done: { sig: top2 } },
    { text: 'Climb the two shafts: take turns on plates to hold back each other\'s lava', done: { sig: trig4 } },
    { text: 'Fling each other up the cliffs with the seesaws', done: { sig: c2.sw } },
    { text: 'Race to the summit, both on the plates', done: { act: both } },
    { text: 'Reach the goal!', done: {} },
  ];
  void PHYS;
  return b.finish();
}
