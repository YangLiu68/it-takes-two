// Level 3 · Seesaw Park: one of you stands on an end, the other pounds the other
// end (C), and the first one flies. Every stage asks something new of it:
//   1. up a cliff (then drop steps for your partner)
//   2. over a wall too tall to jump (then open its gate from the far side)
//   3. into the sky to grab a key that's floating there — one each, so swap
//   4. onto a platform gliding past high above (time the pound!)
//   5. a seesaw nobody can walk to the far end of: bounce off a drum and pound it from above

import { LevelBuilder } from '../build.js';
import { hub, pillar, wallSteps, gateWall } from './kit.js';

export function seesawPark(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'seesaw-park', name: 'Seesaw Park', label: `Level ${index + 1}`, theme: 'garden', sky: 'sunset' });
  const hedge = { color: '#5aa35f' };

  // -- Stage 1: up the cliff -------------------------------------------------------------
  b.floor(0, 0, 4, 14, 18, { mat: 'wood' });
  b.checkpoint(0, 0, 0, 8, { hint: 'One of you stands on one end of the seesaw, the other runs to the other end and presses C to pound it, launching their partner up the cliff!' });
  b.sign(0, 3.4, 2.4, 'Stand on one end—\nyour partner presses C\non the other end!');
  b.seesaw(0, 1.0, 9, 9.2, 2.4);
  const H1 = 9.5;
  b.box(0, (H1 - 1.6) / 2, 20, 14, H1 + 1.6, 10, hedge);
  const sw1 = b.pswitch(-4.5, H1, 17.5, true);
  b.sign(-4.5, H1 + 2.6, 17.5, 'Pound the button:\nsteps for your partner', { w: 3 });
  wallSteps(b, sw1, { x0: -5.5, dx: 2.3, faceZ: 15, fromTop: 0, toTop: H1, n: 4 });
  b.gem(-2.35, 12.5, 9);
  b.mark('s1', 0, 1, 9);
  b.mark('sw1', -4.5, H1, 17.5);

  // -- Stage 2: over the hedge -------------------------------------------------------------
  b.checkpoint(0, H1, 19.5, 6, { hint: 'The hedge is too tall to jump. Launch your partner over it with the seesaw, then they open the hedge gate from the other side!' });
  b.seesaw(0, H1 + 1, 22.6, 9.2, 2.4);
  b.box(-4.25, H1 + 2.5, 25, 5.5, 5, 0.6, hedge);
  b.box(4.25, H1 + 2.5, 25, 5.5, 5, 0.6, hedge);
  const sw2 = b.pswitch(4, 5, 35.5, true);
  b.act('gate', { op: 'all', in: [sw2] }, true, [{ x: 0, y: H1 + 2.5, z: 25, sx: 2.9, sy: 5, sz: 0.5, move: [0, -5.2, 0] }], { speed: 6, color: '#8a5a2b', lamp: [0, H1 + 5.4, 24.6] });
  b.sign(4, 7.6, 35.5, 'Pound the button:\nopen the hedge gate', { w: 3 });
  pillar(b, 0, 5, 38, 14, 10);
  b.gem(-2.35, 16, 25.5);
  b.mark('s2', 0, H1 + 1, 22.6);
  b.mark('sw2', 4, 5, 35.5);

  // -- Stage 3: keys in the sky -------------------------------------------------------------
  b.checkpoint(0, 5, 38, 7, { hint: "The keys float high in the sky. Sol's red key is on the left, Luna's blue key on the right — take turns launching each other up to grab them!" });
  b.floor(0, 5, 52, 16, 18, { mat: 'wood' });
  b.seesaw(0, 6.0, 48, 9.2, 2.4);
  const red = b.item('key', -2.35, 15.5, 48, { who: 0, color: '#ff6b4a', label: 'Red Key' });
  const blue = b.item('key', 2.35, 15.5, 48, { who: 1, color: '#4f86ff', label: 'Blue Key' });
  b.sign(-5.5, 8.6, 46, 'The keys are in the sky!\nOnly a seesaw reaches them', { w: 3.6 });
  const lock = b.lock(0, 5, 56.6, [red, blue], { label: 'Gate Lock' });
  gateWall(b, { op: 'all', in: [lock] }, { z: 60, top: 5, half: 8, doorW: 4, h: 7, color: hedge.color });
  b.mark('s3', 0, 6, 48);

  // -- Stage 4: the gliding platform ----------------------------------------------------------
  b.floor(0, 5, 66, 16, 10, { mat: 'wood' });
  b.checkpoint(0, 5, 64, 6, { hint: 'A platform glides back and forth up high. Wait until it drifts past the seesaw, then pound — land your partner on it and ride it across!' });
  b.seesaw(0, 6.0, 68, 9.2, 2.4);
  b.sign(5.5, 8.4, 64, 'Pound when the\nplatform comes!', { w: 2.8 });
  // Far enough out that flying straight up from the seesaw never bumps its underside.
  b.mover(5, 0.8, 5, { type: 'linear', a: [-2.35, 14, 73.5], b: [-2.35, 14, 90.5], period: 14, phase: 0 }, { steady: true, color: '#ffd166' });
  b.gem(-2.35, 15.8, 81);
  const L4 = 14.5;
  pillar(b, 0, L4, 97, 14, 8);
  const sw4 = b.pswitch(4, L4, 95.4, true);
  b.sign(4, L4 + 2.6, 95.4, 'Pound the button:\nsteps for your partner', { w: 3 });
  const parts = [];
  for (let i = 0; i < 7; i++) {
    const top = 5 + ((L4 - 5) * (i + 1)) / 8;
    parts.push({ x: 3, y: top - 0.4 - 9, z: 73 + i * 2.8, sx: 2.4, sy: 0.8, sz: 2.4, move: [0, 9, 0], delay: i * 0.12 });
  }
  b.act('steps', { op: 'all', in: [sw4] }, true, parts, { speed: 10, mat: 'toy', color: '#ffb84d', lamp: [3, 5.6, 71.4] });
  b.mark('s4', 0, 6, 68);
  b.mark('sw4', 4, L4, 95.4);

  // -- Stage 5: drum + seesaw -----------------------------------------------------------------
  b.checkpoint(0, L4, 98, 6, { hint: 'Nobody can walk to the far end of the seesaw up on the ledge. Luna, press C on the drum to bounce high, then fly over that end and press C to slam down!' });
  b.floor(0, L4, 114, 20, 26, { mat: 'wood' });
  const R = L4 + 6.5;
  pillar(b, -6.1, R, 113, 3.8, 6, { depth: 8 });
  for (let i = 0; i < 4; i++) pillar(b, -9.4, L4 + 1.6 * (i + 1), 119 - i * 2.4, 2.2, 2.2, { depth: 8 });
  b.seesaw(-4, R + 1, 113, 9.2, 2.4);
  b.box(-4, R + 1 + 1.2 + 2.15, 113, 0.4, 4.3, 3, { color: '#8a5a2b' }); // nobody walks across
  b.bouncer(4, L4 + 0.5, 113, 1.35);
  b.box(4, L4 + 0.15 - 4, 113, 1.4, 8, 1.4, { mat: 'wood', deep: true });
  b.sign(4, L4 + 3.0, 110, 'Drum: press C as you land\nto bounce higher!', { w: 3 });
  b.gem(3, L4 + 9.4, 113);
  const T = R + 10;
  pillar(b, -4, T, 127, 12, 16, { depth: 12 });
  const liftPlate = b.plate(0, T, 123);
  b.act('lift', { op: 'any', in: [liftPlate] }, false, [
    { x: 4, y: L4 - 0.08, z: 123, sx: 3.4, sy: 0.4, sz: 3.4, move: [0, T - L4 - 0.12, 0] },
  ], { speed: 5, lamp: [4, T + 0.3, 121] });
  b.sign(0, T + 2.6, 123, 'Hold the plate:\nthe lift fetches your partner', { w: 3 });
  b.goal(-4, T, 131, Math.PI);
  b.mark('s5', -4, R + 1, 113);
  b.mark('drum', 4, L4 + 0.5, 113);
  b.mark('lift', 4, L4, 123);
  b.mark('liftPlate', 0, T, 123);
  b.mark('stairs', -9.4, L4, 119);

  b.objectives = [
    { text: 'Seesaw your partner up the cliff, then bring out the steps', done: { cp: 1 } },
    { text: 'Launch your partner over the hedge to open the gate', done: { cp: 2 } },
    { text: 'Take turns flying up for the red and blue keys', done: { used: blue } },
    { text: 'Time it: launch your partner onto the passing platform', done: { cp: 4 } },
    { text: 'Drum + seesaw: pound down from the sky!', done: {} },
  ];
  return b.finish();
}
