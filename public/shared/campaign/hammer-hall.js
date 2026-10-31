// Level 9 · Hammer Hall: hammers and sweeping bars, six ways — dodging them, a
// partner freezing them for three seconds, holding two plates on a spinning
// disc, riding swings over the drop, getting knocked clean across a chasm by a
// giant hammer, and pounding a colour code in a hammer field that only your
// partner up in the tower can read.

import { LevelBuilder } from '../build.js';
import { slab, hammer } from './kit2.js';

const COLORS = [['red', '#ff5d5d'], ['yellow', '#ffd23f'], ['blue', '#4f86ff']];

export function hammerHall(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'hammer-hall', name: 'Hammer Hall', label: `Level ${index + 1}`, theme: 'ember', sky: 'dusk' });
  const r = b.rng;

  // -- 0. Start --------------------------------------------------------------------------
  slab(b, 0, 0, 0, 12, 10);
  b.checkpoint(0, 0, -0.5, 8, { hint: 'The hammers will knock you off the bridge! Dash through when they swing away.' });
  b.sign(0, 3.3, 3.6, 'Hammer Hall\nTime it, then dash underneath', { style: 'prank' });

  // -- 1. The hammer bridge ----------------------------------------------------------------------
  slab(b, 0, 0, 18.5, 3.2, 27);
  [[10, 2.6, 0], [15.5, 2.3, 0.3], [21, 2.8, 0.6], [26.5, 2.4, 0.15]].forEach(([z, period, phase]) => hammer(b, 0, 0, z, { period, phase }));
  b.gem(0, 3.4, 18.25);

  // -- 2. Three seconds of stillness: a timed switch freezes the hammers --------------------------
  slab(b, 0, 0, 36, 10, 8);
  b.checkpoint(0, 0, 35.5, 7, { hint: "These hammers are too fast. One pounds the timer switch and every hammer freezes for 3 seconds — wait until they've all swung out to the sides, then pound! The one crossing waits on the middle island for the next freeze." });
  const S1 = b.pswitch(3.5, 0, 37.5, false, 3.2);
  const S2 = b.pswitch(-3.5, 0, 77.5, false, 3.2);
  const quick = [];
  slab(b, 0, 0, 47, 3.2, 14);
  slab(b, 0, 0, 56, 4, 4);
  slab(b, 0, 0, 65, 3.2, 14);
  for (const z of [43.5, 47.5, 51.5, 61.5, 65.5, 69.5]) {
    const h = hammer(b, 0, 0, z, { period: 1.6, phase: 0 });
    h.stop = [S1, S2];
    quick.push(h);
  }
  b.sign(3.5, 3.0, 39.2, 'Timer: hammers stop 3 sec\nPound when they swing wide!', { style: 'prank' });
  b.gem(0, 1.4, 56);
  b.mark('S1', 3.5, 0, 37.5);
  b.mark('S2', -3.5, 0, 77.5);

  // -- 3. The spinning disc: both plates at once ---------------------------------------------------
  slab(b, 0, 0, 76, 10, 8);
  b.checkpoint(0, 0, 75.5, 7, { hint: 'There are two plates on the spinning disc. You both have to stand on them at once to open the gate — jump when the bar sweeps by!' });
  slab(b, 0, 0, 88, 16, 16);
  b.box(0, 1.25, 88, 1.6, 2.5, 1.6, { mat: 'metal' });
  b.mover(13.2, 0.7, 0.7, { type: 'spin', center: [0, 0.62, 88], speed: 1.0, phase: 0 }, { mat: 'hazard', color: '#ff5d5d', hazard: 'push', steady: true });
  b.mover(13.2, 0.7, 0.7, { type: 'spin', center: [0, 0.62, 88], speed: -0.6, phase: Math.PI / 2 }, { mat: 'hazard', color: '#ff9f43', hazard: 'push', steady: true });
  // Walls round the disc: a bar knocks you into them, not off the level.
  const rail = { color: '#c98a5a' };
  b.box(-8.2, 2, 88, 0.4, 4, 16, rail);
  b.box(8.2, 2, 88, 0.4, 4, 16, rail);
  b.box(-5, 2, 80.2, 6, 4, 0.4, rail);
  b.box(5, 2, 80.2, 6, 4, 0.4, rail);
  const pL = b.plate(-5.2, 0, 88);
  const pR = b.plate(5.2, 0, 88);
  const wallC = '#a35d3a';
  b.box(-4.8, 3, 96.5, 6.4, 6, 0.6, { color: wallC });
  b.box(4.8, 3, 96.5, 6.4, 6, 0.6, { color: wallC });
  b.box(0, 5.2, 96.5, 3.2, 1.6, 0.6, { color: wallC });
  b.act('door', { op: 'all', in: [pL, pR] }, true, [{ x: 0, y: 2.2, z: 96.5, sx: 3.1, sy: 4.4, sz: 0.5, move: [0, -4.8, 0] }], { speed: 10, lamp: [0, 4.8, 96] });
  b.sign(0, 4.8, 81.2, 'Both plates at once!\nJump when the bar comes', { style: 'prank' });
  b.gem(0, 3.4, 88);
  b.mark('pL', -5.2, 0, 88);
  b.mark('pR', 5.2, 0, 88);
  b.mark('disc', 0, 0, 88);

  // -- 4. Swings over the drop ---------------------------------------------------------------
  slab(b, 0, 0, 100, 10, 8);
  b.checkpoint(0, 0, 100.5, 7, { hint: 'The swing platforms rock side to side, each half a beat behind the last. Jump when two of them reach the same side and nearly stop!' });
  const swingZ = [108, 114.5, 121, 127.5];
  swingZ.forEach((z, i) => {
    b.mover(3.6, 0.8, 3.6, { type: 'linear', a: [-4, -0.4, z], b: [4, -0.4, z], period: 3.4, phase: 1 - i * 0.07 }, { steady: true, color: '#e0b062' });
  });
  b.sign(-3.5, 3.0, 103.4, 'Swings slow down at the ends\nThat is when to jump', { style: 'prank' });
  b.gem(0, 2.4, 121);
  swingZ.forEach((z, i) => b.mark(`swing${i}`, 0, 0, z));

  // -- 5. The giant hammer: let it knock you across ----------------------------------------------
  slab(b, 2, 0, 135, 14, 8);
  b.checkpoint(-1, 0, 135, 6, { hint: 'Stand in the white circle and let the hammer swinging to the right knock you across the chasm! (Step in while it swings left.)' });
  const giant = hammer(b, 6, 0, 135, { len: 9, amp: 0.85, period: 3.4, phase: 0, head: [2.2, 2.2, 2.6], span: 3.6, posts: 'across' });
  b.box(6, 0.03, 135, 2.2, 0.06, 2.2, { color: '#ffffff' }); // the spot
  // A wall behind the platform: a hit from the wrong side bumps you into it
  // instead of throwing you off the level.
  b.box(-5.3, 2.5, 135, 0.6, 5, 8.4, { color: '#ffd6a0' });
  // And along both sides of the spot, where you wait for it: a glancing blow
  // shouldn't knock you off the edge.
  b.box(6.5, 1.6, 130.8, 5, 3.2, 0.4, { color: '#ffd6a0' });
  b.box(6.5, 1.6, 139.2, 5, 3.2, 0.4, { color: '#ffd6a0' });
  b.sign(1.5, 3.4, 131.6, 'Stand in the white circle\nand let the hammer launch you!', { style: 'prank' });
  slab(b, 27, -3, 135, 18, 14, { mat: 'toy', color: '#ffb36b' }); // the landing net
  b.gem(17, 3.2, 135);
  b.mark('spot', 6, 0, 135);
  b.mark('net', 27, -3, 135);

  // -- 6. The hammer field and the tower ------------------------------------------------------------
  slab(b, 27, -3, 145, 4, 6);
  slab(b, 27, -3, 152, 12, 8);
  b.checkpoint(27, -3, 152, 7, { hint: 'Red, yellow and blue buttons sit among the hammers, and they must be pounded in the right order. Only someone on the plate in the tower hut can see the order — the lookout calls it out, the one below dodges hammers and pounds!' });
  slab(b, 27, -3, 165, 16, 18);
  const order = r.shuffle([0, 1, 2]);
  const btn = [];
  const spots = [[27, 161], [23, 165], [31, 165]];
  COLORS.forEach(([, color], i) => btn.push(b.pswitch(spots[i][0], -3, spots[i][1], false, 0.6, color)));
  const code = b.seq(order.map((i) => btn[i]));
  const fh = { len: 9, amp: 0.7, posts: 'none' };
  hammer(b, 23, -3, 161, { ...fh, period: 2.6, phase: 0 });
  hammer(b, 31, -3, 161, { ...fh, period: 2.4, phase: 0.4, yaw: Math.PI / 2 });
  hammer(b, 23, -3, 169, { ...fh, period: 2.8, phase: 0.2, yaw: Math.PI / 2 });
  hammer(b, 31, -3, 169, { ...fh, period: 2.5, phase: 0.7 });
  // A frame over the field for the hammers to hang from.
  const beamY = -3 + 0.95 + 9 + 0.55;
  for (const [x, z] of [[18.6, 155.6], [35.4, 155.6], [18.6, 174.4], [35.4, 174.4]]) b.box(x, (beamY - 3) / 2, z, 0.6, beamY + 3, 0.6, { mat: 'metal' });
  for (const z of [161, 169]) b.box(27, beamY, z, 17.4, 0.5, 0.6, { mat: 'metal' });
  for (const x of [18.6, 35.4]) b.box(x, beamY, 165, 0.6, 0.5, 19.4, { mat: 'metal' });
  // The tower west of the field, and its lookout hut.
  for (let k = 0; k < 6; k++) slab(b, 19.5 - 1.3 * k, -3 + 1.7 * (k + 1), 154 + 1.2 * k, 2.4, 2.4, { mat: 'wood', t: 0.6 });
  slab(b, 13, 7, 165, 6, 6, { t: 10 });
  // A small hut on the tower's north-east corner, open to the west.
  const hut = { color: '#7a4b2e' };
  b.box(14, 8.6, 167.3, 4, 3.2, 0.4, hut);
  b.box(14, 8.6, 163.7, 4, 3.2, 0.4, hut);
  b.box(15.8, 8.6, 165.5, 0.4, 3.2, 3.6, hut);
  b.box(14, 10.4, 165.5, 4, 0.4, 4, hut);
  const look = b.plate(13.4, 7, 165.5);
  order.forEach((ci, slot) => {
    b.light(15.3, 9.2, 164.4 + 1.1 * ci, { color: COLORS[ci][1], intensity: 5, dist: 4, fixture: 'bulb', when: look, pulse: [3, 1 - slot / 3, 0.24] });
  });
  b.sign(14, 9.7, 163.95, 'Stand on the plate\nand watch the lights\nLight order = pound order', { fixed: true, yaw: 0, style: 'prank', w: 3.0 });
  // The exit gate.
  b.box(21.8, 0.5, 174.5, 6.4, 7, 0.6, { color: wallC });
  b.box(32.2, 0.5, 174.5, 6.4, 7, 0.6, { color: wallC });
  b.box(27, 3.2, 174.5, 4, 1.6, 0.6, { color: wallC });
  b.act('door', { op: 'all', in: [code] }, true, [{ x: 27, y: -0.8, z: 174.5, sx: 3.9, sy: 4.4, sz: 0.5, move: [0, -4.8, 0] }], { speed: 10, lamp: [27, 2.2, 174] });
  slab(b, 27, -3, 180, 10, 10);
  b.gem(11, 8.4, 167);
  COLORS.forEach((c, i) => b.mark(`btn${i}`, spots[i][0], -3, spots[i][1]));
  for (let k = 0; k < 6; k++) b.mark(`stair${k}`, 19.5 - 1.3 * k, -3 + 1.7 * (k + 1), 154 + 1.2 * k);
  b.mark('look', 13.4, 7, 165.5);
  b.goal(27, -3, 181);

  b.objectives = [
    { text: 'Dash across the hammer bridge', done: { cp: 1 } },
    { text: 'Freeze the hammers with the timer switch and take turns crossing', done: { cp: 2 } },
    { text: 'Both stand on the plates on the spinning disc', done: { cp: 3 } },
    { text: 'Ride the swing platforms across', done: { cp: 4 } },
    { text: 'Let the hammer knock you across', done: { cp: 5 } },
    { text: 'The lookout calls the order, the other pounds the buttons', done: { sig: code } },
    { text: 'Reach the goal', done: {} },
  ];
  b.meta.order = order;
  void giant; void quick;
  return b.finish();
}
