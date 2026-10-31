// Puzzle 7 · Space Station: a powered-down station floating in space.
// A timed airlock, a lights-out power board split between both of you, a fan
// shaft you climb by powering each other's fans, an oxygen-tank relay through
// two colored wings, magnet lanes over the void, a star chart only Sol can read
// for a docking code only Luna can enter, and a launch that needs you both.

import { LevelBuilder } from '../build.js';

const SOL_RED = '#ff6b4a';
const LUNA_BLUE = '#4f86ff';
const OFF = '#3a3f52';
const ON = '#5dff8a';

export function spaceStation(index) {
  const b = new LevelBuilder({ mode: 'puzzle', index, seed: 'space-station', name: 'Space Station', label: `Room ${index + 1}`, theme: 'space', sky: 'day' });
  const r = b.rng;
  const H = 10;
  const wall = { color: '#c7c9e6', t: 0.5 };
  const hull = (y = 0) => ({ ...wall, y });

  // -- 0. Docking bay (start) ------------------------------------------------------------
  b.floor(0, 0, 7, 16, 14, { color: '#d8d6f0' });
  b.wallX(-8, 8, 0, H, wall);
  b.wallZ(0, 14, -8, H, wall);
  b.wallGapsZ(0, 14, 8, H, [[7, 2.4]], { ...wall, lintel: 3.2 });
  b.wallGapsX(-8, 8, 14, H, [[0, 3.4]], { ...wall, lintel: 4.6 });
  b.checkpoint(0, 0, 4, 6, { hint: 'Starport 7 has lost power. The airlock opens with a timer switch outside: one of you hits it, the other waits at the door and dashes in!' });
  b.sign(0, 3.6, 9.5, 'Starport 7 · Welcome aboard!\nPower out: restore each module', { style: 'prank', w: 4.6 });
  // The spur out to the airlock's timer, far from the door on purpose.
  b.floor(19, 0, 7, 22, 2, { color: '#b9b4e0' });
  b.floor(32.5, 0, 7, 5, 5, { color: '#d8d6f0' });
  const timer = b.pswitch(32.5, 0, 7, false, 2.6, '#ffb347');
  b.sign(32.5, 3.0, 7, 'Airlock timer\nPound: the door opens briefly', { style: 'prank', w: 3.2 });
  b.sign(5, 3.0, 11.5, 'The timer is down the walkway.\nOne pounds it, one waits by the door!', { style: 'prank', w: 4.2 });
  b.gem(20, 1.4, 7);

  // -- 1. Airlock chamber: across the crumbling floor -----------------------------------------
  const Z1 = 14;
  b.floor(0, 0, Z1 + 2.5, 12, 5, { color: '#d8d6f0' });
  b.crumble(-1.2, 0, Z1 + 7.4, 2, 2);
  b.crumble(1.4, 0, Z1 + 11, 2, 2);
  b.floor(0, 0, Z1 + 16, 12, 4, { color: '#d8d6f0' });
  b.wallZ(Z1, Z1 + 18, -6, H, wall);
  b.wallZ(Z1, Z1 + 18, 6, H, wall);
  const latch = b.pswitch(3, 0, Z1 + 16, true);
  b.door(0, Z1, 3.4, 4.6, { op: 'any', in: [timer, latch] }, { latch: false, speed: 18, color: '#9aa0c8' });
  b.sign(3, 2.8, Z1 + 16, 'Pound here to keep\nthe airlock open', { style: 'prank', w: 2.8 });
  b.gem(0.2, 2.6, Z1 + 9.2);
  b.mark('timer', 32.5, 0, 7);
  b.mark('airDoor', 0, 0, Z1);

  // -- 2. Power room: lights-out on a ring of five modules, split in two ---------------------
  const Z2 = Z1 + 18;
  b.floor(0, 0, Z2 + 11, 20, 22, { color: '#e2e0f4' });
  b.wallZ(Z2, Z2 + 22, -10, H, wall);
  b.wallZ(Z2, Z2 + 22, 10, H, wall);
  b.wallGapsX(-10, 10, Z2, H, [[0, 3.4]], { ...wall, lintel: 4.6 });
  b.door(0, Z2, 3.4, 4.6, { op: 'all', in: [latch] }, { latch: true, color: '#9aa0c8' });
  b.wallGapsX(-10, 10, Z2 + 4, H, [[-5, 3], [5, 3]], wall);
  b.field(-5, H / 2, Z2 + 4, 3, H, 0.3, 1);
  b.field(5, H / 2, Z2 + 4, 3, H, 0.3, -1);
  b.sign(-5, 5.4, Z2 + 3.6, 'Sol', { style: 'prank', w: 1.6 });
  b.sign(5, 5.4, Z2 + 3.6, 'Luna', { style: 'prank', w: 1.6 });
  b.wallZ(Z2 + 4, Z2 + 22, 0, H, wall);
  b.wallGapsX(-10, 10, Z2 + 22, H, [[-5, 3], [5, 3]], { ...wall, lintel: 5 });
  b.checkpoint(0, 0, Z2 + 2, 3.6, { hint: 'Power room: five modules in a ring. Each switch flips its own module and the two next to it (5 and 1 are neighbors too). Turn all five green!' });
  b.sign(0, 3.4, Z2 + 1, 'Power board\nEach switch flips itself and both neighbors\n(a ring: 5 is next to 1)\nAll five green = power restored', { style: 'prank', w: 5 });
  const names = ['1 Habitat', '2 Lab', '3 Hangar', '4 Comms', '5 Engine'];
  const xs = [-8, -5, -2, 3.5, 7];
  // Pick the presses that solve it, then start from the state they fix.
  const solve = new Set([1, 2, 4]);
  const start = [1, 1, 1, 1, 1];
  for (const i of solve) for (const k of [i - 1, i, i + 1]) start[(k + 5) % 5] ^= 1;
  const mods = xs.map((x, i) => {
    b.sign(x, 3.3, Z2 + 15, names[i], { style: 'prank', w: 1.7 });
    return b.dial(x, 0, Z2 + 15, { values: [OFF, ON], style: 'color', start: start[i], label: names[i] });
  });
  mods.forEach((id, i) => {
    b.dials.find((d) => d.id === id).links = [mods[(i + 4) % 5], mods[(i + 1) % 5]];
  });
  const power = b.combo(mods, [1, 1, 1, 1, 1]);
  for (const x of xs) b.light(x, 6.5, Z2 + 21.4, { color: '#7dffb0', intensity: 4, dist: 7, fixture: 'bulb', when: power });
  b.door(-5, Z2 + 22, 3, 5, { op: 'all', in: [power] }, { latch: true, color: '#9aa0c8' });
  b.door(5, Z2 + 22, 3, 5, { op: 'all', in: [power] }, { latch: true, color: '#9aa0c8' });
  b.acts[b.acts.length - 1].toast = 'Power restored! The hatches open.';
  b.gem(-8.5, 1.2, Z2 + 20.5);

  // -- 3. Zero-g shaft: take turns powering each other's fans --------------------------------
  const Z3 = Z2 + 22;
  const HS = 26;
  b.floor(0, 0, Z3 + 11, 20, 22, { color: '#d8d6f0' });
  b.wallZ(Z3, Z3 + 22, -10, HS, wall);
  b.wallZ(Z3, Z3 + 22, 10, HS, wall);
  b.wallX(-10, 10, Z3, HS - H, { ...wall, y: H });
  b.wallX(-10, 10, Z3 + 22, 16, wall);
  b.wallGapsX(-10, 10, Z3 + 22, HS - 16, [[4, 3]], { ...wall, y: 16, lintel: 4.5 });
  b.checkpoint(0, 0, Z3 + 3, 4, { hint: 'Shaft: a fan only spins while someone holds its plate. Take turns powering each other\'s fans and climb up level by level!' });
  b.sign(0, 3.6, Z3 + 4.5, 'Zero-g shaft\nPlates power the fans —\nyou hold, your partner flies up', { style: 'prank', w: 4 });
  const P1 = b.plate(4, 0, Z3 + 2.5);
  // Ledge 1 (west, 9 m) and ledge 2 (east, 16 m).
  b.box(-5, 4.5, Z3 + 14.9, 10, 9, 14.2, { color: '#b9b4e0' });
  b.box(5, 8, Z3 + 14.9, 10, 16, 14.2, { color: '#a99ff0' });
  b.plat(-4, 0.25, Z3 + 6, 3.4, 3.4, 1.2, { mat: 'metal' });
  b.fan(-4, 0.25, Z3 + 6, 1.5, 10.6, 56, { op: 'any', in: [P1] });
  const P2 = b.plate(-5, 9, Z3 + 17);
  b.plat(4, 0.25, Z3 + 6, 3.4, 3.4, 1.2, { mat: 'metal' });
  b.fan(4, 0.25, Z3 + 6, 1.5, 17.6, 56, { op: 'any', in: [P2] });
  b.wire(P1, [[4, 0, Z3 + 2.5], [4, 0, Z3 + 4.3]]);
  const P3 = b.plate(5, 16, Z3 + 13);
  b.plat(-1.7, 9.25, Z3 + 12.5, 2.6, 2.6, 0.5, { mat: 'metal' });
  b.fan(-1.7, 9.25, Z3 + 12.5, 1.2, 8.6, 56, { op: 'any', in: [P3] });
  const P4 = b.plate(5, 16, Z3 + 18.5);
  b.sign(-5, 11.6, Z3 + 17, 'This plate powers\nthe big east fan', { style: 'prank', w: 2.8 });
  b.sign(5, 18.6, Z3 + 13, 'This plate powers the\nfan on the west ledge', { style: 'prank', w: 2.8 });
  b.sign(5, 18.6, Z3 + 18.5, 'Hold both plates at once\nto open the hatch', { style: 'prank', w: 2.8 });
  b.checkpoint(8, 16, Z3 + 10, 3.4, { hint: 'Waiting up here for your partner? Hold this plate to power the fan on the west ledge.' });
  const shaftDoor = b.door(4, Z3 + 22, 3, 4.5, { op: 'all', in: [P3, P4] }, { y: 16, latch: true, color: '#9aa0c8' });
  b.gem(4, 19.4, Z3 + 6);
  b.gem(-7.5, 10.4, Z3 + 20);

  // -- 4. Oxygen relay: each wing's challenge sends the other an oxygen tank -----------------
  const Z4 = Z3 + 22;
  const Y = 16;
  b.floor(0, Y, Z4 + 4, 24, 8, { color: '#e2e0f4' });
  b.wallX(-12, -10, Z4, H, hull(Y));
  b.wallX(10, 12, Z4, H, hull(Y));
  b.wallZ(Z4, Z4 + 24, -12, H, hull(Y));
  b.wallZ(Z4, Z4 + 24, 12, H, hull(Y));
  b.wallGapsX(-12, 12, Z4 + 8, H, [[-6.5, 3], [0, 3], [6.5, 3]], hull(Y));
  b.box(0, Y + 5 + (H - 5) / 2, Z4 + 8, 3, H - 5, 0.5, wall);
  b.field(-6.5, Y + H / 2, Z4 + 8, 3, H, 0.3, 1);
  b.field(6.5, Y + H / 2, Z4 + 8, 3, H, 0.3, -1);
  b.sign(-6.5, Y + 5.4, Z4 + 7.6, 'Sol', { style: 'prank', w: 1.6 });
  b.sign(6.5, Y + 5.4, Z4 + 7.6, 'Luna', { style: 'prank', w: 1.6 });
  b.wallZ(Z4 + 8, Z4 + 24, -1.5, H, hull(Y));
  b.wallZ(Z4 + 8, Z4 + 24, 1.5, H, hull(Y));
  b.checkpoint(0, Y, Z4 + 3, 4, { hint: 'Oxygen bay: each of you goes through the barrier of your color. Beat the challenge on your side to send out your partner\'s tank.' });
  b.sign(0, Y + 3.6, Z4 + 1.4, 'Life support needs 2 oxygen tanks\nRed: Sol only · Blue: Luna only\nPound the send switch on your\nside: your partner\'s tank appears', { style: 'prank', w: 5.2 });
  const solSend = b.pswitch(-6.75, Y + 4.2, Z4 + 21.8, true);
  const lunaSend = b.pswitch(6.75, Y + 1.5, Z4 + 21.8, true);
  const redTank = b.item('fuse', -4, Y + 1.0, Z4 + 4, { who: 0, color: SOL_RED, label: 'Red Oxygen Tank', when: lunaSend });
  const blueTank = b.item('fuse', 4, Y + 1.0, Z4 + 4, { who: 1, color: LUNA_BLUE, label: 'Blue Oxygen Tank', when: solSend });
  const o2 = b.lock(0, Y, Z4 + 6.2, [redTank, blueTank], { label: 'Life Support', radius: 2.4 });
  const o2Door = b.door(0, Z4 + 8, 3, 5, { op: 'all', in: [o2] }, { y: Y, latch: true, color: '#9aa0c8' });
  b.acts[b.acts.length - 1].toast = 'Life support online! The middle passage opens.';
  b.floor(0, Y, Z4 + 16, 3, 16, { color: '#d8d6f0' });
  // West wing (Sol): a climb up stepping stones over the void.
  b.floor(-6.75, Y, Z4 + 9.5, 10.5, 3, { color: '#ffd6c8' });
  b.plat(-9.4, Y + 1.2, Z4 + 12.3, 2.2, 2.2, 1.2, { color: '#ff9a7a' });
  b.plat(-6, Y + 2.4, Z4 + 14.2, 2.2, 2.2, 1.2, { color: '#ff9a7a' });
  b.plat(-9, Y + 3.6, Z4 + 16.4, 2.2, 2.2, 1.2, { color: '#ff9a7a' });
  b.floor(-6.75, Y + 4.2, Z4 + 21.5, 10.5, 5, { color: '#ffd6c8' });
  b.sign(-6.75, Y + 7, Z4 + 21.8, 'Send switch:\nsends Luna the blue tank', { style: 'prank', w: 3.4 });
  b.zone('warp', -10.2, Y + 5.4, Z4 + 22.5, 2.4, 3, 2.4, { to: [-3, Y, Z4 + 3, Math.PI], text: 'Back to the hall' });
  b.sign(-10.2, Y + 6.8, Z4 + 22.5, 'Teleporter\nto the hall', { style: 'prank', w: 1.8 });
  // East wing (Luna): crumbling tiles.
  b.floor(6.75, Y, Z4 + 9.5, 10.5, 3, { color: '#cfe0ff' });
  b.crumble(5, Y, Z4 + 12.6, 2, 2);
  b.crumble(8.2, Y + 0.5, Z4 + 14.8, 2, 2);
  b.crumble(5.2, Y + 1, Z4 + 17.2, 2, 2);
  b.floor(6.75, Y + 1.5, Z4 + 21.5, 10.5, 5, { color: '#cfe0ff' });
  b.sign(6.75, Y + 4.3, Z4 + 21.8, 'Send switch:\nsends Sol the red tank', { style: 'prank', w: 3.4 });
  b.zone('warp', 10.2, Y + 3, Z4 + 22.5, 2.4, 3, 2.4, { to: [3, Y, Z4 + 3, Math.PI], text: 'Back to the hall' });
  b.sign(10.2, Y + 4.1, Z4 + 22.5, 'Teleporter\nto the hall', { style: 'prank', w: 1.8 });
  b.gem(-6, Y + 4.8, Z4 + 14.2);
  b.gem(8.2, Y + 2.6, Z4 + 14.8);

  // -- 5. Magnet lanes over the void -------------------------------------------------------------
  const Z5 = Z4 + 24;
  const far0 = 26;
  b.floor(0, Y, Z5 + 3, 14, 6, { color: '#e2e0f4' });
  const land = far0 - 2; // where the far platform starts
  b.floor(0, Y, Z5 + (land + far0 + 10) / 2, 14, far0 + 10 - land, { color: '#e2e0f4' });
  b.checkpoint(0, Y, Z5 + 2.5, 4, { hint: 'Magnet rails: red magnets pull Luna, blue magnets pull Sol. Hold E to fly to a magnet, then let go and hold again to swing to the next.' });
  b.sign(0, Y + 3.6, Z5 + 1.2, 'Opposites attract!\nRed pulls Luna · Blue pulls Sol\nHold E to fly; let go, then hold\nagain to swing to the next one', { style: 'prank', w: 5 });
  const spacing = 5.2;
  for (const lane of [-1, 1]) {
    const x = lane * 3.5;
    const pol = lane < 0 ? 1 : -1;
    b.box(x, Y + 8.1, Z5 + (2 + far0 + 5) / 2, 1.6, 1.0, far0 + 3, { mat: 'metal' });
    b.box(x, Y + 3.8, Z5 + 1.4, 1.0, 7.6, 1.0, { mat: 'metal' });
    b.box(x, Y + 3.8, Z5 + far0 + 4.4, 1.0, 7.6, 1.0, { mat: 'metal' }); // clear of the last pad
    for (let z = 8 + (lane > 0 ? spacing / 2 : 0); ; z += spacing) {
      b.pad(x, Y + 7.58, Z5 + z, [0, -1, 0], pol);
      if (z >= land + 1.5) break; // the last one hangs over the far platform
    }
  }
  b.gem(0, Y + 5.6, Z5 + 6 + (far0 - 6) / 2);
  const gz = Z5 + far0 + 7;
  const G1 = b.plate(-5.4, Y, Z5 + far0 + 3.5);
  const G2 = b.plate(5.4, Y, Z5 + far0 + 3.5);
  b.box(-(15 + 2.7) / 2, Y + 3.4, gz, 15 - 2.7, 8, 1, { color: '#c7c9e6' });
  b.box((15 + 2.7) / 2, Y + 3.4, gz, 15 - 2.7, 8, 1, { color: '#c7c9e6' });
  b.box(0, Y + 6.7, gz, 5.4, 1.4, 1, { color: '#c7c9e6' });
  const laneGate = b.act('door', { op: 'all', in: [G1, G2] }, true, [
    { x: 0, y: Y + 3, z: gz, sx: 5.3, sy: 6, sz: 0.6, move: [0, -6.4, 0] },
  ], { speed: 10, lamp: [0, Y + 6.2, gz - 0.6] });
  b.sign(0, Y + 3, Z5 + far0 + 1.2, 'One of you on each plate', { style: 'prank', w: 3.2 });

  // -- 6. Star chart room: Sol counts the stars, Luna dials the docking code -------------------
  const Z6 = Z5 + far0 + 10;
  b.floor(0, Y, Z6 + 11, 20, 22, { color: '#e2e0f4' });
  b.wallGapsX(-10, 10, Z6, H, [[0, 3.4]], { ...hull(Y), lintel: 4.6 });
  b.wallZ(Z6, Z6 + 22, -10, H, hull(Y));
  b.wallZ(Z6, Z6 + 22, 10, H, hull(Y));
  b.wallGapsX(-10, 10, Z6 + 4, H, [[-5, 3], [5, 3]], hull(Y));
  b.field(-5, Y + H / 2, Z6 + 4, 3, H, 0.3, 1);
  b.field(5, Y + H / 2, Z6 + 4, 3, H, 0.3, -1);
  b.sign(-5, Y + 5.4, Z6 + 3.6, 'Sol', { style: 'prank', w: 1.6 });
  b.sign(5, Y + 5.4, Z6 + 3.6, 'Luna', { style: 'prank', w: 1.6 });
  b.wallZ(Z6 + 4, Z6 + 22, 0, H, hull(Y));
  b.wallGapsX(-10, 10, Z6 + 22, H, [[-5, 3], [5, 3]], { ...hull(Y), lintel: 5 });
  // Screens just inside each barrier, so nobody reads the other room from outside.
  b.wallX(-7, -3, Z6 + 6.2, H, hull(Y));
  b.wallX(3, 7, Z6 + 6.2, H, hull(Y));
  // Roofs, so nobody peeks over into the other room.
  b.box(-5, Y + H + 0.25, Z6 + 13, 10.4, 0.5, 18.4, { color: '#a99ff0' });
  b.box(5, Y + H + 0.25, Z6 + 13, 10.4, 0.5, 18.4, { color: '#a99ff0' });
  b.checkpoint(0, Y, Z6 + 2, 3.6, { hint: 'Star chart room: the star chart is on Sol\'s side; the code order and the wheels are on Luna\'s. Talk it through!' });
  const colors = [['Red', '#ff5d5d'], ['Blue', '#4f86ff'], ['Yellow', '#ffd23f'], ['Green', '#3fc46b']];
  const counts = r.shuffle([2, 3, 5, 6, 7, 8]).slice(0, 4);
  colors.forEach(([name], i) => {
    const stars = Array(counts[i]).fill('★').join(' ');
    b.sign(-9.7, Y + 3.2, Z6 + 8 + i * 3.6, `${name} constellation\n${stars}`, { fixed: true, yaw: Math.PI / 2, style: 'prank', w: 3.2 });
  });
  b.sign(-5, Y + 6.4, Z6 + 21.7, 'Star chart', { fixed: true, yaw: Math.PI, style: 'prank', w: 2 });
  const order = r.shuffle([0, 1, 2, 3]);
  b.sign(9.7, Y + 3.6, Z6 + 12, `Docking code = how many stars in\neach constellation, in this order:\n${order.map((i) => colors[i][0]).join(' → ')}\n(the star chart is on Sol's side)`, { fixed: true, yaw: -Math.PI / 2, style: 'prank', w: 4.2 });
  const dock = [2.5, 4.5, 6.5, 8.5].map((x) => b.dial(x, Y, Z6 + 17, { h: 1.8 }));
  const dockCode = b.combo(dock, order.map((i) => counts[i]));
  b.sign(5.5, Y + 3.6, Z6 + 17, 'Docking code (pound to turn)', { style: 'prank', w: 3.8 });
  b.door(-5, Z6 + 22, 3, 5, { op: 'all', in: [dockCode] }, { y: Y, latch: true, color: '#9aa0c8' });
  b.door(5, Z6 + 22, 3, 5, { op: 'all', in: [dockCode] }, { y: Y, latch: true, color: '#9aa0c8' });
  b.acts[b.acts.length - 1].toast = 'Docking code accepted! On to the launch pad.';
  b.gem(-8.5, Y + 1.2, Z6 + 20.5);
  b.gem(8.5, Y + 1.2, Z6 + 6);

  // -- 7. Launch pad: pound together to raise the boarding bridge ---------------------------
  const Z7 = Z6 + 22;
  b.floor(0, Y, Z7 + 4, 14, 8, { color: '#e2e0f4' });
  b.checkpoint(0, Y, Z7 + 2, 4, { hint: 'Launch pad: stand on a button each and pound (C) together to raise the boarding bridge!' });
  const A = b.pswitch(-4, Y, Z7 + 4.8, false, 0.9);
  const B = b.pswitch(4, Y, Z7 + 4.8, false, 0.9);
  b.sign(0, Y + 3.4, Z7 + 5.5, 'Ignition!\nBoth pound your buttons at once', { style: 'prank', w: 3.6 });
  const gap = 16;
  const planks = 6;
  const pl = gap / planks;
  const parts = [];
  for (let i = 0; i < planks; i++) parts.push({ x: 0, y: Y - 0.3 - 9, z: Z7 + 8 + pl * (i + 0.5), sx: 4, sy: 0.6, sz: pl - 0.06, move: [0, 9, 0], delay: i * 0.12 });
  const bridge = b.act('bridge', { op: 'all', in: [A, B] }, true, parts, { speed: 16, lamp: [0, Y + 0.6, Z7 + 7.6], mat: 'toy', color: '#ffd166' });
  b.wire(A, [[-4, Y, Z7 + 4.8], [-4, Y, Z7 + 7.3], [-1.8, Y, Z7 + 7.3]]);
  b.wire(B, [[4, Y, Z7 + 4.8], [4, Y, Z7 + 7.3], [1.8, Y, Z7 + 7.3]]);
  b.floor(0, Y, Z7 + 30, 16, 12, { color: '#d8d6f0' });
  // The shuttle.
  b.box(0, Y + 3, Z7 + 36.5, 5, 6, 3, { color: '#f4f2ff' });
  b.box(0, Y + 7, Z7 + 36.5, 3.4, 2, 3, { color: '#ff6fd8' });
  b.box(0, Y + 8.6, Z7 + 36.5, 1.6, 1.2, 1.6, { color: '#ff6fd8' });
  for (const s of [-1, 1]) b.box(s * 3.2, Y + 1.2, Z7 + 36.5, 1.4, 2.4, 2.4, { color: '#5ee7ff' });
  b.gem(0, Y + 2.6, Z7 + 16);
  b.goal(0, Y, Z7 + 30);

  b.objectives = [
    { text: 'Airlock: one pounds the timer outside, the other dashes in while the door is open', done: { sig: latch } },
    { text: 'Power room: turn all five modules green (each switch flips itself and its neighbors)', done: { sig: power } },
    { text: 'Shaft: take turns holding plates to power the fans and send each other up', done: { act: shaftDoor } },
    { text: 'Oxygen bay: beat the challenge on your side to send your partner a tank', done: { act: o2Door } },
    { text: 'Magnet rails: swing across on the opposite-color magnets, then both hold a plate', done: { act: laneGate } },
    { text: 'Star chart room: Sol counts the stars, Luna enters the docking code', done: { sig: dockCode } },
    { text: 'Launch pad: pound both buttons together to raise the boarding bridge', done: { act: bridge } },
    { text: 'Board the shuttle together!', done: {} },
  ];
  return b.finish();
}
