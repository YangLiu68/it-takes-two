// Level 1 · First Steps: the tutorial. One new move per stage, and the last two need
// both of you: stand on your partner's head, then hold two plates at once.

import { LevelBuilder } from '../build.js';
import { hub, pillar, bridge, wallSteps, gateWall } from './kit.js';

export function firstSteps(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'first-steps', name: 'First Steps', label: `Level ${index + 1}`, theme: 'playroom', sky: 'day' });

  // -- Stage 1: walk and jump -----------------------------------------------------------
  hub(b, 0, 0, 0, 12, 10, { hint: 'Move with WASD (phone: left stick) and jump with Space. Hop across these blocks to the next wooden deck!' });
  b.sign(0, 3.0, 3.6, 'WASD / left stick: move\nSpace: jump\nMouse / drag: look around');
  pillar(b, 0, 1.0, 8, 4, 4);
  pillar(b, 0, 2.0, 13.5, 4, 4);
  pillar(b, 2, 2.0, 19, 4, 4);
  b.gem(2, 4.4, 19);
  b.mark('s1a', 0, 1, 8);
  b.mark('s1b', 0, 2, 13.5);
  b.mark('s1c', 2, 2, 19);

  // -- Stage 2: double jump -------------------------------------------------------------
  hub(b, 0, 2, 27, 12, 8, { hint: 'Press Space again in mid-air to double jump. Wall too tall? Gap too wide? Jump, then jump again!' });
  b.sign(0, 5.2, 29.6, 'Space again in mid-air:\ndouble jump!');
  pillar(b, 0, 5.6, 34.5, 10, 7); // 3.6 m wall
  b.gem(0, 8.4, 41.5);
  b.mark('s2wall', 0, 5.6, 33);
  b.mark('s2edge', 0, 5.6, 37.4);

  // -- Stage 3: dash --------------------------------------------------------------------
  hub(b, 0, 5.6, 49.5, 12, 8, { hint: 'This gap is too wide: jump, double jump, then press Shift in mid-air to dash! Fell? No problem, just climb back up the stairs.' });
  b.sign(0, 8.8, 52.1, 'Shift: dash\nJump → double jump → dash!');
  // The gap (11.5 m) has a soft floor under it and stairs back up.
  b.floor(0, -1.5, 59.25, 18, 11.5, { mat: 'wood' });
  for (let i = 0; i < 4; i++) pillar(b, -8, -1.5 + 1.6 * (i + 1), 61 - 2.4 * i, 2.2, 2.2);
  b.gem(3, -0.3, 59);
  b.sign(-5, 1.8, 60, 'Fell down?\nClimb back up here', { style: 'prank', w: 2.6 });
  b.mark('s3edge', 0, 5.6, 53.05);
  b.mark('s3land', 0, 5, 67);

  // -- Stage 4: pound switches ----------------------------------------------------------
  hub(b, 0, 5.0, 69, 12, 8, { hint: 'Press C to ground pound (it works standing still, too). Pound this button and the bridge rises.' });
  b.sign(-3.4, 8.0, 70, 'C: ground pound\nPound the button!', { w: 4.6 });
  const sw1 = b.pswitch(3, 5.0, 71, true);
  bridge(b, { op: 'all', in: [sw1] }, { top: 5.0, z0: 73, z1: 87 });
  b.gem(0, 7.2, 80);
  b.floor(0, 5.0, 92, 14, 10, { mat: 'wood' });
  // Two buttons that must be pounded together.
  const swA = b.pswitch(-5, 5.0, 93, false, 1.0);
  const swB = b.pswitch(5, 5.0, 93, false, 1.0);
  b.sign(0, 8.4, 90.5, 'Pound both buttons at once—\none each, count "1, 2, 3!"');
  bridge(b, { op: 'all', in: [swA, swB] }, { top: 5.0, z0: 97, z1: 111 });
  b.wire(swA, [[-5, 5.0, 93], [-5, 5.0, 96.4], [-1.6, 5.0, 96.4]]);
  b.wire(swB, [[5, 5.0, 93], [5, 5.0, 96.4], [1.6, 5.0, 96.4]]);
  b.mark('sw1', 3, 5, 71);
  b.mark('swA', -5, 5, 93);
  b.mark('swB', 5, 5, 93);

  // -- Stage 5: stand on your partner's head --------------------------------------------
  hub(b, 0, 5.0, 116, 12, 10, { hint: 'This wall is too tall to climb alone. One of you stands by the wall, the other jumps on their head and double jumps! Up top, pound the button to bring out steps for your partner.' });
  b.sign(-3.5, 8.2, 116, "Jump on your partner's head,\nthen double jump!", { w: 4 });
  pillar(b, 0, 10.0, 126, 14, 10); // the wall: 5 m, too tall alone
  const top = b.pswitch(4.5, 10.0, 124, true);
  b.sign(4.5, 12.6, 124, 'Pound the button:\nsteps for your partner', { w: 3.4 });
  wallSteps(b, top, { x0: 2.0, dx: 2.4, faceZ: 121, fromTop: 5.0, toTop: 10.0, n: 2 });
  b.gem(-5.5, 11.4, 129);
  b.mark('s5base', -1.5, 5, 120.2);
  b.mark('s5top', -1.5, 10, 123);
  b.mark('s5sw', 4.5, 10, 124);

  // -- Stage 6: two plates at once ------------------------------------------------------
  hub(b, 0, 10.0, 135, 14, 8, { hint: 'The last door needs someone on both plates at once. One each!' });
  const pA = b.plate(-4, 10.0, 137);
  const pB = b.plate(4, 10.0, 137);
  b.sign(0, 13.4, 133.5, 'Stand on both plates\nto open the door');
  gateWall(b, { op: 'all', in: [pA, pB] }, { z: 140, top: 10.0, half: 7, doorW: 4, h: 7 });
  b.wire(pA, [[-4, 10, 137], [-4, 10, 139.3], [-2.1, 10, 139.3]]);
  b.wire(pB, [[4, 10, 137], [4, 10, 139.3], [2.1, 10, 139.3]]);
  b.floor(0, 10.0, 146.5, 14, 13, { mat: 'wood' });
  b.goal(0, 10.0, 148, Math.PI);
  b.mark('pA', -4, 10, 137);
  b.mark('pB', 4, 10, 137);

  b.objectives = [
    { text: 'Hop across the blocks to the next deck', done: { cp: 1 } },
    { text: 'Double jump up the wall and over the gap', done: { cp: 2 } },
    { text: 'Jump → double jump → dash across the big gap', done: { cp: 3 } },
    { text: 'Pound buttons to raise bridges; pound the last two together', done: { cp: 4 } },
    { text: "Stack up: jump on your partner's head to get over the wall", done: { cp: 5 } },
    { text: 'Each stand on a plate to open the last door', done: {} },
  ];
  return b.finish();
}
