// Level 11 · Cannon Coast: magnet cannons over the sea, six ways — each firing your
// own cannon, one cannon and a partner who pulls you over, picking the right
// cannon out of three, a chain where the colours take turns, a short cannon
// that only works if your partner catches you in mid-air, and firing onto a
// raft that won't wait for you.

import { LevelBuilder } from '../build.js';
import { slab, cannonPad } from './kit2.js';

const SOL = 1, LUNA = -1;

export function cannonCoast(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'cannon-coast', name: 'Cannon Coast', label: `Level ${index + 1}`, theme: 'bath', sky: 'sunset' });
  const isle = (x, top, z, w, d, o = {}) => slab(b, x, top, z, w, d, { mat: o.mat ?? 'wood', color: o.color, t: o.t ?? 2.4 });

  // -- 0/1. Your own cannon ---------------------------------------------------------------
  isle(0, 0, 0, 12, 10);
  b.checkpoint(0, 0, -1.5, 7, { hint: 'Magnet cannons: same colors repel. Stand on a cannon pad of your own color and hold E to get blasted over to the next island!' });
  b.sign(0, 3.3, 3.6, 'Stand on your own color\nHold E to fire!', { style: 'prank' });
  const p1 = cannonPad(b, -2.5, 0, 2, SOL, [-2, 0, 28]);
  const p2 = cannonPad(b, 2.5, 0, 2, LUNA, [2, 0, 28]);
  b.gem(0, 6.2, 14);
  isle(0, 0, 27, 12, 10); // A (z 22..32)

  // -- 2. One cannon, and a partner who pulls you over -------------------------------------------
  b.checkpoint(0, 0, 25, 6, { hint: 'Only a blue cannon here: Luna flies over first, then holds E on the far side to call. When Sol holds E too, he gets pulled across!' });
  const p3 = cannonPad(b, 0, 0, 30, LUNA, [0, 0, 52]);
  b.sign(3.5, 3.0, 30, 'Partner pull:\nOne across holds E to call,\nthe other holds E too', { style: 'prank' });
  isle(0, 0, 52, 12, 10); // B (z 47..57)

  // -- 3. Three red cannons: which one goes to the switch? -------------------------------------
  b.checkpoint(0, 0, 50.5, 6, { hint: "Three red cannons each aim at a different islet, and only one islet has the red switch. Check the aim before you fire! Luna's blue cannon leads to the blue switch. Pound both switches to open the gate." });
  cannonPad(b, -3, 0, 55, SOL, [-20, 0, 70]);
  cannonPad(b, 0, 0, 55, SOL, [-8, 0, 77]);
  cannonPad(b, 3, 0, 55, SOL, [20, 0, 70]);
  cannonPad(b, 4.6, 0, 49.6, LUNA, [8, 0, 77]);
  isle(-20, 0, 70, 8, 8, { mat: 'toy', color: '#f7c59f' });
  isle(20, 0, 70, 8, 8, { mat: 'toy', color: '#f7c59f' });
  b.gem(-20, 1.2, 70);
  b.gem(20, 1.2, 70);
  isle(-8, 0, 77, 8, 8, { mat: 'toy', color: '#ffb3a6' });
  isle(8, 0, 77, 8, 8, { mat: 'toy', color: '#a6c8ff' });
  const swQ = b.pswitch(-10.4, 0, 77, true, 1, '#ff6b4a');
  const swS = b.pswitch(10.4, 0, 77, true, 1, '#4f86ff');
  b.sign(0, 3.4, 56.6, 'Which cannon aims at\nthe red switch?\nMissed? Luna pulls you back', { style: 'prank', w: 5 });
  // T, with the gate across it.
  isle(0, 0, 90, 20, 10); // z 85..95
  const wc = '#7fb6c9';
  b.box(-5.75, 2.5, 91, 8.5, 5, 0.6, { color: wc });
  b.box(5.75, 2.5, 91, 8.5, 5, 0.6, { color: wc });
  const gate = b.act('door', { op: 'all', in: [swQ, swS] }, true, [{ x: 0, y: 2.2, z: 91, sx: 3, sy: 4.4, sz: 0.5, move: [0, -4.8, 0] }], { speed: 8, lamp: [0, 4.8, 90.5] });

  // -- 4. The chain: the colours take turns --------------------------------------------------------
  b.checkpoint(0, 0, 87.5, 5, { hint: "Cannon chain: one fires across, the other gets pulled over; the next island's cannon is the other color — take turns!" });
  cannonPad(b, 0, 0, 93.4, SOL, [0, 0, 114]);
  isle(0, 0, 114, 8, 8); // U1 (110..118)
  cannonPad(b, 0, 0, 116, LUNA, [0, 0, 137]);
  isle(0, 0, 137, 8, 8); // U2 (133..141)
  cannonPad(b, 0, 0, 139, SOL, [0, 0, 160.5]);
  b.gem(0, 6.5, 127);
  isle(0, 0, 161, 14, 10); // U3 (156..166)

  // -- 5. The short cannon: your partner catches you in mid-air ------------------------------------
  b.checkpoint(0, 0, 159, 5, { hint: "Luna's blue cannon reaches the clifftop; Sol's red one can't shoot that high. Luna goes up first and holds E to call. Sol fires, then quickly lets go of E and holds it again to get pulled up by Luna (too late and he hits the cliff)!" });
  cannonPad(b, 4, 0, 163, LUNA, [3, 10, 182], { vy: 27, short: 0.6 });
  cannonPad(b, -3, 0, 163, SOL, [-2, 0, 177], { vy: 16, short: 0 });
  b.sign(0, 3.4, 157.4, 'The red cannon falls short!\nMid-air, let go of E and\nhold it again — fly to Luna', { style: 'prank', w: 5 });
  isle(0, 10, 184, 14, 10, { t: 26 }); // the cliff (179..189)
  b.gem(-1, 11.4, 181);

  // -- 6. Fire onto the raft ------------------------------------------------------------------------
  b.checkpoint(0, 10, 185, 5, { hint: 'The raft drifts back and forth, and a shot takes a second to land — fire just as the raft is almost over here, land on it, and ride it to the far shore!' });
  const raft = b.mover(6, 0.8, 8, { type: 'linear', a: [0, -0.4, 210], b: [0, -0.4, 228], period: 10, phase: 0 }, { steady: true, color: '#c99a5a', mat: 'wood' });
  cannonPad(b, -2.5, 10, 187.5, SOL, [0, 0, 210], { vy: 16, short: 2.6 });
  cannonPad(b, 2.5, 10, 187.5, LUNA, [0, 0, 210], { vy: 16, short: 2.6 });
  b.sign(0, 13.2, 189.4, 'Fire when the raft\ndrifts this way!', { style: 'prank' });
  isle(0, 0, 236, 12, 8); // the dock (232..240)
  b.goal(0, 0, 237);

  b.mark('p1', -2.5, 0, 2);
  b.mark('p2', 2.5, 0, 2);
  b.mark('p3', 0, 0, 30);
  b.mark('r2', 0, 0, 55);
  b.mark('r1', -3, 0, 55);
  b.mark('bS', 4.6, 0, 49.6);
  b.mark('swQ', -10.4, 0, 77);
  b.mark('swS', 10.4, 0, 77);
  b.mark('c1', 0, 0, 93.4);
  b.mark('c2', 0, 0, 116);
  b.mark('c3', 0, 0, 139);
  b.mark('high', 4, 0, 163);
  b.mark('short', -3, 0, 163);
  b.mark('raftR', -2.5, 10, 187.5);
  b.mark('raftB', 2.5, 10, 187.5);

  b.objectives = [
    { text: 'Stand on your own color cannon and blast across', done: { cp: 1 } },
    { text: 'Luna fires across, then pulls Sol over', done: { cp: 2 } },
    { text: 'Find the right cannons and pound the red and blue switches', done: { act: gate } },
    { text: 'Cannon chain: take turns firing and pulling', done: { cp: 4 } },
    { text: 'Luna goes up the cliff and pulls Sol up mid-air', done: { cp: 5 } },
    { text: 'Time your shot onto the raft and ride it to the goal', done: {} },
  ];
  void p1; void p2; void p3; void raft;
  return b.finish();
}
