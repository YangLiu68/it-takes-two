// Level 23 · Night Run (night-run): a run in the dark where light is the floor. Follow
// the fireflies past fake tiles; glass that's only solid in a flashlight beam —
// your own, then only your partner's, then both lanes at once; and a dark
// tower with a bridge that needs both lights.

import { LevelBuilder } from '../build.js';
import { DARK } from '../stories/common.js';

const STONE = '#3c4258';
const FAKE = STONE;

export function nightRun(index) {
  const b = new LevelBuilder({
    mode: 'classic', index, seed: 'night-run', name: 'Night Run', label: `Level ${index + 1}`, theme: 'twilight', sky: 'night',
    overrides: { ...DARK, indoor: false, stars: true, fogDensity: 0.035, hemiIntensity: 0.5 },
  });
  const r = b.rng;
  const fl = (x, top, z, w, d, o = {}) => b.floor(x, top, z, w, d, { color: STONE, ...o });
  const lamp = (x, top, z, o = {}) => {
    b.box(x, top + 1.6, z, 0.18, 3.2, 0.18, { mat: 'metal' });
    b.light(x, top + 3.3, z, { color: o.color || '#ffd9a0', intensity: o.intensity ?? 10, dist: o.dist ?? 12, fixture: 'bulb', when: o.when, flicker: o.flicker ?? 0.05 });
  };

  // -- Start ---------------------------------------------------------------------
  fl(0, 0, 4, 12, 10);
  b.checkpoint(0, 0, 3, 6, { hint: 'It\'s dark. Your flashlight points where you look — turn the camera to light the way.' });
  lamp(-5, 0, 6);
  b.sign(0, 3.2, 7.5, 'Night run!\nYour flashlight points\nwhere you look', { style: 'prank' });

  // -- 1. Follow the fireflies -----------------------------------------------------
  // Three tiles per row, only one real; the real ones have fireflies — but only
  // while someone holds the jar plate at either end.
  fl(0, 0, 10.5, 12, 3); // 9..12
  const jarA = b.plate(-4, 0, 10.5);
  b.sign(-4, 2.6, 10.5, 'Firefly jar\nHold it: fireflies glow', { style: 'prank' });
  const rows = [13.5, 17.5, 21.5, 25.5, 29.5, 33.5];
  // A winding path (one tile per row; never more than one column per row).
  const path = r.pick([[0, 1, 2, 1, 0, 1], [2, 1, 1, 0, 1, 2], [1, 0, 1, 2, 2, 1], [0, 0, 1, 2, 1, 0], [2, 2, 1, 0, 0, 1]]);
  rows.forEach((z, k) => {
    const col = path[k];
    for (let c = 0; c < 3; c++) {
      const x = -4 + c * 4;
      if (c === col) fl(x, 0, z, 3, 3, { t: 0.8 });
      else b.trap('fake', x, 0, z, 3, 3, { color: FAKE, t: 0.8 });
    }
  });
  fl(0, 0, 38.5, 12, 5); // 36..41
  const jarB = b.plate(4, 0, 39);
  b.sign(4, 2.6, 39, 'Firefly jar', { style: 'prank', w: 1.8 });
  rows.forEach((z, k) => {
    const x = -4 + path[k] * 4;
    // Two fireflies per tile, one for each jar, blinking along the path like runway lights.
    b.light(x - 0.6, 0.7, z, { color: '#c8ff6a', intensity: 4, dist: 5, fixture: 'bulb', when: jarA, pulse: [2.4, -k / 6, 0.45] });
    b.light(x + 0.6, 0.7, z, { color: '#c8ff6a', intensity: 4, dist: 5, fixture: 'bulb', when: jarB, pulse: [2.4, k / 6, 0.45] });
  });
  b.gem(-4 + path[5] * 4, 1.6, 33.5);
  b.marks.fireflies = rows.map((z, k) => [-4 + path[k] * 4, 0, z]);

  // -- 2. Light glass --------------------------------------------------------------------
  b.checkpoint(0, 0, 38.5, 4, { hint: 'The glass bridge is only solid in a flashlight beam. Look at it, then jump on!' });
  lamp(-5, 0, 37);
  const g2 = [[1.5, 44], [-1.5, 48.5], [1.5, 53], [-1.5, 57.5], [1.5, 62]];
  for (const [x, z] of g2) b.glass(x, 0, z, 3, 2.6);
  b.sign(0, 3.2, 41, 'Glass bridge: only solid\nwhile you light it', { style: 'prank' });
  b.glass(-6, 0.6, 53, 2, 2);
  b.gem(-6, 1.8, 53);
  fl(0, 0, 68, 12, 6); // 65..71
  b.marks.g2 = g2.map(([x, z]) => [x, 0, z]);

  // -- 3. Only your partner's light ---------------------------------------------------------
  // Two lanes. Sol's glass (blue) only answers Luna's light, Luna's (red) only Sol's.
  b.checkpoint(0, 0, 67.5, 4, { hint: 'The blue glass on the left only answers to Luna\'s flashlight, the red glass on the right only to Sol\'s. Take turns: one shines, the other walks!' });
  lamp(5.5, 0, 66);
  b.field(-4, 2, 71.2, 4, 4, 0.3, 1);
  b.field(4, 2, 71.2, 4, 4, 0.3, -1);
  b.sign(-4, 4.6, 71.2, 'Sol', { style: 'prank', w: 1.4 });
  b.sign(4, 4.6, 71.2, 'Luna', { style: 'prank', w: 1.4 });
  b.box(0, 2.2, 71.2, 4, 4.4, 0.3, { color: STONE }); // between the two barriers
  const g3 = [74, 78.5, 83, 87.5, 92];
  for (const z of g3) {
    b.glass(-4, 0, z, 3, 2.6, { who: 1 });
    b.glass(4, 0, z, 3, 2.6, { who: 0 });
  }
  fl(0, 0, 98, 12, 6); // 95..101
  b.marks.g3 = g3;

  // -- 4. Both at once ----------------------------------------------------------------------
  // Long lanes, too long to light from the start: walk side by side, each lighting the other's way.
  b.checkpoint(0, 0, 97.5, 4, { hint: 'This path is too long to light from the start: walk side by side and light each other\'s path as you go!' });
  lamp(-5.5, 0, 96);
  b.field(-3.5, 2, 101.2, 4, 4, 0.3, 1);
  b.field(3.5, 2, 101.2, 4, 4, 0.3, -1);
  b.box(0, 2.2, 101.2, 3, 4.4, 0.3, { color: STONE });
  const g4 = [104.5, 109.5, 114.5, 119.5, 124.5, 129.5, 134.5, 139.5];
  g4.forEach((z, k) => {
    const wob = k % 2 ? 0.8 : -0.8;
    b.glass(-3.5 + wob, 0, z, 2.8, 3);
    b.glass(3.5 - wob, 0, z, 2.8, 3);
  });
  for (const gb of b.glasses.slice(-16)) {
    gb.who = gb.x < 0 ? 1 : 0;
    gb.color = gb.who === 1 ? '#8fb4ff' : '#ff9a7a';
  }
  fl(0, 0, 145, 12, 6); // 142..148
  b.marks.g4 = g4.map((z, k) => [k % 2 ? 0.8 : -0.8, z]);

  // -- 5. The lighthouse --------------------------------------------------------------------
  // Glass stairs spiral up a dark tower (light your own), then a glass bridge
  // that only holds while BOTH lights are on it, to the two lamp switches.
  b.checkpoint(0, 0, 145, 4, { hint: 'A spiral glass stair leads to the top of the lighthouse. The last glass bridge is only solid with both flashlights on it at once — cross together!' });
  lamp(5.5, 0, 143);
  const TX = 0, TZ = 156; // tower centre
  fl(0, 0, 156, 14, 16); // the tower's base 148..164
  b.box(TX, 7.5, TZ, 3, 15, 3, { color: '#2e3346' });
  const stairs = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * (Math.PI * 2 / 9);
    const x = TX + Math.sin(a) * 4.2, z = TZ + Math.cos(a) * 4.2;
    const top = 1.4 * (i + 1);
    b.glass(x, top, z, 2.6, 2.6);
    stairs.push([x, top, z]);
  }
  const TOP = 15;
  b.floor(TX, TOP, TZ, 5, 5, { color: STONE, t: 0.6 }); // the tower top
  // The bridge needs two lights at once.
  b.glass(TX, TOP, TZ + 9, 4, 12, { need: 2, color: '#fff3c4' });
  b.sign(TX, TOP + 2.8, TZ + 2.2, 'This bridge is only solid\nwith both lights on it', { style: 'prank' });
  fl(0, TOP, TZ + 19, 14, 8, { t: 0.8 }); // the lamp deck
  const lampA = b.pswitch(-5, TOP, TZ + 20, true, 1, '#ffd166');
  const lampB = b.pswitch(5, TOP, TZ + 20, true, 1, '#ffd166');
  b.light(-5, TOP + 4, TZ + 20, { color: '#ffe8a0', intensity: 30, dist: 30, fixture: 'bulb', when: lampA });
  b.light(5, TOP + 4, TZ + 20, { color: '#ffe8a0', intensity: 30, dist: 30, fixture: 'bulb', when: lampB });
  const finale = b.act('bridge', { op: 'all', in: [lampA, lampB] }, true, [
    { x: 0, y: TOP - 6.4, z: TZ + 29, sx: 4, sy: 0.8, sz: 12, move: [0, 6, 0] },
  ], { speed: 4, mat: 'toy', color: '#ffd166', lamp: [0, TOP + 0.6, TZ + 23.4] });
  fl(0, TOP, TZ + 40, 10, 10, { t: 0.8 });
  for (const [x, z] of [[-4, TZ + 36], [4, TZ + 36], [-4, TZ + 44], [4, TZ + 44]]) b.light(x, TOP + 3, z, { color: '#ffd166', intensity: 12, dist: 14, fixture: 'bulb', when: lampA });
  b.goal(0, TOP, TZ + 40);
  b.gem(0, TOP + 1.2, TZ);
  b.marks.stairs = stairs;
  b.marks.tower = [TX, TOP, TZ];

  b.objectives = [
    { text: 'One holds the firefly jar, the other follows the fireflies', done: { cp: 1 } },
    { text: 'Light up the glass bridge with your flashlight', done: { cp: 2 } },
    { text: 'Take turns lighting each other\'s glass path', done: { cp: 3 } },
    { text: 'Walk side by side, lighting each other\'s path', done: { cp: 4 } },
    { text: 'Climb the lighthouse, cross the glass together, light both lamps', done: { act: finale } },
    { text: 'Reach the goal!', done: {} },
  ];
  return b.finish();
}
