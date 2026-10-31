// Level 6 · Crumbling Path: tiles that fall away a moment after you land (and come back
// a few seconds later). Every stage uses that differently:
//   1. don't stop: two side-by-side crumbling paths, one each
//   2. hold the way open: Sol runs the crumbling path, then holds a plate for Luna's bridge
//   3. fill the gaps: Luna pounds timed switches that raise planks across Sol's gaps
//   4. twin towers: two crumbling spirals, one each, climbed side by side
//   5. the collapsing arena: cross it to two corner plates, then to the steps they raise

import { LevelBuilder } from '../build.js';
import { hub, pillar, wallSteps } from './kit.js';

export function crumbleRun(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'crumble-run', name: 'Crumbling Path', label: `Level ${index + 1}`, theme: 'ember', sky: 'dusk' });
  const rock = { color: '#8f6bff' };

  // -- Stage 1: don't stop --------------------------------------------------------------------
  hub(b, 0, 0, 0, 12, 10, { hint: 'Cracked tiles drop a moment after you step on them (they come back a few seconds later). Keep moving! One column each.' });
  b.sign(0, 3.2, 3.4, 'Cracked tiles crumble!\nKeep moving', { w: 4 });
  const row1 = [[7.5, 0], [11.3, 0.4], [15.1, 0.8], [18.9, 0.8], [22.7, 1.2], [26.5, 1.2]];
  for (const x of [-1.6, 1.6]) {
    row1.forEach(([z, top], i) => {
      if (i === 2) pillar(b, x, top, z, 2.6, 2.6, rock); // one safe stone each
      else b.crumble(x, top, z, 2.6, 2.6);
    });
  }
  b.gem(-1.6, 3.0, 15.1);
  b.marks.row1 = row1;

  // -- Stage 2: hold the way open --------------------------------------------------------------
  hub(b, 0, 1.2, 33, 14, 8, { hint: "Only Sol can take the crumbling path behind the red barrier. Once across, Sol stands on the plate and Luna's bridge stays up." });
  b.wallGapsX(-7, 7, 37.1, 4, [[-3, 3], [3, 3]], { y: 1.2, t: 0.4, color: '#b8784a' });
  b.field(-3, 3.2, 37.1, 3, 4, 0.3, 1);
  const row2 = [39.4, 43, 46.6, 50.2, 53.6];
  row2.forEach((z, i) => b.crumble(-3 + (i % 2 ? 0.6 : -0.6), 1.2, z, 2.4, 2.4));
  b.gem(-3, 3.6, 46.6);
  b.floor(0, 1.2, 59, 14, 8, { mat: 'wood' });
  const holdPlate = b.plate(3, 1.2, 57.4);
  const parts = [];
  for (let i = 0; i < 7; i++) parts.push({ x: 3, y: 0.9 - 9, z: 38.5 + i * 2.75, sx: 3, sy: 0.6, sz: 2.7, move: [0, 9, 0], delay: i * 0.06 });
  b.act('bridge', { op: 'any', in: [holdPlate] }, false, parts, { speed: 18, mat: 'toy', color: '#ffb84d', lamp: [3, 1.8, 37.6] });
  b.wire(holdPlate, [[3, 1.2, 57.4], [3, 1.2, 55.4]]);
  b.sign(3, 3.8, 57.4, "Sol: hold the plate\nto keep Luna's bridge up", { w: 2.8 });
  b.marks.row2 = row2.map((z, i) => [-3 + (i % 2 ? 0.6 : -0.6), 1.2, z]);
  b.mark('holdPlate', 3, 1.2, 57.4);

  // -- Stage 3: fill the gaps --------------------------------------------------------------------
  b.checkpoint(0, 1.2, 59.5, 6, { hint: "On the left is Sol's crumbling path with two big gaps; on the right, Luna's walkway. Luna runs ahead and pounds switches to raise planks — Sol can only stop on the planks!" });
  b.wallGapsX(-7, 7, 62.8, 4, [[-3, 3], [4.5, 3]], { y: 1.2, t: 0.4, color: '#b8784a' });
  b.field(-3, 3.2, 62.8, 3, 4, 0.3, 1);
  b.field(4.5, 3.2, 62.8, 3, 4, 0.3, -1);
  b.floor(4.5, 1.2, 89, 3, 52, { mat: 'wood' }); // Luna's walkway, z 63..115
  // Gaps of 14.6 m: too far even with a dash — they need the planks.
  const runner = [[65.5, 'c'], [69.3, 'c'], [73.5, 'p1'], [81.5, 'p1'], [86.5, 'c'], [90.3, 'c'], [94.5, 'p2'], [102.5, 'p2'], [107.5, 'c'], [111.3, 'c']];
  for (const [z, k] of runner) if (k === 'c') b.crumble(-3, 1.2, z, 2.6, 2.6);
  const S1 = b.pswitch(4.5, 1.2, 74, false, 10);
  const S2 = b.pswitch(4.5, 1.2, 95, false, 10);
  b.act('bridge', { op: 'all', in: [S1] }, false, [{ x: -3, y: 0.9 - 9, z: 77.65, sx: 2.6, sy: 0.6, sz: 15.1, move: [0, 9, 0] }], { speed: 20, mat: 'toy', color: '#ffe066', lamp: [-3, 1.8, 70] });
  b.act('bridge', { op: 'all', in: [S2] }, false, [{ x: -3, y: 0.9 - 9, z: 98.65, sx: 2.6, sy: 0.6, sz: 15.1, move: [0, 9, 0] }], { speed: 20, mat: 'toy', color: '#ffe066', lamp: [-3, 1.8, 91] });
  b.wire(S1, [[4.5, 1.2, 74], [-1.6, 1.2, 74]]);
  b.wire(S2, [[4.5, 1.2, 95], [-1.6, 1.2, 95]]);
  b.sign(4.5, 3.8, 72, 'Pound the switch:\nplanks for Sol (10 sec)', { w: 3.2 });
  b.gem(-3, 3.2, 98.6);
  b.marks.runner = runner.map(([z, k]) => [-3, 1.2, z, k]);
  b.mark('S1', 4.5, 1.2, 74);
  b.mark('S2', 4.5, 1.2, 95);

  // -- Stage 4: twin towers --------------------------------------------------------------------------
  hub(b, 0, 1.2, 119.5, 16, 9, { hint: 'Two crumbling towers, one each — climb together! At the top, cross the bridge in the middle.' });
  const R = 4.2, TOP = 13.2;
  const towers = [[], []];
  [-6, 6].forEach((cx, s) => {
    pillar(b, cx, TOP, 132, 3, 3, rock);
    for (let k = 0; k < 10; k++) {
      const th = -Math.PI / 2 + (s ? -1 : 1) * k * 0.62;
      const x = cx + Math.cos(th) * R, z = 132 + Math.sin(th) * R, top = 1.2 + 1.2 * (k + 1);
      b.crumble(x, top, z, 2.3, 2.3);
      towers[s].push([x, top, z]);
    }
  });
  b.floor(0, TOP, 132, 9, 2, { mat: 'wood' });
  b.gem(0, TOP + 1.4, 132);
  b.marks.towers = towers;

  // -- Stage 5: the collapsing arena ------------------------------------------------------------------
  const A = TOP;
  b.floor(0, A, 137, 3, 8, { mat: 'wood' }); // bridge to the arena, z 133..141
  b.checkpoint(0, A, 139, 2.6, { hint: 'The whole floor crumbles! Each make your way across and stand on a corner plate to bring out the steps to the goal.' });
  for (let i = 0; i < 7; i++) for (let j = 0; j < 6; j++) b.crumble(-8.4 + i * 2.8, A, 142.9 + j * 2.8, 2.5, 2.5);
  b.gem(0, A + 2.4, 149.9);
  pillar(b, -10.6, A, 160.2, 3, 3, rock);
  pillar(b, 10.6, A, 160.2, 3, 3, rock);
  b.floor(0, A, 163.2, 24, 2.8, { mat: 'wood' });
  const cA = b.plate(-10.6, A, 160.2), cB = b.plate(10.6, A, 160.2);
  b.sign(-10.6, A + 2.6, 160.2, 'Stand here', { w: 1.8 });
  b.sign(10.6, A + 2.6, 160.2, 'Stand here', { w: 1.8 });
  const G = A + 6;
  pillar(b, 0, G, 170.6, 14, 8, rock);
  const steps = b.act('steps', { op: 'all', in: [cA, cB] }, true, [0, 1, 2, 3].map((i) => ({
    x: -4.5 + i * 3, y: A + 1.2 * (i + 1) - 0.4, z: 167.6, sx: 2.6, sy: 0.8, sz: 2, move: [0, 0, -2], delay: i * 0.15,
  })), { speed: 3, mat: 'toy', color: '#ffe066', lamp: [0, A + 0.3, 165.4] });
  b.goal(0, G, 171, Math.PI);
  b.mark('cA', -10.6, A, 160.2);
  b.mark('cB', 10.6, A, 160.2);

  b.objectives = [
    { text: 'One column each: dash across the cracked tiles', done: { cp: 1 } },
    { text: 'Sol crosses the crumbling path and holds a bridge up for Luna', done: { cp: 2 } },
    { text: 'Luna raises planks, Sol dashes across the big gaps', done: { cp: 3 } },
    { text: 'Twin towers: climb a crumbling tower each', done: { cp: 4 } },
    { text: 'Cross the crumbling floor and both stand on the corner plates', done: { act: steps } },
    { text: 'Climb the steps to the goal', done: {} },
  ];
  return b.finish();
}
