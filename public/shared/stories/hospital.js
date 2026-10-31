// Story 4 · Mercy Hospital: a hospital closed twenty years ago,
// still keeping its ward rules. Three floors, joined by lifts:
//   1F  the registration hall: a visitor's pass behind the counter
//   4F  the ward corridor and the night nurse (the trolley rule, curtained
//       beds, the nurses' station), two wings only one of you can enter,
//       each with half of the pharmacy code
//   B1  the basement that "doesn't exist": the morgue (something that only
//       moves while nobody watches it), the power room, the operating theatre,
//       and a chase to the emergency exit.

import { LevelBuilder } from '../build.js';
import { DARK, desk, shelf } from './common.js';

const H = 4.2;
const WALL = '#4f5853';
const TILE = '#2e3533';
const CURTAIN = '#6f8a83';

// A bed behind a curtain on three sides. You can squeeze in beside the bed
// and the nurse won't see you. The open side faces south (-Z).
function curtainBed(b, x, z) {
  const m = { color: CURTAIN };
  b.box(x, 1.2, z + 1.3, 2.6, 2.4, 0.06, m); // back
  b.box(x - 1.3, 1.2, z, 0.06, 2.4, 2.6, m); // sides
  b.box(x + 1.3, 1.2, z, 0.06, 2.4, 2.6, m);
  b.box(x - 0.85, 1.2, z - 1.3, 0.9, 2.4, 0.06, m); // half-drawn front curtain
  b.box(x - 0.55, 0.3, z + 0.1, 1.0, 0.6, 2.0, { mat: 'metal', color: '#3c4046' });
  b.box(x - 0.55, 0.64, z + 0.1, 0.92, 0.1, 1.9, { color: '#9aa39b' });
  b.box(x - 0.55, 0.74, z + 0.85, 0.7, 0.12, 0.35, { color: '#c9cfc6' }); // pillow
  b.zone('hide', x + 0.6, 1.2, z - 0.1, 1.1, 2.4, 2.2);
}

// A row of waiting-room chairs along X.
function chairs(b, x0, z, n) {
  for (let i = 0; i < n; i++) {
    b.box(x0 + i * 0.75, 0.42, z, 0.62, 0.08, 0.6, { color: '#3d5a6a' });
    b.box(x0 + i * 0.75, 0.75, z + 0.28, 0.62, 0.6, 0.06, { color: '#3d5a6a' });
  }
  b.box(x0 + (n - 1) * 0.375, 0.2, z, n * 0.75, 0.4, 0.1, { mat: 'metal', color: '#2c3034' });
}

export function hospital(index) {
  const b = new LevelBuilder({
    mode: 'horror', index, seed: 'hospital', name: 'Mercy Hospital', label: 'Night 4',
    theme: 'twilight', sky: 'day', overrides: { ...DARK, fogDensity: 0.06, hemiIntensity: 0.36, hemiSky: '#1a2a28' },
  });
  const w = { color: WALL, t: 0.4 };
  const door = { ...w, lintel: 3 };

  // ============================== 1F · Outpatient lobby ===============================
  b.floor(0, 0, 8, 20, 16, { color: TILE });
  b.floor(6, 0, 18, 3.6, 4, { color: '#3a3a3a' }); // lift car
  b.box(0, H + 0.25, 10, 20.4, 0.5, 20.4, { color: '#1b1f1e' });
  b.wallX(-10, 10, 0, H, w);
  b.wallZ(0, 16, -10, H, w);
  b.wallZ(0, 16, 10, H, w);
  b.wallGapsX(-10, 10, 16, H, [[6, 3.2]], { ...w, lintel: 3.2 });
  b.wallZ(16, 20, 4.2, H, { ...w, color: '#5e5f60' });
  b.wallZ(16, 20, 7.8, H, { ...w, color: '#5e5f60' });
  b.wallX(4.2, 7.8, 20, H, { ...w, color: '#5e5f60' });
  // Behind the registration counter.
  b.wallZ(9, 16, -4, H, w);
  b.wallGapsX(-10, -4, 9, H, [[-7, 2.4]], door);
  b.sign(-3.75, 1.9, 12.5, 'REGISTRATION\n(closed)', { fixed: true, yaw: -Math.PI / 2, style: 'paper', w: 1.8 });
  b.checkpoint(0, 0, 3, 6, { flag: false, hint: "Read the ward rules on the wall first. The visitor's pass is inside Registration: one of you holds the plate, the other goes in for it." });
  b.sign(-9.75, 2.4, 4.5, "WARD RULES\n1. Visitors: get a pass first.\n2. Red light = trolley. Freeze.\n3. Rounds: hide behind curtains.\n4. The nurses' station is safe.\n5. Someone calls your name?\n    Don't answer.\n6. Flashlight on her: she stops.\n7. There is no basement.", { fixed: true, yaw: Math.PI / 2, style: 'paper', w: 3.6 });
  b.sign(-7, 3.5, 8.8, 'REGISTRATION', { fixed: true, yaw: 0, style: 'horror', w: 1.8 });
  b.sign(0, 3.4, 15.75, 'NOW SERVING: 13', { fixed: true, yaw: Math.PI, style: 'horror', w: 2.2 });
  chairs(b, -2.5, 4.5, 5);
  chairs(b, 3, 4.5, 4);
  chairs(b, 3, 8, 4);
  const gatePlate = b.plate(5, 0, 11.5);
  b.sign(5, 2.3, 11.5, 'Hold: opens Registration', { style: 'horror', w: 2.4 });
  b.wire(gatePlate, [[5, 0, 11.5], [-2, 0, 11.5], [-2, 0, 8.4], [-7, 0, 8.4]]);
  const exitSw = b.pswitch(-6, 0, 11.2, false, 4);
  b.door(-7, 9, 2.4, 3, { op: 'any', in: [gatePlate, exitSw] }, { latch: false, color: '#3a4440', speed: 9 });
  b.sign(-6, 2.2, 11.2, 'Way out:\npound this button', { style: 'horror', w: 2 });
  desk(b, -8.5, 14.5);
  shelf(b, -9.3, 10.5, 1.2, 2.4, 2.4);
  const pass = b.item('card', -8.5, 1.1, 14.5, { color: '#7fd1ff', label: "Visitor's Pass" });
  b.box(-5.4, 0.4, 15.2, 0.9, 0.8, 0.8, { mat: 'wood', color: '#3a2c22' });
  b.note(-5.4, 0.85, 15.2, 'Registration Stub', "March 15, 2004\nDept: Inpatient Ward, Floor 4\nPatient: Lin Xiao, age 7, Bed 13\nGuardian signature: (blank)\n\nIn pencil on the back: Mom said she'd pick me up after work.");
  b.zone('trigger', 0, 1.5, 9, 8, 3, 4, { fx: 'whisper', text: "...A voice is calling your name. Don't answer." });
  b.light(0, 3.9, 6, { color: '#cfe8e0', intensity: 9, dist: 11, flicker: 0.25, fixture: 'tube' });
  b.light(-7, 3.6, 13, { color: '#ffe0b0', intensity: 6, dist: 7, flicker: 0.1, fixture: 'bulb' });
  b.light(6, 3.6, 14, { color: '#b0ffd8', intensity: 4, dist: 6, flicker: 0.5, fixture: 'tube' });
  // The lift: the pass calls it. It only goes to 4F.
  const liftLock = b.lock(3.4, 0, 14.6, [pass], { label: 'Elevator', radius: 2.4 });
  const liftDoor = b.door(6, 16, 3, 3.2, { op: 'all', in: [liftLock] }, { latch: true, color: '#7a7d80', speed: 3 });
  b.acts[b.acts.length - 1].toast = 'Ding — the elevator doors open.';
  b.sign(6, 3.75, 15.75, 'WARDS · 4F', { fixed: true, yaw: Math.PI, style: 'horror', w: 2 });
  b.zone('warp', 6, 1.5, 18.7, 3, 3, 2.4, { when: liftLock, both: true, to: [0, 0, 42.6, 0], text: 'The doors close. The floor numbers tick up one by one: 1... 2... 3... 4.' });
  b.mark('gatePlate', 5, 0, 11.5);
  b.mark('pass', -7.3, 0, 14.5);

  // ============================== 4F · Inpatient ward =================================
  b.floor(0, 0, 43, 8, 6, { color: TILE }); // lift lobby
  b.floor(0, 0, 49, 56, 6, { color: '#2f3836' }); // corridor
  b.floor(0, 0, 56, 56, 8, { color: '#2a302e' }); // wards + nurses' station
  b.floor(-21, 0, 40, 14, 12, { color: '#2b3236' }); // radiology
  b.floor(21, 0, 40, 14, 12, { color: '#30302b' }); // records
  b.floor(10, 0, 40, 8, 12, { color: '#2d332f' }); // pharmacy
  b.floor(30, 0, 49, 4, 4, { color: '#3a3a3a' }); // freight lift car
  b.box(2, H + 0.25, 47, 60.4, 0.5, 26.4, { color: '#1b1f1e' });
  // Lobby.
  b.checkpoint(0, 0, 42.6, 4, { flag: false, hint: 'When the lights turn red, a trolley is passing down the hall: freeze. If the nurse sees you, hide behind a bed curtain or hold her in your flashlight.' });
  b.wallX(-4, 4, 40, H, { ...w, color: '#5e5f60' });
  b.wallZ(40, 46, -4, H, w);
  b.wallZ(40, 46, 4, H, w);
  b.box(0, 1.6, 40.25, 3, 3.2, 0.1, { mat: 'metal', color: '#7a7d80' }); // the lift doors, shut
  // Corridor walls.
  b.wallGapsX(-28, 28, 46, H, [[0, 8], [-21, 3], [10, 2.6], [21, 3]], door);
  b.wallGapsX(-28, 28, 52, H, [[-24, 2.2], [-16, 2.2], [-8, 2.2], [0, 3], [8, 2.2], [16, 2.2], [24, 2.2]], door);
  b.wallZ(46, 52, -28, H, w);
  b.wallGapsZ(46, 52, 28, H, [[49, 3]], { ...w, lintel: 3.2 });
  // Wards (401–407, there is no 404) and the nurses' station.
  b.wallX(-28, 28, 60, H, w);
  for (const x of [-20, -12, -4, 4, 12, 20]) b.wallZ(52, 60, x, H, w);
  b.wallX(-4, 4, 59, H, w);
  const wards = [[-24, '401'], [-16, '402'], [-8, '403'], [8, '405'], [16, '406'], [24, '407']];
  for (const [x, n] of wards) {
    b.sign(x, 3.5, 51.75, n, { fixed: true, yaw: Math.PI, style: 'paper', w: 0.9 });
    curtainBed(b, x - 2, 56.6);
    curtainBed(b, x + 2, 56.6);
    b.light(x, 3.9, 56, { color: '#cfe0d8', intensity: 3, dist: 6, flicker: 0.6, fixture: 'tube' });
  }
  b.sign(-8, 2.4, 52.3, 'Bed 13 →', { fixed: true, yaw: 0, style: 'uv', w: 1.4 });
  // The nurses' station: safe.
  b.box(-2.75, 0.55, 53.2, 2.5, 1.1, 0.6, { color: '#c9cfc6' });
  b.box(2.75, 0.55, 53.2, 2.5, 1.1, 0.6, { color: '#c9cfc6' });
  b.zone('safe', 0, 1.5, 56, 7.4, 3, 5.6);
  b.checkpoint(0, 0, 56.6, 4, { flag: false, hint: "The nurses' station is safe; she won't come in. Sol goes to Radiology (red barrier), Luna to Records (blue barrier). Each finds half of the pharmacy code." });
  b.sign(0, 2.4, 58.75, "ROUNDS\n401 → 402 → 403 → 405 → 406 → 407\nBed 13: hourly. Don't wake her.", { fixed: true, yaw: Math.PI, style: 'paper', w: 3.6 });
  b.note(-2.75, 1.2, 53.2, "Nurses' Handover Log", "Bed 13, Lin Xiao, age 7.\nAsked again today when her mom is coming for her. I said soon.\n\nI'll bring her night meds myself. — Nurse Zhou\n\n(The last page is dated twenty years ago. The writing below it goes on until today, fainter and fainter.)");
  b.light(0, 3.9, 56, { color: '#ffe8c0', intensity: 8, dist: 8, flicker: 0.05, fixture: 'bulb' });
  // The trolley rule over the whole corridor.
  const cart = b.zone('redlight', 0, 2, 49, 56, 4, 6, { period: 11, red: 3, offset: 5, text: 'You moved while the trolley was passing.' });
  for (let x = -24; x <= 24; x += 8) b.light(x, 4.05, 49, { color: '#e8fff4', intensity: 7, dist: 8, flicker: 0.1, fixture: 'tube', rule: cart });
  const meet = b.zone('trigger', 0, 1.5, 46.8, 8, 3, 1.4, { fx: ['apparition', 'whisper'], look: [24, 0, 49], text: 'At the end of the hall, a trolley glides past on its own. Someone is pushing it.' });
  // The night nurse: corridor and wards only, freezes when the trolley passes too.
  const nn = [
    [-26, 0, 49], [-24, 0, 49], [-16, 0, 49], [-8, 0, 49], [0, 0, 49], [8, 0, 49], [16, 0, 49], [24, 0, 49], [26, 0, 49],
    [-24, 0, 54.2], [-16, 0, 54.2], [-8, 0, 54.2], [8, 0, 54.2], [16, 0, 54.2], [24, 0, 54.2],
  ];
  const freightLock = b.lock(26, 0, 47.2, [], { label: 'Freight Elevator', radius: 2.4 }); // key added below
  b.monster({
    look: 'nurse', y: 0, nodes: nn,
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [1, 9], [2, 10], [3, 11], [5, 12], [6, 13], [7, 14]],
    patrol: [8, 7, 14, 7, 6, 5, 12, 5, 4, 3, 11, 3, 2, 1, 9, 1, 0, 1, 2, 10, 2, 3, 4, 5, 6, 13, 6, 7],
    active: meet, until: freightLock, wakeAt: [26, 0, 49], start: 8,
    speed: 2.4, chase: 5.0, sight: 13, giveUp: 10, rest: 6, freeze: cart,
    area: [[-28, 46, 28, 60]],
  });

  // Radiology (Sol only): an X-ray light box, and writing only a flashlight shows.
  b.room(-28, 34, -14, 46, H, { n: null }, w);
  b.field(-21, H / 2, 46, 3, H, 0.3, 1);
  b.sign(-21, 3.6, 46.25, 'RADIOLOGY · Sol only', { fixed: true, yaw: 0, style: 'horror', w: 2.8 });
  for (const z of [37, 40, 43]) {
    b.box(-27.6, 2.0, z, 0.2, 1.4, 2.2, { color: '#1c2a33' });
    b.light(-27.2, 2.0, z, { color: '#9fd8ff', intensity: 2.5, dist: 4, flicker: 0.3, fixture: 'none' });
  }
  b.sign(-27.45, 2.0, 40, 'X-RAY: Bed 13, Lin Xiao\nChest, front view', { fixed: true, yaw: Math.PI / 2, style: 'chalk', w: 2 });
  b.sign(-21, 2.3, 34.25, 'PHARMACY LOCK\n1st digit: 2    2nd digit: 0', { fixed: true, yaw: 0, style: 'uv', w: 3.2 });
  b.box(-17, 0.5, 38, 2.4, 1.0, 1.4, { mat: 'metal', color: '#4a5058' }); // the X-ray machine
  b.box(-17, 2.2, 38, 0.5, 2.4, 0.5, { mat: 'metal', color: '#4a5058' });
  b.figure(-15, 0, 35.2, { look: 'mannequin', yaw: -Math.PI * 0.75, watch: true });
  desk(b, -24, 36);
  const nXray = b.note(-24, 0.8, 36.1, 'Radiology Report', "Patient: Lin Xiao, Bed 13\nDiagnosis: (blacked out)\n\nNotes: patient keeps leaving the ward alone at night, saying she's going to wait for her mom by the elevator.\n\nIn red pen on the back: She split the pharmacy code in two and hid the halves. One half is here, on the wall. Only light can show it.");
  b.light(-21, 3.9, 40, { color: '#9fb6ff', intensity: 3, dist: 7, flicker: 0.4, fixture: 'tube' });
  b.mark('xray', -21, 0, 36.6);

  // Records (Luna only): the other half of the code.
  b.room(14, 34, 28, 46, H, { n: null }, w);
  b.field(21, H / 2, 46, 3, H, 0.3, -1);
  b.sign(21, 3.6, 46.25, 'RECORDS · Luna only', { fixed: true, yaw: 0, style: 'horror', w: 2.8 });
  for (const x of [16, 19, 23, 26]) shelf(b, x, 36, 1.4, 2.6, 3);
  shelf(b, 27.3, 41, 1.2, 4, 3);
  desk(b, 19, 42);
  b.sign(21, 2.2, 34.25 + 1.35, 'Prescription (right half)\n...3rd digit: 0    4th digit: 4', { fixed: true, yaw: 0, style: 'paper', w: 3 });
  const nRecord = b.note(19, 0.8, 42.1, 'Medical File — Lin Xiao', `Admitted: March 1, 2004\nBed: 13\n\n"Patient has improved and may be discharged. Awaiting guardian's signature."\n\nNo guardian ever came.\n\nA slip tucked in the file: I can never remember the pharmacy code, so I'll just remember that year.`);
  b.figure(26.6, 0, 44.6, { look: 'doll', yaw: -Math.PI * 0.75, scale: 0.85 });
  b.light(21, 3.9, 40, { color: '#ffd9a0', intensity: 3.5, dist: 7, flicker: 0.5, fixture: 'bulb' });
  b.mark('records', 19, 0, 43.4);

  // The pharmacy: four dials in the doorway, the head nurse's keys inside.
  b.wallZ(34, 46, 6, H, w); // (its east wall is the records room's)
  b.wallX(6, 14, 34, H, w);
  b.wallGapsX(6, 14, 43, H, [[10, 2.4]], door);
  const dx = [7.4, 9.1, 10.8, 12.5];
  const dials = dx.map((x) => b.dial(x, 0, 44.4, { h: 1.6 }));
  const code = b.combo(dials, [2, 0, 0, 4]);
  b.sign(10, 3.3, 43.25, 'PHARMACY · 4-digit code\n(pound the buttons to turn them)', { fixed: true, yaw: 0, style: 'paper', w: 3 });
  const pharmDoor = b.door(10, 43, 2.4, 3, { op: 'all', in: [code] }, { latch: true, color: '#3c4a46' });
  b.acts[b.acts.length - 1].toast = 'Click. The pharmacy door opens.';
  b.box(10, 0.5, 36.4, 3, 1.0, 0.8, { color: '#c9cfc6' }); // counter
  for (const x of [7, 13]) shelf(b, x, 39, 1.2, 4, 3);
  const freightKey = b.item('key', 10, 1.3, 36.4, { color: '#c0c6cc', label: 'Freight Elevator Key' });
  b.locks.find((l) => l.id === freightLock).accepts.push(freightKey);
  const nPharm = b.note(8.6, 1.05, 36.4, 'Medication Record', "Bed 13, Lin Xiao\nMarch 15, 2004, 3:15 a.m. — medication stopped.\n\nRemains held: B1, cold drawer 6.\nDischarge certificate: not issued.\n\n(The head nurse's keys hang on the counter. The freight elevator key is wound round and round with red thread.)");
  b.light(10, 3.9, 39, { color: '#e0fff0', intensity: 5, dist: 7, flicker: 0.2, fixture: 'tube' });
  for (let i = 0; i < 4; i++) b.mark(`dial${i}`, dx[i], 0, 44.4);

  // The freight lift at the end of the corridor: down to the floor that doesn't exist.
  b.wallZ(47, 51, 32, H, { ...w, color: '#5e5f60' });
  b.wallX(28, 32, 47, H, { ...w, color: '#5e5f60' });
  b.wallX(28, 32, 51, H, { ...w, color: '#5e5f60' });
  const freightDoor = b.door(28, 49, 3, 3.2, { op: 'all', in: [freightLock] }, { axis: 'z', latch: true, color: '#6a6d70', speed: 3 });
  b.acts[b.acts.length - 1].toast = 'The freight elevator opens. There is only one button: B1.';
  b.sign(27.75, 3.75, 49, 'FREIGHT', { fixed: true, yaw: -Math.PI / 2, style: 'horror', w: 1.4 });
  b.zone('warp', 30.3, 1.5, 49, 2.4, 3, 3, { when: freightLock, both: true, to: [0, 0, 98.4, 0], text: 'The freight elevator goes down. Display: 1... B1. But the rules said this hospital has no basement.' });

  // ============================== B1 · The basement ===================================
  b.floor(0, 0, 98, 6, 4, { color: '#262b2a' }); // freight lift exit
  b.floor(0, 0, 118, 6, 36, { color: '#262b2a' }); // corridor
  b.floor(-10, 0, 112, 14, 16, { color: '#232a2d' }); // morgue
  b.floor(8, 0, 112, 10, 10, { color: '#2a2a26' }); // power room
  b.floor(7, 0, 102, 8, 8, { color: '#283028' }); // emergency stairs
  b.floor(0, 0, 142, 12, 12, { color: '#2c3332' }); // operating theatre
  b.box(-2, H + 0.25, 122, 30.4, 0.5, 52.4, { color: '#181b1b' });
  b.wallX(-3, 3, 96, H, { ...w, color: '#5e5f60' });
  b.wallZ(96, 100, -3, H, w);
  b.wallZ(96, 98, 3, H, w);
  b.wallGapsZ(100, 136, -3, H, [[112, 2.4]], door);
  b.wallGapsZ(98, 136, 3, H, [[102, 2.4], [112, 2.4]], door);
  b.checkpoint(0, 0, 98.6, 4, { flag: false, hint: "The emergency exit is right here, but it's locked. Go to the morgue first: one of you keeps your eyes on that thing, the other searches the drawers." });
  b.sign(1.5, 3.4, 99, 'EMERGENCY EXIT →', { fixed: true, yaw: -Math.PI / 2, style: 'horror', w: 1.8 });
  for (const z of [104, 118, 130]) b.light(0, 4.05, z, { color: '#d0e0ff', intensity: 4, dist: 8, flicker: 0.5, fixture: 'tube' });

  // The morgue.
  b.wallX(-17, -3, 104, H, w);
  b.wallX(-17, -3, 120, H, w);
  b.wallZ(104, 120, -17, H, w);
  b.sign(-3.25, 3.3, 112, 'MORGUE', { fixed: true, yaw: -Math.PI / 2, style: 'horror', w: 1.6 });
  const dz = (i) => 104.8 + i * 1.6; // cold drawer i (1–8)
  let keyDrawer = null;
  const drawers = [];
  for (let i = 1; i <= 8; i++) {
    for (const [y, sy] of [[0.55, 1.0], [1.75, 1.0], [2.95, 1.0]]) b.box(-16.4, y, dz(i), 1.2, sy - 0.08, 1.48, { mat: 'metal', color: '#7b858c' });
    b.sign(-15.78, 1.15, dz(i), String(i), { fixed: true, yaw: Math.PI / 2, style: 'paper', w: 0.5 });
    const s = b.pswitch(-15, 0, dz(i), true);
    drawers.push(s);
    if (i === 6) keyDrawer = s;
    else b.figure(-14.0, 0, dz(i), { look: 'mannequin', yaw: Math.PI / 2, when: s });
  }
  b.sign(-12, 3.2, 104.25, "Find the one you're looking for.\nPound the button at her drawer.", { fixed: true, yaw: 0, style: 'paper', w: 3.6 });
  b.box(-8, 0.27, 108, 2.2, 0.55, 1.0, { mat: 'metal', color: '#8a9298' }); // low steel tables
  b.box(-8, 0.27, 116, 2.2, 0.55, 1.0, { mat: 'metal', color: '#8a9298' });
  b.box(-8, 0.56, 116, 1.8, 0.06, 0.8, { color: '#d8dcd6' }); // a sheet over something
  const orKey = b.item('key', -15.3, 1.2, dz(6), { color: '#d9b25a', label: 'Operating Room Key', when: keyDrawer });
  desk(b, -5.2, 117.5);
  const nDiary = b.note(-5.2, 0.8, 117.6, "Nurse Zhou's Diary", "I promised her I'd wait with her until the day she went home.\n\nShe left us at 3:15 in the morning. I wrote that time on the power room wall, so I'd think of her every night when I threw the switches.\n\nI left her discharge certificate in the operating room. Someone has to sign it for her.");
  const morgueIn = b.zone('trigger', -4.6, 1.5, 112, 2.4, 3, 3, { fx: ['sting'], look: [-11, 0, 118.5], text: "The table under the white sheet... is empty. It's standing in the corner. Don't look away." });
  b.monster({
    look: 'mannequin', y: 0, seen: true,
    nodes: [[-6, 0, 106], [-6, 0, 112], [-6, 0, 118.5], [-11, 0, 106], [-11, 0, 112], [-11, 0, 118.5]],
    edges: [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [1, 4], [2, 5]],
    patrol: [5, 2, 1, 4, 3, 0, 1, 4, 5],
    active: morgueIn, until: keyDrawer, wakeAt: [-11, 0, 118.5], start: 5,
    speed: 2.0, chase: 3.8, sight: 20, giveUp: 12, rest: 5,
    area: [[-17, 104, -3, 120]],
  });
  b.light(-10, 3.9, 112, { color: '#9ec8ff', intensity: 4, dist: 9, flicker: 0.45, fixture: 'tube' });
  b.mark('drawer6', -15, 0, dz(6));
  b.mark('watch', -5, 0, 110.6);

  // The power room: breakers 1–5; the order is the time she died.
  b.wallX(3, 13, 107, H, w);
  b.wallX(3, 13, 117, H, w);
  b.wallZ(107, 117, 13, H, w);
  b.sign(3.25, 3.3, 112, 'POWER ROOM', { fixed: true, yaw: Math.PI / 2, style: 'horror', w: 1.6 });
  const bx = [4.8, 6.6, 8.4, 10.2, 12.0];
  const breakers = bx.map((x, i) => {
    b.box(x, 2.2, 116.7, 1.0, 1.4, 0.3, { mat: 'metal', color: '#4c5258' });
    b.sign(x, 3.25, 116.5, String(i + 1), { fixed: true, yaw: Math.PI, style: 'paper', w: 0.6 });
    return b.pswitch(x, 0, 115.6, false, 0.8, '#ffd23f');
  });
  const power = b.seq([breakers[2], breakers[0], breakers[4]]);
  b.sign(8, 2.6, 107.25, 'OPERATING ROOM POWER\nPound the time she left:\nhour first, then minutes\n(e.g. 2:47 → pound 2, 4, 7)', { fixed: true, yaw: 0, style: 'paper', w: 3.8 });
  b.light(8, 3.9, 112, { color: '#ffe6a0', intensity: 4, dist: 7, flicker: 0.3, fixture: 'bulb' });
  b.light(0, 3.6, 135, { color: '#ff4040', intensity: 5, dist: 7, flicker: 0.1, fixture: 'bulb', when: power });
  for (let i = 0; i < 5; i++) b.mark(`breaker${i + 1}`, bx[i], 0, 115.6);

  // The operating theatre: power and the key.
  b.wallGapsX(-6, 6, 136, H, [[0, 2.6]], door);
  b.wallX(-6, 6, 148, H, w);
  b.wallZ(136, 148, -6, H, w);
  b.wallZ(136, 148, 6, H, w);
  const orLock = b.lock(-1.9, 0, 134.2, [orKey], { label: 'Operating Room', radius: 2.4 });
  const orDoor = b.door(0, 136, 2.6, 3, { op: 'all', in: [orLock, power] }, { latch: true, color: '#3a4a48', speed: 3 });
  b.acts[b.acts.length - 1].toast = 'The operating room lights come on. The door slides slowly open.';
  b.sign(0, 3.6, 135.75, 'OPERATING ROOM', { fixed: true, yaw: Math.PI, style: 'horror', w: 1.6 });
  b.checkpoint(0, 0, 138.6, 4, { flag: false, hint: 'The discharge certificate is on the operating table. Grab it, then run back to the emergency exit.' });
  b.box(0, 0.45, 142.5, 1.0, 0.9, 2.2, { mat: 'metal', color: '#8a9298' }); // operating table
  b.box(-5, 0.45, 145.6, 1.0, 0.9, 2.2, { mat: 'metal', color: '#8a9298' }); // a trolley in the far corner
  b.box(-5, 1.0, 145.6, 0.9, 0.2, 2.0, { color: '#e2e4de' }); // under a sheet
  const cert = b.item('paper', 0, 1.15, 142.5, { color: '#f4efe0', label: 'Discharge Certificate' });
  b.note(-4.6, 0.8, 140.2, 'Surgery Record (last page)', 'March 15, 2004, 3:15 a.m.\nResuscitation failed.\n\nBelow, one more line in very neat handwriting:\n"I will keep her discharge certificate. Whoever comes for her gets it."\n                    — Head Nurse Zhou');
  desk(b, -4.6, 140.2);
  const finale = b.zone('trigger', 1.2, 1.5, 142.5, 1.6, 3, 2.6, { fx: ['slam', 'lightsOut', 'sting'], text: 'The sheet slides off the trolley. The head nurse sits up. Run! To the emergency exit!' });
  b.light(0, 3.8, 142.5, { color: '#f4fbff', intensity: 14, dist: 9, flicker: 0.15, fixture: 'bulb', when: power });
  b.mark('cert', 1.0, 0, 142.5);

  // The emergency exit: the discharge certificate opens it.
  b.wallX(3, 11, 98, H, w);
  b.wallX(3, 11, 106, H, w);
  b.wallZ(98, 106, 11, H, w);
  const exitLock = b.lock(1.6, 0, 104.6, [cert], { label: 'Emergency Exit', radius: 2.4 });
  const exitDoor = b.door(3, 102, 2.4, 3, { op: 'all', in: [exitLock] }, { axis: 'z', latch: true, color: '#2a5a3a', speed: 4 });
  b.acts[b.acts.length - 1].toast = "The emergency exit opens. It's raining outside.";
  b.light(7, 3.6, 102, { color: '#7dffa0', intensity: 6, dist: 8, flicker: 0, fixture: 'tube', when: exitLock });
  // The head nurse: the corridor and the theatre, until the exit opens.
  b.monster({
    look: 'nurse', y: 0,
    nodes: [[-3.6, 0, 146.8], [0, 0, 140], [0, 0, 137.4], [0, 0, 130], [0, 0, 122], [0, 0, 114], [0, 0, 106], [0, 0, 101]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]],
    patrol: [7, 6, 5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5, 6],
    active: finale, until: exitLock, wakeAt: [-3.6, 0, 146.8], start: 0,
    speed: 3.0, chase: 5.2, sight: 18, giveUp: 14, rest: 5,
    area: [[-6, 136, 6, 148], [-3, 100, 3, 136]],
  });
  b.goal(7.5, 0, 102, Math.PI / 2, { style: 'exit' });

  b.story = {
    introMs: 9000,
    tagline: 'Rules horror · Ward rules',
    intro: {
      kicker: 'Night 4',
      title: 'Mercy Hospital',
      lines: [
        'Coming out of the subway, both your phones buzz. The same unknown number: "Mercy Hospital, inpatient ward, 4th floor. Someone is waiting for you."',
        'The hospital closed twenty years ago. Yet the queue display in the lobby is still lit, showing the same number over and over: 13.',
      ],
      rules: [
        "Visitors must first get a visitor's pass at Registration.",
        'When a trolley passes (the hall lights turn red), freeze.',
        "During rounds, hide behind the bed curtains. The nurses' station is safe.",
        "If someone calls your name, don't answer.",
        "Hold her in your flashlight and she can't move.",
        'This hospital has no basement.',
      ],
    },
    outro: {
      kicker: 'Discharged',
      title: 'Bed 13',
      lines: [
        'The emergency exit swings shut behind you. Upstairs, the faint rattle of a trolley rolls away, further and further, and stops.',
        'You look back once. In a 4th-floor window, a little girl is waving, and beside her stands a nurse in white. This time, they finally get to leave together.',
        'Your phones buzz again. The unknown number: "Thank you for taking her home. Your next host is waiting in an old house west of town." Attached is a photo: a wedding invitation cut from red paper.',
      ],
    },
  };
  b.objectives = [
    { text: "Get a visitor's pass at Registration: one holds the plate to open the door, the other goes in for it", done: { item: pass } },
    { text: 'Use the pass to call the elevator up to the 4th-floor ward', done: { act: liftDoor } },
    { text: 'Split up for the pharmacy code: Sol to Radiology (red), Luna to Records (blue), then enter the 4 digits together', done: { sig: code } },
    { text: "The pharmacy is open: take the head nurse's freight elevator key", done: { item: freightKey } },
    { text: `Ride the freight elevator down to the basement that "doesn't exist"`, done: { act: freightDoor } },
    { text: "In the morgue, find Lin Xiao's drawer. While one of you watches that thing, it can't move", done: { item: orKey } },
    { text: 'In the power room, throw the switches at the time she left', done: { sig: power } },
    { text: "Open the operating room and find Lin Xiao's discharge certificate", done: { item: cert } },
    { text: 'Run! Take the discharge certificate to the emergency exit', done: { act: exitDoor } },
    { text: 'Get out!', done: {} },
  ];
  void nXray; void nRecord; void nPharm; void nDiary; void drawers; void orDoor; void pharmDoor;
  return b.finish();
}
