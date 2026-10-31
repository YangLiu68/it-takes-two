// Puzzle 9 · Ice Castle. Seven halls, each a two-player puzzle:
//   1 frozen gate: crumbling ice west, blinking ice east, both plates at once
//   2 mirror hall: Sol reads the light path off a model, Luna turns the mirrors
//   3 bell tower: Luna reads the ice-pillar song, Sol rings the bells in order
//   4 snowman: three snowballs (Sol's, Luna's, anyone's), each needs the other
//   5 ice-slide maze: Luna reads the map, Sol rides the right slides
//   6 sculpture gallery: Sol counts the sculptures, Luna dials the code
//   7 throne: two jewels, the two-plate lift, the crown

import { LevelBuilder } from '../build.js';
import { PHYS } from '../constants.js';

const ICE = '#bfe0ff';
const ICE2 = '#8ec5f0';
const SNOW = '#e6f2ff';
const WALL = '#7fa6cf';
const WATER = '#2f6fa8';
const GOLD = '#ffd27a';
const SOL_RED = '#ff6b4a';
const LUNA_BLUE = '#4f86ff';
const H = 10; // castle walls: too tall to climb, even standing on your partner
// Compass: north is +Z. Facing north, -X is on your right, so east is -X.
const DIRS = ['North', 'East', 'South', 'West'];

export function iceCastle(index) {
  const b = new LevelBuilder({ mode: 'puzzle', index, seed: 'ice-castle', name: 'Ice Castle', label: 'Room 9', theme: 'frost', sky: 'aurora', overrides: { fogDensity: 0.004 } });
  const wall = { color: WALL, t: 0.6 };
  const door = (lintel) => ({ ...wall, lintel });
  const iceDoor = (x, z, w, when, o = {}) => b.door(x, z, w, o.h ?? 4, when, { latch: true, color: ICE2, ...o });
  // Freezing water under every pit: touch it and you're back at the checkpoint.
  const water = (x, z, sx, sz) => {
    b.box(x, -3, z, sx, 1, sz, { color: WATER });
    b.zone('kill', x, -1.4, z, sx, 1.8, sz);
  };
  const gold = (x, y, z) => b.gem(x, y, z);
  // A poster on a wall, facing into the room (yaw: 0 → +Z, PI → -Z, PI/2 → +X, -PI/2 → -X).
  const poster = (x, y, z, yaw, text, w = 5, style) => b.sign(x, y, z, text, { fixed: true, yaw, w, ...(style ? { style } : {}) });
  const label = (x, y, z, text, w = 1.2) => b.sign(x, y, z, text, { fit: true, w });

  // == 1 · The frozen gate (z 0..26) ===============================================================
  b.floor(0, 0, 4, 28, 8, { color: SNOW });
  b.wallX(-14, 14, 0, H, wall);
  b.wallZ(0, 26, -14, H, wall);
  b.wallZ(0, 26, 14, H, wall);
  b.wallGapsX(-14, 14, 26, H, [[0, 4]], door(5));
  b.checkpoint(0, 0, 3, 6, { hint: 'The frozen gate melts only when you both stand on the two plates at once. Cracking ice on the right, blinking ice on the left.' });
  poster(0, 7.2, 25.6, Math.PI, 'Ice Castle\nStand on both plates at once to melt the gate', 6.5);
  water(0, 13.5, 27.4, 11);
  // West: crumbling ice. East: blinking ice.
  b.crumble(-10, 0, 10.3, 2.2, 2.2);
  b.crumble(-8.4, 0.7, 13.6, 2.2, 2.2);
  b.crumble(-10, 0.3, 16.9, 2.2, 2.2);
  poster(-13.6, 3.4, 5, Math.PI / 2, 'Cracking ice: it breaks\nunder you. Keep moving!', 3.6);
  const BLINK = 2.8;
  b.blink(10, 0, 10.3, 2.4, 2.4, 0, BLINK);
  b.blink(8.4, 0, 13.6, 2.4, 2.4, 1, BLINK);
  b.blink(10, 0, 16.9, 2.4, 2.4, 0, BLINK);
  poster(13.6, 3.4, 5, -Math.PI / 2, 'Blinking ice: pink and blue\ntake turns. Time your jumps', 3.8);
  // Islands with the plates, joined by a ledge along the gate wall.
  b.floor(-9, 0, 22, 6, 6, { color: SNOW });
  b.floor(9, 0, 22, 6, 6, { color: SNOW });
  b.floor(0, 0, 24, 12.2, 4, { color: ICE });
  const plateW = b.plate(-9, 0, 21.5);
  const plateE = b.plate(9, 0, 21.5);
  const gate = b.act('gate', { op: 'all', in: [plateW, plateE] }, true, [
    { x: 0, y: 2.5, z: 26, sx: 3.9, sy: 5, sz: 0.6, move: [0, -5.3, 0] },
  ], { speed: 4, color: ICE2, mat: 'toy', lamp: [0, 5.6, 25.5] });
  b.acts[b.acts.length - 1].toast = 'The ice on the gate melts!';
  gold(-10, 2.2, 16.9);
  gold(10, 2.2, 10.3);

  // == 2 · The mirror hall (z 26..56) ===============================================================
  b.floor(0, 0, 30, 10, 8, { color: SNOW });
  b.wallGapsZ(26, 34, -5, H, [[30, 3]], door(4));
  b.wallGapsZ(26, 34, 5, H, [[30, 3]], door(4));
  b.wallX(-5, 5, 34, H, wall);
  b.fieldZ(-5, 2, 30, 3, 4, 1);
  b.fieldZ(5, 2, 30, 3, 4, -1);
  poster(0, 3.4, 33.6, Math.PI, 'Split up\nRight, red door: Sol   Left, blue door: Luna', 4.4);
  b.checkpoint(0, 0, 30, 5, { hint: 'Split up: Sol through the red barrier (the model room on the right), Luna through the blue one (the mirror hall on the left).' });

  // Sol's model room: the light path, on a model up on a dais.
  b.floor(-15, 0, 36, 20, 20, { color: SNOW });
  b.wallX(-25, -14, 26, H, wall);
  b.wallZ(26, 46, -25, H, wall);
  b.wallZ(34, 46, -5, H, wall);
  b.wallGapsX(-25, -5, 46, H, [[-9, 3]], door(4));
  b.box(-19, 3, 41, 8, 6, 8, { color: ICE2 });
  b.pad(-19, 0.08, 33, [0, 1, 0], 1, { launch: [0, PHYS.repelSpeed, 0] });
  poster(-19, 3.2, 36.9, Math.PI, 'Sol: hold E on the red pad', 3.4);
  // The model: the mirror hall at 0.18 scale, north up.
  const HX = 18, HZ = 39, S = 0.18, TX = -19, TZ = 41, TY = 6.9;
  const mx = (x) => TX + (x - HX) * S;
  const mz = (z) => TZ + (z - HZ) * S;
  b.box(TX, 6.45, TZ, 5.4, 0.9, 5.4, { color: '#eef6ff' });
  const mbar = (x0, z0, x1, z1, color, y = TY + 0.06, t = 0.06) => {
    const ax = mx(x0), az = mz(z0), bx = mx(x1), bz = mz(z1);
    b.box((ax + bx) / 2, y, (az + bz) / 2, Math.max(t, Math.abs(bx - ax) + t), t, Math.max(t, Math.abs(bz - az) + t), { color });
  };
  mbar(5, 26, 31, 26, WALL, TY + 0.1, 0.12);
  mbar(5, 52, 31, 52, WALL, TY + 0.1, 0.12);
  mbar(5, 26, 5, 52, WALL, TY + 0.1, 0.12);
  mbar(31, 26, 31, 52, WALL, TY + 0.1, 0.12);
  const MIRRORS = [[11, 36], [18, 36], [25, 36], [11, 46], [18, 46], [25, 46]];
  MIRRORS.forEach(([x, z], i) => {
    b.box(mx(x), TY + 0.15, mz(z), 0.3, 0.3, 0.3, { color: '#c7d7ff' });
    label(mx(x), TY + 0.75, mz(z), String(i + 1), 0.6);
  });
  b.box(mx(6), TY + 0.15, mz(36), 0.3, 0.3, 0.3, { color: '#ffe14d' });
  label(mx(6), TY + 0.7, mz(36), 'Light', 0.45);
  b.box(mx(11), TY + 0.2, mz(52), 0.6, 0.4, 0.15, { color: LUNA_BLUE });
  label(mx(11), TY + 0.8, mz(52) + 0.2, 'Ice door', 0.7);
  label(mx(18), TY + 0.7, mz(52) + 0.55, 'N', 0.45);
  const PATH = [[6, 36], [11, 36], [18, 36], [18, 46], [11, 46], [11, 52]];
  for (let i = 0; i < PATH.length - 1; i++) mbar(...PATH[i], ...PATH[i + 1], '#ffd21f', TY + 0.2, 0.07);
  poster(-19, 8.6, 45.6, Math.PI, 'Mirror hall model (north is ahead)\nThe gold line is the light\'s path.\nTell Luna which way each mirror\nsends it: north, east, south, west.', 5.6, 'paper');
  gold(-23, 7.2, 44);

  // Luna's mirror hall.
  b.floor(18, 0, 39, 26, 26, { color: SNOW });
  b.wallX(14, 31, 26, H, wall);
  b.wallZ(26, 52, 31, H, wall);
  b.wallZ(34, 52, 5, H, wall);
  b.wallGapsX(5, 31, 52, H, [[11, 3]], door(4));
  b.sign(18, 6.4, 51.6, 'North', { fixed: true, fit: true, yaw: Math.PI, w: 1.6 });
  b.sign(18, 6.4, 26.4, 'South', { fixed: true, fit: true, yaw: 0, w: 1.6 });
  b.sign(5.4, 6.4, 44, 'East', { fixed: true, fit: true, yaw: Math.PI / 2, w: 1.6 });
  b.sign(30.6, 6.4, 39, 'West', { fixed: true, fit: true, yaw: -Math.PI / 2, w: 1.6 });
  const starts = [2, 3, 0, 2, 1, 1];
  const mirrors = MIRRORS.map(([x, z], i) => {
    const id = b.dial(x, 0, z, { values: DIRS, start: starts[i], h: 1.9 });
    label(x, 0.5, z - 1.35, `Mirror ${i + 1}`, 1.3); // low, in front: never in the camera's way
    return id;
  });
  b.box(6.0, 1.4, 36, 0.8, 1.4, 0.8, { color: '#fff3b0', yaw: Math.PI / 4 });
  b.light(6.6, 1.6, 36, { color: '#fff2a0', intensity: 8, dist: 8, fixture: 'bulb' });
  label(6.4, 3.0, 36, 'Light', 1.2);
  poster(25, 3.6, 51.6, Math.PI, 'Mirror hall\nPound (C) to turn a mirror: its word is where it sends the light.\nOnly one path reaches the ice door — ask Sol in the model room.', 7);
  // The light leaves the source westward (+X): 1 → west, 2 → north, 5 → east, 4 → north (onto the door).
  const mirror = b.combo([mirrors[0], mirrors[1], mirrors[4], mirrors[3]], [3, 0, 1, 0]);
  const beams = [];
  for (let i = 0; i < PATH.length - 1; i++) {
    const [x0, z0] = PATH[i], [x1, z1] = PATH[i + 1];
    beams.push({ x: (x0 + x1) / 2, y: 3.0, z: (z0 + z1) / 2, sx: Math.abs(x1 - x0) + 0.22, sy: 0.22, sz: Math.abs(z1 - z0) + 0.22, move: [0, 0.05, 0], delay: i * 0.25 });
  }
  b.act('bridge', { op: 'all', in: [mirror] }, true, beams, { speed: 1, mat: 'toy', color: '#ffe85a', lamp: [6.6, 2.4, 36] });
  for (const [x, z] of PATH.slice(1, 5)) b.light(x, 3.0, z, { color: '#fff2a0', intensity: 6, dist: 7, fixture: 'none', when: mirror });
  const lunaDoor2 = iceDoor(11, 52, 3, { op: 'all', in: [mirror] });
  b.acts[b.acts.length - 1].toast = 'The light hits the ice door — it melts!';
  iceDoor(-9, 46, 3, { op: 'all', in: [mirror] });
  gold(25, 1.2, 50);

  // == 3 · The bell tower (z 46..84) ==================================================================
  b.floor(-9, 0, 51, 3, 10, { color: ICE });
  b.wallZ(46, 56, -10.5, H, wall);
  b.wallZ(46, 56, -7.5, H, wall);
  b.floor(11, 0, 54, 3, 4, { color: ICE });
  b.wallZ(52, 56, 9.5, H, wall);
  b.wallZ(52, 56, 12.5, H, wall);
  b.floor(1, 0, 60, 40, 8, { color: SNOW });
  b.wallGapsX(-19, 21, 56, H, [[-9, 3], [11, 3]], door(4));
  b.wallZ(56, 64, -19, H, wall);
  b.wallZ(56, 64, 21, H, wall);
  b.wallGapsX(-19, 23, 64, H, [[-10, 3], [13, 3]], door(4));
  b.field(-10, 2, 64, 3, 4, 0.3, -1);
  b.field(13, 2, 64, 3, 4, 0.3, 1);
  b.checkpoint(1, 0, 60, 6, { hint: 'Bell tower: Luna goes to the song room (blue) to read the ice pillars, Sol to the bell court (red) to ring the bells.' });
  poster(-10, 5.0, 63.6, Math.PI, 'Song room (Luna)', 2.6);
  poster(13, 5.0, 63.6, Math.PI, 'Bell court (Sol)', 2.6);

  // The song: each pillar is a note. Taller pillar = longer icicle.
  const SONG = [3, 1, 4, 1, 5, 2];
  b.floor(-10, 0, 74, 18, 20, { color: SNOW });
  b.wallZ(64, 84, -19, H, wall);
  b.wallZ(64, 84, -1, H, wall);
  SONG.forEach((n, i) => {
    const x = -3.5 - i * 2.6; // left to right as you walk in (facing north, +X is on the left)
    const h = n * 1.1;
    b.box(x, h / 2, 79, 1.2, h, 1.2, { color: ICE2 });
    b.box(x, 0.1, 79, 1.8, 0.2, 1.8, { color: WALL });
    b.sign(x, 6.8, 83.6, String(i + 1), { fixed: true, fit: true, yaw: Math.PI, w: 1.1 });
  });
  poster(-1.4, 3.4, 71, -Math.PI / 2, 'Song of Ice (left to right, 1 to 6)\nEach pillar is one note.\nTaller pillar = longer icicle.\nRead the order out to Sol.', 4.8, 'paper');

  // The bells: icicles of five lengths, in a different order.
  b.floor(13, 0, 74, 20, 20, { color: SNOW });
  b.wallZ(64, 84, 3, H, wall);
  b.wallZ(64, 84, 23, H, wall);
  const LEN = [4, 1, 5, 2, 3];
  b.box(13, 8.2, 77, 18, 0.4, 0.6, { color: '#e8f2fb' });
  for (const x of [3.6, 22.4]) b.box(x, 4.1, 77, 0.6, 8.2, 0.6, { color: '#e8f2fb' });
  const bells = LEN.map((L, i) => {
    const x = 6 + i * 3.5;
    b.box(x, 7.55, 77, 0.08, 0.9, 0.08, { color: '#8899aa' });
    b.box(x, 6.6, 77, 1.1, 1.0, 1.1, { color: GOLD });
    b.box(x, 6.1 - (L * 1.1) / 2, 77, 0.42, L * 1.1, 0.42, { color: '#bfe8ff' });
    return b.pswitch(x, 0, 73.6, false, 0.8, '#ffe39a');
  });
  const byLen = (n) => bells[LEN.indexOf(n)];
  const song = b.seq(SONG.map(byLen));
  poster(3.4, 3.4, 70, Math.PI / 2, 'Bell court\nEach bell has an icicle of a\ndifferent length. Stand on a bell\'s\nbutton and pound (C) in the order\nLuna reads. Mistakes start over.', 4.8);
  b.wallGapsX(-19, 23, 84, H, [[-10, 3], [13, 3]], door(4));
  iceDoor(-10, 84, 3, { op: 'all', in: [song] });
  iceDoor(13, 84, 3, { op: 'all', in: [song] });
  b.acts[b.acts.length - 1].toast = 'Bells ring through the castle... the north doors open!';
  gold(-3.5, 7, 78);

  // == 4 · The snowman (z 84..114) =====================================================================
  b.floor(0, 0, 92, 32, 16, { color: SNOW });
  b.wallGapsZ(84, 100, -16, H, [[98, 3]], door(4));
  b.wallGapsZ(84, 100, 16, H, [[92, 3]], door(4));
  b.wallGapsX(-16, 16, 100, 14, [[0, 12], [12, 3]], door(4));
  b.checkpoint(0, 0, 88, 6, { hint: 'The snowman needs three snowballs: only Sol can take the red one, only Luna the blue one, and anyone the white one. Each one needs help from the other player.' });
  const snowLockAt = [0, 0, 93.5];
  b.box(0, 1.0, 96.6, 2.2, 2.0, 2.2, { color: '#ffffff' });
  b.box(0, 2.75, 96.6, 1.6, 1.5, 1.6, { color: '#ffffff' });
  b.box(0, 4.05, 96.6, 1.2, 1.1, 1.2, { color: '#ffffff' });
  b.box(0, 4.1, 95.85, 0.18, 0.18, 0.5, { color: '#ff8c3a' });
  for (const s of [-1, 1]) b.box(s * 0.25, 4.35, 96.0, 0.14, 0.14, 0.05, { color: '#222222' });
  b.sign(0, 5.8, 96.6, 'Snowman: 3 snowballs, please!', { w: 3.4 });
  // West: the lake. A bridge appears only while someone holds the plate.
  b.wallX(-38, -16, 92, H, wall);
  b.wallX(-38, -16, 104, H, wall);
  b.wallZ(92, 104, -38, H, wall);
  water(-27, 98, 22, 12);
  b.floor(-33, 0, 98, 5, 5, { color: SNOW });
  const lakePlate = b.plate(-12.5, 0, 89.5);
  const planks = [];
  for (let k = 0; k < 5; k++) planks.push({ x: -17.45 - 2.9 * k, y: -0.3 - 9, z: 98, sx: 2.84, sy: 0.6, sz: 2.4, move: [0, 9, 0], delay: k * 0.08 });
  b.act('bridge', { op: 'any', in: [lakePlate] }, false, planks, { speed: 16, mat: 'toy', color: ICE, lamp: [-16, 1, 96.2] });
  b.wire(lakePlate, [[-12.5, 0, 89.5], [-15, 0, 89.5], [-15, 0, 96.2]]);
  poster(-15.6, 3.2, 89.5, Math.PI / 2, 'Plate: hold it for the ice bridge', 3.6);
  const red = b.item('snowball', -33, 1.0, 98, { who: 0, color: SOL_RED, label: 'Red Snowball' });
  gold(-33, 2.6, 99.8);
  // North: Luna's snowball on a pillar. Only the seesaw reaches it.
  b.floor(0, 0, 104, 12, 8, { color: SNOW });
  b.wallZ(100, 112.4, -6, 14, wall);
  b.wallZ(100, 112.4, 6, 14, wall);
  b.wallX(-6, 6, 112.4, 14, wall);
  b.box(0, 5.5, 110, 5, 11, 4, { color: ICE2 });
  b.seesaw(0, 1.0, 103.6, 9.2, 2.4);
  poster(-5.6, 3.6, 104, Math.PI / 2, 'Seesaw: one stands on one end,\nthe other pounds (C) the other end', 4);
  const blue = b.item('snowball', 0, 11.7, 110.5, { who: 1, color: LUNA_BLUE, label: 'Blue Snowball' });
  // East: crumbling ice to the white snowball.
  b.wallX(16, 36, 86, H, wall);
  b.wallX(16, 36, 98, H, wall);
  b.wallZ(86, 98, 36, H, wall);
  water(24, 92, 16, 12);
  [[18.3, 0, 91], [21.6, 0.6, 93], [24.9, 1.2, 91], [28.2, 0.6, 93]].forEach(([x, top, z]) => b.crumble(x, top, z, 2.2, 2.2));
  b.floor(32.5, 0, 92, 4, 4, { color: SNOW });
  const white = b.item('snowball', 32.5, 1.0, 92, { color: '#ffffff', label: 'White Snowball' });
  const snowLock = b.lock(...snowLockAt, [red, blue, white], { label: 'Snowman' });
  const exit4 = iceDoor(12, 100, 3, { op: 'all', in: [snowLock] });
  b.acts[b.acts.length - 1].toast = 'The snowman winks, and the north ice door opens!';

  // == 5 · The ice-slide maze (z 100..152) ================================================================
  b.floor(12, 0, 106, 4, 12, { color: ICE });
  b.wallZ(100, 112, 10, H, wall);
  b.wallZ(100, 112, 14, H, wall);
  b.floor(6, 0, 116, 16, 8, { color: SNOW });
  b.wallX(-2, 10, 112, H, wall);
  b.wallZ(112, 120, 14, H, wall);
  b.wallGapsZ(112, 120, -2, H, [[116, 3]], door(4));
  b.fieldZ(-2, 2, 116, 3, 4, -1);
  b.checkpoint(6, 0, 116, 5, { hint: 'Ice-slide maze: the slides are faster than you, and a wrong one drops you into an ice hole! Luna reads the map next door and tells Sol which slide to take at each junction.' });
  poster(9.5, 3.6, 119.6, Math.PI, 'Ice-slide maze (Sol)\nEach junction has several slides;\nonly one way leads to the exit', 5);
  poster(-1.6, 5.0, 116, Math.PI / 2, 'Map room (Luna)', 2.6);
  // The maze: 6 x 5 cells of 4 m. J junction, X exit, H hole, # solid ice, NESW slides.
  const MAZE = [
    'NWJEEN',
    'N#NNWJ',
    'HHWJNN',
    '#NWWNN',
    '#X##HH',
  ];
  const C0 = -6, R0 = 120, CS = 4, MH = 6, BELT = 10;
  const cx = (c) => C0 + CS / 2 + CS * c;
  const cz = (r) => R0 + CS / 2 + CS * r;
  const cell = (c, r) => (r >= 0 && r < MAZE.length && c >= 0 && c < 6 ? MAZE[r][c] : '#');
  const OPEN = new Set([
    '2,0|1,0', '1,0|0,0', '0,0|0,1', '0,1|0,2',
    '2,0|3,0', '3,0|4,0', '4,0|5,0', '5,0|5,1',
    '2,0|2,1', '2,1|2,2', '2,2|1,2',
    '5,1|4,1', '4,1|3,1', '3,1|3,2',
    '5,1|5,2', '5,2|5,3', '5,3|5,4',
    '3,2|3,3', '3,3|2,3', '2,3|1,3', '1,3|1,4',
    '3,2|4,2', '4,2|4,3', '4,3|4,4',
  ]);
  const isOpen = (a, c) => OPEN.has(`${a}|${c}`) || OPEN.has(`${c}|${a}`);
  const DV = { N: [0, 1], S: [0, -1], E: [1, 0], W: [-1, 0] };
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 6; c++) {
      const k = cell(c, r), x = cx(c), z = cz(r);
      if (k === 'J' || k === 'X') b.floor(x, 0, z, CS, CS, { color: k === 'X' ? GOLD : SNOW });
      else if (k === '#') b.box(x, MH / 2, z, CS, MH, CS, { color: ICE2 });
      else if (k === 'H') water(x, z, CS, CS);
      else b.conveyor(x, 0, z, CS, CS, BELT, DV[k]);
      if (c < 5 && !isOpen(`${c},${r}`, `${c + 1},${r}`)) b.wallZ(z - CS / 2, z + CS / 2, x + CS / 2, MH, { color: WALL, t: 0.4 });
      if (r < 4 && !isOpen(`${c},${r}`, `${c},${r + 1}`)) b.wallX(x - CS / 2, x + CS / 2, z + CS / 2, MH, { color: WALL, t: 0.4 });
    }
  }
  b.wallGapsX(C0, C0 + 24, R0, MH, [[cx(2), 3]], { color: WALL, t: 0.6 });
  b.wallGapsX(C0, C0 + 24, R0 + 20, MH, [[cx(1), 3]], { color: WALL, t: 0.6 });
  b.wallZ(R0, R0 + 20, C0, MH, { color: WALL, t: 0.6 });
  b.wallZ(R0, R0 + 20, C0 + 24, MH, { color: WALL, t: 0.6 });
  b.box(C0 + 12, MH + 0.25, R0 + 10, 24.6, 0.5, 20.6, { color: '#dcefff' }); // an ice roof: no peeking over the walls
  b.field(cx(2), 2, R0, 3, 4, 0.3, 1);
  for (const [c, r] of [[2, 0], [5, 1], [3, 2], [1, 4]]) b.light(cx(c), 5.2, cz(r), { color: '#e8f6ff', intensity: 8, dist: 9, fixture: 'bulb' });
  // Luna's map room: the maze in miniature.
  b.floor(-11, 0, 114, 18, 12, { color: SNOW });
  b.wallZ(108, 120, -20, H, wall);
  b.wallX(-20, -2, 108, H, wall);
  b.wallZ(108, 112, -2, H, wall);
  b.wallGapsX(-20, -6, 120, H, [[-8.5, 3]], door(4));
  const MS = 0.2, MX = -12, MZ = 114.5, MY = 1.0;
  const ax = (x) => MX + (x - (C0 + 12)) * MS;
  const az = (z) => MZ + (z - (R0 + 10)) * MS;
  b.box(MX, 0.5, MZ, 5.4, 1.0, 4.6, { color: '#eef6ff' });
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 6; c++) {
      const k = cell(c, r), x = ax(cx(c)), z = az(cz(r));
      const sq = CS * MS - 0.06;
      if (k === 'J') b.box(x, MY + 0.02, z, sq, 0.04, sq, { color: '#ffffff' });
      else if (k === 'X') b.box(x, MY + 0.02, z, sq, 0.04, sq, { color: GOLD });
      else if (k === 'H') b.box(x, MY + 0.02, z, sq, 0.04, sq, { color: '#123c66' });
      else if (k === '#') b.box(x, MY + 0.2, z, sq, 0.4, sq, { color: ICE2 });
      else {
        // An arrow: shaft plus two barbs, pointing the way the slide pushes.
        const [dx, dz] = DV[k];
        const yaw = Math.atan2(dx, dz);
        b.box(x, MY + 0.03, z, sq, 0.04, sq, { color: '#a8d8ff' });
        b.box(x, MY + 0.07, z, 0.08, 0.05, 0.5, { color: '#ff7a3a', yaw });
        for (const s of [-1, 1]) {
          const hx = x + dx * 0.18 - (s * dz * 0.08), hz = z + dz * 0.18 + (s * dx * 0.08);
          b.box(hx, MY + 0.07, hz, 0.07, 0.05, 0.26, { color: '#ff7a3a', yaw: yaw + s * 0.7 });
        }
      }
      if (c < 5 && !isOpen(`${c},${r}`, `${c + 1},${r}`)) b.box(x + (CS * MS) / 2, MY + 0.15, z, 0.05, 0.3, CS * MS, { color: '#7a9cc0' });
      if (r < 4 && !isOpen(`${c},${r}`, `${c},${r + 1}`)) b.box(x, MY + 0.15, z + (CS * MS) / 2, CS * MS, 0.3, 0.05, { color: '#7a9cc0' });
    }
  }
  label(ax(cx(2)), MY + 0.55, az(R0) - 0.4, 'Start', 0.7);
  label(ax(cx(1)), MY + 0.55, az(R0 + 20) + 0.4, 'Exit', 0.7);
  label(MX - 1.6, MY + 0.55, az(R0 + 20) + 0.4, 'N', 0.45);
  poster(-19.6, 3.4, MZ, Math.PI / 2, 'Ice-slide maze map (N = north)\nOrange arrows: where slides push\nDark blue: hole · White: junction\nGold: exit\nTell Sol which slide to take\nat each junction.', 5.4, 'paper');
  // Out of the maze: a button that lets Luna out too.
  b.floor(0, 0, 146, 12, 12, { color: SNOW });
  b.wallGapsZ(140, 152, -6, H, [[144.5, 3]], door(4));
  b.wallZ(140, 152, 6, H, wall);
  const mazeOut = b.pswitch(2.5, 0, 147, true);
  poster(5.6, 3.0, 147, -Math.PI / 2, 'Pound (C) to let Luna out', 3.4);
  b.floor(-8.5, 0, 133, 3, 26, { color: ICE });
  b.floor(-7.75, 0, 144.5, 3.5, 3, { color: ICE });
  b.wallZ(120, 146, -10, H, wall);
  b.wallZ(120, 143, -7, H, wall);
  b.wallX(-10, -6, 146, H, wall);
  const corridor = iceDoor(-8.5, 120, 3, { op: 'all', in: [mazeOut] });
  b.acts[b.acts.length - 1].toast = 'The map room\'s back door opens!';
  b.checkpoint(0, 0, 147.5, 5, { hint: 'You made it out! Wait for Luna to come through the side corridor.' });
  gold(cx(5), 1.4, cz(1));

  // == 6 · The sculpture gallery (z 152..186) ====================================================================
  b.wallGapsX(-6, 6, 152, H, [[-3.5, 3], [3.5, 3]], door(4));
  b.field(-3.5, 2, 152, 3, 4, 0.3, -1);
  b.field(3.5, 2, 152, 3, 4, 0.3, 1);
  poster(-3.5, 5.0, 151.6, Math.PI, 'Code room (Luna)', 2.5);
  poster(3.5, 5.0, 151.6, Math.PI, 'Sculptures (Sol)', 2.5);
  // Sol's gallery.
  b.floor(15, 0, 168, 28, 32, { color: SNOW });
  b.wallX(6, 29, 152, H, wall);
  b.wallZ(152, 184, 29, H, wall);
  b.wallZ(152, 184, 1, H, wall);
  b.wallGapsX(1, 29, 184, H, [[5, 3]], door(4));
  poster(1.4, 3.4, 160, Math.PI / 2, 'Ice sculpture gallery\nCount them: how many penguins,\nsnowmen and deer?\n(More upstairs: ride the fan up)', 5);
  // Sculptures, each on an ice plinth so they read as exhibits. Facing: yaw 0 → +Z.
  const plinth = (x, y, z) => b.box(x, y + 0.2, z, 2.2, 0.4, 2.2, { color: WALL });
  const fwd = (x, z, yaw, d) => [x + Math.sin(yaw) * d, z + Math.cos(yaw) * d];
  const penguin = (x, y, z, yaw = 0) => {
    plinth(x, y, z);
    const y0 = y + 0.4;
    b.box(x, y0 + 0.8, z, 1.0, 1.6, 0.85, { color: '#1f2633', yaw });
    const [bx, bz] = fwd(x, z, yaw, 0.38);
    b.box(bx, y0 + 0.7, bz, 0.66, 1.1, 0.14, { color: '#ffffff', yaw });
    const [kx, kz] = fwd(x, z, yaw, 0.55);
    b.box(kx, y0 + 1.3, kz, 0.24, 0.14, 0.3, { color: '#ffa63a', yaw });
    for (const s2 of [-1, 1]) {
      const ex = bx + Math.cos(yaw) * 0.2 * s2, ez = bz - Math.sin(yaw) * 0.2 * s2;
      b.box(ex, y0 + 1.48, ez, 0.12, 0.12, 0.1, { color: '#ffffff', yaw });
      b.box(x + Math.cos(yaw) * 0.25 * s2 + Math.sin(yaw) * 0.25, y0 + 0.06, z - Math.sin(yaw) * 0.25 * s2 + Math.cos(yaw) * 0.25, 0.3, 0.12, 0.45, { color: '#ffa63a', yaw });
    }
  };
  const snowman = (x, y, z, yaw = 0) => {
    plinth(x, y, z);
    const y0 = y + 0.4;
    b.box(x, y0 + 0.7, z, 1.4, 1.4, 1.4, { color: '#ffffff' });
    b.box(x, y0 + 1.85, z, 1.0, 0.95, 1.0, { color: '#ffffff' });
    b.box(x, y0 + 2.75, z, 0.75, 0.75, 0.75, { color: '#ffffff' });
    b.box(x, y0 + 2.3, z, 1.05, 0.2, 1.05, { color: '#e8403a' }); // scarf
    b.box(x, y0 + 3.17, z, 0.9, 0.08, 0.9, { color: '#1a1a1a' }); // hat brim
    b.box(x, y0 + 3.45, z, 0.55, 0.5, 0.55, { color: '#1a1a1a' });
    const [nx, nz] = fwd(x, z, yaw, 0.5);
    b.box(nx, y0 + 2.72, nz, 0.12, 0.12, 0.42, { color: '#ff8c3a', yaw });
  };
  const deer = (x, y, z, yaw = 0) => {
    plinth(x, y, z);
    const y0 = y + 0.4;
    b.box(x, y0 + 1.25, z, 0.75, 0.65, 1.7, { color: '#b98a5a', yaw });
    for (const [dx, dz] of [[-0.26, -0.6], [0.26, -0.6], [-0.26, 0.6], [0.26, 0.6]]) {
      b.box(x + Math.cos(yaw) * dx + Math.sin(yaw) * dz, y0 + 0.47, z - Math.sin(yaw) * dx + Math.cos(yaw) * dz, 0.16, 0.95, 0.16, { color: '#8a6440' });
    }
    const [hx, hz] = fwd(x, z, yaw, 0.95);
    b.box(hx, y0 + 1.95, hz, 0.42, 0.55, 0.6, { color: '#b98a5a', yaw });
    const [nx, nz] = fwd(x, z, yaw, 1.28);
    b.box(nx, y0 + 1.85, nz, 0.14, 0.14, 0.1, { color: '#2a1a10', yaw });
    for (const s2 of [-1, 1]) {
      const ax2 = hx + Math.cos(yaw) * 0.2 * s2, az2 = hz - Math.sin(yaw) * 0.2 * s2;
      b.box(ax2, y0 + 2.55, az2, 0.08, 0.7, 0.08, { color: '#f0e2c0', yaw: yaw + s2 * 0.35 });
      b.box(ax2 + Math.cos(yaw) * 0.18 * s2, y0 + 2.8, az2 - Math.sin(yaw) * 0.18 * s2, 0.32, 0.08, 0.08, { color: '#f0e2c0', yaw });
    }
  };
  for (const [x, z] of [[8, 162], [11, 165], [21, 158]]) penguin(x, 0, z, Math.PI);
  b.box(24, 3, 166, 3, 6, 3, { color: ICE2 }); // a big pillar...
  penguin(24, 0, 168.6, 0); // ...with one hiding behind it
  snowman(14, 0, 159);
  snowman(26.5, 0, 157);
  deer(4, 0, 176);
  b.box(4, 2.5, 172.4, 4.6, 5, 0.4, { color: WALL }); // the deer's alcove
  // Upstairs, by the fan.
  b.box(22, 3.5, 180, 14, 7, 8, { color: ICE2 });
  b.plat(11.5, 0.25, 178.5, 3, 3, 1.2, { mat: 'metal' });
  b.fan(11.5, 0.25, 178.5, 1.5, 10.5, 56);
  poster(14.9, 3.4, 178.5, -Math.PI / 2, 'Fan: ride it upstairs', 3.2);
  penguin(18, 7, 179, Math.PI);
  snowman(22, 7, 181.5);
  deer(26, 7, 179);
  // Luna's code room: three dials on ice floes.
  b.floor(-10, 0, 156, 18, 8, { color: SNOW });
  b.wallX(-19, -6, 152, H, wall);
  b.wallZ(152, 170, -19, H, wall);
  b.wallZ(152, 170, -1, H, wall);
  b.wallGapsX(-19, -1, 170, H, [[-10, 3]], door(4));
  water(-10, 165, 18, 10);
  b.floor(-10, 0, 169, 18, 2, { color: SNOW });
  const floes = [[-15, 164], [-10, 165.5], [-5, 164]];
  for (const [x, z] of floes) b.floor(x, 0, z, 3, 3, { color: ICE });
  const counts = [5, 3, 2];
  const statues = ['Penguins', 'Snowmen', 'Deer'];
  const codeDials = floes.map(([x, z], i) => {
    label(x, 0.5, z - 1.25, statues[i], 1.1);
    return b.dial(x, 0, z, { start: 0, h: 1.9 });
  });
  const gallery = b.combo(codeDials, counts);
  poster(-18.6, 3.4, 156, Math.PI / 2, 'Sculpture lock\nThree digits: penguins, snowmen\nand deer. Ask Sol in the gallery,\nhop onto the floes and pound (C)\nto set each digit.', 5.4);
  iceDoor(-10, 170, 3, { op: 'all', in: [gallery] });
  iceDoor(5, 184, 3, { op: 'all', in: [gallery] });
  b.acts[b.acts.length - 1].toast = 'Code correct! On to the throne room.';
  b.floor(-10, 0, 178, 3, 16, { color: ICE });
  b.wallZ(170, 186, -11.5, H, wall);
  b.wallZ(170, 186, -8.5, H, wall);
  b.floor(5, 0, 185, 3, 2, { color: ICE });
  b.wallZ(184, 186, 3.5, H, wall);
  b.wallZ(184, 186, 6.5, H, wall);

  // == 7 · The Snow Queen's throne (z 186..232) =================================================================
  b.floor(4, 0, 199, 32, 26, { color: SNOW }); // x -12..20
  b.floor(-11.5, 0, 215, 17, 6, { color: SNOW });
  b.floor(11.5, 0, 215, 17, 6, { color: SNOW });
  b.floor(-14, 0, 224, 12, 12, { color: SNOW });
  b.floor(14, 0, 224, 12, 12, { color: SNOW });
  b.floor(-16, 0, 190, 8, 8, { color: SNOW }); // x -20..-12 by the door
  b.wallGapsX(-20, 20, 186, H, [[-10, 3], [5, 3]], door(4));
  b.wallZ(186, 232, -20, 14, wall);
  b.wallZ(186, 232, 20, 14, wall);
  b.wallX(-20, 20, 232, 14, wall);
  b.checkpoint(0, 0, 191, 6, { hint: 'The Snow Queen\'s throne: first get the two jewels — only Sol can take the red one, only Luna the blue one.' });
  poster(0, 9, 217.9, Math.PI, 'The Snow Queen\'s throne\nHer crown is missing two jewels', 5);
  // West: the red jewel past blinking ice.
  water(-16, 202, 8, 16);
  b.wallGapsZ(194, 212, -12, H, [[196.8, 3]], wall);
  b.wallX(-20, -12, 212, H, wall);
  [[-14.2, 196.8, 0], [-16.4, 199.8, 1], [-14.4, 202.8, 0], [-16.6, 205.8, 1]].forEach(([x, z, g]) => b.blink(x, 0, z, 2.4, 2.4, g, 2.6));
  b.floor(-16, 0, 210, 8, 4, { color: SNOW });
  const redJewel = b.item('jewel', -17, 1.0, 210.5, { who: 0, color: SOL_RED, label: 'Red Jewel' });
  // East: the blue jewel up on a balcony; the fan only runs while someone holds the plate.
  b.box(16, 4.5, 202, 8, 9, 8, { color: ICE2 });
  b.plat(8.5, 0.25, 202, 3, 3, 1.2, { mat: 'metal' });
  const fanPlate = b.plate(2, 0, 196);
  b.fan(8.5, 0.25, 202, 1.5, 11.5, 56, { op: 'any', in: [fanPlate] });
  b.wire(fanPlate, [[2, 0, 196], [8.5, 0, 196], [8.5, 0, 200.5]]);
  b.sign(2, 2.4, 196, 'Plate: hold it to run the fan', { w: 2.8 });
  const blueJewel = b.item('jewel', 17, 9.6, 202, { who: 1, color: LUNA_BLUE, label: 'Blue Jewel' });
  // The lift: both plates at once and it carries you both up to the throne.
  const liftA = b.plate(-1.4, 0, 215);
  const liftB = b.plate(1.4, 0, 215);
  const lift = b.act('lift', { op: 'all', in: [liftA, liftB] }, true, [
    { x: 0, y: -0.25, z: 215, sx: 5.8, sy: 0.5, sz: 5.8, move: [0, 12, 0], delay: 0.8 },
  ], { speed: 3, mat: 'toy', color: ICE, lamp: [3.4, 0.6, 212.4] });
  b.acts[b.acts.length - 1].toast = 'The ice platform carries you up!';
  poster(0, 4.4, 217.9, Math.PI, 'Ice platform: it rises only when you both stand on its two plates\n(once up, it stays up)', 6);
  // Steps that slowly slide out for anyone who falls off.
  const steps = [];
  for (let i = 0; i < 5; i++) {
    const top = 2 * (i + 1);
    steps.push({ x: -7.2, y: top - 0.4, z: 228.5 - i * 2.1, sx: 2, sy: 0.8, sz: 1.9, move: [-2.4, 0, 0], delay: 10 + i * 0.4 });
  }
  b.act('steps', { op: 'all', in: [liftA, liftB] }, true, steps, { speed: 2, mat: 'toy', color: ICE, lamp: [-8.6, 1.2, 230] });
  // The dais and the crown.
  b.box(0, 6, 224, 16, 12, 12, { color: ICE2 });
  b.checkpoint(0, 12, 220, 4, { flag: false, hint: 'Put both jewels in the crown.' });
  const crown = b.lock(0, 12, 220.6, [redJewel, blueJewel], { label: 'Crown' });
  b.wallGapsX(-8, 8, 222.5, 6, [[0, 3]], { color: WALL, t: 0.5, y: 12, lintel: 4 });
  b.wallZ(222.5, 230, -8, 6, { color: WALL, t: 0.5, y: 12 });
  b.wallZ(222.5, 230, 8, 6, { color: WALL, t: 0.5, y: 12 });
  b.wallX(-8, 8, 230, 6, { color: WALL, t: 0.5, y: 12 });
  const crownDoor = b.door(0, 222.5, 3, 4, { op: 'all', in: [crown] }, { y: 12, latch: true, color: GOLD });
  b.acts[b.acts.length - 1].toast = 'The crown lights up — the throne door opens!';
  b.box(0, 13.6, 229, 3, 3.2, 1.2, { color: '#e8f4ff' });
  b.box(0, 15.6, 229.3, 2.2, 1.2, 0.6, { color: GOLD });
  b.light(0, 15, 226.5, { color: '#fff4d0', intensity: 10, dist: 12, fixture: 'bulb', when: crown });
  b.goal(0, 12, 226.5);
  gold(16, 11, 199);
  gold(-14.4, 2.2, 202.8);

  for (const [k, v] of Object.entries({ gateW: [-9, 0, 21.5], gateE: [9, 0, 21.5], pad: [-19, 0, 33], model: [-19, 6, 39.2], lakePlate: [-12.5, 0, 89.5] })) b.mark(k, ...v);

  b.objectives = [
    { text: 'Both stand on the gate plates at once (cracking ice on the right, blinking ice on the left)', done: { act: gate } },
    { text: 'Sol reads the light path in the model room, Luna turns the mirrors in the mirror hall', done: { sig: mirror } },
    { text: 'Luna reads the ice pillars in the song room, Sol rings the bells in order', done: { sig: song } },
    { text: 'Bring the snowman three snowballs (red is for Sol, blue for Luna)', done: { act: exit4 } },
    { text: 'Luna reads the map and guides Sol out of the ice-slide maze', done: { act: corridor } },
    { text: 'Sol counts the sculptures, Luna dials the three-digit code', done: { sig: gallery } },
    { text: 'Sol gets the red jewel (past the blinking ice)', done: { item: redJewel } },
    { text: 'Luna gets the blue jewel (someone must hold the fan plate)', done: { item: blueJewel } },
    { text: 'Both stand on the two plates of the ice platform', done: { act: lift } },
    { text: 'Put the jewels in the crown and enter the throne room', done: { act: crownDoor } },
    { text: 'Both of you reach the finish!', done: {} },
  ];
  void lunaDoor2;
  return b.finish();
}
