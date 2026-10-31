// Story 6 · Midnight Funfair, the last night. A funfair that
// closed in 1999. A clown walks the plaza (ticket booths are safe, a
// flashlight holds it still). Three park stamps open the Ferris wheel:
//   - the carousel: a brake code written in glow ink on its centre pillar,
//     dialled in at the control booth, then a jump from the ride to the pillar
//   - the mirror maze (Sol only): Luna watches from the viewing deck and her
//     eye plate shows which mirrors are fake and which gaps are glass
//   - the haunted ride (Luna only): Sol holds the door plate outside and reads
//     her the nursery rhyme that is the button order inside
// Then the closing music starts, a second clown comes, and you climb the
// broken Ferris wheel's bobbing cars to the top, where it only lets two through.

import { LevelBuilder } from '../build.js';
import { DARK, wardrobe } from './common.js';

const NIGHT = {
  ...DARK,
  stars: true,
  skyTop: '#03020a', skyHorizon: '#170c26', skyBottom: '#050309',
  fog: '#06050c', fogDensity: 0.04,
  hemiSky: '#2a2140', hemiGround: '#0f0b12', hemiIntensity: 0.5,
  blocks: ['#5a3a52', '#3c4a62', '#5a4a3a', '#3a5a4e', '#5e3a3a', '#4a3e5e'],
};

const H = 6.5; // park walls: too tall to jump, even off your partner's head
const DOOR = 3.4;
const WALL = { color: '#2e2a36', t: 0.4 };
const GATE = { ...WALL, lintel: DOOR };
const MIRROR = '#9fb0c8';
const GOLD = '#ffcf4d';

// A little ticket booth / kiosk: walls, a roof, a warm light and a safe zone.
// door: [side, center, width] with side 'n' | 's' | 'e' | 'w'.
function kiosk(b, x0, z0, x1, z1, door, label, o = {}) {
  const h = 3.0;
  const w = { color: o.color || '#4a2e3e', t: 0.3, lintel: 2.4 };
  const [side, at, width] = door;
  b.room(x0, z0, x1, z1, h, { [side]: [[at, width]] }, w);
  b.box((x0 + x1) / 2, h + 0.15, (z0 + z1) / 2, x1 - x0 + 0.6, 0.3, z1 - z0 + 0.6, { color: o.roof || '#8a2f4a' });
  b.zone('safe', (x0 + x1) / 2, 1.5, (z0 + z1) / 2, x1 - x0 - 0.5, 3, z1 - z0 - 0.5);
  b.light((x0 + x1) / 2, h - 0.3, (z0 + z1) / 2, { color: '#ffd9a0', intensity: 7, dist: 7, flicker: 0.12, fixture: 'bulb' });
  const sx = side === 'n' || side === 's' ? at : side === 'e' ? x1 + 0.2 : x0 - 0.2;
  const sz = side === 'e' || side === 'w' ? at : side === 'n' ? z1 + 0.2 : z0 - 0.2;
  const yaw = { n: 0, s: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 }[side];
  b.sign(sx, h - 0.35, sz, label, { fixed: true, yaw, style: 'prank', w: 1.8 });
}

function lamp(b, x, z, color = '#ffc98a') {
  b.box(x, 2.3, z, 0.22, 4.6, 0.22, { mat: 'metal', color: '#22202a' });
  b.light(x, 4.75, z, { color, intensity: 8, dist: 11, flicker: 0.25, fixture: 'bulb' });
}

// A clown statue on a little plinth. Its head follows you.
function statue(b, x, z, yaw) {
  b.box(x, 0.25, z, 1.2, 0.5, 1.2, { color: '#3a3040' });
  b.figure(x, 0.5, z, { look: 'clown', yaw, watch: true });
}

export function funfair(index) {
  const b = new LevelBuilder({
    mode: 'horror', index, seed: 'funfair', name: 'Midnight Funfair', label: 'Night 6',
    theme: 'twilight', sky: 'day', overrides: NIGHT,
  });
  const r = b.rng;

  // -- Floors ----------------------------------------------------------------------------
  b.floor(0, 0, 8, 20, 16, { color: '#2c2a33' }); // entrance square
  b.floor(0, 0, 23.5, 52, 15, { color: '#2a2730' }); // plaza: south
  b.floor(0, 0, 54.5, 52, 19, { color: '#2a2730' }); // plaza: north
  b.floor(-16.5, 0, 38, 19, 14, { color: '#2a2730' }); // plaza: west
  b.floor(16.5, 0, 38, 19, 14, { color: '#2a2730' }); // plaza: east
  b.floor(-42, 0, 38, 20, 24, { color: '#1d2028' }); // mirror maze
  b.floor(-29, 0, 40, 6, 4, { color: '#1d2028' }); // maze way in
  b.floor(-29, 0, 28, 6, 4, { color: '#1d2028' }); // maze way out
  b.floor(31, 0, 42, 10, 8, { color: '#201a1c' }); // ghost ride: boarding hall
  b.floor(38, 0, 29, 24, 10, { color: '#201a1c' }); // ghost ride: the last room
  b.floor(0, 0, 85, 28, 42, { color: '#24222a' }); // Ferris wheel yard

  // -- The entrance and the ticket gate (start) -----------------------------------------
  b.wallX(-10, 10, 0, H, WALL);
  b.wallZ(0, 16, -10, H, WALL);
  b.wallZ(0, 16, 10, H, WALL);
  b.checkpoint(0, 0, 4, 6, { flag: false, hint: 'The ticket gate only opens for two: stand on both plates at once.' });
  b.sign(5.5, 2.6, 9.6, 'PARK RULES\n1. The gate opens only for two.\n2. See the clown? Hide in a lit\n    kiosk (green area).\n3. Flashlight on it: it freezes.\n4. Mirror maze: trust each other.\n5. Ghost train: one rider. The\n    other holds the door plate.\n6. After closing: no Ferris wheel.', { fixed: true, yaw: -Math.PI / 2, style: 'paper', w: 3.6 });
  b.box(6.1, 2.4, 9.6, 0.2, 3.6, 3.9, { color: '#3a3040' }); // the board it's pinned to
  // Old ticket window.
  b.box(-7, 1.5, 6, 3, 3, 3, { color: '#5a2a3a' });
  b.box(-7, 3.15, 6, 3.6, 0.3, 3.6, { color: '#8a2f4a' });
  b.sign(-5.45, 2.2, 6, 'TICKETS', { fixed: true, yaw: Math.PI / 2, style: 'prank', w: 1.4 });
  b.note(-4.9, 1.1, 6, 'Text from Unknown Number', `"Last stop.\nTwo tickets, midnight tonight, Happy Valley funfair.\n\nCome, and you'll find out who I am."\n\nBelow the text, a photo of two tickets. The stubs are stamped: Aug 31, 1999.`);
  statue(b, -7.5, 13, Math.PI * 0.75);
  b.light(0, 4.2, 6, { color: '#ffb0d0', intensity: 9, dist: 12, flicker: 0.3, fixture: 'bulb' });
  b.sign(0, 4.9, 15.7, 'HAPPY VALLEY', { fixed: true, yaw: Math.PI, style: 'prank', w: 3.4 });
  const turnA = b.plate(-4.5, 0, 13);
  const turnB = b.plate(4.5, 0, 13);
  b.sign(-6.4, 2.8, 15.7, 'ENTRANCE\n(both stand on the plates)', { fixed: true, yaw: Math.PI, style: 'horror', w: 2.8 });
  const ticketGate = b.door(0, 16, 4, DOOR, { op: 'all', in: [turnA, turnB] }, { latch: true, style: 'gate', color: '#3a3040', speed: 3 });
  b.acts[b.acts.length - 1].toast = 'The ticket gate clicks open. Welcome to Happy Valley.';
  b.mark('turnA', -4.5, 0, 13);
  b.mark('turnB', 4.5, 0, 13);

  // -- The plaza ---------------------------------------------------------------------------
  b.wallGapsX(-26, 26, 16, H, [[0, 4]], GATE);
  b.wallGapsZ(16, 64, -26, H, [[28, 3], [40, 3]], GATE);
  b.wallGapsZ(16, 64, 26, H, [[29, 2.4], [42, 2.4]], GATE);
  b.wallGapsX(-26, 26, 64, H, [[0, 6]], GATE);
  b.checkpoint(0, 0, 20.5, 5, { flag: false, hint: 'Collect three park stamps: carousel, mirror maze, ghost train. You can only carry one thing at a time — take each stamp to the stamp box in the kiosk by the Ferris wheel.' });
  b.zone('safe', 0, 1.5, 20.2, 8, 3, 6);
  const plazaIn = b.zone('trigger', 0, 1.5, 24, 10, 3, 2, { fx: ['apparition', 'sting'], look: [14, 0, 58], text: 'Behind the carousel... a clown is waving at you.' });
  b.note(3, 0.9, 18.6, 'Closing Notice (1999)', 'Happy Valley Funfair will close for good on September 1, 1999.\n\nOn closing night, August 31, a seven-year-old child went missing in the park and has never been found.\n\nAnyone with information, please contact park management.');
  for (const [x, z] of [[-24.5, 19], [24.5, 19], [-24.5, 46], [24.5, 36], [-24.5, 61], [24.5, 61], [-5, 17.5], [5, 17.5], [4.5, 62]]) lamp(b, x, z, x < 0 ? '#ffb0d0' : '#ffc98a');
  statue(b, 22.5, 60.5, -Math.PI * 0.75);
  wardrobe(b, -24.4, 24, 'e');
  wardrobe(b, 24.4, 52, 'w');
  b.sign(-24.6, 3.6, 24, 'COSTUME CLOSET\n(you can hide inside)', { fixed: true, yaw: Math.PI / 2, style: 'prank', w: 1.8 });

  // -- The carousel --------------------------------------------------------------------------
  b.box(0, -0.25, 38, 14, 1.5, 14, { color: '#3a2a40' }); // its base, 0.5 high
  for (let k = 0; k < 4; k++) {
    b.mover(12, 0.8, 5, { type: 'spin', center: [0, 0.4, 38], speed: 0.35, phase: (k * Math.PI) / 4 }, { color: ['#7a3a5a', '#3a5a7a', '#7a6a3a', '#3a7a5a'][k] });
  }
  b.box(0, 3.55, 38, 1.4, 6.1, 1.4, { color: '#c8a050' }); // centre pillar
  b.box(0, 4.25, 38, 3.4, 0.3, 3.4, { color: '#d8b060' }); // a ledge round it
  b.box(0, 6.8, 38, 14, 0.4, 14, { color: '#6a2a4a' }); // canopy
  b.figure(4.5, 7.0, 41, { look: 'clown', yaw: Math.PI, watch: true, scale: 0.9 }); // something sitting on the canopy
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    b.light(Math.cos(a) * 6.7, 6.45, 38 + Math.sin(a) * 6.7, { color: k % 2 ? '#ff7eb6' : '#ffd166', intensity: k % 4 ? 0.01 : 5, dist: 8, flicker: 0.4, fixture: 'bulb' });
  }
  const animals = ['Horse', 'Deer', 'Rabbit', 'Elephant'];
  const code = r.shuffle([0, 1, 2, 3]).slice(0, 3);
  const glow = `BRAKE CODE\n${code.map((i) => animals[i]).join(' → ')}`;
  for (const [dx, dz, yaw] of [[0, 0.72, 0], [0, -0.72, Math.PI], [0.72, 0, Math.PI / 2], [-0.72, 0, -Math.PI / 2]]) {
    b.sign(dx, 2.3, 38 + dz, glow, { fixed: true, yaw, style: 'uv', w: 1.3 });
  }
  // The control booth: three dials.
  kiosk(b, 8, 21, 16, 26, ['n', 9.4, 1.8], 'CAROUSEL BOOTH');
  const dials = [10.6, 12.4, 14.2].map((x) => b.dial(x, 0, 22.4, { values: animals, h: 1.6 }));
  const brake = b.combo(dials, code);
  b.sign(12.4, 2.4, 21.2, 'CAROUSEL BRAKE (3 dials)\npound the buttons to turn', { fixed: true, yaw: 0, style: 'paper', w: 3.0 });
  b.note(15, 0.9, 25, "Operator's Log", "The carousel brake is three dials. I can never remember the order, so I wrote it in glow ink on the center pillar — invisible normally, but a flashlight shows it.\n\nOn closing night, a little girl sat on a horse and wouldn't get off. She said she was waiting for her friend to come back, so they could ride the last round together.");
  const gold = b.item('stamp', 0, 4.75, 39.2, { color: GOLD, label: 'Gold Stamp', when: brake });
  b.light(0, 5.6, 39.2, { color: GOLD, intensity: 4, dist: 4, fixture: 'none', when: brake });
  b.mark('ledge', 0, 4.4, 39.2);
  for (let i = 0; i < 3; i++) b.mark(`dial${i}`, [10.6, 12.4, 14.2][i], 0, 22.4);

  // -- The mirror maze (Sol only) ---------------------------------------------------------
  // 5 x 6 cells of 4 m. Some mirrors are fake (walk straight through), some
  // gaps are glass (invisible walls). Luna's eye plate on the deck shows both.
  b.fieldZ(-26, DOOR / 2, 40, 3, DOOR, 1);
  b.sign(-25.5, 4.1, 40, 'MIRROR MAZE\n(one at a time)', { fixed: true, yaw: Math.PI / 2, style: 'prank', w: 2.4 });
  b.wallX(-32, -26, 38, H, WALL);
  b.wallX(-32, -26, 42, H, WALL);
  b.wallX(-32, -26, 30, H, WALL);
  const eye = b.plate(-22.5, 7, 50);
  const MH = 5.2;
  const X0 = -52, Z0 = 26, C = 5, R = 6, S = 4;
  const cell = (c, rr) => [X0 + S / 2 + c * S, Z0 + S / 2 + rr * S];
  const kinds = new Map();
  const edge = (a, c) => `${a[0]},${a[1]}|${c[0]},${c[1]}`;
  const set = (kind, ...cells) => {
    for (let i = 0; i < cells.length - 1; i++) {
      kinds.set(edge(cells[i], cells[i + 1]), kind);
      kinds.set(edge(cells[i + 1], cells[i]), kind);
    }
  };
  // The way through (fakes on it), side branches, and glass across the tempting gaps.
  set('open', [4, 3], [3, 3]);
  set('fake', [3, 3], [3, 4]);
  set('open', [3, 4], [2, 4], [1, 4], [1, 3], [0, 3], [0, 2]);
  set('fake', [0, 2], [0, 1]);
  set('open', [0, 1], [0, 0], [1, 0], [2, 0], [2, 1]);
  set('fake', [2, 1], [3, 1]);
  set('open', [3, 1], [3, 0], [4, 0]);
  set('open', [4, 3], [4, 4], [4, 5], [3, 5], [2, 5], [1, 5], [0, 5], [0, 4]);
  set('open', [1, 3], [2, 3], [2, 2], [3, 2], [4, 2], [4, 1]);
  set('open', [1, 2], [1, 1], [0, 1]);
  set('hidden', [3, 3], [2, 3]);
  set('hidden', [0, 4], [0, 3]);
  set('hidden', [1, 3], [1, 2]);
  set('hidden', [2, 0], [3, 0]);
  set('hidden', [3, 4], [4, 4]);
  set('hidden', [2, 4], [2, 5]);
  const panel = (kind, x, z, sx, sz) => {
    if (kind === 'open') return;
    if (kind === 'wall') b.box(x, MH / 2, z, sx, MH, sz, { color: MIRROR });
    else b.trap(kind, x, MH, z, sx, sz, { t: MH, color: MIRROR, reveal: eye });
  };
  for (let c = 0; c < C; c++) {
    for (let rr = 0; rr < R; rr++) {
      const [x, z] = cell(c, rr);
      // East side of the cell.
      if (c < C - 1) panel(kinds.get(edge([c, rr], [c + 1, rr])) || 'wall', x + S / 2, z, 0.4, S - 0.5);
      else if (rr !== 0 && rr !== 3) panel('wall', x + S / 2, z, 0.4, S - 0.5);
      // North side.
      if (rr < R - 1) panel(kinds.get(edge([c, rr], [c, rr + 1])) || 'wall', x, z + S / 2, S - 0.5, 0.4);
      else panel('wall', x, z + S / 2, S - 0.5, 0.4);
      if (c === 0) panel('wall', x - S / 2, z, 0.4, S - 0.5);
      if (rr === 0) panel('wall', x, z - S / 2, S - 0.5, 0.4);
    }
  }
  for (let i = 0; i <= C; i++) for (let j = 0; j <= R; j++) b.box(X0 + i * S, MH / 2, Z0 + j * S, 0.5, MH, 0.5, { color: '#6a7a92' });
  b.wallX(-32, -26, 26, H, WALL);
  // Things in the mirrors.
  b.figure(...[cell(4, 5)[0], 0, cell(4, 5)[1]], { look: 'mannequin', yaw: Math.PI, watch: true });
  b.figure(...[cell(2, 2)[0], 0, cell(2, 2)[1]], { look: 'mannequin', yaw: 0, watch: true });
  b.figure(...[cell(1, 1)[0], 0, cell(1, 1)[1]], { look: 'doll', yaw: Math.PI / 2, watch: true });
  b.zone('trigger', cell(1, 4)[0], 1.5, cell(1, 4)[1], 3, 3, 3, { fx: ['apparition', 'whisper'], look: [cell(0, 4)[0], 0, cell(0, 4)[1]], text: "Someone in the mirror is walking along with you — but there's nothing behind you." });
  for (const [c, rr] of [[4, 3], [1, 4], [0, 1], [3, 1]]) {
    const [x, z] = cell(c, rr);
    b.light(x, 4.6, z, { color: '#b8c8ff', intensity: 4, dist: 6, flicker: 0.5, fixture: 'bulb' });
  }
  const red = b.item('stamp', ...[cell(0, 0)[0], 1.0, cell(0, 0)[1]], { who: 0, color: '#ff6b4a', label: 'Red Stamp' });
  b.note(cell(0, 0)[0] + 1.2, 0.9, cell(0, 0)[1] - 1.1, 'Lipstick on the Mirror', "The me in the mirror is smiling.\nBut I'm not smiling.\n\nDon't trust the mirrors.\nTrust the one holding your hand.");
  b.light(cell(0, 0)[0], 4.4, cell(0, 0)[1], { color: '#ff8a7a', intensity: 5, dist: 6, flicker: 0.2, fixture: 'bulb' });
  const mazeOut = b.pswitch(-28.5, 0, 28, true);
  const mazeDoor = b.door(-26, 28, 3, DOOR, { op: 'all', in: [mazeOut] }, { axis: 'z', latch: true, color: '#3a3040' });
  b.sign(-28.5, 2.8, 29.6, 'EXIT (pound once)', { fixed: true, yaw: Math.PI, style: 'prank', w: 1.8 });
  // Luna's viewing deck in the plaza, up a flight of big steps.
  b.box(-22.5, 3.5, 50, 6, 7, 6, { color: '#3a3040' });
  [1.4, 2.8, 4.2, 5.6].forEach((top, k) => b.box(-14.25 - 1.5 * k, top / 2, 50, 1.5, top, 4, { color: '#4a3e5e' }));
  // Glass railing round the deck so nobody hops over into the maze.
  b.trap('hidden', -25.35, 10, 50, 0.3, 6, { t: 3 });
  b.trap('hidden', -22.5, 10, 52.85, 6, 0.3, { t: 3 });
  b.trap('hidden', -22.5, 10, 47.15, 6, 0.3, { t: 3 });
  b.sign(-12, 3.4, 47.6, 'VIEWING DECK\nStand on the eye plate to see\nwhich mirrors are real', { fixed: true, yaw: Math.PI, style: 'prank', w: 2.6 });
  b.sign(-22.5, 7.9, 52.7, 'EYE PLATE', { fixed: true, yaw: Math.PI, style: 'prank', w: 1.6 });
  b.light(-22.5, 9.2, 50, { color: '#9fd8ff', intensity: 5, dist: 8, flicker: 0.1, fixture: 'bulb' });
  b.mark('eye', -22.5, 7, 50);
  const mazePath = [[4, 3], [3, 3], [3, 4], [2, 4], [1, 4], [1, 3], [0, 3], [0, 2], [0, 1], [0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [3, 0], [4, 0]];
  mazePath.forEach(([c, rr], i) => b.mark(`maze${i}`, cell(c, rr)[0], 0, cell(c, rr)[1]));

  // -- The ghost ride (Luna only) -----------------------------------------------------------
  const HH = 4.4;
  const hw = { color: '#2a1e24', t: 0.4 };
  b.wallX(26, 36, 38, HH, hw);
  b.wallZ(38, 46, 36, HH, hw);
  b.wallGapsX(26, 36, 46, HH, [[32, 4]], hw);
  b.wallZ(46, 56, 30, HH, hw);
  b.wallZ(46, 52, 34, HH, hw);
  b.wallX(30, 50, 56, HH, hw);
  b.wallX(34, 46, 52, HH, hw);
  b.wallZ(24, 56, 50, HH, hw);
  b.wallZ(34, 52, 46, HH, hw);
  b.wallX(26, 50, 24, HH, hw);
  b.wallX(26, 46, 34, HH, hw);
  b.box(38, HH + 0.25, 40, 24.4, 0.5, 32.4, { color: '#140f12' }); // its roof
  b.conveyor(32, 0, 51, 4, 10, 2.5, [0, 1]);
  b.conveyor(42, 0, 54, 16, 4, 2.5, [1, 0]);
  b.conveyor(48, 0, 43, 4, 18, 2.5, [0, -1]);
  // Outside: the door plate, and the rhyme on the wall.
  const holdDoor = b.plate(23, 0, 44.6);
  b.fieldZ(26, DOOR / 2, 42, 2.4, DOOR, -1);
  const rideDoor = b.door(26, 42, 2.4, DOOR - 0.2, { op: 'any', in: [holdDoor] }, { axis: 'z', latch: false, color: '#5a1a2a', speed: 6 });
  b.acts[b.acts.length - 1].quiet = true;
  b.sign(25.5, 4.1, 42, 'GHOST TRAIN (haunted ride)\nOne rider only', { fixed: true, yaw: -Math.PI / 2, style: 'horror', w: 2.4 });
  b.sign(25.75, 2.5, 47.6, 'GHOST TRAIN RHYME\nOne rabbit hops the river,\nTwo pandas climb up slow,\nThree dolls sit in a row,\nThe clown sings last, so low.', { fixed: true, yaw: -Math.PI / 2, style: 'paper', w: 2.8 });
  b.sign(23, 2.6, 44.6, 'DOOR PLATE\n(step off and it shuts)', { style: 'prank', w: 2.2 });
  kiosk(b, 18, 48, 22.5, 52, ['s', 20.2, 1.8], 'KIOSK');
  b.mark('holdDoor', 23, 0, 44.6);
  // Inside: boarding hall, the track, and the last room.
  b.sign(35.75, 2.6, 42, 'One guest rides alone.\nDo not leave the ride.', { fixed: true, yaw: -Math.PI / 2, style: 'horror', w: 2.6 });
  b.figure(34.6, 0, 44.6, { look: 'doll', yaw: -Math.PI * 0.75, watch: true });
  b.zone('trigger', 31, 1.5, 42, 4, 3, 6, { fx: 'whisper', text: '"Welcome aboard the Ghost Train..." Is that coming from the speakers?' });
  b.light(31, 4.0, 42, { color: '#ff4040', intensity: 6, dist: 8, flicker: 0.3, fixture: 'bulb' });
  for (const z of [48, 51, 54]) b.figure(30.6, 1.2, z, { look: 'doll', yaw: Math.PI / 2, watch: true, scale: 0.8 });
  for (const z of [48, 51, 54]) b.box(30.5, 0.6, z, 0.8, 1.2, 0.8, { mat: 'wood', color: '#3a2a22' });
  b.zone('trigger', 32, 1.5, 53.5, 4, 3, 3, { fx: ['lightsOut', 'apparition', 'sting'], look: [45, 0, 54], text: 'The lights go out. A tall shadow stands at the end of the track.' });
  for (const x of [38, 42, 46]) b.figure(x, 0, 55.3, { look: 'mannequin', yaw: Math.PI, watch: true });
  b.zone('trigger', 42, 1.5, 54, 4, 3, 4, { fx: 'knock', text: 'Knock. Knock. Knock.' });
  b.figure(49.3, 0, 36.2, { look: 'clown', yaw: -Math.PI / 2, watch: true });
  b.zone('trigger', 48, 1.5, 40, 4, 3, 4, { fx: ['slam', 'whisper'], text: '"Three dolls sit in a row..." someone sings in your ear.' });
  for (const [x, z] of [[32, 50], [42, 54], [48, 46], [48, 37]]) b.light(x, 4.0, z, { color: '#ff3a3a', intensity: 4, dist: 6, flicker: 0.6, fixture: 'bulb' });
  // The last room: four painted boards, a button in front of each.
  const verses = ['Rabbit', 'Pandas', 'Dolls', 'Clown'];
  const spots = r.shuffle([30, 35, 40, 45]);
  const boardSw = {};
  verses.forEach((name, i) => {
    const x = spots[i];
    b.box(x, 2.0, 24.35, 2.2, 2.2, 0.2, { color: ['#d8d0c0', '#c0c8c0', '#d0b8c0', '#c8b8a0'][i] });
    b.sign(x, 2.0, 24.5, name, { fixed: true, yaw: 0, style: 'paper', w: 1.6 });
    boardSw[name] = b.pswitch(x, 0, 27, false, 0.6, '#c43a3a');
  });
  const rhyme = b.seq(verses.map((n) => boardSw[n]));
  b.sign(38, 3.3, 33.75, 'Pound the buttons in rhyme order\n(the rhyme is posted outside)', { fixed: true, yaw: Math.PI, style: 'horror', w: 3.2 });
  b.box(38, 0.5, 31.5, 1, 1, 1, { color: '#3a2a30' });
  const blue = b.item('stamp', 38, 1.45, 31.5, { who: 1, color: '#4f86ff', label: 'Blue Stamp', when: rhyme });
  b.box(29, 0.4, 32.6, 1.2, 0.8, 0.7, { mat: 'wood', color: '#3a2a22' });
  b.note(29, 1.05, 32.6, 'Ghost Train Staff Rules', '1. Only one guest at a time.\n2. Someone must stand on the door plate outside, or the door will close.\n3. If you hear someone singing the rhyme inside, it is not a member of staff.\n4. After closing, no matter who calls your name, do not look back.');
  b.light(38, 4.0, 29, { color: '#ffb080', intensity: 6, dist: 9, flicker: 0.25, fixture: 'bulb' });
  const rideOut = b.door(26, 29, 2.4, DOOR - 0.2, { op: 'all', in: [rhyme] }, { axis: 'z', latch: true, color: '#5a1a2a' });
  b.acts[b.acts.length - 1].toast = "The ghost train's exit opens.";
  verses.forEach((name, i) => b.mark(`board${i}`, spots[i], 0, 27));

  // -- The stamp box and the Ferris wheel gate ---------------------------------------------------
  kiosk(b, -10, 57, -3, 62.5, ['e', 59.75, 2], 'STAMP DESK', { roof: '#2f5a8a' });
  const stamps = b.lock(-6.5, 0, 59.75, [gold, red, blue], { label: 'Stamp Box', radius: 2.2 });
  b.note(-9, 0.9, 61.6, 'Stamp Card (back)', `Collect all three stamps and ride the Ferris wheel!\n— Stella, age 7\n\n"Leo and I promised to ride the last round together.\nHe said he'd be right back."`);
  const wheelGate = b.door(0, 64, 6, DOOR, { op: 'all', in: [stamps] }, { latch: true, style: 'gate', color: '#3a3040', speed: 3 });
  b.acts[b.acts.length - 1].toast = 'All three stamps are in. In the distance, the closing music begins...';
  b.sign(0, 5.2, 63.7, 'FERRIS WHEEL', { fixed: true, yaw: Math.PI, style: 'prank', w: 2.4 });
  b.mark('stamps', -6.5, 0, 59.75);

  // The clown in the plaza: it wanders the whole square, but never goes into
  // the booths, the maze or the ghost ride. Gone once the stamps are in.
  const nodes = [
    [0, 0, 27], [-11, 0, 27], [-11, 0, 38], [-11, 0, 49], [0, 0, 49], [11, 0, 49], [11, 0, 38], [11, 0, 29],
    [-20, 0, 22], [-20, 0, 44], [-10, 0, 56], [0, 0, 56], [14, 0, 58], [20, 0, 40], [20, 0, 31],
    // The Ferris wheel yard (for the second one).
    [0, 0, 61], [0, 0, 67], [-8, 0, 72], [-10, 0, 80], [2, 0, 78], [9, 0, 72], [-2, 0, 96],
  ];
  const plazaEdges = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [1, 8], [8, 9], [9, 2], [9, 3], [3, 10], [10, 11], [11, 4], [11, 12], [12, 5], [12, 13], [13, 6], [13, 14], [14, 7]];
  const yardEdges = [[11, 15], [15, 16], [16, 17], [17, 18], [18, 19], [19, 16], [19, 20], [20, 16], [19, 21], [18, 21]];
  const plaza = [-26, 16, 26, 64];
  b.monster({
    look: 'clown', y: 0, nodes, edges: plazaEdges,
    patrol: [0, 1, 8, 9, 2, 3, 10, 11, 12, 5, 6, 13, 14, 7],
    active: plazaIn, until: stamps, wakeAt: [14, 0, 58], start: 12,
    speed: 2.6, chase: 5.2, sight: 13, giveUp: 10, rest: 7,
    area: [plaza],
  });

  // -- The Ferris wheel -------------------------------------------------------------------------
  b.wallZ(64, 106, -14, H, WALL);
  b.wallZ(64, 106, 14, H, WALL);
  b.wallX(-14, 14, 106, H, WALL);
  b.checkpoint(-3, 0, 68.5, 4, { flag: false, hint: 'The clown is coming! Climb the Ferris wheel: the cars bob up and down. Jump to the next one when yours is at its highest.' });
  b.zone('safe', -3, 1.5, 68.5, 5, 3, 4);
  // The wheel itself, dark until the end.
  const WX = -3, WY = 11, WZ = 92, WR = 8.5;
  b.box(WX, WY, WZ, 1.6, 1.6, 1.6, { mat: 'metal', color: '#4a4658' });
  for (let k = 0; k < 28; k++) {
    const a = (k / 28) * Math.PI * 2;
    b.box(WX + Math.cos(a) * WR, WY + Math.sin(a) * WR, WZ, 0.6, 0.6, 0.6, { mat: 'metal', color: '#5a5668' });
  }
  for (let s = 0; s < 8; s++) {
    const a = (s / 8) * Math.PI * 2;
    for (let k = 1; k <= 3; k++) b.box(WX + Math.cos(a) * WR * k / 4, WY + Math.sin(a) * WR * k / 4, WZ, 0.35, 0.35, 0.35, { mat: 'metal', color: '#4a4658' });
  }
  b.box(WX - 2.5, 4.5, WZ, 0.5, 9, 0.5, { mat: 'metal', color: '#3a3648' }); // legs
  b.box(WX + 2.5, 4.5, WZ, 0.5, 9, 0.5, { mat: 'metal', color: '#3a3648' });
  const top = b.zone('trigger', 10.5, 15.5, 91.2, 2.6, 3, 2.4, { fx: ['sting'], text: "The Ferris wheel's lights come on, one after another..." });
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2;
    b.light(WX + Math.cos(a) * (WR + 0.5), WY + Math.sin(a) * (WR + 0.5), WZ - 0.4, { color: k % 2 ? '#ff7eb6' : '#ffe08a', intensity: k % 7 ? 0.01 : 9, dist: 14, fixture: 'bulb', when: top });
  }
  // The cars: they bob up and down; the next one is low when this one is high.
  const cars = [];
  const lows = [0.8, 3.1, 5.4, null, 8.6, 10.9];
  lows.forEach((low, i) => {
    const x = -10 + 3.1 * i;
    if (low === null) return;
    const mv = b.mover(2.6, 0.6, 2.6, { type: 'linear', a: [x, low - 0.3, 86], b: [x, low + 2.6 - 0.3, 86], period: 7, phase: i % 2 ? 0.5 : 0 }, { color: ['#ff7eb6', '#7ec8ff', '#ffd166', '', '#9dffb5', '#c48dff'][i] });
    cars.push({ id: mv.id, x, low, high: low + 2.6 });
  });
  // A maintenance platform half-way up, and the top.
  b.box(-0.7, 8.0, 86, 3.4, 0.8, 3.4, { mat: 'metal', color: '#4a4658' });
  b.box(-0.7, 3.8, 86, 0.4, 7.6, 0.4, { mat: 'metal', color: '#3a3648' });
  b.checkpoint(-0.7, 8.4, 86, 2.6, { flag: false, hint: "Halfway. Don't look down." });
  b.box(10.5, 13.5, 86, 6, 1, 6, { mat: 'metal', color: '#4a4658' });
  b.box(10.5, 6.5, 86, 0.5, 13, 0.5, { mat: 'metal', color: '#3a3648' });
  b.checkpoint(10.5, 14, 86, 5, { flag: false, hint: 'At the top: both of you stand on the two plates.' });
  const topA = b.plate(9, 14, 86);
  const topB = b.plate(12, 14, 86);
  b.sign(10.5, 16.6, 83.4, 'LAST RIDE\n(both of you together)', { style: 'horror', w: 2.4 });
  b.note(12.8, 14.8, 88.2, 'Note in the Top Car', "I waited for a long, long time.\n\nEvery night I texted a number, looking for two people who wouldn't leave each other behind.\n\nAnd you came.\n                    — Stella");
  b.light(10.5, 16.2, 86, { color: '#ffd9a0', intensity: 7, dist: 9, flicker: 0.15, fixture: 'bulb' });
  // Both plates raise the bridge to the way out.
  const parts = [];
  for (let i = 0; i < 7; i++) parts.push({ x: 10.5, y: 14 - 0.3 - 9, z: 89.5 + i, sx: 2.6, sy: 0.6, sz: 0.98, move: [0, 9, 0], delay: i * 0.12 });
  const bridge = b.act('bridge', { op: 'all', in: [topA, topB] }, true, parts, { speed: 14, mat: 'toy', color: GOLD, lamp: [10.5, 14.6, 89.2] });
  b.acts[b.acts.length - 1].toast = 'A bridge rises, leading to the exit.';
  b.box(10.5, 7, 99, 6, 14, 6, { color: '#3a3040' }); // the exit tower
  b.sign(10.5, 17.4, 101.8, 'EXIT', { fixed: true, yaw: Math.PI, style: 'prank', w: 1.8 });
  b.goal(10.5, 14, 99.4, 0, { style: 'exit' });
  b.mark('topA', 9, 14, 86);
  b.mark('topB', 12, 14, 86);
  b.mark('rest', -0.7, 8.4, 86);

  // The second clown: when the closing music starts it comes for you, over the
  // whole plaza and the yard. It can't climb; it's gone once you're over the bridge.
  b.monster({
    look: 'clown', y: 0, nodes, edges: [...plazaEdges, ...yardEdges],
    patrol: [4, 11, 15, 16, 17, 18, 21, 19, 20, 16, 15, 11, 10, 3, 2, 9, 8, 1, 0, 7, 14, 13, 6, 5, 12, 11],
    active: stamps, until: top, wakeAt: [0, 0, 49], start: 4,
    speed: 3.0, chase: 5.6, sight: 15, giveUp: 12, rest: 6,
    area: [plaza, [-14, 64, 14, 106]],
  });

  b.story = {
    introMs: 9000,
    tagline: 'Rules horror · The final night',
    intro: {
      kicker: 'Night 6',
      title: 'Midnight Funfair',
      lines: [
        'In the small hours, both your phones light up. The same unknown number: "Last stop. Two tickets, midnight tonight, Happy Valley funfair."',
        'Happy Valley closed more than twenty years ago. But tonight the lights over the entrance are on, and a yellowed list of park rules hangs by the ticket gate.',
      ],
      rules: [
        'The ticket gate opens only for two.',
        'If you see the clown, hide in a lit kiosk (green area).',
        "Hold the clown in your flashlight and it can't move.",
        'In the mirror maze, trust only your partner, never the mirrors.',
        'The ghost train takes one rider at a time; whoever stays outside must hold the door plate.',
        'After closing, do not ride the Ferris wheel.',
      ],
    },
    outro: {
      kicker: 'Dawn',
      title: 'The Last Round',
      lines: [
        'The Ferris wheel lights up, bulb by bulb, and the closing music plays one more time. The top car is empty except for a stamp card, all three stamps filled in.',
        'Your phones buzz at the same time. The same number — but this time, it shows a name: Stella.',
        '"The girl waiting at school, the one knocking in Room 404, the passenger on the last train, the child no one came for at the hospital, the bride in the old mansion... each of them was left behind, alone. Every time, you two never left each other. So they all got out."',
        '"Thank you for riding the last round with me. I can go home now. You too — go home together."',
        'The next day, that number can no longer be reached.',
      ],
    },
  };
  b.objectives = [
    { text: 'Both of you stand on the two ticket gate plates at once', done: { act: ticketGate } },
    { text: 'Carousel: shine a flashlight on the center pillar to find the brake code, then turn the three dials in the control booth', done: { sig: brake } },
    { text: 'Jump onto the carousel, then up to the ledge on the center pillar, and grab the gold stamp', done: { item: gold } },
    { text: 'Mirror maze: Luna climbs to the viewing deck, stands on the eye plate and tells Sol which mirrors are fake', done: { item: red } },
    { text: 'Ghost train: Sol holds the door plate and reads out the rhyme; Luna goes in and pounds the buttons in order', done: { item: blue } },
    { text: 'Put all three stamps in the stamp box by the Ferris wheel (you can carry one at a time)', done: { act: wheelGate } },
    { text: 'The closing music! Dodge the clown and climb the Ferris wheel', done: { cp: 4 } },
    { text: 'At the top: both of you stand on the two plates at once', done: { act: bridge } },
    { text: 'Cross the bridge and leave the funfair', done: {} },
  ];
  void mazeDoor; void rideDoor; void cars;
  return b.finish();
}
