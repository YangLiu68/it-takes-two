// Level 12 · Sprint Gates: timed switches, five ways — a far switch that holds a door
// open just long enough for your partner, two switches you must hit at the
// same moment, a bridge your partner builds a piece at a time beside you, a
// countdown you both have to beat to the exit, and three switches for two
// players.

import { LevelBuilder } from '../build.js';
import { PHYS } from '../constants.js';
import { slab } from './kit2.js';

// A wall across z = wz from x -w to w with a door gap dw wide in the middle.
function gateWall(b, wz, y0, w, dw, h, color) {
  const side = (w - dw / 2);
  b.box(-(dw / 2 + side / 2), y0 + h / 2, wz, side, h, 1, { color });
  b.box(dw / 2 + side / 2, y0 + h / 2, wz, side, h, 1, { color });
  b.box(0, y0 + 4.6 + (h - 4.6) / 2, wz, dw, h - 4.6, 1, { color });
}
const doorPart = (wz, y0, dw) => ({ x: 0, y: y0 + 2.3, z: wz, sx: dw - 0.1, sy: 4.6, sz: 0.6, move: [0, -4.9, 0] });

export function sprintGates(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'sprint-gates', name: 'Sprint Gates', label: `Level ${index + 1}`, theme: 'candy', sky: 'day' });
  const wc = '#f08fb4';

  // -- 1. The far switch -----------------------------------------------------------------------
  slab(b, 0, 0, 0.5, 12, 11);
  b.checkpoint(0, 0, -1, 8, { hint: 'Timer switches: pound one and the door opens for just a few seconds. One runs off to pound the far switch, the other sprints through before it shuts; then whoever got through pounds the button there to keep the door open.' });
  b.sign(0, 3.6, 3.8, 'One pounds the far timer—\nthe other races for the door!', { style: 'prank', w: 5 });
  const Lr = 16;
  const piece = (Lr - 2 * 2.2) / 3;
  for (let i = 0; i < 3; i++) slab(b, 0, 0, 6 + i * (piece + 2.2) + piece / 2, 3.4, piece, { mat: 'toy' });
  slab(b, 18.5, 0, 0, 25, 2, { mat: 'wood' }); // the spur to the switch
  slab(b, 33.5, 0, 0, 5, 5);
  const runTime = (Lr / PHYS.runSpeed) * 1.25 + 0.5;
  const S1 = b.pswitch(33.5, 0, 0, false, runTime * 0.95 + 0.9);
  const wz1 = 6 + Lr;
  gateWall(b, wz1, 0, 15, 3.4, 8, wc);
  slab(b, 0, 0, 26, 12, 8);
  const S2 = b.pswitch(3.5, 0, 27, true);
  b.act('door', { op: 'any', in: [S1, S2] }, false, [doorPart(wz1, 0, 3.4)], { speed: 18, lamp: [0, 5.1, wz1 - 0.6] });
  b.sign(3.5, 2.8, 28.6, 'Pound this button\nto keep the door open', { style: 'prank' });
  b.gem(0, 2.6, 6 + piece + 1.1);
  b.mark('S1', 33.5, 0, 0);
  b.mark('S2', 3.5, 0, 27);

  // -- 2. Both at once ------------------------------------------------------------------------------
  b.checkpoint(0, 0, 25, 6, { hint: 'The two switches are far apart and stay lit for under a second. Count "3, 2, 1" and pound them at the same time to open the gate!' });
  slab(b, 0, 0, 31, 4, 2);
  slab(b, 0, 0, 38, 30, 12); // z 32..44
  const L = b.pswitch(-13, 0, 38, false, 0.9, '#ffd23f');
  const R = b.pswitch(13, 0, 38, false, 0.9, '#3fc46b');
  gateWall(b, 44.5, 0, 15, 3.4, 7, wc);
  const sync = b.act('door', { op: 'all', in: [L, R] }, true, [doorPart(44.5, 0, 3.4)], { speed: 14, lamp: [0, 5.1, 43.9] });
  b.sign(0, 3.6, 34, 'Pound both switches together!\n3, 2, 1—', { style: 'prank' });
  slab(b, -13, 1.4, 42.6, 2, 1.6, { mat: 'toy', t: 2.8 });
  b.gem(-13, 3.6, 42.6);
  b.mark('L', -13, 0, 38);
  b.mark('R', 13, 0, 38);

  // -- 3. The bridge your partner builds beside you -----------------------------------------------
  slab(b, 0, 0, 50, 12, 10); // z 45..55
  b.checkpoint(0, 0, 49, 6, { hint: "The bridge rises one piece at a time: the one on the side path pounds the timer switches in order, and the one on the bridge follows — not too fast, and don't wait too long! On the far side, pound the button to raise the whole bridge." });
  slab(b, -14, 0, 50, 16, 4); // to the side path
  slab(b, -24, 0, 70, 4, 40); // the side path (z 50..90): a dead end, too far to jump from
  const F = b.pswitch(3, 0, 90, true);
  const segs = [];
  for (let k = 0; k < 6; k++) {
    const zc = 57.5 + 5 * k;
    const T = b.pswitch(-24, 0, zc, false, 5);
    segs.push(b.act('bridge', { op: 'any', in: [T, F] }, false, [{ x: 0, y: -0.6 - 9, z: zc, sx: 3, sy: 1.2, sz: 5, move: [0, 9, 0] }], { speed: 16, mat: 'toy', color: '#ffb3d1', lamp: [-1.8, 0.6, zc - 2.2] }));
    b.mark(`T${k}`, -24, 0, zc);
    b.mark(`seg${k}`, 0, 0, zc);
  }
  b.sign(-24, 2.8, 53.4, 'Pound the switches in order:\neach raises a bridge piece', { style: 'prank' });
  b.gem(-24, 1.2, 88.5);
  slab(b, 0, 0, 89, 12, 8); // z 85..93
  b.mark('F', 3, 0, 90);

  // -- 4. The countdown ---------------------------------------------------------------------------------
  b.checkpoint(0, 0, 88.5, 6, { hint: 'Countdown: pound the switch and the goal door opens for just 14 seconds. You both have to sprint through before it closes!' });
  const C = b.pswitch(-3, 0, 91.5, false, 14);
  b.sign(-3, 3.0, 92.8, '14-second countdown!\nRun together!', { style: 'prank' });
  slab(b, 0, 0, 97, 6, 8); // 93..101
  slab(b, 0, 0.6, 104, 4, 3, { mat: 'toy' });
  slab(b, 0, 1.2, 108.5, 4, 3, { mat: 'toy' });
  slab(b, 0, 1.8, 113, 4, 3, { mat: 'toy' });
  b.mover(4, 0.8, 3.6, { type: 'linear', a: [0, 1.4, 116.3], b: [0, 1.4, 121.2], period: 3.2, phase: 0 }, { steady: true, color: '#ffd166' });
  slab(b, 0, 1.8, 126, 6, 6); // 123..129
  for (const z of [131.3, 134, 136.7]) b.crumble(0, 1.8, z, 4, 2.6);
  gateWall(b, 139, 1.8, 6, 3, 6, wc);
  b.act('door', { op: 'all', in: [C] }, false, [doorPart(139, 1.8, 3)], { speed: 18, lamp: [0, 6.9, 138.4] });
  slab(b, 0, 1.8, 144, 10, 8); // 140..148
  b.gem(0, 3.8, 118.8);
  b.mark('C', -3, 0, 91.5);

  // -- 5. Three switches, two of you ----------------------------------------------------------------------
  b.checkpoint(0, 1.8, 143.5, 6, { hint: 'The door only opens while all three timer switches are lit — but there are only two of you. Someone has to pound two in a row!' });
  slab(b, 0, 1.8, 149, 4, 2);
  slab(b, 0, 1.8, 160, 26, 20); // 150..170
  const A = b.pswitch(-10, 1.8, 154, false, 4, '#ff5d5d');
  const B = b.pswitch(-10, 1.8, 166, false, 4, '#ffd23f');
  const D = b.pswitch(11, 1.8, 160, false, 4, '#4f86ff');
  gateWall(b, 170.5, 1.8, 13, 3.4, 7, wc);
  const tri = b.act('door', { op: 'all', in: [A, B, D] }, true, [doorPart(170.5, 1.8, 3.4)], { speed: 14, lamp: [0, 6.9, 169.9] });
  b.sign(0, 5, 152, 'Light all three switches\nto open the door', { style: 'prank' });
  slab(b, 0, 4.2, 160, 2.4, 2.4, { mat: 'toy', t: 2.4 });
  b.gem(0, 6.2, 160);
  slab(b, 0, 1.8, 176, 10, 10);
  b.mark('A', -10, 1.8, 154);
  b.mark('B', -10, 1.8, 166);
  b.mark('D', 11, 1.8, 160);
  b.goal(0, 1.8, 177);

  b.objectives = [
    { text: 'One pounds the far timer switch, the other sprints through the door', done: { sig: S2 } },
    { text: 'Pound both switches at the same time', done: { act: sync } },
    { text: 'One raises the bridge piece by piece, the other follows across', done: { sig: F } },
    { text: 'Start the countdown and both sprint through the goal door', done: { cp: 4 } },
    { text: 'Get all three switches lit at once', done: { act: tri } },
    { text: 'Reach the goal', done: {} },
  ];
  void segs;
  return b.finish();
}
