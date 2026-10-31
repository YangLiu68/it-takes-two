// Level 16 · Piston Workshop: pistons push you, carry you, throw you and build your
// bridge. Dodge the side pistons, race across stepping stones your partner
// punches out for three seconds, get fired over a sweeping piston, climb
// stairs only Sol can switch on, and solve the lights-out piston bridge.

import { LevelBuilder } from '../build.js';

const STEEL = '#8a8f99';

export function pistonPress(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'piston-press', name: 'Piston Workshop', label: `Level ${index + 1}`, theme: 'ember', sky: 'dusk' });

  // -- 1. The piston corridor -------------------------------------------------------------
  b.floor(0, 0, 0, 12, 8, { mat: 'wood' });
  b.checkpoint(0, 0, -1, 7, { hint: 'Pistons shove you off the walkway! Wait for each one to pull back, then dash past.' });
  b.sign(0, 3.2, 3, 'Wait till it\npulls back, then GO!', { w: 3.6 });
  b.floor(0, 0, 17, 4, 26, { color: '#5a4a40' });
  const pz = [7, 11.5, 16, 20.5, 25];
  pz.forEach((z, k) => {
    const side = k % 2 ? 1 : -1;
    b.mover(2.2, 1.3, 1.8, { type: 'linear', a: [side * 4.4, 0.7, z], b: [side * 0.4, 0.7, z], period: 2.4, phase: k * 0.37 }, { mat: 'hazard', color: '#ff5d5d', hazard: 'push', steady: true });
    b.box(side * 5.2, (1.6 - 13) / 2, z, 1.8, 14.6, 2.4, { mat: 'metal', color: STEEL, deep: true });
    b.mark(`pis${k}`, side, 0, z);
  });
  b.gem(0, 1.2, 18.3);
  b.floor(0, 0, 34, 12, 8, { mat: 'wood' });

  // -- 2. Stepping stones for three seconds -------------------------------------------------
  b.checkpoint(0, 0, 33.5, 5, { hint: 'Teamwork: pound the button and piston steps pop out of the wall — for only 4 seconds! One pounds while the other waits at the edge, ready to run. On the far side, pound that button to bring your partner over.' });
  const swA = b.pswitch(-5, 0, 30.6, false, 4);
  const swB = b.pswitch(5, 0, 66.4, false, 4);
  b.sign(-5, 2.9, 30.6, 'Pound: steps\nfor 4 seconds', { w: 3.4 });
  b.box(-10, 0, 48, 6, 6, 22, { mat: 'metal', color: STEEL }); // the wall they come out of
  const stones = [41.5, 46, 50.5, 55];
  b.act('piston', { op: 'any', in: [swA, swB] }, false, stones.map((z, i) => ({
    x: -8.5, y: -0.4, z, sx: 3, sy: 0.8, sz: 3, move: [8.5, 0, 0], delay: i * 0.15,
  })), { speed: 16, mat: 'metal', color: '#ffb02e', lamp: [-7, 3.4, 37.5] });
  stones.forEach((z, i) => b.mark(`st${i}`, 0, 0, z));
  b.gem(0, 1.8, 50.5);
  b.mark('swA', -5, 0, 30.6);
  b.mark('swB', 5, 0, 66.4);

  // -- 3. Fire! -------------------------------------------------------------------------------
  b.floor(3.5, 0, 66, 19, 16, { mat: 'wood' });
  b.checkpoint(0, 0, 62.5, 5, { hint: 'Teamwork: one stands on the launcher, the other steps on the plate to fire! Wait until the sweeping piston is away from the middle. Once up top, step on the plate there to raise the lift for your partner.' });
  const fire = b.plate(-4.5, 0, 69);
  b.sign(-4.5, 2.9, 69, 'Step: FIRE!', { w: 2.6 });
  b.trap('launch', 0, 0.3, 71, 2.4, 2.4, { t: 0.3, look: 'spring', launch: [0, 26, 8], reset: 1.5, on: fire, color: '#ffb02e' });
  b.mark('launcher', 0, 0.3, 71);
  b.mark('fire', -4.5, 0, 69);
  b.mover(3, 1.2, 1.2, { type: 'linear', a: [-6, 6, 73.5], b: [6, 6, 73.5], period: 3.2, phase: 0 }, { mat: 'hazard', color: '#ff5d5d', hazard: 'push', steady: true });
  b.box(-8, 3, 73.5, 1, 6, 1, { mat: 'metal', color: STEEL });
  b.box(8, 3, 73.5, 1, 6, 1, { mat: 'metal', color: STEEL });
  b.gem(0, 7.6, 75.6);
  const ledge = 9;
  b.plat(3, ledge, 84, 22, 16, 12, { color: '#6b5a50' });
  const liftPlate = b.plate(9.5, ledge, 79.5);
  b.act('lift', { op: 'any', in: [liftPlate] }, false, [{ x: 10.2, y: -0.2, z: 74.5, sx: 3, sy: 0.4, sz: 3, move: [0, ledge, 0] }], { speed: 5, lamp: [10.2, ledge + 0.4, 76.4], color: '#ffb02e' });
  b.sign(9.5, ledge + 2.9, 79.5, 'Step: raise lift', { w: 3.2 });
  b.mark('lift', 10.2, 0, 74.5);
  b.mark('liftPlate', 9.5, ledge, 79.5);
  b.mark('ledge', 0, ledge, 79);

  // -- 4. Stairs only Sol can switch on --------------------------------------------------------
  b.checkpoint(0, ledge, 80, 5, { hint: 'The piston steps only come out while Sol stands on the plate in the red booth. Luna climbs with double jumps (the wall piston knocks you down — wait for it to pull back), then pounds the button at the top so the steps stay out.' });
  // Sol's booth: a red barrier only Sol can pass.
  const bx = 8.5, bz = 85;
  b.wallX(bx - 1.8, bx + 1.8, bz - 1.8, 3, { y: ledge, color: '#ff8a7a' });
  b.wallX(bx - 1.8, bx + 1.8, bz + 1.8, 3, { y: ledge, color: '#ff8a7a' });
  b.wallZ(bz - 1.8, bz + 1.8, bx + 1.8, 3, { y: ledge, color: '#ff8a7a' });
  b.fieldZ(bx - 1.8, ledge + 1.5, bz, 3.6, 3, 1);
  const solPlate = b.plate(bx, ledge, bz);
  b.sign(bx - 1.8, ledge + 3.6, bz, 'Sol only', { w: 2.6 });
  b.mark('booth', bx, ledge, bz);
  const wallZ0 = 92;
  b.plat(0, 21, wallZ0 + 5, 14, 10, 12.5, { color: '#5a4a40' }); // the wall, its top is the next floor
  const topSw = b.pswitch(4.5, 21, 95, true);
  // Four big steps going one way (none above another), a double jump each.
  const stepXs = [-4.5, -1.5, 1.5, 4.5];
  const rise = 3;
  const parts = stepXs.map((x, i) => ({ x, y: ledge + rise * (i + 1) - 0.3, z: wallZ0 + 1, sx: 2.4, sy: 0.6, sz: 2, move: [0, 0, -2.05], delay: i * 0.08 }));
  b.act('piston', { op: 'any', in: [solPlate, topSw] }, false, parts, { speed: 8, mat: 'metal', color: '#ffb02e', lamp: [0, ledge + 0.6, wallZ0 - 0.3] });
  parts.forEach((p, i) => b.mark(`step${i}`, p.x, p.y + 0.3, p.z + p.move[2]));
  // A piston punches out of the wall over the second step: wait for it to pull back.
  for (const [i, ph] of [[1, 0]]) {
    const top = ledge + rise * (i + 1);
    b.mover(2.2, 1.0, 1.6, { type: 'linear', a: [stepXs[i], top + 0.75, wallZ0 + 0.9], b: [stepXs[i], top + 0.75, wallZ0 - 1.1], period: 4.4, phase: ph }, { mat: 'hazard', color: '#ff5d5d', hazard: 'push', steady: true });
  }
  // Side walls, so a piston only ever knocks you back down onto the ledge.
  b.box(-7.6, (ledge + 21) / 2, 89, 0.6, 21 - ledge + 3, 6, { color: '#5a4a40' });
  b.box(7.6, (ledge + 21) / 2, 89, 0.6, 21 - ledge + 3, 6, { color: '#5a4a40' });
  b.gem(3, ledge + rise * 3 + 1.4, wallZ0 - 1);
  b.sign(4.5, 23.9, 95, 'Pound: steps\nstay out', { w: 3.4 });
  b.mark('topSw', 4.5, 21, 95);
  b.mark('top', 0, 21, 96);

  // -- 5. The lights-out piston bridge -----------------------------------------------------------
  b.checkpoint(0, 21, 96.5, 5, { hint: 'Six piston pillars, six switches. Pounding a switch flips its pillar and both neighbours (up↔down). Raise all six to build the bridge! Only Sol can reach the left three, only Luna the right three.' });
  const dialXs = [-6, -4.2, -2.4, 2.4, 4.2, 6];
  const dials = [];
  dialXs.forEach((x) => dials.push(b.dial(x, 21, 100.6, { values: ['↓', '↑'], h: 1.6 })));
  b.dials.forEach((d, i) => {
    if (!dials.includes(d.id)) return;
    const k = dials.indexOf(d.id);
    d.links = [dials[k - 1], dials[k + 1]].filter(Boolean);
  });
  // Two rooms on the edge: the left one only lets Sol in, the right one Luna.
  b.wallZ(98.5, 102, 0, 3, { y: 21, color: '#5a4a40', t: 0.6 });
  b.wallX(-7, -1.4, 98.5, 3, { y: 21, color: '#ff8a7a', t: 0.3 });
  b.wallX(1.4, 7, 98.5, 3, { y: 21, color: '#8ab0ff', t: 0.3 });
  b.field(-0.85, 22.5, 98.5, 1.1, 3, 0.3, 1);
  b.field(0.85, 22.5, 98.5, 1.1, 3, 0.3, -1);
  b.sign(-4.2, 25, 98.5, 'Sol only', { fixed: true, yaw: 0, w: 2 });
  b.sign(4.2, 25, 98.5, 'Luna only', { fixed: true, yaw: 0, w: 2 });
  const cols = [104, 108, 112, 116, 120, 124];
  cols.forEach((z, i) => {
    const up = b.combo([dials[i]], [1], { latch: false });
    b.act('piston', { op: 'all', in: [up] }, false, [{ x: 0, y: 21 - 6 - 12, z, sx: 3.4, sy: 12, sz: 3.4, move: [0, 12, 0] }], { speed: 12, mat: 'metal', color: STEEL, lamp: [0, 21.3, z - 1.9] });
    b.sign(0, 18.2, z, String(i + 1), { fixed: true, yaw: Math.PI, w: 1 });
  });
  dialXs.forEach((x, i) => b.mark(`dial${i}`, x, 21, 100.6));
  b.floor(0, 21, 130, 12, 8, { mat: 'wood' });
  b.gem(0, 23.2, 114);
  b.goal(0, 21, 131);
  return b.finish();
}
