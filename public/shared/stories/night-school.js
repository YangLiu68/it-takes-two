// Story 1 · Midnight School Rules: locked in the school after midnight
// with a sheet of rules. Red-light hallway, a roll-call seating puzzle, the
// patroller upstairs (it has to take the beam over the hole too), writing that
// only shows in a flashlight, the principal's safe, Room 4, and a chase to a
// gate that only opens for two.

import { LevelBuilder } from '../build.js';
import { DARK, WALL, KEY, desk, shelf, locker, wardrobe } from './common.js';

export function nightSchool(index) {
  const b = new LevelBuilder({
    mode: 'horror', index, seed: 'night-school', name: 'Midnight School Rules', label: 'Night 1',
    theme: 'twilight', sky: 'day', overrides: DARK,
  });
  const H = 4.2;
  const w = { color: WALL, t: 0.4 };

  // Floors and the ceiling over everything.
  b.floor(-13, 0, 6, 12, 12, { color: '#2e2b29' }); // entrance hall
  b.floor(0, 0, 6, 14, 12, { mat: 'wood', color: '#3b2f27' }); // library
  b.floor(0, 0, 37, 6, 50, { color: '#34322e' }); // main hallway
  b.floor(8, 0, 22, 10, 12, { mat: 'wood', color: '#3b2f27' }); // class 1
  b.floor(-8, 0, 37, 10, 14, { mat: 'wood', color: '#3b2f27' }); // class 3
  b.floor(8, 0, 50, 10, 12, { color: '#1c1a19' }); // room 4 (burnt)
  b.floor(0, 0, 66, 8, 8, { color: '#34322e' }); // stair landing
  b.floor(0, 0, 78.5, 6, 17, { color: '#34322e' }); // upper corridor, before the hole
  b.floor(0, 0, 103.5, 6, 17, { color: '#34322e' }); // after the hole
  b.floor(-8, 0, 79, 10, 14, { mat: 'wood', color: '#3a3029' }); // art room
  b.floor(8, 0, 104, 10, 12, { mat: 'wood', color: '#3b2f27' }); // office
  b.floor(-23, 0, 6, 8, 8, { color: '#26302a' }); // courtyard outside the gate
  b.box(-2.9, H + 0.25, 56, 32.6, 0.5, 112.4, { color: '#1e1d1c' });

  // -- Library (start, safe) and the entrance hall --------------------------------------------
  b.wallX(-19, 7, 0, H, w);
  b.wallX(-19, -7, 12, H, w);
  b.wallGapsZ(0, 12, -19, H, [[6, 3]], { ...w, lintel: 3 });
  b.wallGapsZ(0, 12, -7, H, [[6, 3]], { ...w, lintel: 3 });
  b.wallGapsX(-7, 7, 12, H, [[0, 3]], { ...w, lintel: 3 });
  b.wallZ(0, 12, 7, H, w);
  shelf(b, 6.2, 3.5, 1.2, 5);
  shelf(b, 6.2, 9.2, 1.2, 4);
  shelf(b, -6.2, 2.6, 1.2, 4);
  desk(b, -3.5, 8.5);
  desk(b, 2.5, 7.5);
  b.checkpoint(0, 0, 3.5, 6, { flag: false, hint: "Read the school rules by the library door first. Green areas are safe: it can't get in." });
  b.zone('safe', 0, 1.5, 6, 13.4, 3, 11.4);
  b.sign(-3.4, 2.3, 11.75, "AFTER-HOURS RULES\n1. Lights turn red: freeze.\n2. There is no Room 4.\n3. Seen by the watchman? Run.\n    Lockers are safe.\n4. Hold it in your flashlight\n    and it can't move.\n5. The gate opens only for two.", { fixed: true, yaw: Math.PI, style: 'paper', w: 3.4 });
  b.note(-3.5, 0.8, 8.6, 'Diary, page 1', 'Mei said she once stayed at school past midnight, and the hall lights turned red.\n\nShe stood perfectly still. Something walked right past her.\n\nNobody believed her. I do.');
  b.light(-1.5, 3.9, 5, { color: '#ffe2b0', intensity: 18, dist: 10, flicker: 0.15, fixture: 'bulb' });
  b.light(4, 3.9, 9, { color: '#ffe2b0', intensity: 10, dist: 8, flicker: 0.3, fixture: 'bulb' });

  // Entrance hall: the gate that only opens for two.
  const gateA = b.plate(-15.5, 0, 3.2);
  const gateB = b.plate(-15.5, 0, 8.8);
  b.sign(-13, 2.6, 0.25, 'The gate only opens for two', { fixed: true, yaw: 0, style: 'horror', w: 4.2 });
  b.light(-13, 3.9, 6, { color: '#9dffb5', intensity: 8, dist: 9, flicker: 0.05, fixture: 'tube' });
  b.mark('gateA', -15.5, 0, 3.2);
  b.mark('gateB', -15.5, 0, 8.8);

  // -- Main hallway: the red light ----------------------------------------------------------------
  b.wallGapsZ(12, 62, -3, H, [[37, 2.4]], w);
  b.wallGapsZ(12, 62, 3, H, [[22, 2.4], [50, 2.4]], w);
  b.box(3, 3.6, 50, 0.4, 1.2, 2.4, w); // over Room 4's door
  b.wallGapsX(-4, 4, 62, H, [[0, 3]], { ...w, lintel: 3 });
  const red = b.zone('redlight', 0, 2, 37, 6, 4, 50, { period: 9, red: 3.2, offset: 3, text: 'You moved while the light was red.' });
  for (let z = 15; z <= 59; z += 6) b.light(0, 4.05, z, { color: '#f4f4ff', intensity: 9, dist: 8, flicker: 0.08, fixture: 'tube', rule: red });
  b.sign(0, 3.6, 61.75, 'STAIRS', { fixed: true, yaw: Math.PI, style: 'horror', w: 1.6 });

  // Class 1: empty, except for what's on the board.
  b.room(3, 16, 13, 28, H, { w: null }, w);
  for (const [x, z] of [[6, 19], [9, 19], [6, 23], [9, 23]]) desk(b, x, z);
  b.sign(12.75, 2.2, 22, 'Where is Mei?\nWhere is Mei?\nWhere is Mei?', { fixed: true, yaw: -Math.PI / 2, style: 'chalk', w: 3.2 });
  b.sign(8, 2.4, 27.75, "Don't trust Rule 2", { fixed: true, yaw: Math.PI, style: 'uv', w: 3.4 });
  b.zone('trigger', 9, 1.5, 22, 5, 3, 6, { fx: 'whisper', text: "...I'm here..." });
  b.light(8, 3.9, 22, { color: '#d8e0ff', intensity: 8, dist: 8, flicker: 0.5, fixture: 'tube' });

  // Class 3: the roll-call seating puzzle.
  b.room(-13, 30, -3, 44, H, { e: null }, w);
  const names = ['Lin Mei', 'Wang Jun', 'Anna', 'Chen Kai'];
  const seats = [[-10.5, 33], [-6, 33], [-10.5, 40.5], [-6, 40.5]];
  const seatOf = b.rng.shuffle(names.slice());
  const sw = {};
  seatOf.forEach((name, i) => {
    const [x, z] = seats[i];
    desk(b, x, z);
    b.sign(x, 1.3, z + 0.45, name, { fixed: true, yaw: 0, style: 'paper', w: 0.9 });
    sw[name] = b.pswitch(x + 1.3, 0, z, false, 0.6);
  });
  const seat = b.seq(names.map((n) => sw[n]));
  b.sign(-12.75, 2.3, 37, 'ROLL CALL\nLin Mei, Wang Jun,\nAnna, Chen Kai\n(pound the seat buttons in order)', { fixed: true, yaw: Math.PI / 2, style: 'chalk', w: 3.2 });
  desk(b, -4.6, 43);
  const stairKey = b.item('key', -4.6, 1.1, 43, { color: KEY, label: 'Stairwell Key', when: seat });
  const meiSeat = seats[seatOf.indexOf('Lin Mei')];
  b.note(meiSeat[0], 0.8, meiSeat[1], 'Roll Book', `Lin Mei — absent\nLin Mei — absent\nLin Mei — absent\n\nEvery line is crossed out. Underneath, in pencil:\n"Here. I've always been here."`);
  b.light(-8, 3.9, 37, { color: '#d8e0ff', intensity: 9, dist: 9, flicker: 0.35, fixture: 'tube' });

  // The door marked 4.
  b.room(3, 44, 13, 56, H, { w: null }, w);
  b.sign(2.75, 3.6, 50, '4', { fixed: true, yaw: -Math.PI / 2, style: 'horror', w: 0.9 });
  const room4Key = b.item('key', 0, 0, 0, { color: '#c43a3a', label: 'Room 4 Key' }); // placed in the office safe below
  const room4Lock = b.lock(1.8, 0, 52.5, [room4Key], { label: 'Room 4', radius: 2.4 });
  const room4Door = b.door(3, 50, 2.4, 3, { op: 'all', in: [room4Lock] }, { axis: 'z', latch: true, color: '#3a1d1d', speed: 3 });
  b.acts[b.acts.length - 1].quiet = true;

  // -- Stairwell door, landing (safe), upper corridor -------------------------------------------------
  b.checkpoint(0, 0, 58, 5, { flag: false, hint: 'The stairwell door is just ahead. Something is walking around upstairs.' });
  const stairLock = b.lock(-1.9, 0, 60.5, [stairKey], { label: 'Stairwell Door', radius: 2.4 });
  const stairDoor = b.door(0, 62, 3, 3, { op: 'all', in: [stairLock] }, { latch: true, color: '#2b2f33' });
  b.acts[b.acts.length - 1].toast = 'The stairwell door creaks open...';
  b.room(-4, 62, 4, 70, H, { s: null, n: [[0, 6]] }, w);
  b.checkpoint(0, 0, 65.5, 5, { flag: false, hint: 'The landing is safe. The watchman only walks the corridor: if it sees you, hide in a locker or hold it in your flashlight.' });
  b.zone('safe', 0, 1.5, 65.5, 7.4, 3, 6.6);
  const upstairs = b.zone('trigger', 0, 1.5, 69, 6, 3, 2, { fx: ['apparition', 'whisper'], look: [0, 0, 84], text: 'There — at the end of the hall. Something tall.' });
  b.light(0, 3.9, 66, { color: '#ffd0a0', intensity: 6, dist: 7, flicker: 0.6, fixture: 'bulb' });

  // Upper corridor with lockers, the art room, and a hole where the floor fell in.
  const lockersW = [99.5, 107];
  const lockersE = [76.5, 83.5, 98];
  b.wallGapsZ(70, 112, -3, H, [...lockersW.map((z) => [z, 1.5]), [79, 2.4]], w);
  b.wallGapsZ(70, 112, 3, H, [...lockersE.map((z) => [z, 1.5]), [104, 2.4]], w);
  b.wallX(-3, 3, 112, H, w);
  b.box(3, 3.6, 104, 0.4, 1.2, 2.4, w); // over the office door
  b.box(-3, 3.6, 79, 0.4, 1.2, 2.4, w); // over the art room door
  for (const z of lockersW) locker(b, -3, z, -1, H);
  for (const z of lockersE) locker(b, 3, z, 1, H);
  // Two beams over the hole.
  b.box(-1.5, -0.3, 91, 0.7, 0.6, 8.2, { mat: 'wood', color: '#4a3a2b' });
  b.box(1.5, -0.3, 91, 0.7, 0.6, 8.2, { mat: 'wood', color: '#4a3a2b' });
  b.sign(0, 2.6, 86.6, 'DANGER — FLOOR CAVED IN', { fixed: true, yaw: Math.PI, style: 'horror', w: 2.6 });
  const plateFar = b.plate(0, 0, 101.5);
  const plateNear = b.plate(0, 0, 73.5);
  b.wire(plateFar, [[0, 0, 101.5], [2.2, 0, 101.5], [2.2, 0, 104]]);
  for (const z of [73, 80, 97, 108]) b.light(0, 4.05, z, { color: '#dfe6ff', intensity: 5, dist: 7, flicker: 0.6, fixture: 'tube' });

  // The art room: a mannequin that watches you, and Mei's drawing.
  b.room(-13, 72, -3, 86, H, { e: null }, w);
  b.sign(-3.25, 3.0, 79, 'ART ROOM', { fixed: true, yaw: -Math.PI / 2, style: 'horror', w: 1.6 });
  for (const [x, z] of [[-6, 75.5], [-9.5, 75.5], [-6, 82], [-9.5, 82]]) {
    b.box(x, 0.8, z, 0.9, 1.6, 0.5, { mat: 'wood', color: '#4a3a2b' }); // easels
  }
  b.figure(-12, 0, 84.6, { look: 'mannequin', yaw: Math.PI * 0.8, watch: true });
  b.figure(-12.3, 1.5, 73.2, { look: 'doll', yaw: Math.PI * 0.25, scale: 0.8 });
  shelf(b, -12.3, 73.5, 1.0, 2.6, 1.5);
  wardrobe(b, -11.9, 79, 'e');
  b.sign(-8, 2.5, 85.75, "Mei's birthday: April 17", { fixed: true, yaw: Math.PI, style: 'uv', w: 3.6 });
  b.sign(-8, 3.4, 85.75, 'Art homework: "My Classmates"', { fixed: true, yaw: Math.PI, style: 'paper', w: 3.0 });
  const nArt = b.note(-8, 0.8, 84.2, 'Art Homework — Lin Mei', `Four kids holding hands. A fifth figure stands behind them: very tall, no face.\n\nOn the back:\n"It's afraid of light. I wrote the important things on the walls. Only light can show them."`);
  b.zone('trigger', -8, 1.5, 81, 8, 3, 6, { fx: 'knock', text: 'Knock. Knock. Knock. — Is that coming from the wardrobe?' });
  b.light(-8, 3.9, 79, { color: '#c8d0ff', intensity: 4, dist: 7, flicker: 0.7, fixture: 'bulb' });
  b.mark('artUv', -8, 0, 84);

  // The patroller upstairs. It only walks the corridor and the art room, and
  // crosses the hole on the east beam, slowly.
  const upNodes = [
    [0, 0, 72.5], [0, 0, 78], [0, 0, 84.5], [1.5, 0, 86.6], [1.5, 0, 95.4], [0, 0, 97.5], [0, 0, 103], [0, 0, 110],
    [-1.8, 0, 79], [-6, 0, 79], [-8, 0, 84], [-7.8, 0, 74.4],
  ];
  b.monster({
    look: 'tall', y: 0, nodes: upNodes,
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [1, 8], [8, 9], [9, 10], [9, 11]],
    patrol: [7, 6, 5, 4, 3, 2, 1, 8, 9, 10, 9, 11, 9, 8, 1, 0, 1, 2, 3, 4, 5, 6],
    active: upstairs, wakeAt: [0, 0, 110], start: 7,
    speed: 2.0, chase: 5.0, sight: 12, giveUp: 10, rest: 6,
    area: [[-13, 70, 3, 112]],
  });

  // The principal's office (safe) and its safe.
  b.room(3, 98, 13, 110, H, { w: null }, w);
  const officeDoor = b.door(3, 104, 2.4, 3, { op: 'all', in: [plateFar, plateNear] }, { axis: 'z', latch: true, color: '#3a2c22' });
  b.acts[b.acts.length - 1].toast = 'The office door unlocked.';
  b.checkpoint(8, 0, 105.5, 5, { flag: false, hint: 'The office is safe. The safe needs a 4-digit code.' });
  b.zone('safe', 8, 1.5, 104, 9.4, 3, 11.4);
  desk(b, 9, 108);
  shelf(b, 12.2, 106, 1.2, 4);
  b.box(12, 0.6, 100.2, 1.2, 1.2, 1.2, { mat: 'metal', color: '#3c4048' }); // the safe
  const dials = [5, 6.8, 8.6, 10.4].map((x) => b.dial(x, 0, 100.4, { h: 1.7 }));
  const safe = b.combo(dials, [0, 4, 1, 7]);
  b.sign(7.7, 3.1, 98.25, 'SAFE · 4 digits\n(pound the buttons to turn them)', { fixed: true, yaw: 0, style: 'paper', w: 3.4 });
  b.light(12, 1.6, 100.2, { color: '#7dffb0', intensity: 3, dist: 3, fixture: 'none', when: safe });
  Object.assign(b.items.find((i) => i.id === room4Key), { x: 12, y: 1.4, z: 100.2, when: safe });
  b.note(7.5, 0.8, 108, 'Incident Report', 'The night of the fire. Room 4.\nStudent Lin Mei: missing.\n\nAt 3 a.m. the principal called off the search.\nThe next morning, Rule 2 was added.\nRoom 4 must stay locked forever.\n\n(Tiny writing in the margin: the safe code is now her birthday.)');
  b.note(11.5, 1.6, 107.6, 'Note (different handwriting)', "Rule 2 is a lie.\n\nRoom 4 is the way out.\nI couldn't open the gate alone.\n                    — Mei");
  b.light(9, 3.9, 105, { color: '#ffc27a', intensity: 12, dist: 8, flicker: 0.1, fixture: 'bulb' });
  for (let i = 0; i < 4; i++) b.mark(`dial${i}`, [5, 6.8, 8.6, 10.4][i], 0, 100.4);

  // -- Room 4 and the chase ---------------------------------------------------------------------------
  b.checkpoint(8, 0, 50, 5, { flag: false, hint: 'Find out what happened to Mei. Then — run.' });
  for (const [x, z] of [[6, 47], [9.5, 47.5], [6.5, 52.5]]) desk(b, x, z, 0.4);
  b.box(10.5, 0.15, 53, 2, 0.3, 1.2, { color: '#151312' });
  const nLetter = b.note(11, 0.8, 54.5, 'Burnt Letter', "If you're reading this, there are two of you. Good.\n\nThe gate only opens for two. I was alone.\n\nWhen you leave, it will come after you. When the lights turn red, it has to freeze too. Rules are rules, even for it.\n\nPlease tell them I was here.\n                    — Mei");
  const finale = b.zone('trigger', 10, 1.5, 54.2, 3.5, 3, 2.5, { fx: ['slam', 'lightsOut', 'sting'], text: 'The door slams shut behind you. Run! To the gate!' });
  b.light(11, 3.9, 50, { color: '#ff3030', intensity: 10, dist: 9, flicker: 0.25, fixture: 'bulb' });
  const gate = b.act('gate', { op: 'all', in: [gateA, gateB, finale] }, true, [
    { x: -19, y: 1.5, z: 6, sx: 0.3, sy: 3, sz: 2.9, move: [0, 3.1, 0] },
  ], { speed: 3, color: '#2b2b2b', lamp: [-18.6, 3.4, 6] });
  b.acts[b.acts.length - 1].toast = 'The gate opens — for the two of you.';
  // The chaser comes down the stairs. It hunts the hallway and the entrance
  // hall only (classrooms and the library are out of bounds), freezes under
  // the red light like you, and is gone once the gate opens.
  b.monster({
    look: 'tall', y: 0,
    nodes: [[0, 0, 60], [0, 0, 50], [0, 0, 40], [0, 0, 30], [0, 0, 20], [0, 0, 13], [0, 0, 6], [-4.5, 0, 6], [-10, 0, 6], [-15, 0, 6]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9]],
    patrol: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1], active: finale, until: gate, wakeAt: [0, 0, 61], start: 0,
    speed: 3.0, chase: 5.4, sight: 16, freeze: red, giveUp: 16, rest: 5,
    area: [[-19, 0, -7, 12], [-3, 12, 3, 62]],
  });
  b.goal(-24, 0, 6, -Math.PI / 2, { style: 'exit' });

  b.story = {
    introMs: 9000,
    tagline: 'Rules horror · Stick together',
    intro: {
      kicker: 'Night 1',
      title: 'Midnight School Rules',
      lines: [
        "You both fell asleep in the library. When you wake up, it's past midnight and every door is locked.",
        'A sheet of school rules is taped up by the door. Whoever wrote them pressed so hard the pen tore the paper.',
      ],
      rules: [
        'When the hall lights turn red, freeze.',
        'There is no Room 4. Never open the door marked 4.',
        'If the night watchman sees you, run. Lockers are safe.',
        "Hold it in your flashlight and it can't move.",
        'The school gate opens only for two.',
      ],
    },
    outro: {
      kicker: 'Dawn',
      title: 'Two of You',
      lines: [
        'The gate clangs shut behind you. Inside, the hall lights turn red one last time — and never change back.',
        'The next morning, the janitor finds an old class photo pinned to the library door. In the back row, half-hidden behind the others, a girl is smiling. Her name tag reads: Lin Mei.',
        'On the back: "Thank you for not leaving each other behind."',
      ],
    },
  };
  b.objectives = [
    { text: "Find the stairwell key in Room 3. Don't move when the lights turn red!", done: { item: stairKey } },
    { text: 'Unlock the stairwell door at the end of the hall', done: { act: stairDoor } },
    { text: "Upstairs: find Mei's clue in the art room", done: { note: nArt } },
    { text: 'Cross the beam, then stand on both plates together to open the office', done: { act: officeDoor } },
    { text: "Open the principal's safe (hint: shine a flashlight on the art room wall)", done: { sig: safe } },
    { text: 'Take the key. Rule 2 says never open Room 4... open it', done: { act: room4Door } },
    { text: 'Find out what happened to Mei', done: { note: nLetter } },
    { text: 'Run! Stand on both gate plates together — it only opens for two', done: { act: gate } },
    { text: 'Get out!', done: {} },
  ];
  return b.finish();
}
