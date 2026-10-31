// Level 4 · Pressure Plates: pressure plates, no clocks. Every stage is a different
// little machine you work out together:
//   1. a door you hold from outside, then from inside
//   2. leapfrog bridges over a pit: each plate keeps two bridges up
//   3. crossed stairs: you hold your partner's stairs, they hold yours
//   4. weights: the vault needs three things on its plates — two weights and one of you
//   5. one directs from a glass balcony while the other walks a row of airlock gates

import { LevelBuilder } from '../build.js';
import { hub, pillar, bridge } from './kit.js';

export function weightDoors(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'weight-doors', name: 'Pressure Plates', label: `Level ${index + 1}`, theme: 'workshop', sky: 'day' });
  const wall = { color: '#c98d55' };
  const brick = { color: '#e86f51' };

  // -- Stage 1: hold the door ------------------------------------------------------------
  b.floor(0, 0, 1.5, 14, 13, { mat: 'wood' });
  b.checkpoint(0, 0, 0, 8, { hint: 'The door stays open only while someone stands on the plate. One holds it from outside, the other goes in and holds the plate inside.' });
  b.sign(0, 3.3, 3, 'Plates only work while held\nStep off and the door shuts', { w: 4.2 });
  const pOut = b.plate(-4, 0, 5);
  b.wallGapsX(-7, 7, 8, 6, [[0, 4]], { ...brick, lintel: 4.6, t: 0.6 });
  b.floor(0, 0, 13, 14, 10, { mat: 'wood' });
  b.wallZ(8, 18, -7, 6, { ...brick, t: 0.6 });
  b.wallZ(8, 18, 7, 6, { ...brick, t: 0.6 });
  const pIn = b.plate(4, 0, 14);
  b.door(0, 8, 4, 4.6, { op: 'any', in: [pOut, pIn] }, { latch: false, color: '#ffd166' });
  b.wire(pOut, [[-4, 0, 5], [-4, 0, 7.4], [-2.1, 0, 7.4]]);
  b.wire(pIn, [[4, 0, 14], [4, 0, 8.6], [2.1, 0, 8.6]]);
  b.box(-5, 0.6, 15.5, 1.6, 1.2, 1.6, { mat: 'wood' });
  b.gem(-5, 2.4, 15.5);
  b.mark('pOut', -4, 0, 5);
  b.mark('pIn', 4, 0, 14);

  // -- Stage 2: leapfrog bridges ------------------------------------------------------------
  b.floor(0, 0, 22, 14, 8, { mat: 'wood' });
  b.checkpoint(0, 0, 21, 6, { hint: 'Each plate raises the bridges just before and after it. One stands still, the other crosses to the next plate and stands there — leapfrog forward!' });
  b.sign(-4.5, 3.2, 21, 'Each plate holds up\nthe bridges on both sides', { w: 3.2 });
  const islands = [24.6, 43.5, 63.5, 82.6]; // plate z on each island (first and last are on the hubs)
  const P = islands.map((z) => b.plate(0, 0, z));
  for (const z of [43.5, 63.5]) pillar(b, 0, 0, z, 5, 5, wall);
  const spans = [[26, 41], [46, 61], [66, 81]];
  spans.forEach(([z0, z1], k) => bridge(b, { op: 'any', in: [P[k], P[k + 1]] }, { top: 0, z0, z1, w: 3.2, latch: false }));
  b.gem(2.2, 1.2, 63.5);
  b.marks.leap = islands.map((z) => [0, 0, z]);

  // -- Stage 3: crossed stairs --------------------------------------------------------------
  b.floor(0, 0, 85, 14, 8, { mat: 'wood' });
  b.checkpoint(0, 0, 84.4, 6, { hint: 'The plate on the right brings out the left stairs; the plate on the cliff brings out the right stairs. You hold mine, I hold yours!' });
  const C = 8;
  pillar(b, 0, C, 94, 14, 10, wall); // z 89..99
  const pA = b.plate(4.5, 0, 86.4);
  const pB = b.plate(-4.5, C, 92.2);
  const stair = (signal, x0, dx, color) => {
    const parts = [];
    for (let i = 0; i < 4; i++) {
      const top = (C * (i + 1)) / 5;
      parts.push({ x: x0 + i * dx, y: top - 0.4, z: 90.2, sx: 1.6, sy: 0.8, sz: 2, move: [0, 0, -2.2], delay: i * 0.08 });
    }
    return b.act('steps', { op: 'all', in: [signal] }, false, parts, { speed: 6, mat: 'toy', color, lamp: [x0, 0.4, 88.4] });
  };
  stair(pA, -6, 1.5, '#ff8a7a');
  stair(pB, 6, -1.5, '#7cc4f2');
  b.wire(pA, [[4.5, 0, 86.4], [4.5, 0, 88.3], [-6, 0, 88.3]]);
  b.sign(4.5, 2.8, 86.4, 'Hold: brings out\nthe left stairs', { w: 2.6 });
  b.sign(-4.5, C + 2.8, 92.2, 'Hold: brings out\nthe right stairs', { w: 2.6 });
  b.gem(0, C + 1.4, 97);
  b.mark('pA', 4.5, 0, 86.4);
  b.mark('pB', -4.5, C, 92.2);

  // -- Stage 4: weights ---------------------------------------------------------------------
  b.checkpoint(0, C, 96.5, 5, { hint: 'The vault door needs three loads: two weights and one of you. One weight sits in a cage, the other on a high shelf — figure out how to get them!' });
  b.floor(0, C, 108, 16, 18, { mat: 'wood' });
  b.sign(0, C + 3.4, 101.5, 'The door needs three loads:\ntwo weights + one player', { w: 4 });
  // The cage: its door opens while someone stands on the plate across the room.
  const pC = b.plate(5.5, C, 102.5);
  b.box(-5.5, C + 1.6, 107.6, 3.2, 3.2, 0.3, { mat: 'metal' });
  b.box(-7.0, C + 1.6, 106, 0.3, 3.2, 3.2, { mat: 'metal' });
  b.box(-4.0, C + 1.6, 106, 0.3, 3.2, 3.2, { mat: 'metal' });
  b.box(-5.5, C + 3.3, 106, 3.2, 0.2, 3.4, { mat: 'metal' });
  b.door(-5.5, 104.4, 2.8, 3.1, { op: 'all', in: [pC] }, { latch: false, y: C, color: '#c3cbd6', t: 0.2 });
  const w1 = b.item('weight', -5.5, C + 0.9, 106, { color: '#9aa3ad', label: 'Iron Weight' });
  b.wire(pC, [[5.5, C, 102.5], [-3.6, C, 102.5], [-3.6, C, 104.2]]);
  b.sign(5.5, C + 2.8, 102.5, 'Hold:\nopens the cage', { w: 2.4 });
  // The shelf: 5 m up, so one of you stands on the other's head.
  b.box(5.5, C + 2.5, 111.5, 4, 5, 3, wall);
  const w2 = b.item('weight', 5.5, C + 5.8, 111.5, { color: '#d9a65a', label: 'Brass Weight' });
  b.sign(2.6, C + 3, 109.6, "Too high?\nStand on your partner's head!", { style: 'prank', w: 2.6 });
  const scale = b.lock(-2, C, 113, [w1, w2], { label: 'Scale' });
  const pV = b.plate(2.5, C, 114);
  b.box(-7, C + 0.6, 114, 1.4, 1.2, 1.4, { mat: 'wood' });
  b.gem(-7, C + 2.2, 114);
  const vault = b.door(0, 116, 4, 4.6, { op: 'all', in: [scale, pV] }, { latch: true, y: C, color: '#ffd166', speed: 6 });
  b.acts[b.acts.length - 1].toast = 'The vault door is open!';
  b.wallGapsX(-8, 8, 116, 6, [[0, 4]], { ...brick, y: C, lintel: 4.6, t: 0.6 });
  b.mark('pC', 5.5, C, 102.5);
  b.mark('w1', -5.5, C, 106);
  b.mark('shelf', 5.5, C, 109.4);
  b.mark('scale', -2, C, 113);
  b.mark('pV', 2.5, C, 114);

  // -- Stage 5: the director --------------------------------------------------------------------
  b.floor(0, C, 121, 16, 10, { mat: 'wood' });
  b.checkpoint(0, C, 120, 6, { hint: 'One climbs the stairs to the glass balcony to direct, the other walks the corridor below. Each balcony plate opens half the gates — switch plates one gate at a time!' });
  const Bh = C + 5; // balcony
  [[120.6, 1.6], [122.6, 3.2], [124.6, 4.4]].forEach(([z, h]) => pillar(b, -6.5, C + h, z, 2, 2, wall));
  b.floor(-5.5, Bh, 138, 5, 24, { mat: 'wood' });
  // Corridor below: 4 m wide, walls 4.5 m, glass above the west wall.
  b.floor(0, C, 138, 4, 24, { mat: 'wood' });
  b.wallZ(126, 150, -2.2, 4.5, { y: C, t: 0.4, ...wall });
  b.wallZ(126, 150, 2.2, 4.5, { y: C, t: 0.4, ...wall });
  b.trap('hidden', -2.6, C + 10, 138, 0.2, 24, { t: 5.5 });
  b.box(-2.6, C + 10.05, 138, 0.25, 0.12, 24, { mat: 'metal' });
  b.trap('hidden', -8.1, C + 10, 138, 0.2, 24, { t: 5 });
  const dA = b.plate(-5.5, Bh, 131.5);
  const dB = b.plate(-5.5, Bh, 143.5);
  b.sign(-5.5, Bh + 2.6, 131.5, 'A: opens gates 1 and 3', { w: 2.6 });
  b.sign(-5.5, Bh + 2.6, 143.5, 'B: opens gates 2 and 4', { w: 2.6 });
  [130, 135, 140, 145].forEach((z, k) => {
    b.door(0, z, 4, 4.4, { op: 'all', in: [k % 2 ? dB : dA] }, { latch: false, y: C, color: k % 2 ? '#7cc4f2' : '#ff8a7a', speed: 10 });
    b.sign(1.4, C + 5.0, z - 0.3, String(k + 1), { w: 0.9 });
  });
  b.floor(0, C, 154, 16, 8, { mat: 'wood' });
  const done = b.pswitch(3, C, 152, true);
  b.sign(3, C + 2.6, 152, 'Pound: free the director', { w: 2.6 });
  b.door(-5.5, 150, 5, 5, { op: 'all', in: [done] }, { latch: true, y: Bh, color: '#c3cbd6', t: 0.3 });
  b.goal(0, C, 156.5, Math.PI);
  b.mark('dA', -5.5, Bh, 131.5);
  b.mark('dB', -5.5, Bh, 143.5);
  b.mark('done', 3, C, 152);
  b.marks.stairs = [[-6.5, C + 1.6, 120.6], [-6.5, C + 3.2, 122.6], [-6.5, C + 4.4, 124.6]];

  b.objectives = [
    { text: 'One holds the plate to open the door, then helps from inside', done: { cp: 1 } },
    { text: 'Take turns on the plates to leapfrog across the bridges', done: { cp: 2 } },
    { text: 'Hold the plates for each other and both climb the cliff', done: { cp: 3 } },
    { text: 'Put both weights on the scale, add one player, open the vault', done: { act: vault } },
    { text: 'One directs, one walks: get through all four gates', done: { sig: done } },
    { text: 'Reach the goal together', done: {} },
  ];
  return b.finish();
}
