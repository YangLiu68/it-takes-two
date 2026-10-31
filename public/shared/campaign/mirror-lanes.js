// Level 24 · Mirror Lanes (mirror-lanes): two lanes side by side, a wall between
// them. Nothing in your lane is yours to work: your partner's plates raise
// your bridges, their pound launches you, their switches open your gates.
// Halfway the lanes cross and you swap sides.

import { LevelBuilder } from '../build.js';
import { wallX, wallZ } from './kit4.js';

const FL = '#e6e0f2';
const WALL = { color: '#9a8fc2' };

export function mirrorLanes(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'mirror-lanes', name: 'Mirror Lanes', label: `Level ${index + 1}`, theme: 'playroom', sky: 'dusk' });
  const r = b.rng;
  const fl = (x, top, z, w, d, o = {}) => b.floor(x, top, z, w, d, { color: FL, ...o });
  const S = -4.5, Lx = 4.5; // lane centres (Sol west, Luna east)
  const rise = (x, top, z, len, when, o = {}) => b.act('bridge', when, o.latch ?? false, [
    { x, y: top - 0.5 - 6, z, sx: o.w || 3, sy: 1, sz: len, move: [0, 6, 0], yaw: o.yaw || 0 },
  ], { speed: 6, mat: 'toy', color: o.color || '#c9b6ff', lamp: o.lamp || [x + (x < 0 ? -2 : 2), top + 0.6, z - len / 2 - 0.6] });

  // -- Start ----------------------------------------------------------------------
  fl(0, 0, 4, 18, 10);
  b.checkpoint(0, 0, 3, 6, { hint: 'Two lanes with a wall between them: Sol goes left, Luna goes right. Everything in your lane is worked from your partner\'s side!' });
  b.field(S, 2, 9.2, 7, 4, 0.3, 1);
  b.field(Lx, 2, 9.2, 7, 4, 0.3, -1);
  b.sign(S, 5, 9.2, 'Sol', { style: 'prank', w: 1.6 });
  b.sign(Lx, 5, 9.2, 'Luna', { style: 'prank', w: 1.6 });
  // The middle wall, z 9..100, with a slot at the bottom for the seesaw.
  b.box(0, 6, 44.9, 2, 12, 71.8, WALL); // 9..80.8
  b.box(0, 7.2, 82, 2, 9.6, 2.4, WALL); // above the seesaw slot
  b.box(0, 6, 91.6, 2, 12, 16.8, WALL); // 83.2..100

  // -- 1. Your plate, my bridge ------------------------------------------------------
  // Each gap in your lane is bridged only while your partner stands on a plate
  // further along in theirs: leapfrog.
  for (const x of [S, Lx]) {
    fl(x, 0, 12, 7, 6);
    fl(x, 0, 28, 7, 6);
    fl(x, 0, 44, 7, 6);
  }
  const sp1 = b.plate(S, 0, 13), sp2 = b.plate(S, 0, 29);
  const lp2 = b.plate(Lx, 0, 29), lp3 = b.plate(Lx, 0, 45);
  const lb1 = rise(Lx, 0, 20, 10.4, { op: 'all', in: [sp1] });
  const sb1 = rise(S, 0, 20, 10.4, { op: 'all', in: [lp2] });
  const lb2 = rise(Lx, 0, 36, 10.4, { op: 'all', in: [sp2] });
  const sb2 = rise(S, 0, 36, 10.4, { op: 'all', in: [lp3] });
  b.sign(S, 3, 14.6, 'Hold: raises the bridge\nin your partner\'s lane', { style: 'prank' });
  b.gem(Lx + 2.5, 1.2, 28);
  b.marks.s1 = { sp1, sp2, lp2, lp3, lb1, sb1, lb2, sb2 };

  // -- 2. Spot the difference ------------------------------------------------------------
  b.checkpoint(S, 0, 44, 4, { hint: 'The exhibits on both sides match — except one. Compare them through the wall and set both dials to that number!' });
  b.checkpoint(Lx, 0, 44, 4, { hint: 'The exhibits on both sides match — except one. Compare them through the wall and set both dials to that number!' });
  for (const x of [S, Lx]) fl(x, 0, 61, 7, 28); // 47..75
  const palette = ['#ff5d5d', '#ffd166', '#7cff9e', '#4f86ff', '#c48dff', '#ff9ed2'];
  const pick = r.shuffle(palette.slice());
  const solCols = pick.slice(0, 3);
  const odd = r.int(0, 2);
  const lunaCols = solCols.slice();
  lunaCols[odd] = pick[3];
  [52, 58, 64].forEach((z, i) => {
    for (const [x, cols] of [[S, solCols], [Lx, lunaCols]]) {
      const ox = x + (x < 0 ? -2.7 : 2.7);
      b.box(ox, 1.2, z, 1.2, 2.4, 1.6, { color: cols[i] });
      b.sign(ox, 3.3, z, `#${i + 1}`, { style: 'prank', w: 1.2 });
    }
  });
  const dS = b.dial(S, 0, 70, { values: ['1', '2', '3'] });
  const dL = b.dial(Lx, 0, 70, { values: ['1', '2', '3'] });
  const same = b.combo([dS, dL], [odd, odd]);
  b.sign(S, 3, 68, 'Which number is different?\nSet both dials to it', { style: 'prank' });
  for (const x of [S, Lx]) {
    const s = x < 0 ? -1 : 1;
    wallX(b, s < 0 ? -8.25 : 1, s < 0 ? -1 : 8.25, 75.25, 0, 6, s < 0 ? [-6, -3, 0, 4] : [3, 6, 0, 4], WALL);
    b.door(x, 75.25, 3, 4, { op: 'all', in: [same] }, { color: '#c9b6ff' });
  }
  b.marks.odd = odd;

  // -- 3. The seesaw under the wall ---------------------------------------------------------
  // Its two ends are in different lanes. Luna pounds hers, Sol flies up his
  // cliff; he holds a plate up there and her lift brings her up.
  b.checkpoint(S, 0, 77.5, 4, { hint: 'The seesaw runs under the wall: one end on your side, one on your partner\'s! Sol stands on it, Luna pounds her end.' });
  b.checkpoint(Lx, 0, 77.5, 4, { hint: 'The seesaw runs under the wall: one end on your side, one on your partner\'s! Sol stands on it, Luna pounds her end.' });
  fl(S, 0, 81, 7, 12); // 75..87
  fl(Lx, 0, 80, 7, 10); // 75..85
  b.seesaw(0, 1.0, 82, 9.2, 2.4);
  const H = 9.6;
  b.box(S, H / 2 - 0.5, 91, 7, H + 1, 8, { color: '#b7a8e6' }); // Sol's cliff 87..95
  const spl = b.plate(S, H, 91.5);
  b.sign(S, H + 2.6, 91.5, 'Hold: brings up\nyour partner\'s lift', { style: 'prank' });
  fl(Lx, 0, 87.5, 7, 5); // 85..90
  b.box(Lx, H / 2 - 0.5, 92.5, 7, H + 1, 5, { color: '#b7a8e6' }); // Luna's cliff 90..95
  const lift = b.act('lift', { op: 'all', in: [spl] }, false, [
    { x: Lx, y: -0.38, z: 88, sx: 3, sy: 0.8, sz: 3, move: [0, H, 0] },
  ], { speed: 3.5, mat: 'toy', color: '#ffd166', lamp: [Lx + 2.6, 0.6, 86] });
  b.gem(S + 2.5, H + 1.2, 94);
  b.marks.s3 = { lift, spl, H };

  // -- 4. Swap lanes --------------------------------------------------------------------
  // Two bridges cross over the gap in an X — Luna's arches over Sol's — once
  // you both stand on your plates at the edge.
  b.checkpoint(S, H, 89, 4, { hint: 'Swap lanes! Both stand on the plates at the cliff edge and two crossing bridges rise: Sol goes right, Luna takes the upper one to the left.' });
  b.checkpoint(Lx, H, 92, 3, { hint: 'Swap lanes! Both stand on the plates at the cliff edge and two crossing bridges rise: Sol goes right, Luna takes the upper one to the left.' });
  const sx = b.plate(S - 2, H, 94);
  const lx = b.plate(Lx + 2, H, 93.6);
  fl(Lx - 1.5, H + 1.3, 94.2, 2.4, 1.6); // a step up to Luna's high bridge
  const len = Math.hypot(9, 12);
  const yaw = Math.atan2(9, 12);
  const swapAct = b.act('bridge', { op: 'all', in: [sx, lx] }, true, [
    { x: 0, y: H - 0.3 - 6, z: 101, sx: 2.6, sy: 0.6, sz: len, move: [0, 6, 0], yaw },
    { x: 0, y: H + 2.6 - 0.3 - 6, z: 101, sx: 2.6, sy: 0.6, sz: len, move: [0, 6, 0], yaw: -yaw, delay: 0.3 },
  ], { speed: 5, mat: 'toy', color: '#c9b6ff', lamp: [0, H + 0.6, 94.4] });
  b.marks.s4 = { sx, lx };

  // -- 5. Gates for each other ---------------------------------------------------------------
  // Now Sol's in the east lane (low) and Luna's in the west lane (high). Your
  // gates open for 5 seconds when your partner pounds the switch in their lane.
  const SY = H, LY = H + 2.6;
  fl(Lx, SY, 128, 7, 44); // Sol's new lane 106..150
  fl(S, LY, 128, 7, 44, { t: 1 }); // Luna's new lane
  b.box(0, LY + 2, 128, 2, 14, 44, WALL);
  b.field(Lx, SY + 2, 106.3, 7, 4, 0.3, 1);
  b.field(S, LY + 2, 106.3, 7, 4, 0.3, -1);
  b.checkpoint(Lx, SY, 108.5, 4, { hint: 'Door relay: your switch opens the door on the other side, for just 5 seconds. Take turns rushing through, one door at a time!' });
  b.checkpoint(S, LY, 108.5, 4, { hint: 'Door relay: your switch opens the door on the other side, for just 5 seconds. Take turns rushing through, one door at a time!' });
  const gate = (x, y, z, sw) => {
    b.box(x + (x < 0 ? -4.4 : 4.4), y + 2.5, z, 1.6, 5, 0.5, WALL); // a post past the lane edge
    return b.door(x, z, 8.6, 5, { op: 'any', in: [sw] }, { y, latch: false, color: '#ffb3d1' });
  };
  const sSw = [109, 123, 135].map((z) => b.pswitch(Lx, SY, z, false, 5, '#7cff9e'));
  const lSw = [117, 129, 141].map((z) => b.pswitch(S, LY, z, false, 5, '#7cff9e'));
  [114, 126, 138].forEach((z, i) => gate(S, LY, z, sSw[i]));
  [120, 132, 144].forEach((z, i) => gate(Lx, SY, z, lSw[i]));
  b.sign(Lx, SY + 3, 110.6, 'Pound the switch:\nopens the OTHER door', { style: 'prank' });
  fl(0, SY, 156, 18, 12); // 150..162
  b.goal(0, SY, 157);
  b.gem(0, SY + 1.2, 152);
  b.marks.s5 = { sSw: [109, 123, 135], lSw: [117, 129, 141], lGates: [114, 126, 138], sGates: [120, 132, 144], SY, LY };

  b.objectives = [
    { text: 'Take turns on the plates to raise each other\'s bridges', done: { cp: 1 } },
    { text: 'Spot the one difference and set both dials', done: { sig: same } },
    { text: 'Seesaw under the wall: one flies up, then lifts the partner up', done: { cp: 5 } },
    { text: 'Both on the plates, cross the bridges and swap lanes', done: { act: swapAct } },
    { text: 'Relay: pound switches to open the other door, race to the goal!', done: {} },
  ];
  void lb1; void lb2; void sb1; void sb2;
  return b.finish();
}
