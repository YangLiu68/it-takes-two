// Story 3 · The Last Train: an old subway station after the last
// train. Buy two tickets (a code read off the line map, a booth one of you
// holds open), walk a transfer corridor that repeats itself until you have
// spotted every anomaly (wrong call: back to exit 0), dial the cab code off the
// timetable, fetch two handles from a train a faceless conductor patrols, then
// run the dark tunnel where he follows you: freeze when the PA turns the
// lights red, cross the collapsed section on the catwalk, and open the blast
// door together.

import { LevelBuilder } from '../build.js';
import { DARK, locker, wardrobe } from './common.js';

const H = 4.5;
const TILE = '#5c6660';
const FLOOR = '#353938';
const CEIL = '#1a1c1c';
const CIRCLED = '①②③④⑤⑥';

const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

// One room of the looping transfer corridor. kind: the anomaly in it, or null.
// Both exits are doors that open while both their buttons are lit; behind each
// is a warp: the right call leads on, the wrong one back to exit 0.
function corridor(b, i, kind, good, reset) {
  const ox = 30 + 12 * i;
  const w = { color: kind === 'red' ? '#5c5452' : TILE, t: 0.4 };
  b.floor(ox, 0, 17, 5, 34, { color: FLOOR });
  b.box(ox, H + 0.25, 17, 5.4, 0.5, 34.4, { color: CEIL });
  b.wallZ(0, 34, ox - 2.5, H, w);
  b.wallZ(0, 34, ox + 2.5, H, w);
  b.wallX(ox - 2.5, ox + 2.5, 0, H, w);
  b.wallX(ox - 2.5, ox + 2.5, 34, H, w);
  b.box(ox - 1.7, 0.015, 17, 0.36, 0.03, 33.4, { color: '#8a7a3a' }); // tactile strip

  // The two ways on.
  const door = { latch: false, color: '#58636b', speed: 6 };
  const bA = b.pswitch(ox - 1.4, 0, 5.6, false, 5, '#ff6b6b');
  const bB = b.pswitch(ox + 1.4, 0, 5.6, false, 5, '#ff6b6b');
  b.door(ox, 4, 5, H, { op: 'all', in: [bA, bB] }, door);
  const fA = b.pswitch(ox - 1.4, 0, 28.4, false, 5, '#7dffb0');
  const fB = b.pswitch(ox + 1.4, 0, 28.4, false, 5, '#7dffb0');
  b.door(ox, 30, 5, H, { op: 'all', in: [fA, fB] }, door);
  b.sign(ox, 3.5, 5.8, 'Anomaly → go back', { style: 'horror', w: 2.2 });
  b.sign(ox, 3.5, 28.2, 'No anomaly → go on', { style: 'chalk', w: 2.4 });
  const wrong = { to: reset, both: true, scare: 'Wrong.', text: '...You are back at Exit 0.' };
  const right = { to: good.to, both: true, text: good.text };
  b.zone('warp', ox, 1.5, 2, 4.4, 3, 3.2, kind ? right : wrong);
  b.zone('warp', ox, 1.5, 32, 4.4, 3, 3.2, kind ? wrong : right);

  // What a normal corridor looks like.
  for (const z of [8, 14, 20, 26]) {
    if (kind === 'dark' && z === 14) continue;
    b.light(ox, 4.25, z, {
      color: kind === 'red' ? '#ff2a2a' : '#e8f0ff', intensity: kind === 'dark' ? 3.5 : 7, dist: 9,
      flicker: kind === 'dark' ? 0.85 : 0.04, fixture: 'tube',
    });
  }
  b.sign(ox, 3.3, 12, `Exit ${i}`, { fixed: true, yaw: Math.PI, style: 'chalk', w: 1.8 });
  b.sign(ox, 3.6, 24.5, kind === 'sign' ? 'EXIT ↓' : 'EXIT ↑', { fixed: true, yaw: Math.PI, style: 'chalk', w: 1.6 });
  b.sign(ox - 2.25, 2.0, 10, 'TOOTHPASTE\nSmile! Look ten years younger', { fixed: true, yaw: Math.PI / 2, style: 'paper', w: 2.2 });
  b.sign(ox - 2.25, 2.0, 17, kind === 'poster' ? 'MISSING\nLin Xiaoyu, 17\nShe is right behind you' : 'MISSING\nLin Xiaoyu, 17\nLast seen on the\nLine 4 last train', { fixed: true, yaw: Math.PI / 2, style: 'paper', w: 2.2 });
  b.sign(ox - 2.25, 2.0, 24, 'RIDE SAFELY\nDo not lean on the doors\nMind the gap', { fixed: true, yaw: Math.PI / 2, style: 'paper', w: 2.2 });
  b.box(ox + 1.95, 0.25, 15, 0.6, 0.5, 2.6, { mat: 'metal', color: '#4a5058' }); // bench
  b.sign(ox + 2.25, 2.9, 20, kind === 'clock' ? '59:32' : '23:59', { fixed: true, yaw: -Math.PI / 2, style: 'horror', w: 1.4 });
  b.sign(ox + 2.25, 2.2, 26, 'Line 4 → Terminus', { fixed: true, yaw: -Math.PI / 2, style: 'chalk', w: 2.2 });

  // The anomaly.
  if (kind === 'figure') b.figure(ox + 1.5, 0, 18.5, { look: 'conductor', yaw: -Math.PI / 2, watch: true });
  if (kind === 'doll') b.figure(ox + 1.95, 0.5, 15, { look: 'doll', yaw: -Math.PI / 2, watch: true, scale: 0.9 });
  if (kind === 'door') {
    b.box(ox + 2.25, 1.25, 11, 0.12, 2.5, 1.3, { color: '#4a1414' });
    b.sign(ox + 2.17, 2.75, 11, '404', { fixed: true, yaw: -Math.PI / 2, style: 'horror', w: 0.8 });
  }
  b.mark(`c${i}`, ox, kind ? 1 : 0, 0);
}

export function lastTrain(index) {
  const b = new LevelBuilder({
    mode: 'horror', index, seed: 'last-train', name: 'The Last Train', label: 'Night 3',
    theme: 'twilight', sky: 'day', overrides: { ...DARK, hemiIntensity: 0.4, fogDensity: 0.05 },
  });
  const r = b.rng;
  const w = { color: TILE, t: 0.4 };

  // The line: two stops before the terminus are in a seeded order.
  const line = ['Elm Street', 'Old Town', ...r.shuffle(['White Tower', 'Green Lake', 'Zhongshan Road']), 'Terminus'];
  let m = 29;
  const times = line.map((s, i) => (i ? (m += r.int(6, 9)) : m));
  const code = fmt(times[1]).replace(':', '').split('').map(Number);

  // -- Ticket hall (start) ------------------------------------------------------------------
  b.floor(0, 0, 10, 20, 20, { color: FLOOR });
  b.box(0, H + 0.25, 10, 20.4, 0.5, 20.4, { color: CEIL });
  b.wallX(-10, 10, 0, H, w);
  b.wallZ(0, 20, -10, H, w);
  b.wallZ(0, 20, 10, H, w);
  b.wallGapsX(-10, 10, 20, H, [[0, 3]], { ...w, lintel: 3 });
  b.checkpoint(0, 0, 3, 6, { flag: false, hint: 'Read the rider rules on the wall first. One of you checks the line map on the east wall, the other goes to the ticket machine on the west wall.' });
  b.sign(-9.75, 2.4, 3.4, "LINE 4 · LAST TRAIN RULES\n1. The conductor has no face.\n    Don't let him see you.\n2. Transfer tunnel: anomaly?\n    Go back. None? Go on.\n3. Don't board unnumbered cars.\n4. PA on, lights red: freeze.\n5. Flashlight on it: it can't move.", { fixed: true, yaw: Math.PI / 2, style: 'paper', w: 3.6 });
  b.box(-6.5, 0.25, 1.2, 2.4, 0.5, 0.7, { mat: 'metal', color: '#4a5058' });
  b.note(-6.5, 0.75, 1.2, "Station Attendant's Log", "After midnight, no trains run on Line 4.\n\nBut every night, the arrival announcement still plays on the platform.\n\nI've fixed the transfer tunnel lights three times. Only Exit 6 leads down to the platform. Miss one thing and you're back at Exit 0.");
  for (const [x, z] of [[-5, 4], [5, 9], [-5, 12]]) b.light(x, 4.25, z, { color: '#e6eef0', intensity: 9, dist: 11, flicker: 0.12, fixture: 'tube' });

  // Ticket machine: press the stops from here to the terminus, in order.
  b.box(-9.4, 1.2, 10, 1.0, 2.4, 6.6, { mat: 'metal', color: '#2f4a5a' });
  b.sign(-8.85, 3.3, 10, 'TICKET MACHINE\nFrom this station, pound every\nstop in order, up to Terminus', { fixed: true, yaw: Math.PI / 2, style: 'chalk', w: 3.4 });
  const stops = line.slice(2);
  const btn = {};
  r.shuffle(stops.slice()).forEach((name, i) => {
    const z = 7.3 + i * 1.8;
    btn[name] = b.pswitch(-7.9, 0, z, false, 0.6, '#5ad1ff');
    b.sign(-8.85, 1.95, z, name, { fixed: true, yaw: Math.PI / 2, style: 'chalk', w: 1.3 });
  });
  const ticketSeq = b.seq(stops.map((n) => btn[n]));
  const lunaTicket = b.item('tag', -7.9, 1.0, 14.3, { who: 1, color: '#4f86ff', label: 'Blue Ticket', when: ticketSeq });
  b.sign(9.75, 2.4, 10, `LINE 4 MAP (to Terminus)\n${line.map((s, i) => `${CIRCLED[i]} ${s}${i === 1 ? '  ← You are here' : ''}`).join('\n')}`, { fixed: true, yaw: -Math.PI / 2, style: 'chalk', w: 3.6 });

  // Service booth: one holds the plate across the hall, the other goes in.
  b.wallZ(0, 5, 5, H, w);
  b.wallGapsX(5, 10, 5, H, [[7.5, 1.8]], { ...w, lintel: 2.6 });
  const boothPlate = b.plate(-3, 0, 12.4);
  b.mark('boothPlate', -3, 0, 12.4);
  const boothDoor = b.door(7.5, 5, 1.8, 2.6, { op: 'all', in: [boothPlate] }, { latch: false, color: '#8a9aa6' });
  b.wire(boothPlate, [[-3, 0, 12.4], [-3, 0, 6.6], [7.5, 0, 6.6], [7.5, 0, 5.4]]);
  b.sign(-3, 2.1, 12.4, 'Hold: service booth door', { style: 'chalk', w: 2.2 });
  b.sign(7.5, 3.3, 5.25, 'SERVICE BOOTH', { fixed: true, yaw: 0, style: 'chalk', w: 1.6 });
  b.box(8.7, 0.55, 2.5, 1.2, 1.1, 3.0, { mat: 'wood', color: '#4a3f36' });
  const solTicket = b.item('tag', 8.7, 1.4, 2.5, { who: 0, color: '#ff6b4a', label: 'Red Ticket' });
  b.sign(9.75, 2.4, 2.5, 'She never got off', { fixed: true, yaw: -Math.PI / 2, style: 'uv', w: 2.4 });
  b.light(7.5, 3.9, 2.5, { color: '#ffd8a0', intensity: 5, dist: 6, flicker: 0.3, fixture: 'bulb' });

  // The ticket gates.
  b.wallGapsX(-10, 10, 15, H, [[0, 3]], { ...w, lintel: 2.8 });
  for (const x of [-6, -4, 4, 6]) b.box(x, 0.55, 14.5, 0.35, 1.1, 1.0, { mat: 'metal', color: '#7b8a94' });
  const gateLock = b.lock(-2.2, 0, 13.4, [solTicket, lunaTicket], { label: 'Ticket Gate', radius: 2.4 });
  const gateDoor = b.door(0, 15, 3, 2.8, { op: 'all', in: [gateLock] }, { latch: true, color: '#6f8796' });
  b.acts[b.acts.length - 1].toast = 'Beep. The ticket gate opens.';
  b.sign(0, 3.4, 17.5, 'TRANSFER ↑', { fixed: true, yaw: Math.PI, style: 'chalk', w: 2.2 });

  // Passage into the transfer corridor.
  b.floor(0, 0, 24, 3, 8, { color: FLOOR });
  b.box(0, H + 0.25, 24, 3.4, 0.5, 8.4, { color: CEIL });
  b.wallZ(20, 28, -1.5, H, w);
  b.wallZ(20, 28, 1.5, H, w);
  b.wallX(-1.5, 1.5, 28, H, w);
  b.sign(0, 2.7, 21.5, 'Remember what a normal tunnel\nlooks like. Anomaly? Go back.\nNo anomaly? Go on.\nBoth pound the buttons together\nto open the door.', { style: 'chalk', w: 3.2 });
  b.note(1.0, 0.8, 23.5, 'Torn Missing Poster', "Lin Xiaoyu, female, 17.\n\nOne night ten years ago, she boarded the last train at Old Town. When it reached Terminus, there was no one on board.\n\nSome say that train's last car had no number.");
  b.light(0, 4.1, 24, { color: '#e6eef0', intensity: 5, dist: 7, flicker: 0.4, fixture: 'tube' });

  // -- The transfer corridor: six rooms that look the same -------------------------------------
  const N = 6;
  const entry = (i) => [30 + 12 * i, 0, 8, 0];
  b.zone('warp', 0, 1.5, 26.4, 2.8, 3, 2.6, { to: entry(0), text: 'Exit 0' });
  const anomalous = [false, ...r.shuffle([true, true, true, false, false])];
  const kinds = r.shuffle(['figure', 'red', 'poster', 'clock', 'door', 'doll', 'sign', 'dark']);
  let k = 0;
  const platform = [0, 0, 54, 0];
  for (let i = 0; i < N; i++) {
    const good = i < N - 1 ? { to: entry(i + 1), text: `Exit ${i + 1}` } : { to: platform, text: '...The stairs end at the platform. You made it out.' };
    corridor(b, i, anomalous[i] ? kinds[k++] : null, good, entry(0));
  }

  // -- Platform and the train ---------------------------------------------------------------------
  b.floor(0, 0, 72, 8, 56, { color: '#34383a' }); // platform, x -4..4, z 44..100
  b.floor(6.6, 0, 73.5, 4.8, 59, { color: '#2b2e30' }); // train, x 4.2..9, z 44..103
  b.box(0, H + 0.25, 72, 8.4, 0.5, 56.4, { color: CEIL });
  b.box(6.6, 3.45, 73.5, 4.8, 0.5, 59, { color: '#22262a' }); // train ceiling
  b.wallZ(44, 100, -4, H, w);
  b.wallX(-4, 9.2, 44, H, w);
  const tw = { color: '#7d868c', t: 0.4 };
  b.wallGapsZ(44, 103, 4.2, H, [[47.5, 2.0], [55, 1.8], [61, 1.8], [69, 1.8], [75, 1.8], [83, 1.8], [89, 1.8], [97, 1.8]], { ...tw, lintel: 2.4 });
  b.wallZ(44, 103, 9.0, H, tw);
  b.wallX(4.2, 9.0, 103, H, tw);
  b.wallX(4.2, 9.0, 51, 3.2, tw);
  for (const z of [65, 79, 93]) b.wallGapsX(4.2, 9.0, z, 3.2, [[6.6, 1.6]], { ...tw, lintel: 2.4 });
  b.checkpoint(0, 0, 54, 5, { flag: false, hint: "The conductor only walks the train cars; he can't see you on the platform. Never board the car with no number!" });
  for (let z = 48; z <= 96; z += 8) b.light(0, 4.25, z, { color: '#dfe8e6', intensity: 7, dist: 9, flicker: z === 72 ? 0.6 : 0.1, fixture: 'tube' });
  for (const z of [58, 70, 82, 94]) {
    b.box(-2.4, H / 2, z, 0.8, H, 0.8, { color: '#6a716d' });
    b.sign(-2.4, 2.4, z - 0.43, 'OLD TOWN', { fixed: true, yaw: Math.PI, style: 'chalk', w: 1.2 });
  }
  b.sign(-3.75, 2.3, 63, `LAST TRAIN · LINE 4\n(toward Terminus)\n${line.map((s, i) => `${s} — ${fmt(times[i])}`).join('\n')}`, { fixed: true, yaw: Math.PI / 2, style: 'paper', w: 3.2 });
  b.box(-3.4, 0.25, 70, 0.7, 0.5, 2.4, { mat: 'metal', color: '#4a5058' });
  b.note(-3.4, 0.75, 70, 'Message (scrawled on a bench)', "The conductor walks up and down the cars. He has no face, but he can see you.\n\nHide in a luggage locker, or shine your flashlight on him — while the light holds him, he can't move at all.");

  // Cars: 1-3 numbered, the last one isn't.
  const consoleLockRef = { id: null };
  const cars = [51, 65, 79];
  cars.forEach((z0, n) => {
    b.box(8.45, 0.25, z0 + 3.5, 0.7, 0.5, 5, { color: '#5a3f3a' });
    b.box(8.45, 0.25, z0 + 10.5, 0.7, 0.5, 5, { color: '#5a3f3a' });
    wardrobe(b, 8.1, z0 + 7, 'w', 2.6);
    b.sign(3.98, 3.0, z0 + 7, `CAR ${n + 1}`, { fixed: true, yaw: -Math.PI / 2, style: 'chalk', w: 1.6 });
    b.sign(8.78, 2.95, z0 + 3.5, `${n + 1}`, { fixed: true, yaw: -Math.PI / 2, style: 'chalk', w: 0.6 });
  });
  b.sign(3.98, 3.0, 98, '—', { fixed: true, yaw: -Math.PI / 2, style: 'horror', w: 1.6 });
  b.zone('kill', 6.6, 1.5, 98, 4.2, 3, 9.4, { scare: 'You boarded the car with no number.' });
  b.figure(7.8, 0, 100.5, { look: 'doll', yaw: -Math.PI / 2, watch: true });
  b.light(6.6, 3.1, 98, { color: '#ff3030', intensity: 6, dist: 7, flicker: 0.3, fixture: 'bulb' });
  const redHandle = b.item('handle', 8.45, 0.95, 54.5, { who: 0, color: '#ff6b4a', label: 'Red Handle' });
  const blueHandle = b.item('handle', 8.45, 0.95, 89.5, { who: 1, color: '#4f86ff', label: 'Blue Handle' });
  b.note(8.45, 0.75, 68.5, "Lin Xiaoyu's Phone (unsent)", "I'm the only one on the train.\nThe conductor keeps walking up and down. He has no face.\n\nThe last car has no number. Its door is open, and someone inside is calling my name.\n\nI won't go in. I won't go in. I");

  // The cab: its door code is this station's last departure.
  const dials = [45.6, 47.4, 49.2, 51.0].map((z) => b.dial(1.8, 0, z, { start: r.int(1, 9), h: 1.7 }));
  dials.forEach((d, i) => b.mark(`dial${i}`, 1.8, 0, [45.6, 47.4, 49.2, 51.0][i]));
  const cabCode = b.combo(dials, code);
  b.sign(3.98, 2.9, 50.6, "DRIVER'S CAB\nDoor code: this station's\nlast departure time", { fixed: true, yaw: -Math.PI / 2, style: 'paper', w: 2.4 });
  const cabDoor = b.door(4.2, 47.5, 2.0, 2.4, { op: 'all', in: [cabCode] }, { axis: 'z', latch: true, color: '#8a2a2a' });
  b.acts[b.acts.length - 1].toast = 'The cab door opens.';
  b.box(6.6, 0.55, 44.9, 4.0, 1.1, 0.9, { mat: 'metal', color: '#2a2f36' });
  b.checkpoint(6.6, 0, 48.6, 3, { flag: false, hint: 'Put both handles on the console. Only Sol can carry the red one, only Luna the blue one.' });
  const consoleLock = b.lock(7.6, 0, 47.6, [redHandle, blueHandle], { label: 'Console', radius: 2.4 });
  consoleLockRef.id = consoleLock;
  b.note(5.4, 1.25, 44.9, "Driver's Log", "Line 4 last train, departing Old Town.\nThe cab door code is the departure time, four digits.\n\nWithout both the red and the blue handle, the train won't move — and the tunnel service door won't open.\n\n(Dated ten years ago.)");
  b.light(6.6, 3.1, 47.5, { color: '#ffd0a0', intensity: 5, dist: 6, flicker: 0.2, fixture: 'bulb' });
  for (const z of [55, 62, 69, 76, 83, 90]) b.light(6.6, 3.15, z, { color: '#f0f4ff', intensity: 5, dist: 7, flicker: 0.25, fixture: 'tube', off: consoleLock });

  // The conductor walks cars 1-3, and is gone once the handles are in.
  const tn = [[6.4, 0, 52.5], [6.4, 0, 58], [6.4, 0, 64], [6.6, 0, 65], [6.4, 0, 66.2], [6.4, 0, 72], [6.4, 0, 78], [6.6, 0, 79], [6.4, 0, 80.2], [6.4, 0, 86], [6.4, 0, 91.5]];
  b.monster({
    look: 'conductor', y: 0, nodes: tn, edges: tn.slice(1).map((_, i) => [i, i + 1]),
    patrol: [...tn.keys(), ...[...tn.keys()].reverse().slice(1, -1)], start: 10, patrolStart: 10,
    speed: 2.2, chase: 4.6, sight: 10, giveUp: 8, rest: 6,
    area: [[4.4, 51.2, 8.8, 93]], until: consoleLock,
  });

  // -- The tunnel ---------------------------------------------------------------------------------
  b.wallGapsX(-4, 4.2, 100, H, [[0, 3]], { ...w, lintel: 3 });
  const tunnelGate = b.door(0, 100, 3, 3, { op: 'all', in: [consoleLock] }, { latch: true, color: '#4a4f2a', speed: 4 });
  b.acts[b.acts.length - 1].toast = 'The conductor is gone... The tunnel service door at the end of the platform opens.';
  b.sign(0, 3.6, 99.75, 'SERVICE DOOR', { fixed: true, yaw: Math.PI, style: 'horror', w: 2.0 });
  b.checkpoint(0, 0, 96.5, 5, { flag: false, hint: 'In the tunnel, the lights turn red whenever the PA sounds: freeze — so does he. If he chases you, hide in a maintenance locker or the signal booth, or hold him in your flashlight.' });

  const tw2 = { color: '#3f4440', t: 0.4 };
  b.floor(0, 0, 125, 6, 50, { color: '#2a2b28' }); // z 100..150
  b.box(-2.2, -0.3, 154, 0.7, 0.6, 8.4, { mat: 'metal', color: '#5a5f56' }); // catwalk over the collapse
  b.floor(0, 0, 173, 6, 30, { color: '#2a2b28' }); // z 158..188
  for (const x of [-0.75, 0.75]) {
    b.box(x, 0.06, 125, 0.12, 0.12, 50, { mat: 'metal', color: '#6b6b66' });
    b.box(x, 0.06, 173, 0.12, 0.12, 30, { mat: 'metal', color: '#6b6b66' });
  }
  b.box(0, H + 0.25, 144, 6.4, 0.5, 88, { color: CEIL });
  const alcoves = [112, 124, 134, 166, 178];
  b.wallGapsZ(100, 188, -3, H, [[141, 2.4]], tw2);
  b.wallGapsZ(100, 188, 3, H, alcoves.map((z) => [z, 1.5]), tw2);
  for (const z of alcoves) locker(b, 3, z, 1, H);
  const tunnelIn = b.zone('trigger', 0, 1.5, 104.5, 6, 3, 2, { fx: ['slam', 'sting'], text: 'Footsteps behind you — the conductor has left the train. Run!' });
  const red = b.zone('redlight', 0, 2, 143, 6, 4, 84, { period: 10, red: 3, offset: 0, text: 'You moved while the PA was on.' });
  for (let z = 104; z <= 184; z += 8) b.light(0, 4.2, z, { color: '#d8e0c8', intensity: 5, dist: 8, flicker: 0.3, fixture: 'tube', rule: red });
  b.sign(0, 2.8, 147.5, 'COLLAPSE AHEAD\nUse the left catwalk', { fixed: true, yaw: Math.PI, style: 'horror', w: 2.6 });
  b.sign(-2.78, 1.6, 154, "It can't move fast.", { fixed: true, yaw: Math.PI / 2, style: 'uv', w: 2.0 });
  b.mark('cat0', -2.2, 0, 148.6);
  b.mark('cat1', -2.2, 0, 159);

  // Signal booth: safe.
  b.floor(-6, 0, 141, 6, 10, { color: '#2e2a26' });
  b.box(-6, H + 0.25, 141, 6.4, 0.5, 10.4, { color: CEIL });
  b.wallX(-9, -3, 136, H, tw2);
  b.wallX(-9, -3, 146, H, tw2);
  b.wallZ(136, 146, -9, H, tw2);
  b.zone('safe', -6, 1.5, 141, 5.4, 3, 9.4);
  b.checkpoint(-6, 0, 140, 4, { flag: false, hint: "The signal booth is safe. Wait until he's far away before you head back out." });
  b.box(-8.2, 0.45, 144.5, 1.2, 0.9, 2.0, { mat: 'wood', color: '#4a3a2b' });
  b.note(-8.2, 1.15, 144.5, "Signalman's Note", "Part of the tunnel caved in. Only the catwalk on the left is still standing.\nHe has to use the catwalk too, and he's slow on it.\n\nWhen the PA sounds, everything has to stop — him included.");
  b.sign(-6, 3.3, 136.25, 'SIGNAL BOOTH', { fixed: true, yaw: 0, style: 'chalk', w: 1.6 });
  b.light(-6, 3.9, 141, { color: '#ffc27a', intensity: 9, dist: 8, flicker: 0.1, fixture: 'bulb' });
  b.mark('booth', -6, 0, 141);

  // The far end: a blast door that needs both buttons at once.
  b.checkpoint(0, 0, 162, 5, { flag: false, hint: 'The blast door needs both buttons pounded at the same time.' });
  const swL = b.pswitch(-2.0, 0, 172, false, 2, '#ffd23f');
  const swR = b.pswitch(2.0, 0, 185.5, false, 2, '#ffd23f');
  b.mark('swL', -2.0, 0, 172);
  b.mark('swR', 2.0, 0, 185.5);
  b.sign(-2.0, 2.0, 172, 'Together!', { style: 'chalk', w: 1.4 });
  b.sign(2.0, 2.0, 185.5, 'Together!', { style: 'chalk', w: 1.4 });
  b.wallGapsX(-3, 3, 188, H, [[0, 3]], { ...tw2, lintel: 3.2 });
  b.wallX(-3, 3, 188, 3.5, { ...tw2, y: H });
  const blast = b.door(0, 188, 3, 3.2, { op: 'all', in: [swL, swR] }, { latch: true, color: '#5a5f36', speed: 4 });
  b.acts[b.acts.length - 1].toast = 'The blast door opens!';
  b.sign(0, 3.75, 187.75, 'BLAST DOOR\nPound both buttons at once', { fixed: true, yaw: Math.PI, style: 'horror', w: 3.0 });

  // The conductor follows you in from the platform, and stops at the blast door.
  const exitZone = b.zone('trigger', 0, 1.5, 190, 6, 3, 2.4, { fx: 'whisper', text: 'The footsteps behind you stop.' });
  const un = [[0, 0, 101.5], [0, 0, 112], [0, 0, 124], [0, 0, 136], [0, 0, 146], [-2.2, 0, 149.4], [-2.2, 0, 158.6], [0, 0, 162], [0, 0, 174], [0, 0, 186]];
  b.monster({
    look: 'conductor', y: 0, nodes: un, edges: un.slice(1).map((_, i) => [i, i + 1]),
    patrol: [...un.keys(), ...[...un.keys()].reverse().slice(1, -1)], start: 0,
    active: tunnelIn, wakeAt: [0, 0, 101.5], until: exitZone, freeze: red,
    speed: 2.6, chase: 5.0, sight: 14, giveUp: 12, rest: 6,
    area: [[-3, 100.5, 3, 188]],
  });

  // Emergency stairs up to the street.
  b.floor(0, 0, 191, 6, 6, { color: '#2a2b28' });
  for (let s = 0; s < 8; s++) {
    const top = 0.35 * (s + 1);
    b.box(0, top / 2, 189.4 + 0.8 * s, 6, top, 0.8, { color: '#4a4f4a' });
  }
  b.box(0, 1.4, 199, 6, 2.8, 7.2, { color: '#4a4f4a' });
  b.wallZ(188, 203, -3, 8, tw2);
  b.wallZ(188, 203, 3, 8, tw2);
  b.wallX(-3, 3, 202.6, 8, tw2);
  b.box(0, 8.25, 195.3, 6.4, 0.5, 15, { color: CEIL });
  b.sign(0, 6.2, 202.35, 'EMERGENCY EXIT', { fixed: true, yaw: Math.PI, style: 'chalk', w: 2.2 });
  b.light(0, 6.6, 199, { color: '#7dffa0', intensity: 8, dist: 10, flicker: 0.05, fixture: 'tube' });
  b.note(-2, 3.3, 197, 'A Ticket', 'Old Town → Terminus\nCar: (blank)\n\nOn the back:\n"Thank you for finishing the ride for me. — Xiaoyu"');
  b.goal(0, 2.8, 199.5, 0, { style: 'exit' });

  b.story = {
    introMs: 9000,
    tagline: 'Rules horror · Spot the anomaly',
    intro: {
      kicker: 'Night 3',
      title: 'The Last Train',
      lines: [
        `When the elevator doors open again, it isn't the ground floor — it's a subway entrance. Both your phones buzz. The same unknown number: "Last train. Don't be late."`,
        'The station lights are still on, and a yellowed sheet of rider rules hangs by the ticket gates. The last train left long ago — but the PA keeps calling the stops, over and over.',
      ],
      rules: [
        "The conductor has no face. Don't let him see you.",
        'In the transfer tunnel: see an anomaly, go back. See none, go on.',
        'Never board a car without a number.',
        'When the PA sounds and the lights turn red, freeze.',
        "Hold it in your flashlight and it can't move.",
      ],
    },
    outro: {
      kicker: 'Almost Dawn',
      title: 'The Exit',
      lines: [
        'You climb the emergency stairs and push open the steel door. A light rain is falling. Behind you, the station entrance is dark, its shutter taped with a notice: "Line 4, Old Town Station. Closed for ten years."',
        'Nobody boarded the car without a number. Not this time.',
        'Your phones buzz again. The same number: "Next stop: Mercy Hospital. Bed 13. Someone is waiting for you."',
      ],
    },
  };
  b.objectives = [
    { text: 'Buy tickets: one reads the line map on the east wall, the other pounds the stops in order on the ticket machine', done: { sig: ticketSeq } },
    { text: "There's a red ticket in the service booth: one holds the plate, the other goes in for it", done: { item: solTicket } },
    { text: 'Put both tickets into the ticket gate', done: { act: gateDoor } },
    { text: 'Transfer tunnel: anomaly? Go back. No anomaly? Go on. Pound both buttons together to open the doors', done: { cp: 1 } },
    { text: "Open the cab: the code is this station's last departure time (see the timetable on the platform)", done: { act: cabDoor } },
    { text: 'Find the two handles in the train cars and put them on the console. Never board the car with no number!', done: { sig: consoleLock } },
    { text: 'Get through the tunnel. Freeze when the lights turn red; if chased, hide in a maintenance locker or the signal booth', done: { cp: 4 } },
    { text: 'Cross the collapse on the left catwalk', done: { cp: 5 } },
    { text: 'Pound both blast door buttons at the same time', done: { sig: exitZone } },
    { text: 'Climb the emergency stairs and get out!', done: {} },
  ];
  void boothDoor; void tunnelGate; void blast; void consoleLockRef;
  return b.finish();
}
