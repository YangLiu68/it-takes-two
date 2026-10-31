// Puzzle 8 · Detective Agency: the case of the stolen moonstone.
// Split archive rooms (each of you reads half a letter and half the suspect
// files), a study with a knock code, a safe opened with the suspects' staff
// numbers, a secret passage of invisible stepping stones, the museum (two
// passes, two plates, half a photo each, the fingerprint and the tool marks),
// the guard's timetable up a seesaw, and finally the accusation: who, when,
// and with what. Every answer follows from clues in the level.

import { LevelBuilder } from '../build.js';

const SOL_RED = '#ff6b4a';
const LUNA_BLUE = '#4f86ff';

export function detective(index) {
  const b = new LevelBuilder({ mode: 'puzzle', index, seed: 'detective', name: 'Detective Agency', label: `Room ${index + 1}`, theme: 'workshop', sky: 'dusk' });
  const r = b.rng;
  const H = 9;
  const wall = { color: '#8a6a4a', t: 0.5 };
  const paper = { fixed: true, style: 'paper' };
  const W = Math.PI / 2; // faces +X (a poster on a west wall)
  const E = -Math.PI / 2; // faces -X

  // The case. Ages and staff numbers give the safe code; fingerprints and
  // the timetable give the culprit; the photo halves give the time; the
  // marks on the windowsill give the tool.
  const people = [
    { name: 'Hobbs', job: 'Butler', age: 63, no: 3, print: 'Arch' },
    { name: 'Bruno', job: 'Cook', age: 35, no: 8, print: 'Whorl' },
    { name: 'Molly', job: 'Maid', age: 41, no: 1, print: 'Loop' },
    { name: 'Finn', job: 'Gardener', age: 24, no: 5, print: 'Whorl' },
  ];
  const safeCode = people.slice().sort((a, c) => c.age - a.age).map((p) => p.no);
  const SUSPECTS = ['Hobbs', 'Bruno', 'Finn', 'Molly'];
  const TIMES = ['9:00', '10:00', '11:00', '12:00'];
  // (Short words: the wheel shows each one in big letters.)
  const TOOLS = ['Key', 'Ladder', 'Rope', 'Cane'];

  // -- A. The agency's front room (start) ---------------------------------------------------
  b.floor(0, 0, 7, 18, 14, { mat: 'wood' });
  b.wallX(-9, 9, 0, H, wall);
  b.wallZ(0, 46, -9, H, wall);
  b.wallZ(0, 46, 9, H, wall);
  b.wallGapsX(-9, 9, 14, H, [[-4.5, 3], [4.5, 3]], wall);
  b.field(-4.5, H / 2, 14, 3, H, 0.3, 1);
  b.field(4.5, H / 2, 14, 3, H, 0.3, -1);
  b.sign(-4.5, 5.2, 13.6, 'Sol\'s archive', { style: 'prank', w: 2.6 });
  b.sign(4.5, 5.2, 13.6, 'Luna\'s archive', { style: 'prank', w: 2.6 });
  b.checkpoint(0, 0, 4, 6, { hint: 'Find out who stole the Moonstone, when, and with what tool. The archive is split in two and you can each enter only your own color, so share what you find!' });
  b.sign(0, 3.6, 9.5, 'Case: the museum\'s Moonstone\nwas stolen last night\nWho? When? What tool?', { style: 'prank', w: 5.2 });
  b.box(5.5, 0.4, 4, 1.8, 0.8, 1, { mat: 'wood', color: '#6b4a2f' });
  b.note(5.5, 0.9, 4, 'The Case', 'Dear Detective,\n\nLast night the museum\'s greatest treasure, the Moonstone, was stolen. Only four people were in the building that night: Hobbs the butler, Bruno the cook, Molly the maid and Finn the gardener.\n\nFind out who did it, at what time, and with what tool. Then make your accusation in my office.\n\n— The Inspector');
  b.gem(-7.5, 1.2, 12.5);

  // -- B. The split archive: half a letter and half the suspect files each ---------------------
  b.floor(0, 0, 22, 18, 16, { mat: 'wood', color: '#6b4a2f' });
  b.wallZ(14, 30, 0, H, wall);
  b.wallGapsX(-9, 9, 30, H, [[-4.5, 3], [4.5, 3]], wall);
  b.field(-4.5, H / 2, 30, 3, H, 0.3, 1);
  b.field(4.5, H / 2, 30, 3, H, 0.3, -1);
  b.box(-4.5, H + 0.25, 22, 9.4, 0.5, 16.4, { mat: 'wood', color: '#5a3d26' });
  b.box(4.5, H + 0.25, 22, 9.4, 0.5, 16.4, { mat: 'wood', color: '#5a3d26' });
  // Screens inside both doorways of each room: no reading the clues from outside.
  for (const side of [-1, 1]) {
    b.wallX(side * 2.5, side * 6.5, 16.2, H, wall);
    b.wallX(side * 2.5, side * 6.5, 27.8, H, wall);
  }
  b.light(-4.5, H - 0.6, 22, { color: '#ffe2b0', intensity: 10, dist: 12 });
  b.light(4.5, H - 0.6, 22, { color: '#ffe2b0', intensity: 10, dist: 12 });
  // The knock code: the letter is torn in two. One half says which number is
  // which object; the other half says the order of the numbers.
  const objects = ['Pocket watch', 'Candlestick', 'Globe', 'Cigar box'];
  const numOf = r.shuffle([1, 2, 3, 4]); // numOf[i] = the number written next to objects[i]
  const knock = r.shuffle([0, 1, 2, 3]); // the order of objects to knock
  const profile = (p) => `Suspect file: ${p.name}\n${p.job} · age ${p.age}\nStaff no. ${p.no}`;
  for (const [side, pol, who] of [[-1, W, [people[0], people[1]]], [1, E, [people[2], people[3]]]]) {
    const xw = side * 8.7;
    who.forEach((p, k) => b.sign(xw, 2.6, 18.5 + k * 4.5, profile(p), { ...paper, yaw: pol, w: 3.2 }));
    b.box(side * 6, 0.4, 27, 1.8, 0.8, 1, { mat: 'wood', color: '#6b4a2f' });
    b.note(side * 6, 0.9, 27, `Fingerprint file (${side < 0 ? '1' : '2'})`, who.map((p) => `${p.name}: ${p.print}`).join('\n') + '\n\n(The other two are on file in the room next door.)');
  }
  const order = objects.map((o, i) => `${numOf[i]} = ${o}`).sort();
  b.sign(-0.3, 2.8, 22, `Torn letter (left half)\n...code for the secret door...\n${order.join('\n')}`, { ...paper, yaw: E, w: 3.2 });
  b.sign(0.3, 2.8, 22, `Torn letter (right half)\n...knock in this order...\n${knock.map((i) => numOf[i]).join(' → ')}`, { ...paper, yaw: W, w: 3.2 });
  b.gem(-7.5, 1.2, 15.5);
  b.gem(7.5, 1.2, 15.5);

  // -- C. The study: knock the objects in order -------------------------------------------------
  b.floor(0, 0, 38, 18, 16, { mat: 'wood' });
  b.checkpoint(0, 0, 33, 4, { hint: 'Study: put the two letter halves together — one says which number is which object, the other gives the order to knock. One wrong knock starts it over.' });
  b.sign(0, 3.6, 35.5, 'Secret door\nPound the objects\' buttons in\ncode order (mistakes start over)', { style: 'prank', w: 4.4 });
  const knockSw = objects.map((o, i) => {
    const x = -6 + i * 4;
    b.box(x, 0.5, 41.5, 1.2, 1, 1.2, { mat: 'wood', color: '#5a3d26' });
    b.box(x, 1.25, 41.5, 0.5, 0.5, 0.5, { color: ['#d9b25a', '#f0e6c8', '#4f86ff', '#8a4a2a'][i] });
    b.sign(x, 2.7, 41.5, o, { style: 'prank', w: 1.8 });
    return b.pswitch(x, 0, 39, false, 0.6, '#d9b25a');
  });
  const knockCode = b.seq(knock.map((i) => knockSw[i]));
  b.box(-5.2, 1.8, 45.5, 7.4, 3.6, 0.8, { mat: 'wood', color: '#4a321f' });
  b.box(5.2, 1.8, 45.5, 7.4, 3.6, 0.8, { mat: 'wood', color: '#4a321f' });
  b.wallGapsX(-9, 9, 46, H, [[0, 2.8]], { ...wall, lintel: 3.4 });
  const secretDoor = b.door(0, 46, 2.8, 3.4, { op: 'all', in: [knockCode] }, { latch: true, color: '#4a321f', speed: 3 });
  b.acts[b.acts.length - 1].toast = 'The bookcase slides aside — there is a hidden room!';
  b.gem(7.5, 1.2, 32);

  // -- D. The safe room ---------------------------------------------------------------------------
  b.floor(0, 0, 52, 12, 12, { mat: 'wood', color: '#6b4a2f' });
  b.wallZ(46, 58, -6, H, wall);
  b.wallZ(46, 58, 6, H, wall);
  b.wallGapsX(-6, 6, 58, H, [[0, 2.8]], { ...wall, lintel: 3.4 });
  b.checkpoint(0, 0, 48.6, 3.4, { hint: 'Safe: the code is the four suspects\' staff numbers, oldest first. The files were split between the two rooms, so you each know half.' });
  b.box(0, 0.7, 56.6, 1.4, 1.4, 1.4, { mat: 'metal', color: '#3c4048' });
  const safeDials = [-2.7, -0.9, 0.9, 2.7].map((x) => b.dial(x, 0, 53.4, { h: 1.8 }));
  const safe = b.combo(safeDials, safeCode);
  b.sign(0, 3.8, 53.4, 'Safe: the suspects\' staff numbers,\noldest to youngest', { style: 'prank', w: 3.8 });
  const redPass = b.item('tag', 0, 1.65, 56.6, { who: 0, color: SOL_RED, label: 'Red Pass', when: safe });
  b.box(-4.5, 0.4, 49.5, 1.6, 0.8, 1, { mat: 'wood', color: '#6b4a2f' });
  b.note(-4.5, 0.9, 49.5, 'The Inspector\'s Note', 'The museum gate needs two passes to open.\n\nThe red one is locked in the safe.\nThe blue one... I hid at the end of the secret passage. The path in there is invisible, but the desk lamp will show it.');

  // -- E. The secret passage: invisible stepping stones, shown by the lamp ----------------------
  b.floor(0, 0, 60.5, 8, 5, { mat: 'wood', color: '#5a3d26' });
  b.wallZ(58, 78, -4, H, wall);
  b.wallZ(58, 78, 4, H, wall);
  b.checkpoint(1.6, 0, 60.6, 3.2, { hint: 'Secret passage: hold the lamp plate and the invisible stepping stones show a green outline (red ones are fake). One lights the way, the other crosses!' });
  const lamp = b.plate(-2, 0, 60.5);
  b.sign(-2, 2.6, 60.5, 'Desk lamp\nHold it to light the passage', { style: 'prank', w: 2.4 });
  b.light(-2, 3.2, 60.5, { color: '#ffe9a8', intensity: 6, dist: 10, when: lamp });
  const real = [[1.4, 64.7], [-1.3, 67.6], [1.2, 70.5], [-1.4, 73.4], [1.0, 76.2]];
  for (const [x, z] of real) b.trap('hidden', x, 0, z, 2, 2, { reveal: lamp, color: '#c9a35a' });
  for (const [x, z] of real) b.trap('fake', -x, 0, z, 2, 2, { reveal: lamp, color: '#c9a35a', mat: 'wood' });
  b.sign(0, 3.4, 62.6, 'Watch your step...', { style: 'prank', w: 2.4 });

  // -- F. The museum ---------------------------------------------------------------------------
  // The plaza at the end of the passage: the blue pass, a bridge back, the door.
  b.floor(0, 0, 83, 10, 10, { color: '#9a8a78' });
  const bluePass = b.item('tag', 3, 1.0, 80.5, { who: 1, color: LUNA_BLUE, label: 'Blue Pass' });
  const bridgeSw = b.pswitch(-3, 0, 80, true);
  b.sign(-3, 2.6, 80, 'Pound to raise a\nbridge for your partner', { style: 'prank', w: 2.6 });
  const planks = [];
  for (let i = 0; i < 5; i++) planks.push({ x: 3.1, y: -0.3 - 9, z: 63 + 3 * (i + 0.5), sx: 1.3, sy: 0.6, sz: 2.94, move: [0, 9, 0], delay: i * 0.1 });
  b.act('bridge', { op: 'all', in: [bridgeSw] }, true, planks, { speed: 16, mat: 'toy', color: '#c9a35a', lamp: [-3, 0.5, 79] });
  const gateLock = b.lock(0, 0, 85.8, [redPass, bluePass], { label: 'Museum Gate', radius: 2.4 });
  b.wallGapsX(-12, 12, 88, H, [[0, 3.4]], { ...wall, lintel: 4.6 });
  const museumDoor = b.door(0, 88, 3.4, 4.6, { op: 'all', in: [gateLock] }, { latch: true, color: '#7a5a3a' });
  b.acts[b.acts.length - 1].toast = 'The museum gate opens.';
  b.sign(0, 5.6, 87.6, 'City Museum', { style: 'prank', w: 3 });

  b.floor(0, 0, 106, 24, 36, { color: '#d9cdbb' });
  b.wallZ(88, 112, -12, H, wall);
  b.wallZ(88, 112, 12, H, wall);
  // Entrance hall: both plates at once.
  b.checkpoint(0, 0, 90.4, 3.4, { hint: 'Lobby: both stand on the side plates at once to open the gallery door.' });
  const hallA = b.plate(-7, 0, 92);
  const hallB = b.plate(7, 0, 92);
  b.wallGapsX(-12, 12, 96, H, [[0, 3.4]], { ...wall, lintel: 4.6 });
  const hallDoor = b.door(0, 96, 3.4, 4.6, { op: 'all', in: [hallA, hallB] }, { latch: true, color: '#7a5a3a' });
  b.wire(hallA, [[-7, 0, 92], [-7, 0, 95], [-1.8, 0, 95]]);
  b.wire(hallB, [[7, 0, 92], [7, 0, 95], [1.8, 0, 95]]);
  b.sign(0, 3.4, 93, 'One of you on each plate', { style: 'prank', w: 3.2 });

  // Gallery: the empty case, the windowsill, the tool guide; half a photo in each side room.
  b.checkpoint(0, 0, 98.6, 3.4, { hint: 'Gallery: look for the fingerprint and the marks on the windowsill. Each side room holds half a photo; only together can you work out the time of the theft.' });
  b.wallGapsZ(96, 112, -6, H, [[104, 3]], wall);
  b.wallGapsZ(96, 112, 6, H, [[104, 3]], wall);
  b.fieldZ(-6, H / 2, 104, 3, H, 1);
  b.fieldZ(6, H / 2, 104, 3, H, -1);
  b.box(-9, H + 0.25, 104, 6.4, 0.5, 16.4, { mat: 'wood', color: '#5a3d26' });
  b.box(9, H + 0.25, 104, 6.4, 0.5, 16.4, { mat: 'wood', color: '#5a3d26' });
  b.wallZ(102, 106.4, -7.6, H, wall);
  b.wallZ(102, 106.4, 7.6, H, wall);
  b.light(-9, H - 0.6, 104, { color: '#ffe2b0', intensity: 9, dist: 10 });
  b.light(9, H - 0.6, 104, { color: '#ffe2b0', intensity: 9, dist: 10 });
  b.box(0, 0.6, 102.5, 1.8, 1.2, 1.8, { color: '#cfe8ff' });
  b.sign(0, 2.8, 102.5, 'Empty display case\nFingerprint on the glass: a whorl', { style: 'prank', w: 4.2 });
  b.box(-3.5, 1.1, 111.4, 3, 0.2, 0.8, { mat: 'wood', color: '#6b4a2f' }); // windowsill
  b.sign(-3.5, 2.6, 110.8, 'Windowsill\nTwo square dents, 40 cm apart', { style: 'prank', w: 4.2 });
  b.sign(3.5, 3.0, 109.5, 'Tool guide\nLadder: 2 square feet 40 cm apart\nCane: one small round dent\nRope: one long scuff mark\nKey: no mark (case has no lock)', { style: 'prank', w: 4.6 });
  b.sign(-11.7, 2.8, 104, 'Torn photo (left half)\nThe gallery clock was knocked\nto a stop during the theft.\nHour hand: on a number above 10.', { ...paper, yaw: W, w: 3.6 });
  b.sign(11.7, 2.8, 104, 'Torn photo (right half)\n...the minute hand is on the 12.\nHour hand: on a number below 12.', { ...paper, yaw: E, w: 3.6 });
  b.gem(-9, 1.2, 98);
  b.gem(9, 1.2, 110);

  // Back hall: the seesaw up to the guard's balcony, steps for the partner.
  const HB = 18;
  b.wallGapsX(-12, 12, 112, H, [[0, 3]], { ...wall, lintel: 3.4 });
  b.wallZ(112, 124, -12, HB, wall);
  b.wallZ(112, 124, 12, HB, wall);
  b.wallX(-12, 12, 112, HB - H, { ...wall, y: H });
  b.checkpoint(-7, 0, 114.5, 3.2, { hint: 'The guard room is up on the balcony: one of you stands on one end of the seesaw, the other pounds (C) the other end!' });
  b.seesaw(0, 1.0, 114.5, 9.2, 2.4);
  b.box(0, 4.5, 121, 24, 9, 6, { mat: 'wood', color: '#7a5a3a' });
  const parts = [];
  for (let i = 0; i < 5; i++) {
    const top = (9 * (i + 1)) / 6;
    parts.push({ x: -5.5 + i * 2.3, y: top - 0.4, z: 119.6, sx: 2.2, sy: 0.8, sz: 2, move: [0, 0, -2.6], delay: i * 0.15 });
  }
  const stepSw = b.pswitch(-4.5, 9, 120.5, true);
  const steps = b.act('steps', { op: 'all', in: [stepSw] }, true, parts, { speed: 3, mat: 'toy', color: '#d9b25a', lamp: [-4.5, 9.3, 118.4] });
  b.sign(-4.5, 11.6, 120.5, 'Pound to slide out\nsteps for your partner', { style: 'prank', w: 2.6 });
  b.checkpoint(7, 9, 121, 3.2, { hint: 'The guard log is on the wall. Read it, then head to the Inspector\'s office to name the thief.' });
  b.wallGapsX(-12, 12, 124, HB, [[0, 3]], { ...wall, lintel: 9 + 3.4 });
  b.sign(5, 12.2, 123.7, 'Guard room · Last night\'s log\n9-10 pm  Bruno: kitchen, on camera\n10-11 pm  Finn: watering plants\n11-12 pm  Bruno: at the gate with\nthe guard (the guard confirms)\n11-12 pm  Finn: says he was asleep\n(no witness)\nHobbs & Molly: playing cards in\nthe staff room all night', { ...paper, yaw: Math.PI, w: 6 });
  b.box(-8, 9.4, 122.5, 1.8, 0.8, 1, { mat: 'wood', color: '#6b4a2f' });
  const timetable = b.note(-8, 9.9, 122.5, 'Guard Log (copy)', '9-10 pm  Bruno: in the kitchen (on camera)\n10-11 pm  Finn: watering plants in the greenhouse\n11 pm-midnight  Bruno: at the gate, chatting with the guard (the guard confirms)\n11 pm-midnight  Finn: says he was asleep (no one can confirm)\nHobbs and Molly: playing cards in the staff room all night');
  b.gem(3.4, 12, 115);

  // -- G. The sheriff's office: the accusation --------------------------------------------------
  b.floor(0, 9, 126, 3, 4, { mat: 'wood' });
  b.floor(0, 9, 135, 14, 14, { mat: 'wood', color: '#6b4a2f' });
  b.wallZ(128, 142, -7, H, { ...wall, y: 9 });
  b.wallZ(128, 142, 7, H, { ...wall, y: 9 });
  b.wallGapsX(-7, 7, 128, H, [[0, 3]], { ...wall, y: 9 });
  b.wallGapsX(-7, 7, 142, H, [[0, 3]], { ...wall, y: 9, lintel: 3.6 });
  b.checkpoint(0, 9, 130.2, 3.4, { hint: 'Inspector\'s office: turn the three wheels to name the thief, the time and the tool. The door opens only when all three are right.' });
  b.sign(0, 13, 133, 'Accuse\nWho · When · Tool\n(all three right = the door opens)', { style: 'prank', w: 4.4 });
  const wheels = [[-3, 'Who', SUSPECTS], [0, 'When', TIMES], [3, 'Tool', TOOLS]].map(([x, label, values]) => {
    b.sign(x, 12.4, 136.5, label, { style: 'prank', w: 1.6 });
    return b.dial(x, 9, 136.5, { values, h: 2.0 });
  });
  const culprit = people.filter((p) => p.print === 'Whorl').find((p) => p.name === 'Finn');
  const accuse = b.combo(wheels, [SUSPECTS.indexOf(culprit.name), TIMES.indexOf('11:00'), TOOLS.indexOf('Ladder')]);
  const finalDoor = b.door(0, 142, 3, 3.6, { op: 'all', in: [accuse] }, { y: 9, latch: true, color: '#7a5a3a', speed: 3 });
  b.acts[b.acts.length - 1].toast = 'Case closed! The Inspector unlocks the greenhouse.';

  // The greenhouse: where the moonstone was hidden.
  b.floor(0, 9, 148, 14, 12, { color: '#7fbf7a' });
  b.box(0, 9.5, 152.5, 1.2, 1, 1.2, { mat: 'wood', color: '#6b4a2f' });
  b.box(0, 10.3, 152.5, 0.6, 0.6, 0.6, { color: '#dff4ff' });
  b.light(0, 11.5, 152.5, { color: '#cfe8ff', intensity: 6, dist: 6 });
  b.sign(0, 12, 152.5, 'The Moonstone is found!', { style: 'prank', w: 2.8 });
  b.box(-4, 9.5, 151, 2.6, 1, 1, { color: '#4a8a4a' });
  b.box(4, 9.5, 151, 2.6, 1, 1, { color: '#4a8a4a' });
  b.box(5.5, 10.6, 146, 0.3, 3.2, 0.3, { mat: 'wood' }); // the ladder
  b.box(5.9, 10.6, 146, 0.3, 3.2, 0.3, { mat: 'wood' });
  b.note(-4, 10.1, 151, 'Finn\'s Diary', '"Hobbs always says the Moonstone is just a rock. But in moonlight it glows blue, like the river by my house when I was little.\nI only wanted it in the greenhouse for one night. I was going to put it back at dawn..."\n\n(A ladder rental slip is tucked inside the diary.)');
  b.goal(0, 9, 147);

  b.objectives = [
    { text: 'Split up in the archive: each into the room of your color, then tell each other what you read', done: { cp: 1 } },
    { text: 'Study: join the two letter halves for the code, then pound the buttons by the objects in order', done: { sig: knockCode } },
    { text: 'Safe: enter the four suspects\' staff numbers, oldest first', done: { sig: safe } },
    { text: 'Secret passage: one holds the lamp to show the hidden path, the other crosses for the pass', done: { item: bluePass } },
    { text: 'Open the museum gate with both passes', done: { act: museumDoor } },
    { text: 'Lobby: both hold a plate at once', done: { act: hallDoor } },
    { text: 'Gallery: check the fingerprint and the windowsill; each side room has half a photo', done: { cp: 6 } },
    { text: 'Seesaw up to the balcony and read the guard log', done: { note: timetable } },
    { text: 'Inspector\'s office: name the thief, the time and the tool', done: { sig: accuse } },
    { text: 'Walk into the greenhouse together and recover the Moonstone!', done: {} },
  ];
  void secretDoor; void finalDoor; void steps;
  return b.finish();
}
