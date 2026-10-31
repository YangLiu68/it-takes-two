// Puzzle 1 · Toy Vault. The gentlest escape room: seven toy
// rooms in a row, each a small two-player puzzle.
//   0 entrance: two plates at once
//   1 toy train: one rides, the other drives (plates), then swap
//   2 split wings: Sol reads a color code that Luna presses; Luna's plate opens
//     Sol's room, Sol launches up to a shelf; two key halves open the vault
//   3 block picture: Luna counts the blocks, Sol dials in the numbers
//   4 jack-in-the-box: the wind-up key powers a lift; take turns riding it
//   5 timed race: one pounds a far button, the other runs the course
//   6 seesaw: up onto the treasure, then slide out steps for your partner

import { LevelBuilder } from '../build.js';
import { PHYS } from '../constants.js';

const SOL_RED = '#ff6b4a';
const LUNA_BLUE = '#4f86ff';

export function toyVault(index) {
  const b = new LevelBuilder({ mode: 'puzzle', index, seed: 'toy-vault', name: 'Toy Vault', label: 'Room 1', theme: 'workshop', sky: 'day' });
  const r = b.rng;
  const H = 12; // walls too tall to climb, even standing on your partner
  const wall = { color: '#d9c3a5', t: 0.5 };
  const door = { ...wall, lintel: 5 };
  // A tall wall standing on the ground under the raised rooms.
  const tallX = (x0, x1, z, top = 18) => b.box((x0 + x1) / 2, top / 2, z, Math.abs(x1 - x0), top, 0.5, wall);
  const tallZ = (z0, z1, x, top = 18) => b.box(x, top / 2, (z0 + z1) / 2, 0.5, top, Math.abs(z1 - z0), wall);

  // -- 0 · Entrance: two plates at once --------------------------------------------
  b.floor(0, 0, 7, 16, 14, { mat: 'wood' });
  b.wallX(-8, 8, 0, H, wall);
  b.wallZ(0, 14, -8, H, wall);
  b.wallZ(0, 14, 8, H, wall);
  b.checkpoint(0, 0, 4, 6, { hint: 'Welcome to the Toy Vault! Stand on both plates at the same time to open the big door.' });
  b.sign(0, 3.6, 8.5, 'Welcome to the Toy Vault!\nHold both plates at once', { style: 'prank', w: 4.4 });
  const p0a = b.plate(-4.5, 0, 10.5);
  const p0b = b.plate(4.5, 0, 10.5);
  b.wire(p0a, [[-4.5, 0, 10.5], [-4.5, 0, 13.2], [-1.2, 0, 13.2]]);
  b.wire(p0b, [[4.5, 0, 10.5], [4.5, 0, 13.2], [1.2, 0, 13.2]]);
  b.wallGapsX(-10, 10, 14, H, [[0, 4]], door);
  const door0 = b.door(0, 14, 4, 5, { op: 'all', in: [p0a, p0b] }, { latch: true, color: '#ffb59e' });
  b.acts[b.acts.length - 1].toast = 'The big door is open!';
  b.gem(6.2, 1.2, 2);
  b.mark('p0a', -4.5, 0, 10.5);
  b.mark('p0b', 4.5, 0, 10.5);

  // -- 1 · The toy train: plates drive it across the gap ---------------------------------
  b.floor(0, 0, 17, 20, 6, { mat: 'wood' });
  b.floor(0, 0, 40, 20, 8, { mat: 'wood' });
  b.wallZ(14, 44, -10, H, wall);
  b.wallZ(14, 44, 10, H, wall);
  b.checkpoint(1.5, 0, 16.6, 4, { hint: 'Toy train: while someone stands on a plate, it drives across. One holds the plate, the other rides!' });
  b.sign(5.5, 3.6, 19, 'Toy Train\nHold a plate and it rolls across', { style: 'prank', w: 4 });
  const trainA = b.plate(-6.5, 0, 17.4);
  const trainB = b.plate(6.5, 0, 40.5);
  const trainZ = 22.3, run = 11.4;
  b.act('carrier', { op: 'any', in: [trainA, trainB] }, false, [
    { x: 0, y: -0.3, z: trainZ, sx: 4.2, sy: 0.6, sz: 4.2, move: [0, 0, run] },
    { x: 1.55, y: 0.45, z: trainZ + 1.55, sx: 0.7, sy: 0.9, sz: 0.7, move: [0, 0, run] },
  ], { speed: 3.6, mat: 'toy', color: '#ff5d5d', lamp: [-2.6, 0.6, 19.4] });
  b.wire(trainA, [[-6.5, 0, 17.4], [-6.5, 0, 19.6], [-2.4, 0, 19.6]]);
  b.gem(0, 2.4, 28);
  const sw1 = b.pswitch(-6, 0, 40.5, true);
  b.sign(-6, 2.9, 42.2, 'Pound the button (C)\nto open the next door', { style: 'prank' });
  b.mark('trainA', -6.5, 0, 17.4);
  b.mark('trainB', 6.5, 0, 40.5);
  b.mark('trainNear', 0, 0, trainZ);
  b.mark('trainFar', 0, 0, trainZ + run);

  // -- 2 · Split wings ----------------------------------------------------------------------
  const Z2 = 44;
  b.floor(0, 0, Z2 + 7, 16, 14, { mat: 'wood' }); // hall
  b.floor(-17, 0, Z2 + 7, 18, 14, { color: '#ffd6c8' }); // Sol's wing
  b.floor(17, 0, Z2 + 7, 18, 14, { color: '#cfe0ff' }); // Luna's wing
  b.floor(-20, 0, Z2 + 20, 12, 12, { color: '#ffd6c8' });
  b.floor(20, 0, Z2 + 20, 12, 12, { color: '#cfe0ff' });
  b.wallGapsX(-26, 26, Z2, H, [[0, 4]], door);
  const door1 = b.door(0, Z2, 4, 5, { op: 'all', in: [sw1] }, { latch: true, color: '#ffd166' });
  b.wallGapsZ(Z2, Z2 + 14, -8, H, [[Z2 + 7, 3]], wall);
  b.wallGapsZ(Z2, Z2 + 14, 8, H, [[Z2 + 7, 3]], wall);
  b.wallZ(Z2, Z2 + 26, -26, H, wall);
  b.wallZ(Z2, Z2 + 26, 26, H, wall);
  b.wallGapsX(-26, -8, Z2 + 14, H, [[-20, 3]], door);
  b.wallGapsX(8, 26, Z2 + 14, H, [[20, 3]], door);
  b.wallX(-26, -14, Z2 + 26, H, wall);
  b.wallX(14, 26, Z2 + 26, H, wall);
  b.wallZ(Z2 + 14, Z2 + 26, -14, H, wall);
  b.wallZ(Z2 + 14, Z2 + 26, 14, H, wall);
  b.checkpoint(0, 0, Z2 + 3.5, 5, { hint: 'Split up! Sol takes the red barrier (west), Luna the blue one (east). Keep talking!' });
  b.sign(0, 3.8, Z2 + 8, 'Two halves make one key\nSol: west   ·   Luna: east', { style: 'prank', w: 4.2 });
  b.fieldZ(-8, H / 2, Z2 + 7, 3, H, 1);
  b.fieldZ(8, H / 2, Z2 + 7, 3, H, -1);
  b.sign(-8, 4.4, Z2 + 7, 'Sol only', { style: 'prank', w: 2.4 });
  b.sign(8, 4.4, Z2 + 7, 'Luna only', { style: 'prank', w: 2.4 });
  b.gem(-6.5, 1.2, Z2 + 1.5);

  // Luna's wing: the plate that opens Sol's room, and the color buttons.
  const lunaPlate = b.plate(11.5, 0, Z2 + 3.5);
  b.sign(11.5, 3.0, Z2 + 3.5, "Hold this plate to\nopen Sol's room", { style: 'prank' });
  const palette = [['green', '#3fc46b'], ['red', '#ff4d4d'], ['yellow', '#ffd23f'], ['blue', '#3f7dff']];
  const order = r.shuffle(palette.slice());
  const layout = r.shuffle(palette.slice());
  const ids = {};
  layout.forEach(([name, color], i) => {
    ids[name] = b.pswitch(12 + i * 3.6, 0, Z2 + 9.5, false, 0.6, color);
  });
  const code = b.seq(order.map(([name]) => ids[name]));
  b.sign(17.4, 4.2, Z2 + 12.5, "Pound the buttons in order\nThe order is on Sol's wall", { style: 'prank' });
  const cage = b.door(20, Z2 + 14, 3, 5, { op: 'all', in: [code] }, { latch: true, color: '#8fb4ff' });
  const blueHalf = b.item('half', 20, 1.0, Z2 + 21, { who: 1, color: LUNA_BLUE, label: 'Blue key half' });
  b.gem(23.5, 1.2, Z2 + 24);

  // Sol's wing: the code on the wall, and a high shelf.
  b.sign(-17.5, 6.6, Z2 + 0.4, 'Color order', { fixed: true, yaw: 0, style: 'prank', w: 4.4 });
  order.forEach(([, color], i) => {
    const x = -23 + i * 3;
    b.box(x, 2.2, Z2 + 1.1, 1.6, 1.6, 1.6, { color });
    b.sign(x, 4.3, Z2 + 0.4, String(i + 1), { fixed: true, yaw: 0, style: 'prank', w: 1.2 });
  });
  const solExit = b.pswitch(-16.5, 0, Z2 + 17, true);
  b.door(-20, Z2 + 14, 3, 5, { op: 'any', in: [lunaPlate, solExit] }, { latch: false, color: '#ffb59e' });
  b.sign(-16.5, 2.8, Z2 + 17, 'Pound the button inside\nto keep the door open', { style: 'prank' });
  b.box(-22, 3.5, Z2 + 23.5, 6, 7, 5, { color: '#ffb59e' });
  b.pad(-22, 0.08, Z2 + 18.5, [0, 1, 0], 1, { launch: [0, PHYS.repelSpeed, 0] });
  b.sign(-22, 3.2, Z2 + 17, 'Sol: stand on the red pad\nand hold E', { style: 'prank' });
  const redHalf = b.item('half', -22, 7.6, Z2 + 23.5, { who: 0, color: SOL_RED, label: 'Red key half' });
  b.gem(-24.5, 1.2, Z2 + 16.5);

  // The vault lock in the hall.
  const lock = b.lock(0, 0, Z2 + 11, [blueHalf, redHalf], { label: 'Vault lock' });
  b.wallGapsX(-8, 8, Z2 + 14, H, [[0, 4]], door);
  const vaultDoor = b.door(0, Z2 + 14, 4, 5, { op: 'all', in: [lock] }, { latch: true, color: '#c9a35a', speed: 6 });
  b.acts[b.acts.length - 1].toast = 'The vault door is open! More tricks inside...';
  b.mark('lunaPlate', 11.5, 0, Z2 + 3.5);
  b.mark('solPad', -22, 0, Z2 + 18.5);
  b.mark('solExit', -16.5, 0, Z2 + 17);

  // -- 3 · Block picture: Luna counts, Sol dials -------------------------------------------
  const Z3 = Z2 + 14; // 58
  b.floor(0, 0, Z3 + 11, 16, 22, { color: '#fff1d6' });
  b.wallZ(Z3, Z3 + 22, -8, H, wall);
  b.wallZ(Z3, Z3 + 22, 8, H, wall);
  b.wallZ(Z3 + 6, Z3 + 22, 0, H, wall);
  b.checkpoint(0, 0, Z3 + 3, 4, { hint: 'Luna counts the blocks in the block picture, Sol turns the number lock. Only Luna can see the numbers!' });
  b.field(-4, H / 2, Z3 + 6, 8, H, 0.3, 1);
  b.field(4, H / 2, Z3 + 6, 8, H, 0.3, -1);
  b.sign(-4, 4.0, Z3 + 6, 'Sol: number lock', { style: 'prank', w: 2.6 });
  b.sign(4, 4.0, Z3 + 6, 'Luna: block picture', { style: 'prank', w: 2.6 });

  // Luna's side: a picture made of toy blocks. Count the red, blue and yellow ones.
  const counts = [r.int(1, 6), r.int(1, 6), r.int(1, 6)];
  const tints = ['#e8202a', '#1f4fe0', '#ffc400'];
  b.box(4, 0.2, Z3 + 18, 7, 0.4, 6, { color: '#ffffff' });
  b.sign(4, 4.6, Z3 + 21.7, 'Block Picture', { fixed: true, yaw: Math.PI, style: 'prank', w: 2.4 });
  b.sign(0.3, 3.2, Z3 + 11, 'This picture hides the code:\ncount the red, blue, yellow\nblocks and tell Sol', { fixed: true, yaw: Math.PI / 2, style: 'prank', w: 3.6 });
  const cells = [];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) cells.push([1.25 + i * 1.1, Z3 + 15.9 + j * 1.3]);
  const spots = r.shuffle(cells);
  let k = 0;
  counts.forEach((n, c) => {
    for (let i = 0; i < n; i++) {
      const [x, z] = spots[k++];
      b.box(x, 0.8, z, 0.8, 0.8, 0.8, { color: tints[c] });
    }
  });
  for (let i = 0; i < 3; i++) {
    const [x, z] = spots[k++];
    b.box(x, 0.8, z, 0.8, 0.8, 0.8, { color: '#2fa84f' }); // green ones don't count
  }
  b.gem(7, 1.2, Z3 + 9);

  // Sol's side: three number wheels.
  const wheels = [-6.3, -4, -1.7].map((x) => b.dial(x, 0, Z3 + 15));
  ['Red', 'Blue', 'Yellow'].forEach((t, i) => b.sign([-6.3, -4, -1.7][i], 3.3, Z3 + 15, t, { style: 'prank', w: 0.9 }));
  const picture = b.combo(wheels, counts);
  b.sign(-0.3, 3.2, Z3 + 11, 'Lock: red · blue · yellow\nPound a wheel (C) to turn it\nHow many of each? Ask Luna!', { fixed: true, yaw: -Math.PI / 2, style: 'prank', w: 3.6 });
  b.box(-4, 0.6, Z3 + 21.1, 2, 1.2, 1.2, { color: '#c9a35a' }); // toy box
  const windKey = b.item('key', -4, 1.35, Z3 + 21.1, { color: '#ffd166', label: 'Wind-up key', when: picture });
  b.light(-4, 2.2, Z3 + 21.1, { color: '#ffe9a8', intensity: 4, dist: 4, fixture: 'none', when: picture });
  b.wallGapsX(-8, 8, Z3 + 22, H, [[-4, 3], [4, 3]], door);
  b.door(-4, Z3 + 22, 3, 5, { op: 'all', in: [picture] }, { latch: true, color: '#ffb59e' });
  b.door(4, Z3 + 22, 3, 5, { op: 'all', in: [picture] }, { latch: true, color: '#8fb4ff' });
  b.acts[b.acts.length - 1].quiet = true;
  wheels.forEach((id, i) => b.mark(`wheel${i}`, [-6.3, -4, -1.7][i], 0, Z3 + 15));

  // -- 4 · Jack-in-the-box: the wind-up key powers a lift ---------------------------------
  const Z4 = Z3 + 22; // 80
  b.floor(0, 0, Z4 + 12, 20, 24, { color: '#ffe0f0' });
  b.wallX(-10, -8, Z4, H, wall);
  b.wallX(8, 10, Z4, H, wall);
  tallZ(Z4, Z4 + 24, -10);
  tallZ(Z4, Z4 + 18, 10);
  b.checkpoint(4.5, 0, Z4 + 3.5, 4, { hint: 'Put the wind-up key in the jack-in-the-box. Then one holds the plate while the other rides the spring lift up.' });
  // The ledge everyone has to get up to.
  b.box(0, 3, Z4 + 21, 20, 6, 6, { color: '#ff8fab' });
  // The box: a fenced corner with the lift inside, opened by the key.
  b.wallX(-10, -2, Z4 + 6, 5, { color: '#ffd166', t: 0.4 });
  b.wallGapsZ(Z4 + 6, Z4 + 18, -2, 5, [[Z4 + 12, 3]], { color: '#ffd166', t: 0.4 });
  const jack = b.lock(1, 0, Z4 + 12, [windKey], { label: 'Jack-in-the-box' });
  b.door(-2, Z4 + 12, 3, 4.6, { op: 'all', in: [jack] }, { axis: 'z', latch: true, color: '#ff5d8f' });
  b.acts[b.acts.length - 1].toast = 'The jack-in-the-box pops open!';
  b.sign(1, 3.4, Z4 + 14.2, 'Jack-in-the-box\nWind it up with the key!', { style: 'prank', w: 3.6 });
  const liftLow = b.plate(-6, 0, Z4 + 9);
  const liftTop = b.plate(-6, 6, Z4 + 21.5);
  const lift = b.act('lift', { op: 'any', in: [liftLow, liftTop] }, false, [
    { x: -6, y: -0.08, z: Z4 + 16.3, sx: 3.4, sy: 0.4, sz: 3.4, move: [0, 5.88, 0] },
  ], { speed: 4.5, mat: 'toy', color: '#ffd166', lamp: [-3.6, 5.4, Z4 + 18.2] });
  b.sign(-6, 2.6, Z4 + 9, 'Hold the plate:\nthe lift goes up', { style: 'prank' });
  b.sign(-6, 8.6, Z4 + 21.5, 'Another plate up here:\nhold it to call the lift up', { style: 'prank' });
  b.bouncer(6, 0, Z4 + 12, 1.2);
  b.gem(6, 6.2, Z4 + 12);
  b.mark('liftLow', -6, 0, Z4 + 9);
  b.mark('liftTop', -6, 6, Z4 + 21.5);
  b.mark('lift', -6, 0, Z4 + 16.3);

  // -- 5 · Timed race on the ledge ----------------------------------------------------------
  const Z5 = Z4 + 24; // 104: the course starts at the ledge's edge
  const top = 6;
  b.checkpoint(3, top, Z4 + 21, 4, { hint: 'One runs out to the far timer button, the other dashes through while the door is open, then pounds the button inside to keep it open!' });
  b.sign(-9.7, top + 3.2, Z4 + 21, 'One pounds the far timer,\nthe other dashes through!', { fixed: true, yaw: Math.PI / 2, style: 'prank', w: 4.4 });
  // A long spur out to the timed button, so nobody can press it and make the run alone.
  b.floor(25, top, Z4 + 21, 30, 2, { color: '#ffd166' });
  b.floor(42, top, Z4 + 21, 4, 4, { color: '#ffd166' });
  tallX(10, 44, Z4 + 18);
  tallX(10, 44, Z4 + 24);
  tallZ(Z4 + 18, Z4 + 24, 44);
  const course = [[Z5, Z5 + 3.9], [Z5 + 6.1, Z5 + 9.9], [Z5 + 12.1, Z5 + 16]];
  for (const [z0, z1] of course) b.floor(0, top, (z0 + z1) / 2, 3.4, z1 - z0, { color: '#8fd3ff' });
  const S1 = b.pswitch(42, top, Z4 + 21, false, 5);
  const wz = Z5 + 16;
  tallZ(Z5, wz + 12, -10);
  tallZ(Z5, wz, 10);
  // The door wall (above the void, so it reaches down to the ground).
  b.box(-5.85, 9, wz, 8.3, 18, 1, wall);
  b.box(5.85, 9, wz, 8.3, 18, 1, wall);
  b.box(0, top + 4.6 + (18 - top - 4.6) / 2, wz, 3.4, 18 - top - 4.6, 1, wall);
  b.floor(0, top, wz + 6, 20, 12, { color: '#fff1d6' });
  tallZ(wz, wz + 12, 10);
  const S2 = b.pswitch(3, top, wz + 4.5, true);
  b.act('door', { op: 'any', in: [S1, S2] }, false, [
    { x: 0, y: top + 2.3, z: wz, sx: 3.3, sy: 4.6, sz: 0.6, move: [0, -4.9, 0] },
  ], { speed: 18, lamp: [0, top + 5.1, wz - 0.55] });
  b.sign(3, top + 2.8, wz + 4.5, 'Pound this button\nto keep the door open', { style: 'prank' });
  b.gem(0, top + 2.4, Z5 + 5);
  b.mark('S1', 42, top, Z4 + 21);
  b.mark('S2', 3, top, wz + 4.5);
  course.forEach(([z0, z1], i) => b.mark(`course${i}`, 0, top, (z0 + z1) / 2));

  // -- 6 · Seesaw up to the treasure ------------------------------------------------------------
  const Z6 = wz + 12; // 132
  b.floor(0, top, Z6 + 7, 20, 14, { color: '#ffe0f0' });
  tallZ(Z6, Z6 + 26, -10, 26);
  tallZ(Z6, Z6 + 26, 10, 26);
  tallX(-10, 10, Z6 + 26, 26);
  b.checkpoint(0, top, Z6 + 2.5, 5, { hint: 'The treasure is on top of the toy pile! One stands on one end of the seesaw, the other pounds (C) the other end!' });
  b.sign(0, top + 3.2, Z6 + 13.7, 'One stands on one end,\nthe other pounds (C) the other!', { fixed: true, yaw: Math.PI, style: 'prank', w: 5 });
  const H2 = 9.6;
  b.seesaw(0, top + 1.0, Z6 + 9, 9.2, 2.4);
  b.box(0, top + H2 / 2 - 0.5, Z6 + 19, 14, H2 + 1, 10, { color: '#e8a45a' });
  const parts = [];
  for (let i = 0; i < 5; i++) {
    const t = (H2 * (i + 1)) / 6;
    parts.push({ x: -5.5 + i * 2.3, y: top + t - 0.4, z: Z6 + 15.6, sx: 2.2, sy: 0.8, sz: 2, move: [0, 0, -2.6], delay: i * 0.15 });
  }
  const sw6 = b.pswitch(-4.5, top + H2, Z6 + 17.5, true);
  const steps = b.act('steps', { op: 'all', in: [sw6] }, true, parts, { speed: 3, mat: 'toy', color: '#ffd166', lamp: [-4.5, top + H2 + 0.3, Z6 + 14.4] });
  b.sign(-4.5, top + H2 + 2.6, Z6 + 17.5, 'Pound this button\nto slide out steps', { style: 'prank' });
  b.gem(3.4, top + 11.8, Z6 + 11);
  b.goal(2.5, top + H2, Z6 + 20.5);

  b.objectives = [
    { text: 'Stand on both plates at once to open the big door', done: { act: door0 } },
    { text: 'Cross on the toy train: one holds the plate, the other rides, then swap', done: { act: door1 } },
    { text: "Sol: get the red key half (Luna's plate opens your room)", done: { item: redHalf } },
    { text: "Luna: pound the colors in the order on Sol's wall to get the blue key half", done: { item: blueHalf } },
    { text: 'Put both key halves in the vault lock', done: { act: vaultDoor } },
    { text: 'Luna counts the blocks, Sol turns the lock: get the wind-up key', done: { item: windKey } },
    { text: 'Wind up the jack-in-the-box, then take turns riding the lift', done: { cp: 5 } },
    { text: 'One pounds the far timer, the other dashes through the door', done: { sig: S2 } },
    { text: 'Seesaw one of you onto the treasure pile, then slide out steps for the other', done: { act: steps } },
    { text: 'Both of you step into the goal!', done: {} },
  ];
  void cage; void lift;
  return b.finish();
}
