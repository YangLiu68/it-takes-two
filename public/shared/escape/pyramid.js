// Puzzle 6 · The Pyramid: riddles on the obelisks open the stone gate,
// the Eye of Horus shows the traps, sand slides and swinging axes guard two
// scarab keys, the sarcophagus hides the offering order, linked star rings,
// a field of braziers to light, and a lift relay up to the top.

import { LevelBuilder } from '../build.js';

const SOL_RED = '#ff6b4a';
const LUNA_BLUE = '#4f86ff';
const SAND = '#ecd29a';
const STONE = '#d9b77a';
const WALL = { color: STONE, t: 0.6 };
const H = 9;

// The six glyphs, each with a riddle. Every riddle fits only its own glyph.
const RIDDLES = {
  Sun: 'Up in the sky all day, gone all night.',
  Moon: 'Some nights thin, some nights round.',
  Star: 'I twinkle at night, too many to count.',
  Bird: 'I fly on feathered wings and sing.',
  Eye: 'I live on your face. Shut me: all goes dark.',
  Water: 'Shapeless, I take the shape of any cup.',
};
const GLYPHS = Object.keys(RIDDLES);

export function pyramid(index) {
  const b = new LevelBuilder({
    mode: 'puzzle', index, seed: 'pyramid', name: 'Pyramid', label: `Room ${index + 1}`, theme: 'workshop', sky: 'sunset',
    overrides: { blocks: ['#e8b86a', '#d99a52', '#f2d49b', '#5fb3b3', '#e07a5f', '#c9a35a'], wood: '#c98d55', metal: '#c9b48a' },
  });
  const r = b.rng;
  const sign = (x, y, z, text, o = {}) => b.sign(x, y, z, text, { style: 'prank', ...o });
  const carve = (x, y, z, yaw, text, w = 3.4) => b.sign(x, y, z, text, { fixed: true, yaw, style: 'paper', w });
  // Glyph dials start anywhere but on the answer.
  const glyphDial = (x, y, z, values, target, o = {}) => {
    let start = r.int(0, values.length - 1);
    if (start === target) start = (start + 1 + r.int(0, values.length - 2)) % values.length;
    return b.dial(x, y, z, { values, start, color: '#ffd23f', ...o });
  };

  // -- 0. The desert gate: four riddles, two people to push ----------------------------------------
  b.plat(0, 0, 14, 30, 28, 4, { color: SAND });
  b.wallX(-15, 15, 0, H, WALL);
  b.wallZ(0, 28, -15, H, WALL);
  b.wallZ(0, 28, 15, H, WALL);
  b.wallGapsX(-15, 15, 28, 14, [[0, 4]], { ...WALL, lintel: 6 });
  for (let k = 0; k < 4; k++) b.box(0, 14 + k * 2, 30 + k * 2, 30 - k * 6, 4, 2, { color: STONE }); // the pyramid's face, stepping back
  b.checkpoint(0, 0, 4, 8, { hint: 'Four symbol wheels lock the stone gate. The answers are riddles on the two obelisks. The gate is heavy: you must both stand on its plates at once!' });
  const answers = r.shuffle(GLYPHS.slice()).slice(0, 4);
  const nums = ['1', '2', '3', '4'];
  for (const [side, pair] of [[-1, [0, 1]], [1, [2, 3]]]) {
    const x = side * 10;
    b.box(x, 4, 14, 2, 8, 2, { color: STONE });
    b.box(x, 8.6, 14, 1.2, 1.2, 1.2, { color: '#ffd23f', mat: 'metal' });
    carve(x, 3.4, 12.95, Math.PI, pair.map((i) => `${nums[i]}. ${RIDDLES[answers[i]]}`).join('\n'), 5.2);
  }
  const gate = answers.map((g, i) => {
    const x = -4.5 + i * 3;
    const id = glyphDial(x, 0, 22.5, GLYPHS, GLYPHS.indexOf(g));
    sign(x, 3.6, 22.5, nums[i], { w: 0.9 });
    return id;
  });
  const riddles = b.combo(gate, answers.map((g) => GLYPHS.indexOf(g)));
  sign(0, 5.2, 24.5, 'Stone gate: answer the four\nobelisk riddles with the symbols,\nthen both hold the side plates', { w: 6 });
  const pushA = b.plate(-9, 0, 23);
  const pushB = b.plate(9, 0, 23);
  const door0 = b.door(0, 28, 4, 6, { op: 'all', in: [riddles, pushA, pushB] }, { latch: true, color: '#a67c45', speed: 3 });
  b.acts[b.acts.length - 1].toast = 'Rumble... the stone gate opens!';
  b.gem(-12, 1.2, 4);
  for (let i = 0; i < 4; i++) b.mark(`gate${i}`, -4.5 + i * 3, 0, 22.5);

  // -- 1. The trap corridor: the Eye of Horus sees what you can't ------------------------------------
  b.wallZ(28, 70, -6, H, WALL);
  b.wallZ(28, 70, 6, H, WALL);
  b.plat(0, 0, 31, 12, 6, 4, { color: STONE });
  b.checkpoint(-3, 0, 30.5, 3, { hint: 'Trap corridor! Whoever stands on the Eye of Horus sees which tiles are traps — tell your partner where to step. Once across, they pound the button to raise a bridge.' });
  const eye = b.plate(3, 0, 31.5);
  sign(3, 3.2, 31.5, 'Eye of Horus:\nstand here to see the traps', { w: 3.4 });
  const rows = [37, 42.5, 48, 53.5, 59];
  const kinds = ['fake', 'vanish', 'drop', 'fake', 'vanish'];
  rows.forEach((z, k) => {
    const bad = r.sign();
    for (const side of [-1, 1]) {
      const x = side * 2.75;
      if (side === bad) b.trap(kinds[k], x, 0, z, 3, 3, { reveal: eye, color: '#e8b86a', delay: 0.12 });
      else b.floor(x, 0, z, 3, 3, { color: '#e8b86a' });
    }
    b.mark(`row${k}`, -bad * 2.75, 0, z);
  });
  b.box(0, -6.5, 48, 12, 1, 30, { color: '#d9b06a' });
  b.zone('kill', 0, -5.4, 48, 12, 1.2, 30);
  sign(0, -3, 40, 'Quicksand!', { w: 2 });
  b.plat(0, 0, 66, 12, 8, 4, { color: STONE });
  const bridgeSw = b.pswitch(3.5, 0, 64.5, true);
  sign(3.5, 3, 64.5, 'Pound: raise the bridge\nfor your partner', { w: 3.4 });
  const planks = [];
  for (let i = 0; i < 7; i++) planks.push({ x: 0, y: -9.3, z: 34 + 4 * (i + 0.5), sx: 2.2, sy: 0.6, sz: 3.94, move: [0, 9, 0], delay: i * 0.1 });
  const bridge = b.act('bridge', { op: 'all', in: [bridgeSw] }, true, planks, { speed: 14, mat: 'toy', color: '#ffd23f', lamp: [1.2, 0.6, 61.4] });
  b.acts[b.acts.length - 1].toast = 'The stone bridge rises!';
  b.gem(0, 2.4, 50);

  // -- 2. Sand slides and swinging axes: a scarab each ----------------------------------------------------
  b.wallX(-10, -6, 70, H, WALL);
  b.wallX(6, 10, 70, H, WALL);
  b.wallZ(70, 136, -10, H, WALL);
  b.wallZ(70, 136, 10, H, WALL);
  b.plat(0, 0, 71.5, 20, 3, 4, { color: STONE });
  b.wallZ(73, 104, 0, H, WALL);
  b.field(-5, H / 2, 73, 10, H, 0.3, 1);
  b.field(5, H / 2, 73, 10, H, 0.3, -1);
  b.checkpoint(0, 0, 71.5, 2.6, { hint: 'Sand slides: Sol takes the red door, Luna the blue. The sand pushes you back and the axes sweep you into the quicksand — wait for each axe to swing away, then dash!' });
  sign(-5, 4.4, 72.4, 'Sol: this way', { w: 2.4 });
  sign(5, 4.4, 72.4, 'Luna: this way', { w: 2.4 });
  const PY = 0.95 + 6.4;
  for (const side of [-1, 1]) {
    const cx = side * 5;
    b.plat(cx, 0, 74.5, 6, 3, 1.2, { color: STONE });
    b.conveyor(cx, 0, 80.5, 3, 7, 4, [0, -1]);
    b.plat(cx, 0, 90, 3.4, 10, 1.2, { color: STONE });
    [88, 92].forEach((z, k) => {
      b.pendulum(cx, PY, z, 6.4, 1.0, 2.6, (side > 0 ? 0.25 : 0) + k * 0.4, [1.4, 1.4, 1.4]);
      b.box(cx - 3.2, (PY + 0.6) / 2, z, 0.5, PY + 0.6, 0.5, { color: STONE });
      b.box(cx + 3.2, (PY + 0.6) / 2, z, 0.5, PY + 0.6, 0.5, { color: STONE });
      b.box(cx, PY + 0.3, z, 6.9, 0.5, 0.6, { color: STONE });
    });
    b.conveyor(cx, 0, 98.5, 4, 5, 2.5, [-side, 0]);
    b.plat(cx, 0, 104, 8, 4, 1.2, { color: STONE });
  }
  sign(-5, 3.4, 76.5, 'The sand flows back!', { w: 2.6 });
  const redScarab = b.item('gem', -5, 1.1, 104.2, { who: 0, color: SOL_RED, label: 'Red Scarab' });
  const blueScarab = b.item('gem', 5, 1.1, 104.2, { who: 1, color: LUNA_BLUE, label: 'Blue Scarab' });
  b.box(0, -6.5, 89, 20, 1, 33, { color: '#d9b06a' });
  b.zone('kill', 0, -5.4, 89, 20, 1.2, 33);
  b.plat(0, 0, 109, 20, 6, 1.2, { color: STONE });
  b.wallGapsX(-10, 10, 112, H, [[0, 4]], { ...WALL, lintel: 5 });

  // -- 3. The pharaoh's tomb: two scarabs, then the offering order ---------------------------------------
  b.plat(0, 0, 124, 20, 24, 4, { color: STONE });
  b.checkpoint(0, 0, 114.5, 4, { hint: 'The pharaoh\'s sarcophagus needs both scarabs. Once it opens, see what the wall reveals.' });
  b.box(0, 0.6, 124, 2.2, 1.2, 4.2, { color: '#c9a35a', mat: 'metal' });
  b.box(0, 1.3, 124, 2.5, 0.2, 4.5, { color: '#ffd23f', mat: 'metal' });
  const coffin = b.lock(0, 0, 119.4, [redScarab, blueScarab], { label: 'Pharaoh\'s Sarcophagus', radius: 2.4 });
  const order = r.shuffle(['Eye', 'Water', 'Bird', 'Sun']);
  carve(-1, 3.2, 135.6, Math.PI, `Offering order:\n${order.join(' → ')}`, 3.6);
  const slab = b.act('door', { op: 'all', in: [coffin] }, true, [
    { x: -1, y: 3.2, z: 135.15, sx: 5, sy: 3.2, sz: 0.4, move: [0, 4.6, 0] },
  ], { speed: 2, color: STONE, lamp: [-1, 5.2, 134.8] });
  b.acts[b.acts.length - 1].toast = 'The sarcophagus opens — a slab in the wall slides up!';
  const statue = {};
  r.shuffle(order.slice()).forEach((g, i) => {
    const x = -6 + i * 4;
    statue[g] = b.pswitch(x, 0, 128.6, false, 0.6);
    b.box(x, 1.2, 130.6, 1.4, 2.4, 1.4, { color: '#c9a35a' });
    b.sign(x, 2.0, 129.85, g, { fixed: true, yaw: Math.PI, style: 'prank', w: 1 });
  });
  const offering = b.seq(order.map((g) => statue[g]));
  sign(0, 4.8, 128, 'Statues: pound them in order', { w: 4.4 });
  b.wallGapsX(-10, 10, 136, H, [[7.5, 3]], { ...WALL, lintel: 5 });
  const door3 = b.door(7.5, 136, 3, 5, { op: 'all', in: [offering] }, { latch: true, color: '#a67c45' });
  b.acts[b.acts.length - 1].toast = 'A door deep in the tomb opens.';

  // -- 4. The star chamber: linked rings ------------------------------------------------------------------
  b.plat(0, 0, 148, 20, 24, 4, { color: STONE });
  b.wallZ(136, 184, -10, H, WALL);
  b.wallZ(136, 184, 10, H, WALL);
  b.checkpoint(5, 0, 139, 3, { hint: 'Star chamber: the star map is in the small room on the left, and only Sol can get in. Luna turns the rings — turn one and the ring to its right turns too!' });
  b.room(-10, 140, -5, 150, H, { w: null, e: [[145, 2.4]] }, WALL);
  b.fieldZ(-5, H / 2, 145, 2.4, H, 1);
  sign(-5.5, 4.8, 145, 'Star map', { w: 1.8 });
  const RING = ['Sun', 'Moon', 'Star', 'Bird'];
  const sky = [r.int(0, 3), r.int(0, 3), r.int(0, 3)];
  carve(-9.65, 3, 145, Math.PI / 2, `Star map (left to right):\n${sky.map((i) => RING[i]).join('   ')}`, 3.6);
  const rings = [-2, 1.5, 5].map((x, i) => glyphDial(x, 0, 152, RING, sky[i], { color: '#7ee0ff' }));
  b.dials.forEach((d) => {
    const i = rings.indexOf(d.id);
    if (i >= 0 && i < rings.length - 1) d.links = [rings[i + 1]];
  });
  const starsOk = b.combo(rings, sky);
  sign(1.5, 4.6, 154, 'Star rings: pound one and the ring\nto its right turns one step too', { w: 5 });
  b.wallGapsX(-10, 10, 160, H, [[0, 4]], { ...WALL, lintel: 5 });
  const door4 = b.door(0, 160, 4, 5, { op: 'all', in: [starsOk] }, { latch: true, color: '#7ee0ff' });
  b.acts[b.acts.length - 1].toast = 'Starlight! The next door opens.';
  for (let i = 0; i < 3; i++) b.mark(`ring${i}`, [-2, 1.5, 5][i], 0, 152);

  // -- 5. The brazier hall: light all nine -----------------------------------------------------------------
  b.plat(0, 0, 172, 20, 24, 4, { color: STONE });
  b.checkpoint(7, 0, 162.5, 3, { hint: 'Brazier hall: light all nine braziers. Pound one and it flips, along with its neighbors in front, behind, left and right.' });
  const cells = [];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) cells.push([-5 + col * 5, 166 + row * 5]);
  const near = (i) => cells.map((_, j) => j).filter((j) => j !== i && Math.abs(cells[i][0] - cells[j][0]) + Math.abs(cells[i][1] - cells[j][1]) <= 5.01);
  let flips;
  do {
    const presses = r.shuffle(cells.map((_, i) => i)).slice(0, 4);
    flips = cells.map(() => 0);
    for (const p of presses) for (const k of [p, ...near(p)]) flips[k] ^= 1;
  } while (flips.filter(Boolean).length < 3);
  const fires = cells.map(([x, z], i) => b.dial(x, 0, z, { values: ['#4a3a30', '#ff8a3d'], style: 'color', start: 1 ^ flips[i], h: 1.5, color: '#c9a35a' }));
  b.dials.forEach((d) => {
    const i = fires.indexOf(d.id);
    if (i >= 0) d.links = near(i).map((j) => fires[j]);
  });
  const fireOk = b.combo(fires, fires.map(() => 1));
  sign(0, 4.6, 181, 'Braziers: light all nine\nPound one: it flips, and so do\nits neighbors (not diagonals)', { w: 5.6 });
  b.wallGapsX(-10, 10, 184, H, [[0, 4]], { ...WALL, lintel: 5 });
  const door5 = b.door(0, 184, 4, 5, { op: 'all', in: [fireOk] }, { latch: true, color: '#ff8a3d' });
  b.acts[b.acts.length - 1].toast = 'All nine fires burn! The last tomb opens.';

  // -- 6. The rising tomb: a lift relay, then pound together --------------------------------------------------
  const HT = 20;
  b.wallZ(184, 230, -10, HT, WALL);
  b.wallZ(184, 230, 10, HT, WALL);
  b.wallX(-10, 10, 230, HT, WALL);
  b.plat(0, 0, 192, 20, 16, 4, { color: STONE });
  b.checkpoint(0, 0, 187, 4, { hint: 'Lift tomb: one of you holds the plate so the other can ride a lift up; then whoever is up top holds the plate there to bring you up too.' });
  const LEDGE = 7.5, TOP = 15;
  b.plat(0, LEDGE, 207.5, 20, 15, LEDGE + 1, { color: STONE });
  const liftPlateA = b.plate(0, 0, 193);
  const liftPlateB = b.plate(6, LEDGE, 203.5);
  const lift = (x, sig) => b.act('lift', { op: 'any', in: [sig] }, false, [
    { x, y: -0.08, z: 198, sx: 3.4, sy: 0.4, sz: 3.4, move: [0, LEDGE - 0.12, 0] },
  ], { speed: 3, lamp: [x, LEDGE + 0.2, 199.6], color: '#ffd23f' });
  lift(-6, liftPlateA);
  lift(6, liftPlateB);
  sign(0, 3, 193, 'Hold this plate:\nthe left lift goes up', { w: 3.2 });
  sign(6, LEDGE + 3, 203.5, 'Hold this plate:\nthe right lift goes up', { w: 3.2 });
  b.checkpoint(-1.5, LEDGE, 206, 3, { hint: 'Stand on a button each and ground-pound (C) at the same time to bring out the steps to the top!' });
  const syncA = b.pswitch(-5, LEDGE, 210, false, 0.9);
  const syncB = b.pswitch(5, LEDGE, 210, false, 0.9);
  sign(0, LEDGE + 3.4, 210, 'Both pound (C) at once!', { w: 3.6 });
  b.plat(0, TOP, 222.5, 20, 15, TOP + 1, { color: STONE });
  const stairParts = [9.4, 11.3, 13.2].map((top, i) => ({ x: -5 + i * 2.3, y: top - 0.4, z: 216.6, sx: 2.2, sy: 0.8, sz: 2, move: [0, 0, -2.6], delay: i * 0.15 }));
  const stairs = b.act('steps', { op: 'all', in: [syncA, syncB] }, true, stairParts, { speed: 3, color: '#ffd23f', lamp: [-2.7, TOP + 0.3, 214.8] });
  b.acts[b.acts.length - 1].toast = 'Steps slide out of the wall!';
  b.goal(0, TOP, 223);
  b.gem(-8, LEDGE + 1.2, 212);
  for (const [x, z] of [[-6, 226], [6, 226]]) b.box(x, TOP + 1, z, 1.4, 2, 1.4, { color: '#ffd23f', mat: 'metal' });

  b.objectives = [
    { text: 'Solve the four obelisk riddles and set the symbols on the stone gate', done: { sig: riddles } },
    { text: 'The gate is heavy: both stand on the side plates at once', done: { act: door0 } },
    { text: 'One stands on the Eye of Horus to guide the other past the traps, then raise the bridge', done: { act: bridge } },
    { text: 'Sand slides: Sol through red, Luna through blue; dodge the axes and grab a scarab each', done: { cpBoth: 3 } },
    { text: 'Put both scarabs in the pharaoh\'s sarcophagus', done: { act: slab } },
    { text: 'Pound the statues in the offering order behind the slab', done: { act: door3 } },
    { text: 'Star chamber: Sol reads the star map, Luna turns the rings', done: { act: door4 } },
    { text: 'Brazier hall: light all nine braziers', done: { act: door5 } },
    { text: 'Lift tomb: take turns on the plates to get you both up', done: { cpBoth: 7 } },
    { text: 'Pound both buttons together to raise the steps to the top', done: { act: stairs } },
    { text: 'Climb to the top of the pyramid!', done: {} },
  ];
  return b.finish();
}
