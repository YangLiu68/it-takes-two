// Puzzle 10 · Machine City (The Grand Machine): the finale. A city of six districts
// around a plaza, each a puzzle in the style of an earlier escape room. Each
// one gives a gear; all six go into the machine core in the middle, which
// sends steps spiralling up the central tower for the last climb.
//   D1 toys (color order)       D2 clocks (read the floor clock, set the time)
//   D3 library (lights-out)     D4 pirates (seesaw to the crow's nest, raft, chest)
//   D5 pyramid (invisible path, symbol code)   D6 detectives (two offices of clues)
//   tower: spiral steps → fan lift (take turns) → launch pads → the top.
// Districts open one after another, so the checkpoints in the plaza run in order.

import { LevelBuilder } from '../build.js';
import { PHYS } from '../constants.js';

const SOL_RED = '#ff6b4a';
const LUNA_BLUE = '#4f86ff';
const GOLD = '#f2c14e';
const STONE = '#c9b08a';
const WALL = '#9c7a5a';
const H = 12; // district walls: too tall to climb, even on your partner

export function grandMachine(index) {
  const b = new LevelBuilder({ mode: 'puzzle', index, seed: 'grand-machine', name: 'Machine City', label: 'Room 10', theme: 'workshop', sky: 'sunset', overrides: { fogDensity: 0.003 } });
  const wall = { color: WALL, t: 0.6 };
  const door = (lintel) => ({ ...wall, lintel });
  const poster = (x, y, z, yaw, text, w = 5, style) => b.sign(x, y, z, text, { fixed: true, yaw, w, ...(style ? { style } : {}) });
  const label = (x, y, z, text, w = 1.2) => b.sign(x, y, z, text, { fit: true, w });
  const pit = (x, z, sx, sz, color = '#3d6f9c') => {
    b.box(x, -3, z, sx, 1, sz, { color });
    b.zone('kill', x, -1.4, z, sx, 1.8, sz);
  };
  const gearDoor = (x, z, axis, when, toast) => {
    const id = b.door(x, z, 4, 5, when, { axis, latch: true, color: GOLD });
    if (toast) b.acts[b.acts.length - 1].toast = toast;
    return id;
  };
  const gear = (x, y, z, who, when, label) => b.item('gear', x, y, z, { who, when, label, color: who === 0 ? SOL_RED : who === 1 ? LUNA_BLUE : '#ffffff' });
  // A big decorative cog: a disc of boxes.
  const cog = (x, y, z, r, color, flat = true) => {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI;
      b.box(x, y, z, flat ? r * 2 : 0.3, flat ? 0.3 : r * 2, flat ? 0.5 : 0.5, { color, yaw: a });
    }
  };

  // == Spawn and the plaza ====================================================================
  b.floor(0, 0, 10, 16, 20, { color: STONE });
  b.wallZ(0, 20, -8, H, wall);
  b.wallZ(0, 20, 8, H, wall);
  b.wallX(-8, 8, 0, H, wall);
  b.checkpoint(0, 0, 6, 6, { hint: 'Machine City: six districts, each hiding a gear. Fit all six gears into the machine core in the middle of the plaza!' });
  poster(0, 8.6, 19.6, Math.PI, 'Machine City\nSix districts, six gears — fit them all into the machine core!', 7);
  b.floor(0, 0, 42, 44, 44, { mat: 'wood' }); // plaza: x -22..22, z 20..64
  b.wallGapsX(-22, 22, 20, H, [[0, 6]], door(6));
  b.wallGapsZ(20, 64, -22, H, [[31, 4], [53, 4]], door(5));
  b.wallGapsZ(20, 64, 22, H, [[31, 4], [53, 4]], door(5));
  b.wallGapsX(-22, 22, 64, H, [[-11, 4], [11, 4]], door(5));
  // The central tower and the machine core at its foot.
  b.box(0, 14, 50, 10, 28, 10, { color: '#7d5f46' });
  for (const [x, y] of [[-2.6, 6], [2.4, 9.5], [-1.2, 14], [2.8, 19]]) cog(x, y, 44.75, 1.6, GOLD, false);
  const gears = [];
  const core = () => b.lock(0, 0, 40.6, gears, { label: 'Machine Core', radius: 2.6 });
  poster(0, 4.6, 44.6, Math.PI, 'Machine core: six gear slots', 4.4);

  // == D1 · Toy district (x -50..-22, z 20..42) =======================================================
  poster(-21.6, 6.2, 31, Math.PI / 2, 'Toys', 2.6);
  b.checkpoint(-16.5, 0, 31, 5, { hint: 'Toy district: Sol takes the red door to see the block tower, Luna takes the blue door to the buttons.' });
  b.floor(-25, 0, 31, 6, 10, { mat: 'wood' });
  b.wallX(-28, -22, 26, H, wall);
  b.wallX(-28, -22, 36, H, wall);
  b.wallGapsZ(20, 42, -28, H, [[28.5, 3], [33.5, 3]], door(4));
  b.fieldZ(-28, 2, 28.5, 3, 4, 1);
  b.fieldZ(-28, 2, 33.5, 3, 4, -1);
  poster(-27.6, 5.2, 31, Math.PI / 2, 'Right, red door: Sol\nLeft, blue door: Luna', 3.2);
  b.floor(-39, 0, 25.5, 22, 11, { color: '#ffd6c8' });
  b.floor(-39, 0, 36.5, 22, 11, { color: '#cfe0ff' });
  b.wallZ(20, 42, -50, H, wall);
  b.wallX(-50, -22, 20, H, wall);
  b.wallX(-50, -22, 42, H, wall);
  b.wallX(-50, -28, 31, H, wall);
  const palette = [['red', '#ff4d4d'], ['yellow', '#ffd23f'], ['green', '#3fc46b'], ['blue', '#3f7dff'], ['purple', '#a35bff']];
  const order = b.rng.shuffle(palette.slice());
  // Sol's room: the block tower (bottom to top is the order).
  order.forEach(([, color], i) => b.box(-46, 0.85 + i * 1.7, 25.5, 1.6, 1.6, 1.6, { color }));
  poster(-49.6, 6, 25.5, Math.PI / 2, 'Block tower\nRead it bottom to top', 3.2);
  b.box(-38, 1, 22, 2, 2, 2, { color: '#ff9f5a' });
  b.box(-35.5, 0.75, 22.5, 1.5, 1.5, 1.5, { color: '#7cc4f2' });
  b.box(-31, 0.6, 23.5, 2.4, 1.2, 1.6, { color: '#b5651d' }); // toy box
  // Luna's room: five colored buttons in a different order.
  const layout = b.rng.shuffle(palette.slice());
  const btn = {};
  layout.forEach(([name, color], i) => {
    btn[name] = b.pswitch(-46 + i * 3, 0, 38.5, false, 0.6, color);
  });
  const d1 = b.seq(order.map(([name]) => btn[name]));
  poster(-38, 4.2, 41.6, Math.PI, 'Pound (C) the buttons in the\nblock tower\'s color order.\nThe tower is with Sol — ask him!', 5);
  const g1 = gear(-31, 1.3, 23.5, 0, d1, 'Red Toy Gear');
  gears.push(g1);

  // == D2 · Clock district (x -50..-22, z 42..64) =========================================================
  poster(-21.6, 6.2, 53, Math.PI / 2, 'Clocks', 2.6);
  b.checkpoint(-16.5, 0, 53, 5, { hint: 'Clock district: Luna takes the blue door to read the big floor clock; Sol takes the red door, crosses the moving platforms and sets the time.' });
  gearDoor(-22, 53, 'z', { op: 'all', in: [d1] }, 'A red gear appears! The clock district opens too.');
  b.floor(-26, 0, 53, 8, 6, { mat: 'wood' });
  b.wallZ(42, 64, -50, H, wall);
  b.wallX(-50, -22, 64, H, wall);
  b.wallGapsZ(50, 56, -30, H, [], wall);
  b.wallGapsX(-30, -22, 56, H, [[-26, 3]], door(4));
  b.wallGapsX(-30, -22, 50, H, [[-26, 3]], door(4));
  b.field(-26, 2, 56, 3, 4, 0.3, -1);
  b.field(-26, 2, 50, 3, 4, 0.3, 1);
  // Luna: the great floor clock (12 to the north). It reads 4:45.
  b.floor(-36, 0, 60, 28, 8, { color: '#e8dcc0' });
  b.wallX(-50, -30, 56, H, wall);
  const CX = -40, CZ = 60, CR = 3.4;
  b.box(CX, 0.04, CZ, 7.6, 0.08, 7.6, { color: '#fff6dd' });
  for (let k = 0; k < 12; k++) {
    const th = (k / 12) * Math.PI * 2;
    const big = k % 3 === 0;
    b.box(CX - Math.sin(th) * CR, 0.12, CZ + Math.cos(th) * CR, big ? 0.5 : 0.25, 0.1, big ? 0.9 : 0.5, { color: '#3a2b1f', yaw: -th });
  }
  label(CX, 0.6, CZ + CR + 0.2, '12', 0.7);
  const hand = (th, len, w, color) => b.box(CX - Math.sin(th) * len / 2, 0.2, CZ + Math.cos(th) * len / 2, w, 0.1, len, { color, yaw: -th });
  hand(((4 + 45 / 60) / 12) * Math.PI * 2, 2.0, 0.34, '#1a1410');
  hand((45 / 60) * Math.PI * 2, 3.1, 0.2, '#1a1410');
  b.box(CX, 0.24, CZ, 0.4, 0.1, 0.4, { color: GOLD });
  poster(-30, 4.4, 63.6, Math.PI, 'The great clock (12 points north)\nTell Sol the time', 4.2, 'paper');
  // Sol: two sliding platforms over the gears, then the clock lock.
  b.floor(-26, 0, 46, 8, 8, { mat: 'wood' });
  pit(-36, 46, 12, 8, '#5a4636');
  for (const [x, ph] of [[-34, 0], [-38.6, 0.5]]) {
    b.mover(3.4, 0.8, 3.4, { type: 'linear', a: [x, -0.4, 44], b: [x, -0.4, 48], period: 6, phase: ph }, { steady: true, color: GOLD, mat: 'toy' });
  }
  b.floor(-46, 0, 46, 8, 8, { color: '#e8dcc0' });
  const hourVals = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const hour = b.dial(-47, 0, 44.4, { values: hourVals, start: 11 });
  const minute = b.dial(-47, 0, 47.6, { values: ['00', '15', '30', '45'], start: 0 });
  label(-47, 0.5, 43.0, 'Hour', 0.6);
  label(-47, 0.5, 49.0, 'Min', 0.6);
  poster(-49.6, 4, 46, Math.PI / 2, 'Clock lock: set the great clock\'s\ntime (on the floor on Luna\'s side)', 4);
  b.sign(-28, 2.6, 49.4, 'Moving platforms: time your jump', { w: 2.6 });
  const d2 = b.combo([hour, minute], [3, 3]);
  const g2 = gear(CX, 1.2, CZ, 1, d2, 'Blue Clock Gear');
  gears.push(g2);

  // == D3 · Book district (x -22..0, z 64..88) ===========================================================
  poster(-11, 6.2, 63.6, Math.PI, 'Books', 2.6);
  b.checkpoint(-11, 0, 59, 5, { hint: 'Book district: six reading lamps. Pound a button and its lamp flips together with the lamps beside it. Light all six!' });
  gearDoor(-11, 64, 'x', { op: 'all', in: [d2] }, 'Right on time! The bells ring and the book district opens.');
  b.floor(-11, 0, 66.5, 22, 5, { mat: 'wood' });
  b.wallZ(64, 88, 0, H, wall);
  b.wallZ(64, 88, -22, H, wall);
  b.wallX(-22, 0, 88, H, wall);
  b.wallGapsX(-22, 0, 69, H, [[-16.5, 3], [-5.5, 3]], door(4));
  b.field(-16.5, 2, 69, 3, 4, 0.3, 1);
  b.field(-5.5, 2, 69, 3, 4, 0.3, -1);
  b.floor(-16.5, 0, 78.5, 11, 19, { color: '#ffd6c8' });
  b.floor(-5.5, 0, 78.5, 11, 19, { color: '#cfe0ff' });
  b.wallZ(69, 88, -11, 10, { color: '#6b4a2b', t: 0.6 }); // the great bookshelf down the middle
  for (const [x, z] of [[-21, 74], [-21, 80], [-21, 86], [-1, 74], [-1, 80], [-1, 86]]) b.box(x, 2.5, z, 1.2, 5, 4, { color: '#7a5230' });
  poster(-11, 4, 69.4, Math.PI, 'Six reading lamps: pound a button (C) and that lamp and the ones beside it flip (on ↔ off)\nLight all six! Odd lamps are Sol\'s, even lamps are Luna\'s', 8);
  const LAMP = ['#2b2b3a', '#ffe14d'];
  const start = [0, 1, 0, 0, 0, 0];
  const lamps = [0, 1, 2, 3, 4, 5].map((i) => {
    const sol = i % 2 === 0;
    const x = sol ? -12.2 : -9.8;
    const z = 73 + i * 2.5;
    label(x + (sol ? -1.4 : 1.4), 0.5, z, String(i + 1), 0.6);
    return b.dial(x, 0, z, { values: LAMP, style: 'color', start: start[i], h: 12.5 });
  });
  lamps.forEach((id, i) => {
    b.dials.find((d) => d.id === id).links = [lamps[i - 1], lamps[i + 1]].filter(Boolean);
  });
  const d3 = b.combo(lamps, [1, 1, 1, 1, 1, 1]);
  for (const id of lamps) {
    const d = b.dials.find((q) => q.id === id);
    b.light(d.x, 12, d.z, { color: '#ffe8a0', intensity: 5, dist: 8, fixture: 'none', when: d3 });
  }
  const g3 = gear(-11, 1.2, 66.5, null, d3, 'White Book Gear');
  gears.push(g3);

  // == D4 · Pirate district (x 0..30, z 64..100) ===========================================================
  poster(11, 6.2, 63.6, Math.PI, 'Pirates', 2.6);
  b.checkpoint(11, 0, 59, 5, { hint: 'Pirate district: the gold key is up in the crow\'s nest (take the seesaw up); ride the raft to the island and open the chest.' });
  gearDoor(11, 64, 'x', { op: 'all', in: [d3] }, 'All six lamps lit! The pirate district opens.');
  b.floor(13, 0, 68, 26, 8, { mat: 'wood' });
  b.wallZ(64, 100, 30, 14, wall);
  b.wallZ(88, 100, 0, 14, wall);
  b.wallX(0, 30, 100, 14, wall);
  b.floor(28, 0, 68, 4, 8, { mat: 'wood' });
  pit(15, 82, 30, 20, '#2f7fb8');
  b.floor(13, 0, 96, 18, 8, { color: '#f2dca0' }); // the island
  const raftA = b.plate(4, 0, 68);
  const raftB = b.plate(19, 0, 96);
  b.act('carrier', { op: 'any', in: [raftA, raftB] }, false, [
    { x: 13, y: -0.3, z: 74.6, sx: 4.2, sy: 0.6, sz: 4.2, move: [0, 0, 15.2] },
  ], { speed: 4.2, mat: 'wood', color: '#8a5a32', lamp: [13, 0.6, 71.4] });
  b.wire(raftA, [[4, 0, 68], [4, 0, 71.4], [11, 0, 71.4]]);
  poster(4, 3.2, 64.6, 0, 'Raft: hold a plate (dock or island)\nand it sails to the island;\nlet go and it comes back', 5);
  // The ship's mast and crow's nest, reached by the seesaw.
  b.seesaw(21, 1.0, 68.4, 9.2, 2.4);
  b.box(21, 3.2, 75.5, 1.0, 12.8, 1.0, { color: '#6b4a2b' });
  b.box(21, 9.6, 75.5, 4, 0.8, 4, { color: '#8a5a32' }); // nest top at 10
  b.box(21, 10.4, 77.3, 4, 0.8, 0.3, { color: '#6b4a2b' });
  poster(29.4, 4, 68.4, -Math.PI / 2, 'Seesaw: one stands on an end,\nthe other pounds (C) the far end\nThe gold key is in the crow\'s nest', 5);
  const key = b.item('key', 21, 10.7, 75.5, { color: GOLD, label: 'Gold Key' });
  // The chest on the island.
  b.box(13, 0.5, 98.6, 2.2, 1.0, 1.4, { color: '#8a5a32' });
  b.box(13, 1.1, 98.6, 2.3, 0.2, 1.5, { color: GOLD });
  const chest = b.lock(13, 0, 97, [key], { label: 'Treasure Chest', radius: 2.4 });
  const g4 = gear(9, 1.2, 97, 0, chest, 'Red Pirate Gear');
  gears.push(g4);
  poster(13, 3.6, 99.6, Math.PI, 'Chest: opens with the gold key', 3.6);

  // == D5 · Pyramid district (x 22..50, z 42..64) ==========================================================
  poster(21.6, 6.2, 53, -Math.PI / 2, 'Pyramid', 2.6);
  b.checkpoint(16.5, 0, 53, 5, { hint: 'Pyramid district: one stands on the eye plate so the other can see the stone path. Four symbols are carved on the far wall.' });
  gearDoor(22, 53, 'z', { op: 'all', in: [chest] }, 'The chest opens! So does the pyramid district.');
  b.floor(27, 0, 53, 10, 22, { color: '#e8c98a' });
  b.wallX(22, 50, 64, H, wall);
  b.wallZ(42, 64, 50, H, wall);
  b.wallX(22, 50, 42, H, wall);
  pit(38, 53, 12, 22, '#c9a35a');
  b.floor(47, 0, 53, 6, 22, { color: '#e8c98a' });
  const eye = b.plate(25, 0, 45.5);
  poster(22.4, 3.4, 45.5, Math.PI / 2, 'Eye of Horus: stand on the eye\nplate to reveal the hidden path', 4.8);
  const tiles = [[33.8, 52], [36.6, 54.6], [39.4, 52.2], [42.2, 54.8]];
  for (const [x, z] of tiles) b.trap('hidden', x, 0, z, 2.6, 2.6, { reveal: eye, color: '#e8c98a' });
  const SYM = ['Sun', 'Moon', 'Star', 'Water'];
  const answer = [0, 3, 2, 1];
  answer.forEach((v, i) => {
    b.sign(49.6, 4.4, 47.5 + i * 3.6, `${i + 1}`, { fixed: true, fit: true, yaw: -Math.PI / 2, w: 1.0 });
    b.sign(49.6, 2.6, 47.5 + i * 3.6, SYM[v], { fixed: true, fit: true, yaw: -Math.PI / 2, w: 1.6, style: 'chalk' });
  });
  poster(46, 6.2, 63.6, Math.PI, 'Four symbols, 1 to 4', 3.6);
  const symDials = [0, 1, 2, 3].map((i) => {
    label(29.6, 0.5, 48.5 + i * 3, String(i + 1), 0.6);
    return b.dial(28.4, 0, 48.5 + i * 3, { values: SYM, start: (i + 1) % 4 });
  });
  poster(22.4, 3.4, 56, Math.PI / 2, 'Symbol lock: set the order shown\non the far wall, across the pit', 4.6);
  const d5 = b.combo(symDials, answer);
  b.box(25, 0.6, 61.5, 2.4, 1.2, 1.4, { color: '#c9a35a' }); // altar
  const g5 = gear(25, 1.4, 61.5, 1, d5, 'Blue Pyramid Gear');
  gears.push(g5);
  for (const [x, z, s] of [[44.5, 44.5, 3], [44.5, 61.5, 3]]) b.box(x, s / 2, z, s, s, s, { color: '#d9b26a' });

  // == D6 · Detective district (x 22..50, z 20..42) ===========================================================
  poster(21.6, 6.2, 31, -Math.PI / 2, 'Detectives', 2.6);
  b.checkpoint(16.5, 0, 31, 5, { hint: 'Detective district: each office holds half the clues. Put them together: who stole the gear, where, and with what?' });
  gearDoor(22, 31, 'z', { op: 'all', in: [d5] }, 'Symbols match! The detective district opens.');
  b.floor(28, 0, 31, 12, 10, { mat: 'wood' });
  b.wallX(22, 34, 26, H, wall);
  b.wallX(22, 34, 36, H, wall);
  b.wallGapsZ(20, 42, 34, H, [[28.5, 3], [33.5, 3]], door(4));
  b.fieldZ(34, 2, 28.5, 3, 4, 1);
  b.fieldZ(34, 2, 33.5, 3, 4, -1);
  b.wallX(22, 50, 20, H, wall);
  b.wallZ(20, 42, 50, H, wall);
  b.wallX(34, 50, 31, H, wall);
  b.floor(42, 0, 25.5, 16, 11, { color: '#ffd6c8' });
  b.floor(42, 0, 36.5, 16, 11, { color: '#cfe0ff' });
  poster(22.4, 4, 31, Math.PI / 2, 'Case: a gear was stolen!\nWho? Where? With what?\nLeft, red door: Sol\'s clues\nRight, blue door: Luna\'s clues', 5.4);
  // Short words: each wheel shows its value in big letters.
  const who = ['Cat', 'Dog', 'Bear', 'Bunny'];
  const where = ['Hall', 'Yard', 'Attic', 'Cellar'];
  const what = ['Pliers', 'Rope', 'Broom', 'Lamp'];
  const caseDials = [[who, 'Who'], [where, 'Where'], [what, 'Tool']].map(([vals, name], i) => {
    label(25 + i * 3, 0.5, 27.6, name, 1.1);
    return b.dial(25 + i * 3, 0, 29, { values: vals, start: 3 });
  });
  const d6 = b.combo(caseDials, [0, 1, 0]);
  b.box(28, 0.5, 34.6, 3, 1.0, 1.0, { color: '#6b4a2b' });
  const g6 = gear(28, 1.6, 34.6, null, d6, 'White Detective Gear');
  gears.push(g6);
  // Sol's office: half the clues.
  poster(49.6, 4.2, 23.5, -Math.PI / 2, 'Clue 1: on camera, the thief\nwore a hat.', 5, 'paper');
  poster(49.6, 4.2, 28.5, -Math.PI / 2, 'Clue 2: Bear slept all night,\nand three witnesses back that up.', 5, 'paper');
  poster(42, 4.2, 20.4, 0, 'Clue 3: in the whole city, only the\nyard and the cellar have mud.', 6, 'paper');
  poster(42, 4.2, 30.6, Math.PI, 'Clue 4: the rope at the scene is\njust a washing line, not the tool.', 5, 'paper');
  // Luna's office: the other half.
  poster(49.6, 4.2, 34, -Math.PI / 2, 'Suspects\nCat: wears a hat · Dog: no hat\nBear: wears a hat · Bunny: no hat', 5.4, 'paper');
  poster(49.6, 4.2, 39.5, -Math.PI / 2, 'Clue 5: the thief left muddy\nfootprints.', 5, 'paper');
  poster(42, 4.2, 41.6, Math.PI, 'Clue 6: the cellar door was\nlocked all night.', 5, 'paper');
  poster(42, 4.2, 31.4, 0, 'Clue 7: the gear was pinched out\nwith a gripping tool.', 5, 'paper');
  for (const [x, z] of [[46, 24], [46, 38]]) b.box(x, 0.4, z, 3, 0.8, 1.6, { color: '#6b4a2b' }); // desks

  // == The core and the tower =====================================================================
  const coreLock = core();
  // Spiral steps slide out of the tower once the core runs.
  const STEPS = [
    [3.6, 1.4, 43.4, [0, 0, -2.8]], [0.2, 2.8, 43.4, [0, 0, -2.8]], [-3.2, 4.2, 43.4, [0, 0, -2.8]],
    [-6.8, 5.6, 44.6, [-2.8, 0, 0]], [-6.6, 7.0, 49.6, [-2.8, 0, 0]], [-6.8, 8.4, 54.2, [-2.8, 0, 0]],
    [-3.8, 9.8, 57.0, [0, 0, 2.8]], [-0.8, 11.2, 56.6, [0, 0, 2.8]],
  ];
  b.act('steps', { op: 'all', in: [coreLock] }, true, STEPS.map(([x, top, z, mv], i) => ({
    x: x - mv[0], y: top - 0.4, z: z - mv[2], sx: 2.6, sy: 0.8, sz: 2.6, move: mv, delay: 0.6 + i * 0.35,
  })), { speed: 3, mat: 'toy', color: GOLD, lamp: [0, 2.4, 44.6] });
  b.acts[b.acts.length - 1].toast = 'The machine core starts up! Steps spiral out of the central tower!';
  // Ledge 1: the fan. One holds a plate, the other rides up; then swap.
  b.box(3.5, 11.6, 57.2, 6, 0.8, 4.4, { color: '#8a6a4a' });
  b.checkpoint(4.2, 12, 57.2, 3.4, { flag: false, hint: 'One holds the plate to run the fan and blow the other up; whoever is up top then holds the plate up there.' });
  const P1 = b.plate(5.4, 12, 57.8);
  b.plat(1.6, 12.25, 57.2, 2.4, 2.4, 0.5, { mat: 'metal' });
  b.box(-3, 21.6, 57.2, 6, 0.8, 4.4, { color: '#8a6a4a' });
  const P2 = b.plate(-3, 22, 58.4);
  b.fan(1.6, 12.25, 57.2, 1.3, 11.6, 56, { op: 'any', in: [P1, P2] });
  b.checkpoint(-2.6, 22, 56.6, 3.2, { flag: false, hint: 'Last jump: each stand on the pad of your color and hold E to fly to the top!' });
  b.pad(-1.3, 22.08, 56.4, [0, 1, 0], 1, { launch: [0, PHYS.repelSpeed, 0] });
  b.pad(-4.7, 22.08, 56.4, [0, 1, 0], -1, { launch: [0, PHYS.repelSpeed, 0] });
  // The top: the finish, with everything the city has.
  b.goal(0, 28, 49.6, 0);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const colors = [SOL_RED, LUNA_BLUE, '#ffffff', SOL_RED, LUNA_BLUE, '#ffffff'];
    b.box(Math.sin(a) * 4.2, 28.5, 50 + Math.cos(a) * 4.2, 0.9, 1, 0.9, { color: colors[i] });
    b.gem(Math.sin(a + 0.5) * 3.3, 29.4, 50 + Math.cos(a + 0.5) * 3.3);
  }
  for (const [x, z, c] of [[-4.4, 45.6, '#ff6fae'], [4.4, 45.6, '#5ee7ff'], [-4.4, 54.4, '#ffe45e'], [4.4, 54.4, '#8fff9c']]) {
    b.box(x, 30, z, 0.2, 4, 0.2, { color: '#ffffff' });
    b.box(x + 0.6, 31.4, z, 1.2, 0.8, 0.08, { color: c });
  }
  b.light(0, 31, 50, { color: '#fff2c0', intensity: 12, dist: 14, fixture: 'bulb', when: coreLock });
  poster(0, 30.6, 45.3, 0, 'Congratulations!\nAll ten escape rooms cleared!', 6);
  for (const [x, z] of [[-14, 30], [14, 30], [-14, 58], [14, 58]]) b.gem(x, 1.2, z);

  b.objectives = [
    { text: 'Toys: Sol reads the block tower, Luna pounds the buttons in order. Red gear into the core', done: { used: g1 } },
    { text: 'Clocks: Luna reads the floor clock, Sol crosses the platforms to set the time. Blue gear into the core', done: { used: g2 } },
    { text: 'Books: light all six lamps (odd for Sol, even for Luna). White gear into the core', done: { used: g3 } },
    { text: 'Pirates: seesaw up to the crow\'s nest for the key, raft to the island, open the chest. Red gear into the core', done: { used: g4 } },
    { text: 'Pyramid: one holds the eye plate, the other crosses the hidden path to read the symbols. Blue gear into the core', done: { used: g5 } },
    { text: 'Detectives: combine the clues from both offices to solve the case. White gear into the core', done: { used: g6 } },
    { text: 'The core is running! Climb the steps around the central tower', done: { cp: 7 } },
    { text: 'One holds the plate to run the fan and blow the other up, then swap', done: { cp: 8 } },
    { text: 'Last jump: stand on the pad of your color, hold E, and reach the finish at the top together!', done: {} },
  ];
  return b.finish();
}
