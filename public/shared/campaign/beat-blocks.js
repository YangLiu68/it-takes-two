// Level 5 · Beat Blocks: blocks that come and go on a beat — and blocks whose beat
// your partner plays.
//   1. follow the beat: pink and teal take turns being solid
//   2. two tempos: a slow lane and a fast lane, and a gate that needs you both
//   3. you call the beat: your partner flips red/blue blocks for you, then you swap
//   4. the beat tower: climb on the beat
//   5. duet: Sol keeps Luna's beat from an island in the middle of his own lane

import { LevelBuilder } from '../build.js';
import { hub, gateWall } from './kit.js';

const RED = '#ff5d5d', BLUE = '#4f86ff';

export function beatBlocks(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'beat-blocks', name: 'Beat Blocks', label: `Level ${index + 1}`, theme: 'candy', sky: 'day' });
  const ids = (from) => b.blinks.slice(from).map((k) => k.id);

  // -- Stage 1: follow the beat --------------------------------------------------------------
  hub(b, 0, 0, 0, 12, 10, { hint: 'Pink and teal blocks take turns being solid. A blinking block is about to vanish — hop onto the other color right as it goes!' });
  b.sign(0, 3.2, 3.4, 'Jump to the beat!\nBlinking = about to vanish', { w: 4 });
  let n0 = b.blinks.length;
  [8, 12.5, 17, 21.5, 26, 30.5].forEach((z, i) => b.blink((i % 2 ? 0.8 : -0.8), 0, z, 3, 3, i % 2, 3.2));
  b.marks.beat1 = ids(n0);
  b.gem(0.8, 2.6, 17);

  // -- Stage 2: two tempos ------------------------------------------------------------------
  hub(b, 0, 0, 37, 16, 8, { hint: 'Left is slow, right is fast. One lane each, and at the end you both stand on the plates to open the gate.' });
  b.sign(-4, 3.0, 40, 'Slow beat', { w: 1.8 });
  b.sign(4, 3.0, 40, 'Fast beat', { w: 1.8 });
  const zs = [44, 48.5, 53, 57.5, 62, 66.5];
  n0 = b.blinks.length;
  zs.forEach((z, i) => b.blink(-4, 0, z, 3, 3, i % 2, 4.2));
  b.marks.slow = ids(n0);
  n0 = b.blinks.length;
  zs.forEach((z, i) => b.blink(4, 0, z, 2.8, 2.8, i % 2, 2.2));
  b.marks.fast = ids(n0);
  b.floor(-4, 0, 72.5, 5, 5, { mat: 'wood' });
  b.floor(4, 0, 72.5, 5, 5, { mat: 'wood' });
  const pW = b.plate(-4, 0, 72.6), pE = b.plate(4, 0, 72.6);
  gateWall(b, { op: 'all', in: [pW, pE] }, { z: 75.5, top: 0, half: 8, doorW: 4, h: 6 });
  b.wire(pW, [[-4, 0, 72.6], [-4, 0, 74.8], [-2.1, 0, 74.8]]);
  b.wire(pE, [[4, 0, 72.6], [4, 0, 74.8], [2.1, 0, 74.8]]);
  b.gem(4, 2.6, 57.5);
  b.mark('pW', -4, 0, 72.6);
  b.mark('pE', 4, 0, 72.6);

  // -- Stage 3: you call the beat -----------------------------------------------------------
  hub(b, 0, 0, 81, 16, 10, { hint: 'Red and blue blocks obey the switch: pound it and red and blue swap. One walks, the other times the switch — then swap roles on the far side!' });
  b.sign(-5.5, 3.2, 79, 'Pound the switch:\nred ⇄ blue', { w: 2.6 });
  const D1 = b.dial(-5.5, 0, 82.5, { values: [RED, BLUE], style: 'color' });
  const lane = (x, dial, colors) => {
    // colored block, small grey pad, colored block, ...
    let z = 86;
    const out = [];
    colors.forEach((c, i) => {
      out.push({ kind: 'swap', x, z: z + 1.5, on: c, id: b.swap(x, 0, z + 1.5, 3, 3, { dial, on: c, t: 0.8 }) });
      z += 3 + 1;
      if (i < colors.length - 1) {
        b.floor(x, 0, z + 1, 2, 2, { mat: 'wood', t: 0.8 });
        out.push({ kind: 'pad', x, z: z + 1 });
        z += 2 + 1;
      }
    });
    return out;
  };
  b.marks.lane1 = lane(-2.5, D1, [0, 1, 1, 0]);
  hub(b, 0, 0, 115.5, 16, 7, { hint: 'Whoever gets across first pounds the switch on the right to help their partner over the red and blue path. Then climb the tower to the beat!' });
  const D2 = b.dial(5.5, 0, 114.4, { values: [RED, BLUE], style: 'color' });
  b.marks.lane2 = lane(2.5, D2, [1, 0, 1, 1]);
  b.sign(5.5, 3.2, 116.6, 'Your turn on the switch:\nbring your partner over', { w: 2.8 });
  b.gem(-2.5, 2.4, 98);
  b.mark('D1', -5.5, 0, 82.5);
  b.mark('D2', 5.5, 0, 114.4);

  // -- Stage 4: the beat tower ----------------------------------------------------------------
  n0 = b.blinks.length;
  const tower = [];
  for (let i = 0; i < 8; i++) {
    const x = i % 2 ? 2 : -2, z = 122 + i * 3, top = 1.2 * (i + 1);
    b.blink(x, top, z, 2.6, 2.6, i % 2, 3.0);
    tower.push([x, top, z]);
  }
  b.marks.tower = ids(n0);
  b.marks.towerAt = tower;
  b.gem(5, 8.4, 140);

  // -- Stage 5: duet ---------------------------------------------------------------------------
  const T = 9.6;
  hub(b, 0, T, 148, 16, 8, { hint: "Behind the red barrier is Sol's beat path; behind the blue one, Luna's red and blue path. Sol, stop on the island halfway and pound the switch for Luna!" });
  b.wallGapsX(-8, 8, 152.2, 4, [[-4, 3.6], [4, 3.6]], { y: T, t: 0.4, color: '#a98bff' });
  b.field(-4, T + 2, 152.2, 3.6, 4, 0.3, 1);
  b.field(4, T + 2, 152.2, 3.6, 4, 0.3, -1);
  n0 = b.blinks.length;
  [156, 160].forEach((z, i) => b.blink(-4, T, z, 3, 3, i % 2, 3.0));
  b.floor(-4, T, 164.5, 3.4, 3.4, { mat: 'wood', t: 0.8 });
  const D3 = b.dial(-4, T, 164.5, { values: [RED, BLUE], style: 'color' });
  [169, 173, 177].forEach((z, i) => b.blink(-4, T, z, 3, 3, i % 2, 3.0));
  b.marks.duetBlink = ids(n0);
  // Luna's lane: swap blocks with grey pads, keyed to D3.
  const lz = [[155.5, 0], [159.5, 'pad'], [163.5, 1], [167.5, 'pad'], [171.5, 1], [175.5, 'pad'], [179, 0]];
  b.marks.duetSwap = lz.map(([z, c]) => {
    if (c === 'pad') {
      b.floor(4, T, z, 2, 2, { mat: 'wood', t: 0.8 });
      return { kind: 'pad', x: 4, z };
    }
    return { kind: 'swap', x: 4, z, on: c, id: b.swap(4, T, z, 3, 3, { dial: D3, on: c, t: 0.8 }) };
  });
  b.gem(-4, T + 2.4, 164.5);
  b.floor(0, T, 185.5, 16, 8, { mat: 'wood' });
  b.goal(0, T, 186.5, Math.PI);
  b.mark('D3', -4, T, 164.5);

  b.objectives = [
    { text: 'Hop across the pink and teal blocks to the beat', done: { cp: 1 } },
    { text: 'One takes the slow lane, one the fast; hold the plates to open the gate', done: { cp: 2 } },
    { text: 'One walks, one pounds the switch: red and blue obey you', done: { cp: 3 } },
    { text: 'Climb the tower to the beat', done: { cp: 4 } },
    { text: 'Duet: Sol keeps the beat for Luna from the island', done: {} },
  ];
  return b.finish();
}
