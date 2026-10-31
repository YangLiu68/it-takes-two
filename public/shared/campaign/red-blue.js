// Level 20 · Red & Blue (red-blue): pounding a colour switch swaps which blocks
// exist — red or blue. Every stage asks something new of the switch: flip it
// while your partner rests, while they're in mid-air, flip your partner's lane
// from yours, walk a maze whose walls and floors swap, and race a timed door
// flipping the blocks yourself.

import { LevelBuilder } from '../build.js';

const RED = '#ff5d5d';
const BLUE = '#4f86ff';
const GRAY = '#b8b2c8';
const COLORS = [RED, BLUE];

export function redBlue(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'red-blue', name: 'Red & Blue', label: `Level ${index + 1}`, theme: 'candy', sky: 'day' });
  const gray = (x, top, z, w, d, o = {}) => b.floor(x, top, z, w, d, { color: GRAY, t: 0.8, ...o });
  // A colour switch you can see; `master` is the dial whose value the blocks follow.
  const master = (x, top, z) => b.dial(x, top, z, { values: COLORS, style: 'color', start: 0 });
  // A swap button somewhere else: pounding it flips `target`.
  const flip = (x, top, z, target) => b.dial(x, top, z, { values: ['⇄'], links: [target], color: '#ffd166' });
  const block = (x, top, z, dial, on, o = {}) => b.swap(x, top, z, o.w || 2.6, o.d || 2.6, { dial, on, t: o.t || 0.8 });

  // -- Start --------------------------------------------------------------------------
  b.floor(0, 0, 4, 12, 10, { color: '#ffd6e8' });
  b.checkpoint(0, 0, 3, 6, { hint: 'Pound a colour switch (C) to swap the red and blue blocks: only one colour is solid at a time!' });

  // -- 1. Flip it while your partner rests ----------------------------------------------
  gray(0, 0, 12, 10, 6);
  const d1 = master(-3, 0, 13);
  b.sign(-3, 3.2, 13, 'Colour switch\nPound: red ⇄ blue', { style: 'prank' });
  b.sign(2, 3.2, 14.6, 'Stand on a grey block,\nlet your partner swap', { style: 'prank' });
  const c1 = [[2, 18, 0], [2, 22.5, -1], [2, 27, 1], [2, 31.5, -1], [2, 36, 0]];
  for (const [x, z, on] of c1) (on < 0 ? gray(x, 0, z, 2.6, 2.6) : block(x, 0, z, d1, on));
  block(-3.5, 0, 27, d1, 1);
  b.gem(-3.5, 1.4, 27);
  gray(0, 0, 41, 10, 6); // far side
  flip(3, 0, 41.5, d1);
  b.sign(3, 3.2, 41.5, 'You can swap\nfrom here too', { style: 'prank' });
  b.mark('d1', -3, 0, 13);

  // -- 2. Flip it in mid-air ------------------------------------------------------------
  b.checkpoint(0, 0, 40.5, 5, { hint: 'No grey blocks this time: swap the colour the moment your partner jumps, so they land on the next block!' });
  const d2 = master(-3, 0, 42.5);
  const c2 = [[0, 0, 47.5, 0], [0, 0.8, 53, 1], [0, 1.6, 58.5, 0], [0, 2.4, 64, 1]];
  for (const [x, t, z, on] of c2) block(x, t, z, d2, on);
  b.sign(0, 3.4, 44.2, 'Jump — SWAP!', { style: 'prank' });
  gray(0, 2.4, 70, 10, 6); // 67..73
  flip(3, 2.4, 70.5, d2);
  b.gem(-2.6, 3.8, 58.5);
  block(-2.6, 2.4, 58.5, d2, 1, { w: 1.8, d: 1.8 });
  b.marks.c2 = c2;

  // -- 3. Flip your partner's lane --------------------------------------------------------
  // Two lanes. Sol's blocks follow one hidden switch, Luna's another; the
  // buttons on each lane's grey islands flip the OTHER lane.
  const T3 = 2.4;
  b.checkpoint(0, T3, 69.5, 5, { hint: 'Two lanes: Sol goes left, Luna goes right. The button on your grey block swaps the colours on your partner\'s lane!' });
  const dL = b.dial(-3, -60, 70, { values: COLORS, style: 'color' }); // hidden masters
  const dR = b.dial(3, -60, 70, { values: COLORS, style: 'color' });
  gray(-3.5, T3, 76, 3.4, 3.4);
  gray(3.5, T3, 76, 3.4, 3.4);
  b.sign(-3.5, T3 + 3, 76, "Sol's lane", { style: 'prank', w: 2 });
  b.sign(3.5, T3 + 3, 76, "Luna's lane", { style: 'prank', w: 2 });
  // island z, then the block after it: left block colour, right block colour.
  const lanes = [[76, 0, 1], [86, 1, 0], [96, 0, 1]];
  for (const [z, lOn, rOn] of lanes) {
    block(-3.5, T3, z + 5, dL, lOn);
    block(3.5, T3, z + 5, dR, rOn);
    gray(-3.5, T3, z + 10, 3.4, 3.4);
    gray(3.5, T3, z + 10, 3.4, 3.4);
  }
  for (const z of [76, 86, 96, 106]) {
    flip(-3.5, T3, z, dR);
    flip(3.5, T3, z, dL);
  }
  b.box(0, T3 + 1.2, 91, 0.6, 2.4, 30, { color: '#e8a0c8' }); // low divider
  gray(0, T3, 111, 12, 6); // 108..114
  b.gem(0, T3 + 4.2, 91);
  b.marks.lanes = lanes;
  b.marks.dLR = [dL, dR];

  // -- 4. The swapping maze ---------------------------------------------------------------
  // Doors are walls of one colour; two rooms have floors of one colour around a
  // grey island. The guide on the balcony flips; the walker calls out when.
  const T4 = T3;
  b.checkpoint(0, T4, 111, 5, { hint: 'One enters the maze, the other works the switch from the stand on the right. Walls and floors both swap colour: only swap while they\'re on grey!' });
  const d4 = b.dial(7.5, T4 + 3, 116, { values: COLORS, style: 'color' });
  gray(7.5, T4 + 3, 116, 3, 3); // balcony switch stand
  gray(7.5, T4 + 1.5, 113.5, 2.4, 1.6); // step up to it
  b.sign(7.5, T4 + 6.2, 116, 'Lookout: controls\nthe maze colours', { style: 'prank' });
  const MZ0 = 116, ROOM = 6;
  const W = { color: '#c9a3ff' };
  // Rooms along z: floor kind per room (gray | 0 red | 1 blue), door colour after it.
  const rooms = [['g', 0], ['g', 1], [1, 0], [0, 1], ['g', null]];
  rooms.forEach(([floor, door], i) => {
    const zc = MZ0 + ROOM / 2 + i * ROOM;
    if (floor === 'g') gray(0, T4, zc, 6, ROOM);
    else {
      block(0, T4, zc, d4, floor, { w: 6, d: ROOM });
      gray(0, T4 + 0.03, zc, 1.8, 1.8); // island
    }
    // Side walls.
    b.box(-3.2, T4 + 1.6, zc, 0.4, 3.2, ROOM, W);
    b.box(3.2, T4 + 1.6, zc, 0.4, 3.2, ROOM, W);
    if (door !== null) {
      const zd = MZ0 + (i + 1) * ROOM;
      b.box(-2.1, T4 + 1.6, zd, 1.8, 3.2, 0.4, W);
      b.box(2.1, T4 + 1.6, zd, 1.8, 3.2, 0.4, W);
      block(0, T4 + 3.2, zd, d4, door, { w: 2.4, d: 0.5, t: 3.2 });
    }
  });
  const MZ1 = MZ0 + rooms.length * ROOM; // 146
  gray(0, T4, MZ1 + 3, 12, 6); // exit platform 146..152
  flip(-3.5, T4, MZ1 + 3.5, d4);
  b.sign(-3.5, T4 + 3.2, MZ1 + 3.5, 'Swap colours for\nyour partner on the stand', { style: 'prank' });
  gray(0, T4, 115, 6, 2); // into the maze
  b.gem(0, T4 + 1.4, MZ0 + 2.5 * ROOM);
  b.marks.maze = { MZ0, ROOM, rooms };

  // -- 5. Race the door, flip it yourself ---------------------------------------------------
  const T5 = T4;
  b.checkpoint(0, T5, 149.5, 5, { hint: 'Your partner pounds the timer switch and the far door opens for a short while: jump along and pound the buttons on the grey blocks to swap colours yourself! On the other side, open the door for your partner.' });
  const d5 = b.dial(0, -60, 150, { values: COLORS, style: 'color' });
  const t5a = b.pswitch(-4, T5, 151, false, 18, '#7cff9e');
  b.sign(-4, T5 + 3.2, 151, 'Timer switch\n(door opens 18 s)', { style: 'prank' });
  flip(3, T5, 151.5, d5);
  // course: block, island with button, block, island, block, door
  const c5 = [[0, 156, 0], [0, 161, 'i'], [0, 166, 1], [0, 171, 'i'], [0, 176, 0], [0, 181, 'i'], [0, 186, 1]];
  for (const [x, z, k] of c5) {
    if (k === 'i') {
      gray(x, T5, z, 2.6, 2.6);
      flip(x, T5, z, d5);
    } else block(x, T5, z, d5, k);
  }
  gray(0, T5, 192, 8, 4); // before the door 190..194
  const t5b = b.pswitch(3, T5, 197.5, false, 18, '#7cff9e');
  b.box(-3, T5 + 2.2, 194.2, 2.2, 4.4, 0.4, { color: '#ffb3d1' });
  b.box(3, T5 + 2.2, 194.2, 2.2, 4.4, 0.4, { color: '#ffb3d1' });
  const door = b.door(0, 194.2, 3.8, 4.4, { op: 'any', in: [t5a, t5b] }, { y: T5, latch: false, color: '#ff8fc8' });
  gray(0, T5, 199, 12, 10); // 194..204
  b.gem(3.5, T5 + 1.2, 166);
  gray(3.5, T5, 166, 1.6, 1.6);
  b.goal(0, T5, 201);
  b.marks.c5 = c5;

  b.objectives = [
    { text: 'Stand on grey blocks while your partner swaps colours', done: { cp: 1 } },
    { text: 'Swap colours the moment your partner jumps', done: { cp: 2 } },
    { text: 'Two lanes: your buttons swap your partner\'s colours', done: { cp: 3 } },
    { text: 'Colour maze: the one on the stand works the switch', done: { cp: 4 } },
    { text: 'Timed door: swap colours yourself as you jump', done: { act: door } },
    { text: 'Reach the goal!', done: {} },
  ];
  return b.finish();
}
