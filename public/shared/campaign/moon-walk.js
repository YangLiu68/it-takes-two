// Level 18 · Moon Walk: low gravity. Floaty jumps over craters, a cliff you can
// only climb while your partner keeps the gravity low, a magnet launch into the
// sky with the partner bond to pull your partner up, gravity that comes and
// goes like a tide, and an asteroid field you cross tied together by a rope.

import { LevelBuilder } from '../build.js';
import { PHYS } from '../constants.js';

const ROCK = '#9a8fb3';
const MOON = '#d9d3ea';

export function moonWalk(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'moon-walk', name: 'Moon Walk', label: `Level ${index + 1}`, theme: 'space', sky: 'night' });
  const G = 0.35;

  // -- 1. Craters -------------------------------------------------------------------------
  b.floor(0, 0, 0, 12, 10, { color: MOON });
  b.checkpoint(0, 0, -1.5, 7, { hint: 'Low gravity! Inside the purple zones you jump high and far, and fall slowly.' });
  b.sign(0, 3.4, 4, 'Low gravity ahead\ngive it a jump!', { w: 3.8 });
  b.zone('gravity', 0, 12, 34, 30, 44, 66, { g: G }); // z 1..67: take off from the edge already floaty
  const isles = [[0, 5, 16, 6], [6, 9, 30, 6], [-4, 7, 44, 7], [2, 12, 58, 6]];
  isles.forEach(([x, top, z, w], i) => {
    b.plat(x, top, z, w, w, 3, { color: ROCK });
    b.mark(`isle${i}`, x, top, z);
  });
  b.plat(-9.5, 15, 44, 2, 2, 8, { color: ROCK });
  b.gem(-9.5, 16.4, 44);
  b.floor(0, 12, 74.5, 14, 15, { color: MOON });

  // -- 2. Hold the gravity for me ------------------------------------------------------------
  const top2 = 22;
  b.checkpoint(0, 12, 70, 6, { hint: 'Teamwork: the cliff is too high. One holds the plate to make low gravity at the cliff base, the other double-jumps up. Then the one up top holds the plate there to bring the partner up too.' });
  const p1 = b.plate(-5, 12, 71);
  b.plat(0, top2, 90, 14, 16, 12, { color: ROCK }); // the cliff: z 82..98
  const p2 = b.plate(5, top2, 85.5);
  b.zone('gravity', 0, 22, 79, 14, 24, 6, { g: G, when: [p1, p2] });
  b.light(0, 13.5, 79, { color: '#c9a0ff', intensity: 6, dist: 8, when: p1, fixture: 'none' });
  b.light(0, 13.5, 79, { color: '#c9a0ff', intensity: 6, dist: 8, when: p2, fixture: 'none' });
  b.sign(-5, 14.9, 71, 'Hold: low gravity\nat the cliff', { w: 3.6 });
  b.sign(5, top2 + 2.9, 85.5, 'Hold: low gravity\nfor your partner', { w: 3.4 });
  b.gem(0, 18, 80);
  b.mark('p1', -5, 12, 71);
  b.mark('p2', 5, top2, 85.5);
  b.mark('cliffBase', 0, 12, 80.6);

  // -- 3. Up into the sky ---------------------------------------------------------------------
  b.checkpoint(0, top2, 90, 6, { hint: 'The red magnet pad is for Sol only: stand on it and hold E to bounce sky-high in low gravity! Up top, hold the plate to raise the lift for Luna.' });
  b.zone('gravity', 0, 40, 108, 30, 50, 36, { g: G }); // z 90..126
  b.pad(-4, top2 + 0.08, 94.5, [0, 1, 0], 1, { launch: [0, PHYS.repelSpeed, 0] });
  b.sign(-4, top2 + 3, 94.5, 'Sol: stand here\nand hold E', { w: 3.2 });
  const hTop = 36;
  b.plat(0, hTop, 107, 10, 6, 1.6, { color: '#c9a0ff' }); // z 104..110
  const liftPlate = b.plate(3, hTop, 108);
  b.sign(3, hTop + 3, 108, 'Hold: lift up\nfor your partner', { w: 3.4 });
  b.act('lift', { op: 'any', in: [liftPlate] }, false, [{ x: 4, y: top2 - 0.2, z: 102, sx: 3, sy: 0.4, sz: 3, move: [0, hTop - top2, 0] }], { speed: 6, lamp: [4, top2 + 0.4, 100.2], color: '#c9a0ff' });
  b.mark('liftPlate', 3, hTop, 108);
  b.mark('lift', 4, top2, 102);
  b.gem(2, hTop + 1.4, 106);
  b.mark('pad', -4, top2, 94.5);
  b.mark('high', 0, hTop, 107);
  b.mark('luna3', 4, top2, 95);
  const fTop = 30;
  b.floor(0, fTop, 134, 14, 12, { color: MOON }); // z 128..140

  // -- 4. The lunar tide ---------------------------------------------------------------------------
  const per = 6;
  b.checkpoint(0, fTop, 133, 6, { hint: 'Moon tide: every 6 seconds the low gravity is on for 3 seconds, off for 3. It only works while the lights glow — jump as soon as they light up!' });
  b.zone('gravity', 0, 50, 162.5, 20, 50, 51, { g: G, pulse: [per, 0, 0.5] }); // z 137..188
  const cols = [[0, 35, 151], [0, 40, 165], [0, 45, 179]];
  cols.forEach(([x, top, z], i) => {
    b.plat(x, top, z, 5, 5, 4, { color: ROCK });
    b.light(x, top + 4, z, { color: '#c9a0ff', intensity: 10, dist: 12, fixture: 'bulb', pulse: [per, 0, 0.5] });
    b.mark(`col${i}`, x, top, z);
  });
  b.light(0, fTop + 4, 138, { color: '#c9a0ff', intensity: 10, dist: 12, fixture: 'bulb', pulse: [per, 0, 0.5] });
  b.sign(-3.5, fTop + 3, 138, 'Lights on = low gravity\nLights off = normal', { w: 3.6 });
  b.gem(0, 42.5, 172);
  const eTop = 45;
  b.floor(0, eTop, 194, 12, 10, { color: MOON }); // z 189..199
  b.mark('tide', 0, 0, per);

  // -- 5. Tied together through the asteroids ----------------------------------------------------
  b.checkpoint(0, eTop, 193, 6, { hint: 'You are tied together by a 7 m rope! Jump together — if one jumps too early, the rope yanks the other along.' });
  b.zone('gravity', 0, 55, 226, 24, 40, 70, { g: G });
  b.zone('tether', 0, 55, 226, 24, 40, 70, { len: 7 });
  const rocks = [[-2, eTop, 209], [2.5, eTop + 1.5, 221], [-1.5, eTop + 0.5, 233], [2, eTop + 2, 245]];
  rocks.forEach(([x, top, z], i) => {
    b.plat(x, top, z, 6, 6, 3, { color: ROCK });
    b.mark(`rock${i}`, x, top, z);
  });
  b.gem(0.5, eTop + 4, 227);
  b.floor(0, eTop + 2, 258, 14, 12, { color: MOON }); // the far moon: z 252..264
  b.goal(0, eTop + 2, 259);
  return b.finish();
}
