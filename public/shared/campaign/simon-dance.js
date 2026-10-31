// Level 29 · Memory Dance: lamps flash an order, you pound the buttons in that order.
// Every stage changes who sees the order and how you get to the buttons.
//   1. follow the lights — four buttons, four lamps
//   2. each sees the other's order — a tall wall between your two floors
//   3. one watches, one dances — the lamps only light while someone's on the
//      watch tower, and a spinning bar sweeps the dance floor
//   4. the relay — one order across both floors: you have to take turns
//   5. the grand finale — eight steps (some twice) on islands over the pit, the
//      first half shown to Sol, the second half to Luna

import { LevelBuilder } from '../build.js';

const COLORS = [
  ['red', '#ff4d5e'], ['yellow', '#ffd23f'], ['green', '#3fd17a'], ['blue', '#3f8cff'], ['purple', '#b06bff'], ['orange', '#ff9a3f'],
];

export function simonDance(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'simon-dance', name: 'Memory Dance', label: `Level ${index + 1}`, theme: 'twilight', sky: 'night' });
  const r = b.rng;
  const dance = '#3a3358', glow = '#6b5fa8';
  const SLOT = 0.9;
  // Lamps that flash in order: lamps[k] lights during slot k of each cycle.
  const flash = (lamps, o = {}) => {
    const n = lamps.length;
    const P = n * SLOT + 1.8;
    lamps.forEach(([x, y, z, color], k) => b.light(x, y, z, {
      color, intensity: 8, dist: 6, fixture: 'bulb', size: 2.8, pulse: [P, 1 - (k * SLOT) / P, (SLOT * 0.7) / P], when: o.when || null,
    }));
  };
  // A dim marker so you can see where each lamp is when it's off.
  const post = (x, z, top, h) => b.box(x, top + h / 2, z, 0.25, h, 0.25, { mat: 'metal' });
  const button = (x, top, z, color) => b.pswitch(x, top, z, false, 0.5, color);

  // -- Start ----------------------------------------------------------------------------------
  b.floor(0, 0, 3, 12, 8, { color: dance });
  b.checkpoint(0, 0, 2, 6, { hint: 'Watch the order the lamps light up, then pound the buttons (C) in the same order. One mistake and you start over!' });

  // -- 1. Follow the lights --------------------------------------------------------------------
  b.floor(0, 0, 16, 14, 18, { color: dance }); // z 7–25
  const order1 = r.shuffle([0, 1, 2, 3]);
  const btn1 = [-4.5, -1.5, 1.5, 4.5].map((x, i) => {
    post(x, 18, 0, 3);
    return button(x, 0, 15, COLORS[i][1]);
  });
  flash(order1.map((i) => [[-4.5, -1.5, 1.5, 4.5][i], 3.25, 18, COLORS[i][1]]));
  const seq1 = b.seq(order1.map((i) => btn1[i]));
  b.wallGapsX(-7, 7, 25, 5, [[0, 3]], { color: glow, lintel: 3.6 });
  b.door(0, 25, 3, 3.5, { op: 'all', in: [seq1] }, { latch: true, color: '#ff7ab8' });
  b.sign(-5.5, 3.2, 9.5, 'Order of the lights =\norder to pound the buttons', { style: 'prank', w: 4 });
  b.gem(0, 1.3, 21);

  // -- 2. Each sees the other's order -----------------------------------------------------------
  b.floor(0, 0, 28, 14, 6, { color: dance }); // z 25–31
  b.checkpoint(0, 0, 28, 5, { hint: 'A tall wall splits the floor: the lamps on Sol\'s side show Luna\'s order, and the lamps on Luna\'s side show Sol\'s. Call them out to each other!' });
  b.floor(-5, 0, 44, 8, 26, { color: dance }); // Sol's floor, x -9..-1, z 31–57
  b.floor(5, 0, 44, 8, 26, { color: dance }); // Luna's floor
  b.box(0, 4.5, 44, 2, 9, 26, { color: glow }); // the wall
  for (const s of [-1, 1]) b.box(s * 9.2, 4.5, 44, 0.4, 9, 26, { color: glow });
  b.field(-5, 1.5, 31.3, 8, 3, 0.3, 1);
  b.field(5, 1.5, 31.3, 8, 3, 0.3, -1);
  const xsS = [-8, -6, -4, -2], xsL = [2, 4, 6, 8];
  const colsS = [0, 1, 2, 3], colsL = [4, 5, 2, 3];
  const btnS = xsS.map((x, i) => button(x, 0, 48, COLORS[colsS[i]][1]));
  const btnL = xsL.map((x, i) => button(x, 0, 48, COLORS[colsL[i]][1]));
  const orderS = r.shuffle([0, 1, 2, 3]), orderL = r.shuffle([0, 1, 2, 3]);
  // Sol's order is shown on Luna's side of the wall, and Luna's on Sol's.
  for (const [k, x] of [1.4, 1.4, 1.4, 1.4].entries()) post(x, 38 + k * 2, 0, 2.6);
  for (const [k, x] of [-1.4, -1.4, -1.4, -1.4].entries()) post(x, 38 + k * 2, 0, 2.6);
  flash(orderS.map((i, k) => [1.4, 2.85, 38 + k * 2, COLORS[colsS[i]][1]]));
  flash(orderL.map((i, k) => [-1.4, 2.85, 38 + k * 2, COLORS[colsL[i]][1]]));
  const seqS = b.seq(orderS.map((i) => btnS[i]));
  const seqL = b.seq(orderL.map((i) => btnL[i]));
  b.sign(-5, 3.4, 34, "Sol: the lamps on the wall\nshow Luna's order", { style: 'prank' });
  b.sign(5, 3.4, 34, "Luna: the lamps on the wall\nshow Sol's order", { style: 'prank' });
  b.wallGapsX(-9, 9, 57, 6, [[-5, 3], [5, 3]], { color: glow, lintel: 3.6 });
  b.door(-5, 57, 3, 3.5, { op: 'all', in: [seqS, seqL] }, { latch: true, color: '#ff7ab8' });
  b.door(5, 57, 3, 3.5, { op: 'all', in: [seqS, seqL] }, { latch: true, color: '#ff7ab8' });
  b.gem(-5, 1.3, 53);

  // -- 3. One watches, one dances -----------------------------------------------------------------
  b.floor(0, 0, 60.5, 18, 7, { color: dance }); // z 57–64
  b.checkpoint(0, 0, 61, 6, { hint: 'The lamps only light while someone stands on the plate on the lookout to the left — that one calls out the order. The other dodges the spinning bar on the dance floor and pounds the buttons in order.' });
  b.floor(0, 0, 73, 16, 18, { color: dance }); // the dance floor, z 64–82
  for (const s of [-1, 1]) b.box(s * 8.2, 0.5, 73, 0.4, 1, 18, { color: glow });
  b.wallGapsX(-8, 8, 82, 5, [[0, 3]], { color: glow, lintel: 3.2 });
  b.floor(-11.5, 3, 66.5, 3, 3, { t: 3, color: glow }); // the watch tower
  b.floor(-11.5, 1.5, 63, 2.4, 2.4, { t: 1.5, color: glow });
  const watch = b.plate(-11.5, 3, 66.5);
  b.sign(-11.5, 5.4, 66.5, 'Lookout: stand here\nto light the lamps', { style: 'prank' });
  const pads3 = [[-5.5, 67.5], [5.5, 67.5], [0, 70.5], [-5.5, 78.5], [5.5, 78.5]];
  const cols3 = [0, 1, 2, 3, 4];
  const btn3 = pads3.map(([x, z], i) => {
    post(x + 1.1, z, 0, 2.4);
    return button(x, 0, z, COLORS[cols3[i]][1]);
  });
  const order3 = r.shuffle([0, 1, 2, 3, 4]);
  flash(order3.map((i) => [pads3[i][0] + 1.1, 2.65, pads3[i][1], COLORS[cols3[i]][1]]), { when: watch });
  const seq3 = b.seq(order3.map((i) => btn3[i]));
  const bar = b.mover(11, 0.6, 0.6, { type: 'spin', center: [0, 1.0, 73], speed: 0.7, phase: 0 }, { steady: true, mat: 'hazard', color: '#ff5d5d', hazard: 'push' });
  b.sign(0, 3.4, 65.5, 'Watch the spinning bar!\nJump over it', { style: 'prank' });
  b.floor(0, 0, 86, 14, 8, { color: dance }); // past the floor, z 82–90
  b.door(0, 82, 3, 3, { op: 'all', in: [seq3] }, { latch: true, color: '#ff7ab8' });
  b.gem(0, 2.6, 78);
  b.mark('bar', 0, 1, 73);

  // -- 4. The relay: one order across both floors ------------------------------------------------
  b.checkpoint(0, 0, 86, 6, { hint: 'Relay: one order, with the buttons split across both sides. Whoever\'s side the lamp lights up on pounds next — take turns!' });
  b.floor(-5, 0, 101, 8, 22, { color: dance }); // Sol's floor, z 90–112
  b.floor(5, 0, 101, 8, 22, { color: dance }); // Luna's floor
  b.box(0, 2.3, 101, 1, 4.6, 22, { color: glow }); // too high to jump, low enough to see each other's lamps
  b.field(-5, 1.5, 90.3, 8, 3, 0.3, 1);
  b.field(5, 1.5, 90.3, 8, 3, 0.3, -1);
  const pads4 = [[-7, 98, 0], [-3, 102, 5], [-7, 106, 1], [7, 98, 3], [3, 102, 2], [7, 106, 4]];
  const btn4 = pads4.map(([x, z, ci]) => {
    post(x + Math.sign(x) * 1.3, z, 0, 5.6);
    return button(x, 0, z, COLORS[ci][1]);
  });
  const order4 = r.shuffle([0, 1, 2, 3, 4, 5]);
  flash(order4.map((i) => [pads4[i][0] + Math.sign(pads4[i][0]) * 1.3, 5.85, pads4[i][1], COLORS[pads4[i][2]][1]]));
  const seq4 = b.seq(order4.map((i) => btn4[i]));
  b.wallGapsX(-9, 9, 112, 5, [[-5, 3], [5, 3]], { color: glow, lintel: 3.6 });
  b.door(-5, 112, 3, 3.5, { op: 'all', in: [seq4] }, { latch: true, color: '#ff7ab8' });
  b.door(5, 112, 3, 3.5, { op: 'all', in: [seq4] }, { latch: true, color: '#ff7ab8' });
  b.sign(0, 4.8, 92, 'One order, buttons on both sides:\ntake turns pounding!', { style: 'prank' });
  b.gem(5, 1.3, 109);

  // -- 5. The grand finale: eight steps on islands ------------------------------------------------
  b.floor(0, 0, 116, 18, 8, { color: dance }); // z 112–120
  b.checkpoint(0, 0, 116, 7, { hint: 'The last dance: eight steps, and some colours come up twice. The left stand shows Sol steps 1–4, the right stand shows Luna steps 5–8. Memorise them, then jump onto the islands together and pound in order.' });
  const isl = [[0, 124], [-4.2, 128], [4.2, 128], [0, 132]]; // a diamond of islands over the pit
  const cols5 = [3, 0, 1, 2];
  const btn5 = isl.map(([x, z], i) => {
    b.floor(x, 0, z, 3, 3, { color: glow });
    return button(x, 0, z, COLORS[cols5[i]][1]);
  });
  // Eight steps; each button at most twice in a row of four.
  const order5 = [...r.shuffle([0, 1, 2, 3]), ...r.shuffle([0, 1, 2, 3])];
  const seq5 = b.seq(order5.map((i) => btn5[i]));
  // Viewing stands: Sol's (left) shows steps 1–4, Luna's (right) shows 5–8.
  for (const [side, from, pol] of [[-1, 0, 1], [1, 4, -1]]) {
    const sx = side * 11;
    b.floor(sx, 2.5, 117, 4, 4, { t: 2.5, color: glow });
    b.floor(side * 8, 1.2, 117, 2, 2, { t: 1.2, color: glow });
    const p = b.plate(sx, 2.5, 117.5);
    b.field(sx - side * 2.15, 3.9, 117, 0.3, 2.8, 4, pol);
    flash(order5.slice(from, from + 4).map((i, k) => [sx - 1.5 + k, 4.4, 119.4, COLORS[cols5[i]][1]]), { when: p });
    for (let k = 0; k < 4; k++) post(sx - 1.5 + k, 119.4, 2.5, 1.7);
    b.sign(sx, 6.4, 119.6, side < 0 ? 'Sol: steps 1–4' : 'Luna: steps 5–8', { style: 'prank', w: 3 });
  }
  b.floor(0, 0, 151.5, 14, 8, { color: dance }); // the end, z 147.5–155.5: too far to jump
  b.act('bridge', { op: 'all', in: [seq5] }, true, [
    { x: 0, y: -8.4, z: 140.5, sx: 3, sy: 0.8, sz: 14.2, move: [0, 8, 0] },
  ], { speed: 6, mat: 'toy', color: '#ff7ab8', lamp: [0, 0.6, 134.4] });
  b.gem(-4.2, 1.6, 132);
  b.gem(4.2, 1.6, 124);
  b.goal(0, 0, 152);

  b.objectives = [
    { text: 'Watch the lamps, pound the buttons in the same order', done: { sig: seq1 } },
    { text: 'The wall lamps show your partner\'s order: call them out', done: { sig: seqL } },
    { text: 'One calls the order from the lookout, one dodges the bar and pounds', done: { sig: seq3 } },
    { text: 'Relay: one order, whoever\'s turn it is pounds', done: { sig: seq4 } },
    { text: 'Last eight steps: Sol remembers the first four, Luna the last four', done: { sig: seq5 } },
    { text: 'Jump to the goal!', done: {} },
  ];
  void bar;
  return b.finish();
}
