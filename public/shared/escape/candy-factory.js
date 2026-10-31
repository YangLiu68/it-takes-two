// Puzzle 4 · Candy Factory: fix the production line to ship a batch
// of rainbow candy. Clock in together, sort the candies down the conveyor
// lanes, mix the syrup from a recipe only one of you can read, catapult up for
// the giant gumball, raft across the chocolate river, ride the hot-air fan,
// light up the packing machine, race the timed gate, and punch in the batch
// number you collected along the way.

import { LevelBuilder } from '../build.js';

const SOL_RED = '#ff6b4a';
const LUNA_BLUE = '#4f86ff';
const WALL = { color: '#ffd6ea', t: 0.5 };
const H = 9; // walls too tall to climb, even standing on your partner

export function candyFactory(index) {
  const b = new LevelBuilder({ mode: 'puzzle', index, seed: 'candy-factory', name: 'Candy Factory', label: `Room ${index + 1}`, theme: 'candy', sky: 'day' });
  const r = b.rng;
  const sign = (x, y, z, text, o = {}) => b.sign(x, y, z, text, { style: 'prank', ...o });
  // Batch number: one digit is printed somewhere in three of the workshops.
  const batch = [r.int(1, 9), r.int(0, 9), r.int(0, 9)];

  // -- 0. Lobby: clock in together ------------------------------------------------------
  b.floor(0, 0, 9, 20, 18, { mat: 'wood' });
  b.wallX(-10, 10, 0, H, WALL);
  b.wallZ(0, 18, -10, H, WALL);
  b.wallZ(0, 18, 10, H, WALL);
  b.wallGapsX(-10, 10, 18, H, [[0, 4]], { ...WALL, lintel: 5 });
  b.checkpoint(0, 0, 4, 8, { hint: "The candy factory's line has stopped! Fix it together and make a batch of rainbow candy. First clock in: hold both time-clock plates at once." });
  sign(0, 3.6, 7, 'Welcome to the Candy Factory!\nClock in: both of you hold\na time-clock plate at once');
  sign(-5, 3.2, 1.2, 'Shipping needs a batch number:\nwatch the workshop walls!', { w: 4.6 });
  const clockA = b.plate(-6, 0, 12);
  b.box(6, 1.6, 13, 4, 3.2, 4, { color: '#a98bff' });
  const clockB = b.plate(6, 3.2, 13);
  b.bouncer(6, 0.7, 8.6, 1.1);
  sign(6, 6.4, 13, 'Jump on the bounce drum\nto reach the high plate', { w: 3.6 });
  b.wire(clockA, [[-6, 0, 12], [-6, 0, 16.5], [-1.6, 0, 16.5]]);
  const door0 = b.door(0, 18, 4, 5, { op: 'all', in: [clockA, clockB] }, { latch: true, color: '#ff7eb6' });
  b.acts[b.acts.length - 1].toast = 'Clocked in! The workshop door opens.';
  b.gem(-6, 1.2, 4);
  b.mark('clockA', -6, 0, 12);
  b.mark('drum', 6, 0, 8.6);
  b.mark('clockB', 6, 3.2, 13);

  // -- 1. Sorting room: split lanes of conveyor belts -------------------------------------
  b.floor(0, 0, 20, 20, 4, { mat: 'wood' });
  b.wallZ(18, 56, -10, H, WALL);
  b.wallZ(18, 56, 10, H, WALL);
  b.wallZ(22, 48, 0, H, WALL);
  b.field(-5, H / 2, 22, 10, H, 0.3, 1);
  b.field(5, H / 2, 22, 10, H, 0.3, -1);
  b.checkpoint(0, 0, 20, 4, { hint: 'Sorting room: Sol takes the red lane, Luna the blue lane. The belts push you sideways — jump across and grab the candy in your color.' });
  sign(-5, 4.4, 21.6, 'Sol only', { w: 3 });
  sign(5, 4.4, 21.6, 'Luna only', { w: 3 });
  for (const side of [-1, 1]) {
    const x = side * 5;
    b.floor(x, 0, 23.5, 10, 3, { mat: 'wood' });
    // Each lane's belts push a different way.
    b.conveyor(x, 0, 28.5, 4, 5, 3, [side, 0]);
    b.conveyor(x, 0.8, 35, 4, 5, 3.4, [0, -1]);
    b.conveyor(x, 1.6, 41.5, 4, 5, 3, [-side, 0]);
    b.floor(x, 1.6, 46.75, 10, 2.5, { mat: 'wood' });
  }
  sign(-5, 3.4, 26, 'The belts push you around!', { w: 3.2 });
  const redCandy = b.item('candy', -5, 2.7, 46.75, { who: 0, color: SOL_RED, label: 'Strawberry candy' });
  const blueCandy = b.item('candy', 5, 2.7, 46.75, { who: 1, color: LUNA_BLUE, label: 'Blueberry candy' });
  b.gem(5, 3.6, 35);
  b.floor(0, 0, 52, 20, 8, { mat: 'wood' });
  const pot = b.lock(0, 0, 52.5, [redCandy, blueCandy], { label: 'Candy pot' });
  sign(0, 3.4, 50.4, 'Candy pot: add the strawberry\nand blueberry candies', { w: 4 });
  b.wallGapsX(-10, 10, 56, H, [[0, 4]], { ...WALL, lintel: 5 });
  const door1 = b.door(0, 56, 4, 5, { op: 'all', in: [pot] }, { latch: true, color: '#7ee0ff' });
  b.acts[b.acts.length - 1].toast = 'The candy pot bubbles away... the next workshop opens!';
  b.sign(-9.7, 3.2, 52, `Batch number\n1st digit: ${batch[0]}`, { fixed: true, yaw: Math.PI / 2, style: 'prank', w: 2.6 });

  // -- 2. Recipe room: one reads, one mixes --------------------------------------------------
  b.floor(0, 0, 58, 20, 4, { mat: 'wood' });
  b.wallZ(56, 82, -10, H, WALL);
  b.wallZ(56, 82, 10, H, WALL);
  b.wallZ(60, 82, 0, H, WALL);
  b.field(-5, H / 2, 60, 10, H, 0.3, 1);
  b.field(5, H / 2, 60, 10, H, 0.3, -1);
  b.checkpoint(0, 0, 58, 4, { hint: "Recipe room: the recipe hangs in Sol's room, the syrup machine is in Luna's. Sol reads the recipe out, Luna turns the dials. Read every word of the recipe carefully!" });
  b.floor(-5, 0, 71, 10, 22, { color: '#ffe0f0' });
  b.floor(5, 0, 71, 10, 22, { color: '#d6f0ff' });
  const one = [r.int(1, 4), r.int(1, 4), r.int(1, 4)];
  b.sign(-9.7, 3.4, 71, `Rainbow Syrup (1 serving)\nScoops of strawberry: ${one[0]}\nScoops of lemon: ${one[1]}\nScoops of mint: ${one[2]}\n\n★ Today's order: 2 servings!`, { fixed: true, yaw: Math.PI / 2, style: 'paper', w: 4.6 });
  for (const [x, z] of [[-6, 64], [-3, 77]]) b.box(x, 0.6, z, 1.2, 1.2, 1.2, { color: '#ffb27a' });
  const flavors = [['Strawberry', '#ff7eb6'], ['Lemon', '#fff07a'], ['Mint', '#7affc4']];
  const syrup = flavors.map(([name, color], i) => {
    const x = 2.5 + i * 2.5;
    const id = b.dial(x, 0, 72, { color, h: 1.8 });
    sign(x, 3.4, 72, name, { w: 1.4 });
    return id;
  });
  sign(5, 4.9, 74, 'Syrup machine\nPound a dial (C) to turn it\nThe recipe is next door', { w: 4.2 });
  const recipe = b.combo(syrup, one.map((n) => n * 2));
  b.wallGapsX(-10, 10, 82, H, [[-5, 3], [5, 3]], { ...WALL, lintel: 5 });
  const door2 = b.act('door', { op: 'all', in: [recipe] }, true, [-5, 5].map((x) => ({ x, y: 2.5, z: 82, sx: 2.9, sy: 5, sz: 0.5, move: [0, -5.3, 0] })), { speed: 8, color: '#a98bff', lamp: [0, 5.4, 82] });
  b.acts[b.acts.length - 1].toast = 'Syrup mixed! Both doors open.';
  for (let i = 0; i < 3; i++) b.mark(`syrup${i}`, 2.5 + i * 2.5, 0, 72);

  // -- 3. Gumball tower: seesaw up, cookie bridge, bring it down ----------------------------------
  const HH = 16;
  b.floor(0, 0, 91, 20, 18, { mat: 'wood' });
  b.wallZ(82, 124, -10, HH, WALL);
  b.wallZ(82, 124, 10, HH, WALL);
  b.checkpoint(5, 0, 86, 5, { hint: "The giant gumball is up on the high ledge! One stands on one end of the seesaw, the other pounds (C) the other end to fling them up. The cookie bridge up there crumbles — don't stop!" });
  b.seesaw(-4.5, 1.0, 95, 9.2, 2.4);
  sign(-4.5, 4.2, 92, 'One stands on one end,\nthe other pounds (C) the other!', { w: 4 });
  const T2 = 9.6;
  b.plat(-4.5, T2, 102, 11, 4, T2 + 1, { color: '#ff9ccf' });
  b.crumble(-4.5, T2, 105.3, 3.2, 2.6);
  b.crumble(-4.5, T2, 107.9, 3.2, 2.6);
  b.plat(-4.5, T2, 110.6, 11, 2.8, T2 + 1, { color: '#ff9ccf' });
  b.wallZ(100, 124, 1, HH, WALL);
  b.wallX(-10, 1, 112, HH, WALL);
  const gumball = b.item('candy', -4.5, T2 + 1.1, 110.6, { color: '#ff5fa2', label: 'Giant gumball' });
  // Only whoever is up here can read these (the tower's edge hides them from below).
  b.sign(-1.6, T2 + 1.4, 111.75, `Batch number\n2nd digit: ${batch[1]}`, { fixed: true, yaw: Math.PI, style: 'prank', w: 2.4 });
  const tastes = [['Pink', '#ff7eb6'], ['Yellow', '#fff07a'], ['Blue', '#7ee0ff'], ['Green', '#7affc4']];
  const tasteOrder = r.shuffle(tastes.slice());
  b.sign(-7.2, T2 + 1.4, 111.75, `Gumball flavor order:\n${tasteOrder.map(([n]) => n).join(' → ')}`, { fixed: true, yaw: Math.PI, style: 'paper', w: 3.4 });
  sign(-4.5, T2 + 3, 102, 'The cookie bridge crumbles. Run!', { w: 3.6 });
  b.gem(-8, T2 + 1.2, 101);
  b.floor(5.5, 0, 112, 9, 24, { mat: 'wood' });
  const gumMachine = b.lock(8, 0, 88, [gumball], { label: 'Gumball machine' });
  sign(8, 3.4, 86.6, 'Gumball machine: put in the\ngiant gumball, then pound\nthe 4 flavors in order', { w: 4.2 });
  const tasteBtn = {};
  r.shuffle(tastes.slice()).forEach(([n, color], i) => {
    const x = 2.8 + i * 2.1;
    tasteBtn[n] = b.pswitch(x, 0, 97.6, false, 0.6, color);
    sign(x, 2.2, 97.6, n, { w: 0.9 });
  });
  const flavour = b.seq(tasteOrder.map(([n]) => tasteBtn[n]));
  sign(5.5, 4.6, 98.8, 'The flavor order is up top:\nask whoever is up there!', { w: 4 });
  b.wallGapsX(1, 10, 100, HH, [[5.5, 4]], { ...WALL, lintel: 5 });
  const door3 = b.door(5.5, 100, 4, 5, { op: 'all', in: [gumMachine, flavour] }, { latch: true, color: '#fff07a' });
  b.acts[b.acts.length - 1].toast = 'The gumball machine whirs to life!';
  b.mark('seesaw', -4.5, 1, 95);

  // -- 4. Chocolate river: the raft and the hot-air fan ----------------------------------------------
  b.wallX(-10, 1, 124, H, WALL);
  b.floor(0, 0, 128, 20, 8, { mat: 'wood' });
  b.wallZ(124, 156, -10, H, WALL);
  b.wallZ(124, 156, 10, H, WALL);
  b.checkpoint(2, 0, 127, 4, { hint: 'Chocolate river! Hold a plate and the boat sails. One holds the plate, the other rides — then the one across holds the far plate.' });
  b.box(0, -3.5, 140, 20, 1, 16, { color: '#6b3a22' });
  b.zone('kill', 0, -2.4, 140, 20, 1.2, 16);
  const rideA = b.plate(-5, 0, 128);
  const rideB = b.plate(7.5, 0, 150);
  b.act('carrier', { op: 'any', in: [rideA, rideB] }, false, [
    { x: 0, y: -0.3, z: 134.3, sx: 4.2, sy: 0.6, sz: 4.2, move: [0, 0, 11.4] },
  ], { speed: 3.6, mat: 'wood', color: '#c98d55', lamp: [0, 0.6, 131.6] });
  b.wire(rideA, [[-5, 0, 128], [-5, 0, 131.3], [-1.6, 0, 131.3]]);
  sign(-5, 3.0, 128, 'Hold the plate:\nthe chocolate boat sails over', { w: 3.2 });
  sign(7.5, 3.0, 150, 'Hold the plate:\nthe boat sails back', { w: 3.2 });
  b.gem(0, 2.6, 140);
  b.floor(0, 0, 152, 20, 8, { mat: 'wood' });
  b.checkpoint(0, 0, 151.5, 4, { hint: 'Hot-air fan: hold the plate to power the fan and blow your partner up. Then they hold the plate up top to blow you up too.' });
  const T4 = 12;
  b.plat(0, T4, 173, 20, 34, T4 + 1, { color: '#ffd6ea' }); // the upper floor: z 156..190
  b.plat(-5, 0.25, 154.3, 3.4, 3.4, 1.2, { mat: 'metal' });
  const fanA = b.plate(4.5, 0, 153.5);
  const fanB = b.plate(-5, T4, 158.8);
  b.fan(-5, 0.25, 154.3, 1.5, T4 + 1, 58, { op: 'any', in: [fanA, fanB] });
  b.wire(fanA, [[4.5, 0, 153.5], [4.5, 0, 155.3], [-3.3, 0, 155.3]]);
  sign(4.5, 3.0, 153.5, 'Hold the plate to\npower the hot-air fan', { w: 3 });
  sign(-5, T4 + 3, 158.8, 'Hold the plate to power\nthe hot-air fan below', { w: 3.4 });
  b.sign(5, 6, 155.75, `Batch number\n3rd digit: ${batch[2]}`, { fixed: true, yaw: Math.PI, style: 'prank', w: 2.6 });
  b.mark('fan', -5, 0.25, 154.3);

  // -- 5. Packing machine: lights out ---------------------------------------------------------------
  const W5 = { ...WALL, y: T4 };
  b.wallZ(156, 190, -10, H, W5);
  b.wallZ(156, 190, 10, H, W5);
  b.checkpoint(0, T4, 166, 8, { hint: 'Packing machine: light all six lamps. Pounding a button flips it and the lamps right next to it (front, back, left, right). Work it out together!' });
  const grid = [];
  for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) grid.push([-4 + col * 4, 176 + row * 5]);
  // Light pattern: start from "all on" and undo a few presses, so it is always solvable.
  const nb = (i) => grid.map((_, j) => j).filter((j) => j !== i && Math.abs(grid[i][0] - grid[j][0]) + Math.abs(grid[i][1] - grid[j][1]) <= 5.01);
  let flips;
  do {
    const presses = r.shuffle([0, 1, 2, 3, 4, 5]).slice(0, 3);
    flips = grid.map(() => 0);
    for (const p of presses) for (const k of [p, ...nb(p)]) flips[k] ^= 1;
  } while (flips.every((f) => !f));
  const lamps = [];
  grid.forEach(([x, z], i) => lamps.push(b.dial(x, T4, z, { values: ['#3a3550', '#ffe066'], style: 'color', start: 1 ^ flips[i], h: 1.6 })));
  b.dials.forEach((d) => {
    const i = lamps.indexOf(d.id);
    if (i >= 0) d.links = nb(i).map((j) => lamps[j]);
  });
  const lightsOn = b.combo(lamps, lamps.map(() => 1));
  sign(0, T4 + 4.6, 173, 'Packing machine: light all 6!\nPounding a lamp flips it and\nthe lamps right beside it', { w: 6 });
  b.wallGapsX(-10, 10, 190, H, [[0, 4]], { ...W5, lintel: 5 });
  const door5 = b.door(0, 190, 4, 5, { op: 'all', in: [lightsOn] }, { latch: true, y: T4, color: '#7affc4' });
  b.acts[b.acts.length - 1].toast = 'The packing machine lights up! Shipping is just ahead.';
  b.gem(-8, T4 + 1.2, 186);

  // -- 6. Shipping: the timed gate and the batch number ----------------------------------------------
  b.plat(0, T4, 193, 20, 6, 1.4, { mat: 'wood' });
  b.checkpoint(0, T4, 192.5, 4, { hint: 'Shipping gate: one pounds (C) the far timer button, the other dashes through while the gate is open, then pounds the button inside to keep it open.' });
  // A long walkway out to the timer, too far to press it and make the run yourself.
  b.plat(-21, T4, 192, 22, 2, 1.2, { mat: 'wood' });
  b.plat(-34.5, T4, 192, 5, 5, 1.6, { mat: 'wood' });
  b.wallGapsZ(190, 196, -10, H, [[192, 2.2]], W5);
  b.wallZ(190, 196, 10, H, W5);
  b.wallZ(196, 210, -10, H + T4, WALL); // down to the ground: the course runs over a drop
  b.wallZ(196, 210, 10, H + T4, WALL);
  b.wallZ(210, 237, -10, H, W5);
  b.wallZ(210, 237, 10, H, W5);
  b.wallX(-10, 10, 237, H, W5);
  const course = 14, gaps = 2, piece = (course - gaps * 2.2) / (gaps + 1);
  for (let i = 0; i <= gaps; i++) b.plat(0, T4, 196 + i * (piece + 2.2) + piece / 2, 3.4, piece, 1.2, { color: '#7ee0ff' });
  const runTime = (course / 8.5) * 1.25 + 0.5;
  const timer = b.pswitch(-34.5, T4, 192, false, runTime * 0.95 + 1.8);
  sign(-34.5, T4 + 3, 192, 'Timer button: the gate\nonly opens for a moment!', { w: 3.4 });
  const gz = 196 + course;
  b.box(-5.85, T4 + 4, gz, 8.3, 8, 1, { color: '#ffb27a' });
  b.box(5.85, T4 + 4, gz, 8.3, 8, 1, { color: '#ffb27a' });
  b.box(0, T4 + 6.3, gz, 3.4, 3.4, 1, { color: '#ffb27a' });
  b.plat(0, T4, 219.5, 20, 19, 1.4, { mat: 'wood' });
  const keep = b.pswitch(3, T4, gz + 4.5, true);
  b.act('door', { op: 'any', in: [timer, keep] }, false, [
    { x: 0, y: T4 + 2.3, z: gz, sx: 3.3, sy: 4.6, sz: 0.6, move: [0, -4.9, 0] },
  ], { speed: 18, lamp: [0, T4 + 5, gz - 0.55] });
  sign(3, T4 + 3, gz + 4.5, 'Pound this button\nto keep the gate open', { w: 3 });
  const ship = [-3, 0, 3].map((x) => b.dial(x, T4, 222, { color: '#ffe066', h: 1.8 }));
  sign(0, T4 + 4.4, 222, 'Shipping: enter the batch no.\nDigits 1, 2 and 3 are on the\nworkshop walls you passed', { w: 5.4 });
  const shipped = b.combo(ship, batch);
  b.wallGapsX(-10, 10, 229, H, [[0, 4]], { ...W5, lintel: 5 });
  const door6 = b.door(0, 229, 4, 5, { op: 'all', in: [shipped] }, { latch: true, y: T4, color: '#ff7eb6' });
  b.acts[b.acts.length - 1].toast = 'The rainbow candy ships out!';
  b.plat(0, T4, 233, 20, 8, 1.4, { mat: 'wood' });
  b.goal(0, T4, 233.5);
  b.gem(8, T4 + 1.2, 219);
  b.mark('timer', -34.5, T4, 192);
  b.mark('keep', 3, T4, gz + 4.5);
  for (let i = 0; i < 3; i++) b.mark(`ship${i}`, [-3, 0, 3][i], T4, 222);

  b.objectives = [
    { text: 'Clock in: both hold a time-clock plate at once', done: { act: door0 } },
    { text: 'Split up: Sol takes the red lane, Luna the blue; each brings a candy in their color to the candy pot', done: { act: door1 } },
    { text: 'Recipe room: Sol reads the recipe, Luna turns the syrup dials', done: { act: door2 } },
    { text: 'Seesaw your partner up to the ledge and grab the giant gumball', done: { item: gumball } },
    { text: 'Put the gumball in the machine, then pound the flavors in the order written up on the ledge', done: { act: door3 } },
    { text: 'Cross the chocolate river: one holds the plate, the other rides; then swap', done: { cpBoth: 5 } },
    { text: 'Hot-air fan: one powers it to blow the other up; then they power it from the top plate', done: { cpBoth: 6 } },
    { text: 'Packing machine: light all six lamps', done: { act: door5 } },
    { text: 'Shipping gate: one pounds the timer, the other dashes through and pounds the button inside', done: { sig: keep } },
    { text: 'Enter the 3-digit batch number (one digit on each workshop wall)', done: { act: door6 } },
    { text: 'Step into the goal together', done: {} },
  ];
  return b.finish();
}
