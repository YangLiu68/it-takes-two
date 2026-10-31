// Level 17 · Ice Slide: ice. You speed up slowly and you don't stop. Take the
// bends of an ice path early, race over thin ice into the wall your partner
// raises, slide a rock maze to two buttons you pound together, and stop on
// two plates in a rink while a sweeper knocks you about.

import { LevelBuilder } from '../build.js';
import { plankBridge } from './kit3.js';

const ICE = '#8fd0ff';
const SNOW = '#ffffff';
const ROCK = '#8fa3b8';

export function iceRink(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'ice-rink', name: 'Ice Slide', label: `Level ${index + 1}`, theme: 'frost', sky: 'day' });
  const ice = (x, z, w, d, o = {}) => b.floor(x, o.top ?? 0, z, w, d, { ice: true, color: ICE, t: o.t ?? 1 });
  const snow = (x, z, w, d, o = {}) => b.floor(x, o.top ?? 0, z, w, d, { color: SNOW, t: o.t ?? 1 });

  // -- 1. The ice path -----------------------------------------------------------------------
  snow(0, 0, 12, 8);
  b.checkpoint(0, 0, -1, 7, { hint: 'Ice is slippery: slow to start, hard to stop. Let go early and turn early!' });
  b.sign(0, 3.2, 3, 'Ice: turn early!', { w: 3.6 });
  ice(0, 9, 3, 10);
  ice(4.5, 15.5, 12, 3);
  ice(9, 22, 3, 10);
  ice(3, 28.5, 15, 3);
  ice(-3, 35, 3, 10);
  b.gem(9, 1.4, 15.5);
  b.gem(-3, 1.4, 28.5);
  snow(-3, 44, 10, 8);
  b.mark('bend', 0, 0, 0);

  // -- 2. Thin ice and the wall ------------------------------------------------------------
  b.checkpoint(-3, 0, 43.5, 6, { hint: 'Teamwork: build up speed on the ice and race over the thin ice before it cracks! You can\'t stop at the end — your partner holds the plate at the start to raise a wall that catches you.' });
  const hold = b.plate(-6.5, 0, 45.5);
  b.sign(-6.5, 2.9, 45.5, 'Hold: raise the\nwall at the end', { w: 3.4 });
  ice(-3, 55, 6, 14); // speed up: z 48..62
  for (let k = 0; k < 6; k++) {
    b.crumble(-3, 0, 63.5 + k * 3, 6, 3);
    b.crumbles[b.crumbles.length - 1].ice = true;
  }
  ice(-3, 83.5, 6, 7); // landing strip: z 80..87
  b.act('wall', { op: 'any', in: [hold] }, false, [{ x: -3, y: -1.6, z: 87.3, sx: 6, sy: 3, sz: 0.6, move: [0, 3.1, 0] }], { speed: 10, mat: 'toy', color: '#8ec5ff', lamp: [-3, 0.4, 86.6] });
  const sw2 = b.pswitch(-1, 0, 84.5, true);
  b.sign(-1, 2.8, 84.5, 'Pound: bridge\nfor your partner', { w: 3.2 });
  plankBridge(b, 2.5, 48, 81, 0, sw2, { w: 2.4 });
  b.floor(0.65, 0, 84, 1.3, 6, { color: SNOW }); // the bridge lands next to the strip
  b.gem(-3, 1.4, 69);
  b.mark('hold', -6.5, 0, 45.5);
  b.mark('sw2', -1, 0, 84.5);
  b.mark('runStart', -3, 0, 48.6);

  // -- 3. The sliding maze -------------------------------------------------------------------
  // 5 x 5 cells of 3.6 m: you slide until a rock, a wall or a patch of snow stops you.
  const z0 = 92, S = 3.6;
  const cx = (i) => -9 + S / 2 + i * S;
  const cz = (j) => z0 + S / 2 + j * S;
  snow(-1, 89.5, 8, 5); // from the strip into the maze
  b.checkpoint(-1, 0, 89.4, 4, { flag: false, hint: 'Sliding maze: on ice you keep sliding until you hit a rock or a wall, or reach snow. Each of you slides to a button, then pound them together (within 2 seconds)!' });
  const snowCells = [[2, 0], [0, 4], [4, 2]];
  const rocks = [[2, 3], [1, 0], [3, 1]];
  for (let j = 0; j < 5; j++) {
    for (let i = 0; i < 5; i++) {
      const isSnow = snowCells.some(([a, c]) => a === i && c === j);
      if (isSnow) snow(cx(i), cz(j), S, S);
      else ice(cx(i), cz(j), S, S);
    }
  }
  for (const [i, j] of rocks) b.box(cx(i), 0.8, cz(j), S - 0.4, 1.6, S - 0.4, { color: ROCK });
  const wallC = { color: '#b7d4ea', t: 0.6 };
  const zN = z0 + 5 * S;
  b.wallGapsX(-9, 9, z0, 2.4, [[cx(2), 3.4]], wallC);
  b.wallX(-9, 9, zN, 2.4, wallC);
  b.wallZ(z0, zN, -9, 2.4, wallC);
  b.wallGapsZ(z0, zN, 9, 2.4, [[cz(2), 3]], wallC);
  const swA = b.pswitch(cx(0), 0, cz(4), false, 2);
  const swB = b.pswitch(cx(4), 0, cz(2), false, 2);
  const mazeDoor = b.door(9, cz(2), 3, 2.4, { op: 'all', in: [swA, swB] }, { axis: 'z', latch: true, color: '#8ec5ff' });
  b.acts[b.acts.length - 1].toast = 'The door is open!';
  void mazeDoor;
  b.gem(cx(4), 1.2, cz(4));
  for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) b.mark(`c${i}${j}`, cx(i), 0, cz(j));

  // -- 4. Curling into the corners ------------------------------------------------------------
  const rx = 20, rz = cz(2);
  snow(14.75, rz, 10.5, 4); // out of the maze's side door to the rink
  b.checkpoint(13.5, 0, rz, 3.5, { flag: false, hint: 'There is a plate in two corners of the rink. Play it like curling: walk along the edge to the right row, then line up and slide in. Both of you on a plate at once opens the east door.' });
  // The rink, x 20..40: ice, with a patch of snow by the exit door.
  ice(rx + 8, rz, 16, 20);
  ice(rx + 18, rz - 6.5, 4, 7);
  ice(rx + 18, rz + 6.5, 4, 7);
  snow(rx + 18, rz, 4, 6);
  const pocket = (z) => {
    // A U-shaped pocket against the east fence, open to the west.
    b.box(38.1, 1, z - 1.7, 2.6, 2, 0.4, { color: ROCK });
    b.box(38.1, 1, z + 1.7, 2.6, 2, 0.4, { color: ROCK });
    b.box(39.6, 1, z, 0.4, 2, 3.8, { color: ROCK });
    return b.plate(38.1, 0, z);
  };
  const pA = pocket(rz - 7.5);
  const pB = pocket(rz + 7.5);
  // Rocks in the middle stop the easy diagonal shots.
  b.box(29, 0.8, rz - 2.6, 2.6, 1.6, 2.6, { color: ROCK });
  b.box(29, 0.8, rz + 2.6, 2.6, 1.6, 2.6, { color: ROCK });
  // Rink fence, with the way in (west) and the exit door (east).
  const fence = { color: '#b7d4ea' };
  b.wallX(rx, rx + 20, rz - 10, 1.4, fence);
  b.wallX(rx, rx + 20, rz + 10, 1.4, fence);
  b.wallGapsZ(rz - 10, rz + 10, rx, 1.4, [[rz, 4]], fence);
  b.wallGapsZ(rz - 10, rz + 10, rx + 20, 2.6, [[rz, 3]], { ...fence, lintel: 2.4 });
  const exit = b.door(rx + 20, rz, 3, 2.4, { op: 'all', in: [pA, pB] }, { axis: 'z', latch: true, color: '#8ec5ff' });
  b.acts[b.acts.length - 1].toast = 'The door is open!';
  void exit;
  b.gem(rx + 2, 1.2, rz - 7.5);
  b.mark('pA', 38.1, 0, rz - 7.5);
  b.mark('pB', 38.1, 0, rz + 7.5);
  b.mark('rink', rx, 0, rz);
  snow(rx + 26, rz, 12, 10);
  b.goal(rx + 27, 0, rz, Math.PI / 2);
  return b.finish();
}
