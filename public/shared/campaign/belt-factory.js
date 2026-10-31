// Level 7 · Conveyor Factory: every stage is about conveyor belts, and every stage uses
// them differently — riding them, a partner turning them round, pistons on a
// moving line, a belt railway you steer with dials, and two lanes where your
// plates drive your partner's belts.

import { LevelBuilder } from '../build.js';
import { slab, piston, toggle } from './kit2.js';

export function beltFactory(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'belt-factory', name: 'Conveyor Factory', label: `Level ${index + 1}`, theme: 'workshop', sky: 'day' });

  // -- 0. Start ------------------------------------------------------------------------
  slab(b, 0, 0, 0, 12, 10);
  b.checkpoint(0, 0, 0, 8, { hint: 'Belts carry you along: walk with them to go faster, against them to go slower, and across them to get pushed to the edge — careful not to fall off!' });
  b.sign(0, 3.2, 3.5, 'Welcome to the factory!\nWalk with, against, across', { style: 'prank' });

  // -- 1. Riding the belts ------------------------------------------------------------------
  b.belt(0, 0, 11, 4, 12, 5, [0, 1]); // with you
  b.gem(0, 2.4, 18.5);
  b.belt(0, 0, 26, 6, 12, 4, [1, 0]); // pushes you sideways
  b.gem(2.2, 1.2, 26);
  b.belt(0, 0, 41, 4, 12, 4, [0, -1]); // against you
  b.mark('beltA', 0, 0, 11);
  b.mark('beltB', 0, 0, 26);
  b.mark('beltC', 0, 0, 41);

  // -- 2. Too fast to walk: your partner turns it round -----------------------------------------
  slab(b, 0, 0, 51, 10, 8);
  b.checkpoint(0, 0, 50.5, 7, { hint: 'This belt is too fast to walk against. One stands on the plate to reverse it and send their partner across; then the partner holds the plate on that side to bring them over.' });
  const pA = b.plate(3.5, 0, 52);
  const pB = b.plate(3.5, 0, 96);
  b.belt(0, 0, 63, 4, 16, 10, [0, -1], { flip: [pA, pB] });
  slab(b, 0, 0, 73, 4, 4); // island
  b.belt(0, 0, 84.5, 4, 14, 10, [0, -1], { flip: [pA, pB] });
  b.gem(0, 2.6, 76.25);
  b.sign(0, 3.3, 54.2, 'Too fast to cross!\nA plate turns the belt around', { style: 'prank' });
  b.wire(pA, [[3.5, 0, 52], [3.5, 0, 54.6], [1.6, 0, 54.6]]);
  b.mark('plateA', 3.5, 0, 52);
  b.mark('plateB', 3.5, 0, 96);
  b.mark('island', 0, 0, 73);

  // -- 3. The press line: pistons, and a partner who can freeze them ----------------------------
  slab(b, 0, 0, 95.5, 10, 8);
  b.checkpoint(0, 0, 94.5, 7, { hint: 'The press shop! Pistons will knock you off the belt. One waits for the moment every piston is pulled back, then steps on the plate to freeze them; the other hurries across.' });
  const pC = b.plate(-3.5, 0, 96);
  const pD = b.plate(-3.5, 0, 134);
  b.belt(0, 0, 115.5, 4, 32, 3, [0, 1]);
  const pistons = [];
  [105, 109.5, 114, 118.5, 123, 127.5].forEach((zc, i) => {
    const m = piston(b, i % 2 ? 1 : -1, zc, { period: 1.5, phase: 0 });
    m.stop = [pC, pD];
    pistons.push(m);
  });
  b.sign(-3.5, 3.0, 98, 'When all pistons pull back,\nstep on the plate to stop them', { style: 'prank' });
  b.gem(0, 1.2, 116.25);
  b.mark('plateC', -3.5, 0, 96);
  b.mark('plateD', -3.5, 0, 134);

  // -- 4. The belt railway: three dials steer three groups of belts ------------------------------
  slab(b, 0, 0, 135.5, 10, 8);
  b.checkpoint(0, 0, 135, 7, { hint: "The belt railway: the red, yellow and green dials each control one group of belts (check the colored block above each belt). One turns the dials, the other rides the belts — and you'll need to turn one again on the way!" });
  const GROUP = { A: '#ff5d5d', B: '#ffd23f', C: '#3fc46b' };
  const tA = toggle(b, -2.5, 0, 138, { color: GROUP.A });
  const tB = toggle(b, 0, 0, 138, { color: GROUP.B });
  const tC = toggle(b, 2.5, 0, 138, { color: GROUP.C });
  const flipOf = { A: tA.on, B: tB.on, C: tC.on };
  b.sign(0, 3.8, 139.2, 'Belt Railway\nOne dial per belt color\nFWD = normal · REV = reversed', { style: 'prank', w: 4.6 });
  slab(b, 0, 0, 141.25, 4, 3.5); // to the first junction
  const Z0 = 145, S = 18;
  const jx = (i) => -18 + S * i, jz = (j) => Z0 + S * j;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) slab(b, jx(i), 0, jz(j), 4, 4, { mat: 'metal' });
  // Channels: [kind, i, j, base direction (+1 = toward +x / +z), group or null].
  const channels = [
    ['h', 0, 0, 1, 'C'], ['h', 1, 0, -1, null],
    ['h', 0, 1, 1, 'B'], ['h', 1, 1, 1, 'C'],
    ['h', 0, 2, 1, null], ['h', 1, 2, -1, 'A'],
    ['v', 0, 0, -1, null], ['v', 0, 1, 1, 'A'],
    ['v', 1, 0, -1, 'A'], ['v', 1, 1, -1, 'C'],
    ['v', 2, 0, 1, 'B'], ['v', 2, 1, -1, null],
  ];
  for (const [kind, i, j, dir, g] of channels) {
    const o = g ? { flip: flipOf[g] } : {};
    if (kind === 'h') b.belt(jx(i) + S / 2, 0, jz(j), 14, 3, 9, [dir, 0], o);
    else b.belt(jx(i), 0, jz(j) + S / 2, 3, 14, 9, [0, dir], o);
    if (g) {
      const x = kind === 'h' ? jx(i) + S / 2 : jx(i);
      const z = kind === 'h' ? jz(j) : jz(j) + S / 2;
      b.box(x, 2.6, z, 0.6, 0.6, 0.6, { color: GROUP[g] });
    }
  }
  b.gem(jx(0), 1.2, jz(0));
  b.gem(jx(2), 1.2, jz(1));
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) b.mark(`j${i}${j}`, jx(i), 0, jz(j));
  b.mark('dialA', -2.5, 0, 138);
  b.mark('dialB', 0, 0, 138);
  b.mark('dialC', 2.5, 0, 138);

  // The partner's way round: a service walkway, lowered from the far side.
  slab(b, -30, 0, 135.5, 18, 5);
  slab(b, -39, 0, 161.5, 4, 57);
  slab(b, -30, 0, 188, 14, 4);
  const lower = b.pswitch(-21, 0, 186, true);
  const planks = [];
  for (let k = 0; k < 4; k++) planks.push({ x: -7 - 4 * k, y: -0.6 - 9, z: 135.5, sx: 4, sy: 1.2, sz: 4, move: [0, 9, 0], delay: k * 0.12 });
  b.act('bridge', { op: 'all', in: [lower] }, true, planks, { speed: 14, mat: 'toy', lamp: [-5.5, 0.6, 133] });
  b.sign(-21, 2.9, 187.6, 'Pound this button:\na walkway for your partner', { style: 'prank' });
  b.mark('lower', -21, 0, 186);

  // -- 5. Two lanes running backwards: your plates drive your partner's belts --------------------
  slab(b, -18, 0, 188, 10, 10);
  b.checkpoint(-18, 0, 188.5, 7, { hint: "Both lanes run backwards. The plate under your feet drives the next stretch of your partner's lane — left, right, take turns pushing each other forward!" });
  b.sign(-18, 3.6, 191.6, "Your plate drives\nyour partner's belt!", { style: 'prank' });
  b.box(-18, 3, 217, 0.6, 6, 48); // wall between the lanes
  const LX = -21, RX = -15;
  const lanePlate = (x, z) => b.plate(x, 0, z);
  const pL1 = lanePlate(-15.5, 190); // on the start platform, right side: drives L1
  const pR1 = lanePlate(LX, 208.5); // left island 1: drives R1
  const pL2 = lanePlate(RX, 208.5); // right island 1: drives L2
  const pR2 = lanePlate(LX, 225.5);
  const pL3 = lanePlate(RX, 225.5);
  const pR3 = lanePlate(LX, 244); // the far platform: drives R3
  const lanes = [[LX, [pL1, pL2, pL3]], [RX, [pR1, pR2, pR3]]];
  for (const [x, plates] of lanes) {
    b.belt(x, 0, 200, 3.4, 14, 10, [0, -1], { flip: plates[0] });
    slab(b, x, 0, 208.5, 3.4, 3);
    b.belt(x, 0, 217, 3.4, 14, 10, [0, -1], { flip: plates[1] });
    slab(b, x, 0, 225.5, 3.4, 3);
    b.belt(x, 0, 234, 3.4, 14, 10, [0, -1], { flip: plates[2] });
  }
  b.gem(LX, 2.6, 217);
  slab(b, -18, 0, 247, 10, 12);
  b.mark('pL1', -15.5, 0, 190);
  b.mark('pR3', LX, 0, 244);
  b.goal(-18, 0, 249.5);

  b.objectives = [
    { text: 'Ride the belts to the other side', done: { cp: 1 } },
    { text: 'Reverse the fast belt with the plate and take turns crossing', done: { cp: 2 } },
    { text: 'Stop the pistons and get through the press shop', done: { cp: 3 } },
    { text: 'Set the dials, ride the belt railway to the far corner, then lower the walkway for your partner', done: { sig: lower } },
    { text: 'Push each other along the twin lanes to the goal', done: {} },
  ];
  void pistons;
  return b.finish();
}
