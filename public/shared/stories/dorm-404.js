// Story 2 · Dorm 404: a sealed dorm floor that's a maze. The
// supervisor walks the halls; knock-rule corridors make you stand still; her
// office's key cabinet opens in her round order; the washroom mirror holds the
// laundry code (don't look back); three fuses (one only Sol can carry, one only
// Luna) bring the power back — and a fourteenth door. Room 404's beam only rises
// while someone holds the light, and the way out is the elevator, together.

import { LevelBuilder } from '../build.js';
import { DARK, wardrobe, bed, desk } from './common.js';

export function dorm404(index) {
  const b = new LevelBuilder({
    mode: 'horror', index, seed: 'dorm-404', name: 'Dorm 404', label: 'Night 2',
    theme: 'twilight', sky: 'day', overrides: { ...DARK, fogDensity: 0.06, hemiIntensity: 0.38 },
  });
  const r = b.rng;
  const H = 4.2;
  const w = { color: '#56604f', t: 0.4 };
  const wood = { mat: 'wood', color: '#3a2c22' };

  // Maze of corridors: 7 x 5 cells of 6 m, carved by a depth-first walk.
  const C = 7, R = 5, S = 6, X0 = -21, Z0 = 10;
  const cx = (i) => X0 + S / 2 + i * S;
  const cz = (j) => Z0 + S / 2 + j * S;
  const key = (i, j) => j * C + i;
  const open = new Set(); // "a-b" passages
  const pass = (a, c) => open.add(a < c ? `${a}-${c}` : `${c}-${a}`);
  const isOpen = (a, c) => open.has(a < c ? `${a}-${c}` : `${c}-${a}`);
  const seen = new Set([key(3, 0)]);
  const stack = [[3, 0]];
  while (stack.length) {
    const [i, j] = stack[stack.length - 1];
    const nb = r.shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]]).map(([di, dj]) => [i + di, j + dj]).filter(([a, c]) => a >= 0 && a < C && c >= 0 && c < R && !seen.has(key(a, c)));
    if (!nb.length) {
      stack.pop();
      continue;
    }
    const [a, c] = nb[0];
    pass(key(i, j), key(a, c));
    seen.add(key(a, c));
    stack.push([a, c]);
  }
  // A few extra openings so there's more than one way around her.
  for (let k = 0; k < 5; k++) {
    const i = r.int(0, C - 2), j = r.int(0, R - 1);
    pass(key(i, j), key(i + 1, j));
  }
  const nbrs = (i, j) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([di, dj]) => [i + di, j + dj]).filter(([a, c]) => a >= 0 && a < C && c >= 0 && c < R && isOpen(key(i, j), key(a, c)));
  // Distance from the entrance, to put things far away.
  const dist = new Map([[key(3, 0), 0]]);
  const q = [[3, 0]];
  while (q.length) {
    const [i, j] = q.shift();
    for (const [a, c] of nbrs(i, j)) if (!dist.has(key(a, c))) {
      dist.set(key(a, c), dist.get(key(i, j)) + 1);
      q.push([a, c]);
    }
  }
  const ENTRY = [3, 0], DOOR404 = [6, 4], WASH = [0, 2], LAUNDRY = [6, 1];
  const cells = [];
  for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) cells.push([i, j]);
  const special = (i, j) => [ENTRY, DOOR404, WASH, LAUNDRY].some(([a, c]) => a === i && c === j);
  const byFar = (a, c) => dist.get(key(c[0], c[1])) - dist.get(key(a[0], a[1]));
  // Dead ends first (farthest first), then other far cells if there aren't enough.
  const deadEnds = cells.filter(([i, j]) => nbrs(i, j).length === 1 && !special(i, j)).sort(byFar);
  for (const c of cells.filter(([i, j]) => nbrs(i, j).length > 1 && !special(i, j)).sort(byFar)) if (deadEnds.length < 8) deadEnds.push(c);

  // -- Floors, ceiling, maze walls ---------------------------------------------------------------
  const zN = Z0 + R * S;
  b.floor(0, 0, 5, 12, 10, { color: '#2b302c' }); // elevator lobby
  b.floor(0, 0, -3.5, 4, 7, { color: '#3a3a3a' }); // elevator car
  b.floor(-10, 0, 5, 8, 10, { mat: 'wood', color: '#3a3029' }); // supervisor's office
  b.floor(0, 0, Z0 + (R * S) / 2, C * S, R * S, { color: '#2d3330' }); // the floor's corridors
  b.floor(-26, 0, 25, 10, 12, { color: '#3a4446' }); // washroom (tiles)
  b.floor(26, 0, 19, 10, 12, { color: '#33383a' }); // laundry
  b.floor(18, 0, 43, 12, 6, { color: '#1f1f1f' }); // 404 entry
  b.floor(18, 0, 64, 12, 4, { color: '#1f1f1f' }); // 404 far side
  b.box(0, H + 0.25, 29.5, 62.4, 0.5, 73.4, { color: '#1b1d1b' });
  for (let j = 0; j < R; j++) {
    for (let i = 0; i < C; i++) {
      const x = cx(i), z = cz(j);
      if (i < C - 1 && !isOpen(key(i, j), key(i + 1, j))) b.wallZ(z - S / 2, z + S / 2, x + S / 2, H, w);
      if (j < R - 1 && !isOpen(key(i, j), key(i, j + 1))) b.wallX(x - S / 2, x + S / 2, z + S / 2, H, w);
    }
  }
  b.wallGapsX(X0, -X0, Z0, H, [[cx(3), 3]], w);
  b.wallGapsX(X0, -X0, zN, H, [[cx(DOOR404[0]), 2.4]], w);
  b.wallGapsZ(Z0, zN, X0, H, [[cz(WASH[1]), 2.4]], w);
  b.wallGapsZ(Z0, zN, -X0, H, [[cz(LAUNDRY[1]), 2.4]], w);
  b.box(X0, 3.6, cz(WASH[1]), 0.4, 1.2, 2.4, w);
  b.box(-X0, 3.6, cz(LAUNDRY[1]), 0.4, 1.2, 2.4, w);
  // Room numbers along the way (thirteen of them... mostly).
  let n = 401;
  const westWall = (i, j) => i === 0 || !isOpen(key(i, j), key(i - 1, j));
  for (const [i, j] of cells.filter(([i, j]) => westWall(i, j) && !special(i, j)).slice(0, 13)) {
    if (n === 404) n++;
    b.sign(cx(i) - 2.75, 2.6, cz(j), String(n++), { fixed: true, yaw: Math.PI / 2, style: 'paper', w: 0.8 });
  }
  // Where the doors are.
  b.sign(X0 + 0.25, 3.0, cz(WASH[1]), 'WASHROOM', { fixed: true, yaw: Math.PI / 2, style: 'horror', w: 1.4 });
  b.sign(-X0 - 0.25, 3.0, cz(LAUNDRY[1]), 'LAUNDRY', { fixed: true, yaw: -Math.PI / 2, style: 'horror', w: 1.6 });
  b.sign(0, 3.1, Z0 + 0.25, 'ELEVATORS', { fixed: true, yaw: 0, style: 'horror', w: 1.6 });
  for (const c of [ENTRY, WASH, LAUNDRY]) b.light(cx(c[0]), 3.9, cz(c[1]), { color: '#cfd8c8', intensity: 4, dist: 7, flicker: 0.45, fixture: 'tube' });

  // -- Elevator lobby (start, safe) -------------------------------------------------------------------
  b.wallGapsX(-6, 6, 0, H, [[0, 4]], w);
  b.box(0, 3.6, 0, 4, 1.2, 0.4, w);
  b.wallGapsZ(0, 10, -6, H, [[3, 2], [7.5, 2.4]], w);
  b.box(-6, 0.5, 3, 0.4, 1.0, 2, w); // the duty window's sill...
  b.box(-6, (2.3 + H) / 2, 3, 0.4, H - 2.3, 2, w); // ...and the wall above it
  b.box(-6, 3.6, 7.5, 0.4, 1.2, 2.4, w); // over the office door
  b.wallZ(0, 10, 6, H, w);
  b.room(-2, -7, 2, 0, H, { n: null }, { ...w, color: '#5e5f60' });
  b.checkpoint(0, 0, 5, 6, { flag: false, hint: "The elevator has no power. The rules are on the wall. The elevator lobby is safe: she can't get in." });
  b.zone('safe', 0, 1.5, 5, 11.4, 3, 9.4);
  b.sign(5.75, 2.4, 6, "DORM RULES · FLOOR 4\n1. No elevator after midnight.\n2. Three knocks? Don't answer.\n    Freeze till they stop.\n3. If the warden sees you,\n    hide in a wardrobe.\n4. This floor has 13 rooms.\n    Count 14? Get out.\n5. Extra face in the washroom\n    mirror? Don't look back.\n6. There is no Room 404.", { fixed: true, yaw: -Math.PI / 2, style: 'paper', w: 3.4 });
  b.box(-3.6, 0.42, 8.6, 1.2, 0.84, 0.7, wood);
  b.note(-3.6, 0.9, 8.6, 'Printed Chat Log — Xiaoyu', "23:58  come up to floor 4 lol 404 is REAL!!\n00:03  why is this hallway so long\n00:05  someone keeps knocking\n00:05  three knocks. stop. three more\n00:06  don't come up\n00:06  don't come up\n00:07  come up");
  b.light(0, 3.9, 5, { color: '#ffd8a0', intensity: 7, dist: 8, flicker: 0.4, fixture: 'tube' });
  b.mark('lobby', 0, 0, 6);

  // The fuse box by the elevator: the key, then three fuses.
  const dutyPlate = b.plate(-4.4, 0, 3);
  b.sign(-5.75, 2.75, 3, 'DUTY WINDOW', { fixed: true, yaw: Math.PI / 2, style: 'horror', w: 1.4 });
  b.sign(-5.75, 3.6, 7.5, "WARDEN'S OFFICE", { fixed: true, yaw: Math.PI / 2, style: 'horror', w: 1.3 });
  b.sign(-4.4, 1.9, 3, "Stand here to open\nthe warden's office", { style: 'paper', w: 1.9 });
  b.mark('duty', -4.4, 0, 3);

  // -- The supervisor's office: a key cabinet that opens in her round order ---------------------
  b.wallZ(0, 10, -14, H, w);
  b.wallX(-14, -6, 0, H, w);
  b.checkpoint(-10, 0, 5, 4, { flag: false, hint: "Pound the buttons under the room numbers in the order from the warden's round log to open the key cabinet." });
  b.box(-13.5, 1.5, 5, 0.8, 3.0, 5.6, { mat: 'metal', color: '#4a4f57' }); // the key cabinet
  const round = ['413', '409', '406', '401'];
  const hookZ = [2.6, 4.2, 5.8, 7.4];
  const hooks = {};
  r.shuffle(round.slice()).forEach((room, i) => {
    hooks[room] = b.pswitch(-12.2, 0, hookZ[i], false, 0.6);
    b.sign(-13.08, 2.2, hookZ[i], room, { fixed: true, yaw: Math.PI / 2, style: 'paper', w: 0.8 });
  });
  const cabinet = b.seq(round.map((room) => hooks[room]));
  b.sign(-13.08, 3.4, 5, 'KEY CABINET', { fixed: true, yaw: Math.PI / 2, style: 'horror', w: 1.4 });
  const boxKey = b.item('key', -12.4, 1.3, 9.2, { color: '#d9b25a', label: 'Fuse Box Key', when: cabinet });
  const officeDoor = b.door(-6, 7.5, 2.4, 3, { op: 'any', in: [dutyPlate, cabinet] }, { axis: 'z', latch: false, color: '#3a2c22', speed: 6 });
  b.acts[b.acts.length - 1].quiet = true;
  desk(b, -9, 9);
  bed(b, -9.5, 1.4, 'x');
  b.figure(-10.1, 0.73, 1.4, { look: 'doll', yaw: Math.PI / 2, watch: true, scale: 0.55 });
  b.note(-9, 0.8, 9, 'Shift Handover', "To whoever has the next shift:\nThe fuse box key is locked in the key cabinet. Pound the room numbers in round order and it opens.\n\nAlso — if you hear someone knock on the office window at night, don't look up.\n                    — Old Zhou");
  b.light(-10, 3.9, 5, { color: '#ffc27a', intensity: 7, dist: 7, flicker: 0.25, fixture: 'bulb' });
  for (const room of round) {
    const sw = b.switches.find((s) => s.id === hooks[room]);
    b.mark(`hook${room}`, sw.x, 0, sw.z);
  }

  // -- The maze: fuses, beds, wardrobes, knock-rule corridors ----------------------------------------
  const [fRedCell, fWhiteCell, ...rest] = deadEnds;
  const fRed = b.item('fuse', cx(fRedCell[0]), 1.0, cz(fRedCell[1]), { who: 0, color: '#ff6b4a', label: 'Red Fuse' });
  const fWhite = b.item('fuse', cx(fWhiteCell[0]), 1.0, cz(fWhiteCell[1]), { color: '#f4f0e6', label: 'White Fuse' });
  b.mark('fuseRed', cx(fRedCell[0]), 0, cz(fRedCell[1]));
  b.mark('fuseWhite', cx(fWhiteCell[0]), 0, cz(fWhiteCell[1]));
  for (const cell of [fRedCell, fWhiteCell]) b.light(cx(cell[0]), 3.9, cz(cell[1]), { color: '#ffcf8a', intensity: 5, dist: 6, flicker: 0.5, fixture: 'bulb' });
  // Furniture goes against a cell's closed walls, clear of the corridor lines.
  const SIDES = { n: [0, 1], s: [0, -1], e: [1, 0], w: [-1, 0] };
  const closedSides = (i, j) => Object.entries(SIDES).filter(([, [di, dj]]) => !nbrs(i, j).some(([a, c]) => a === i + di && c === j + dj)).map(([k]) => k);
  const opposite = { n: 's', s: 'n', e: 'w', w: 'e' };
  const texts = [
    ["Warden's Round Log", "01:00 rounds. Same order as always:\n413 → 409 → 406 → 401\n\nThe light in 404 is on again.\nThere is no 404 on this floor.\n\nI knocked three times. Something inside knocked three times back.\n\n(The key cabinet opens in this order too. Don't tell the students.)"],
    ['Dorm Bulletin (2015)', "Following last month's accident, Floor 4 is closed, effective immediately.\n\nA reminder to all students: Floor 4 has only thirteen rooms."],
    ['Torn-out Page', "She walks the halls, but she isn't looking for students.\nShe's looking for a door.\n\nDon't let her see which one you open."],
  ];
  const notes = [];
  rest.filter(([i, j]) => closedSides(i, j).length >= 2).slice(0, 5).forEach(([i, j], k) => {
    const [sw, sb] = closedSides(i, j);
    const [wx, wz] = SIDES[sw];
    wardrobe(b, cx(i) + wx * 2.15, cz(j) + wz * 2.15, opposite[sw]);
    if (k < texts.length) {
      const [bxd, bzd] = SIDES[sb];
      const bx = cx(i) + bxd * 2.2, bz = cz(j) + bzd * 2.2;
      bed(b, bx, bz, bxd ? 'z' : 'x');
      notes.push(b.note(bx, 0.8, bz, ...texts[k]));
      // Where to stand to read it: just in front of the bed.
      b.mark(`bed${k}`, cx(i) + bxd * 1.0, 0, cz(j) + bzd * 1.0);
    }
  });
  const nLog = notes[0];
  // Knock rules: in these corridors three knocks mean "stand still".
  const used = new Set([fRedCell, fWhiteCell, ...rest.slice(0, 5)].map(([i, j]) => key(i, j)));
  const knockCells = r.shuffle(cells.filter(([i, j]) => dist.get(key(i, j)) > 1 && nbrs(i, j).length > 1 && !special(i, j) && !used.has(key(i, j)))).slice(0, 4);
  knockCells.forEach(([i, j], k) => {
    const z = b.zone('redlight', cx(i), 2, cz(j), S, 4, S, {
      period: 11, red: 3, offset: k * 2.7, fx: 'knock', say: "Knock, knock, knock — freeze. Don't answer.", text: 'You moved during the knocking.',
    });
    b.light(cx(i), 3.9, cz(j), { color: '#e8e2c8', intensity: 5, dist: 7, flicker: 0.2, fixture: 'tube', rule: z });
  });

  // -- Washroom: the mirror and the code (don't look back) ----------------------------------------
  b.room(-31, 19, -21, 31, H, { e: null }, { ...w, color: '#5c6a68' });
  b.checkpoint(-24, 0, 25, 4, { flag: false, hint: "Shine a flashlight on the mirror. When someone extra shows up in it — don't look back. Walk out backwards." });
  for (const z of [21.5, 25, 28.5]) {
    b.box(-30.3, 0.45, z, 1.2, 0.9, 1.6, { mat: 'metal', color: '#8a9196' }); // sinks
    b.box(-30.74, 1.95, z, 0.08, 1.1, 1.5, { color: '#7f939c' }); // mirrors
  }
  for (const z of [20.2, 29.8]) b.box(-24, 1.1, z, 3, 2.2, 0.1, { mat: 'metal', color: '#4c5658' }); // stall walls
  b.sign(-30.66, 2.15, 25, 'DRYER CODE\n3 · 8 · 1', { fixed: true, yaw: Math.PI / 2, style: 'uv', w: 3.4 });
  const mirror = b.zone('trigger', -28.6, 1.5, 25, 4, 3, 8, { fx: ['sting', 'whisper'], text: "In the mirror... someone is standing behind you. Don't look back." });
  const washOut = b.zone('trigger', -18.5, 1.5, 25, 3, 3, 4, { when: mirror, text: '...The footsteps behind you stop at the washroom door.' });
  b.figure(-22.4, 0, 22.4, { look: 'dorm', yaw: -Math.PI / 2, when: mirror, until: washOut });
  b.zone('nolook', -26, 1.5, 25, 10, 3, 12, { at: [-22.4, 1.2, 22.4], cone: 0.7, when: mirror, until: washOut, text: 'You looked back.' });
  b.light(-28.5, 3.9, 25, { color: '#c8e4ff', intensity: 9, dist: 9, flicker: 0.5, fixture: 'tube' });
  b.light(-24, 3.9, 21.5, { color: '#c8e4ff', intensity: 4, dist: 6, flicker: 0.7, fixture: 'tube' });
  b.mark('mirror', -29, 0, 25);

  // -- Laundry: the locked dryer and the blue fuse ------------------------------------------------
  b.room(21, 13, 31, 25, H, { w: null }, { ...w, color: '#525a5c' });
  b.checkpoint(24, 0, 19, 4, { flag: false, hint: "The dryer needs a 3-digit code. It's written on the washroom mirror." });
  const mz = [15.5, 19, 22.5];
  for (const z of mz) b.box(29.5, 0.8, z, 1.6, 1.6, 1.6, { mat: 'metal', color: '#c9ccc8' });
  const dryerDials = mz.map((z) => b.dial(27.0, 0, z, { h: 2.0 }));
  const dryer = b.combo(dryerDials, [3, 8, 1]);
  b.sign(30.75, 2.9, 19, 'DRYER · 3-digit code', { fixed: true, yaw: -Math.PI / 2, style: 'paper', w: 2.6 });
  const fBlue = b.item('fuse', 28.2, 1.1, 19, { who: 1, color: '#4f86ff', label: 'Blue Fuse', when: dryer });
  b.light(28.6, 1.9, 19, { color: '#7da8ff', intensity: 3, dist: 3, fixture: 'none', when: dryer });
  b.box(24, 0.5, 24, 2.4, 1.0, 1.2, wood);
  b.note(24, 1.05, 24, 'Sticky Note', "I locked the dryer. The code is on the washroom mirror — only a flashlight shows it.\n\nWhen you look in the mirror, whatever you do, don't look back.\n                    — Xiaoyu");
  b.note(23, 0.8, 14.2, 'Laundry Slip', 'Room: 404\nName: Xiaoyu\nItems: white dress ×1\n\nThe slip is dated ten years ago.');
  b.light(26, 3.9, 19, { color: '#e8f0ff', intensity: 5, dist: 8, flicker: 0.35, fixture: 'tube' });
  mz.forEach((z, i) => b.mark(`dryer${i}`, 27.0, 0, z));
  b.mark('fuseBlue', 27.0, 0, 19);

  // The fuse box: once it has its key and all three fuses, the power comes back.
  const power = b.lock(4.2, 0, 1.4, [boxKey, fRed, fBlue, fWhite], { label: 'Fuse Box', radius: 2.4 });
  b.sign(4.2, 2.6, 0.25, 'FUSE BOX', { fixed: true, yaw: 0, style: 'horror', w: 1.4 });
  for (const [i, j] of cells.filter(([i, j]) => (i * 3 + j) % 4 === 1)) b.light(cx(i), 3.9, cz(j), { color: '#fff1c8', intensity: 6, dist: 7, flicker: 0.2, fixture: 'tube', when: power });
  b.mark('fuseboxA', 3.0, 0, 3.0);
  b.mark('fuseboxB', 5.2, 0, 3.0);

  // -- The supervisor, walking every corridor ---------------------------------------------------------
  const nodes = cells.map(([i, j]) => [cx(i), 0, cz(j)]);
  const edges = [];
  for (const [i, j] of cells) for (const [a, c] of nbrs(i, j)) if (key(a, c) > key(i, j)) edges.push([key(i, j), key(a, c)]);
  const tour = [];
  const walk = (i, j, from) => {
    tour.push(key(i, j));
    for (const [a, c] of nbrs(i, j)) if (key(a, c) !== from && !tour.includes(key(a, c))) {
      walk(a, c, key(i, j));
      tour.push(key(i, j));
    }
  };
  walk(3, 0, -1);
  const far = rest[3] || deadEnds[0];
  const maze = [[X0, Z0, -X0, zN]];
  b.monster({
    look: 'dorm', y: 0, nodes, edges, patrol: tour, start: key(far[0], far[1]), patrolStart: tour.indexOf(key(far[0], far[1])),
    speed: 2.4, chase: 5.0, sight: 11, giveUp: 9, rest: 7, area: maze,
  });

  // -- Room 404 ---------------------------------------------------------------------------------------
  const [di, dj] = DOOR404;
  const dx = cx(di);
  const door404 = b.door(dx, zN, 2.4, 3, { op: 'all', in: [power] }, { latch: true, color: '#2a1414', speed: 2 });
  b.acts[b.acts.length - 1].toast = 'Somewhere far off, a door creaks open. You count again: fourteen rooms.';
  b.box(dx, 3.6, zN, 2.4, 1.2, 0.4, w);
  b.sign(dx, 3.6, zN - 0.25, '404', { fixed: true, yaw: Math.PI, style: 'horror', w: 1.1 });
  b.room(12, zN, 24, 66, H, { s: null }, { ...w, color: '#3a2f2f' });
  b.wallX(-X0, 24, zN, H, { ...w, color: '#3a2f2f' });
  b.checkpoint(18, 0, 43.2, 4, { flag: false, hint: 'One of you holds the "LIGHT" plate to raise the beam. The other walks across.' });
  const lightPlate = b.plate(14.2, 0, 43);
  b.sign(14.2, 2.4, 43, 'LIGHT', { style: 'horror', w: 1.0 });
  // The beam: only there while the light is on.
  const beam = b.act('bridge', { op: 'all', in: [lightPlate] }, false, [
    { x: dx, y: -2.4, z: 54, sx: 0.5, sy: 0.4, sz: 16.4, move: [0, 2.2, 0] },
  ], { speed: 3, mat: 'wood', color: '#5a4636', lamp: [14.2, 1.2, 44.4] });
  b.acts[b.acts.length - 1].quiet = true;
  for (const z of [49, 54, 59]) b.light(dx, 3.9, z, { color: '#ff5050', intensity: 8, dist: 9, flicker: 0.15, fixture: 'bulb', when: lightPlate });
  b.box(21.5, 0.42, 41.6, 1.2, 0.84, 0.7, wood);
  const nPhone = b.note(21.5, 0.9, 41.6, "Xiaoyu's Phone — Unsent Draft", `"I'm in 404. She's right outside. She's been knocking for an hour.\n\nIf you see this, don't answer the knocking. And don't trust my messages. The last few weren't from me."`);
  const call = b.pswitch(dx, 0, 64.4, true);
  b.sign(dx, 2.6, 65.75, 'CALL ELEVATOR', { fixed: true, yaw: Math.PI, style: 'horror', w: 2.0 });
  b.note(15, 0.15, 64, 'New Message', `Xiaoyu:\n"Where are you?? I've been home all night. I've never even been up to Floor 4. Who... have you been texting all night?"`);
  const chase = b.zone('trigger', dx, 1.5, 63.8, 6, 3, 3, { fx: ['slam', 'sting'], text: "Knock, knock, knock — she's found this door. Run back to the elevators!" });
  b.light(dx, 3.9, 64, { color: '#ff3030', intensity: 6, dist: 7, flicker: 0.3, fixture: 'bulb' });
  b.mark('plate404', 14.2, 0, 43);
  b.mark('beamStart', dx, 0, 44.6);
  b.mark('beamEnd', dx, 0, 63);
  b.mark('call', dx, 0, 64.4);

  // The elevator: two plates in front of it, and the call from 404.
  const liftA = b.plate(-2.2, 0, 2.2);
  const liftB = b.plate(2.2, 0, 2.2);
  const lift = b.door(0, 0, 4, 3.2, { op: 'all', in: [call, liftA, liftB] }, { latch: true, color: '#7a7d80', speed: 3 });
  b.acts[b.acts.length - 1].toast = 'Ding. The elevator doors open.';
  b.sign(0, 3.55, 0.3, 'Both stand on the plates to open', { fixed: true, yaw: 0, style: 'paper', w: 3.0 });
  b.mark('liftA', -2.2, 0, 2.2);
  b.mark('liftB', 2.2, 0, 2.2);
  b.goal(0, 0, -4.6, 0, { style: 'exit' });

  // Whoever knocked on 404 comes out once you've called the elevator. Its
  // chase ends when the doors open; the lobby and 404 itself are out of its reach.
  const back = tour.slice().reverse();
  b.monster({
    look: 'dorm', y: 0, nodes, edges, patrol: back, start: key(di, dj), patrolStart: back.indexOf(key(di, dj)),
    active: chase, until: lift, wakeAt: [dx, 0, cz(dj) - 1], speed: 3.0, chase: 5.6, sight: 16, giveUp: 15, rest: 5, area: maze,
  });

  b.story = {
    introMs: 9000,
    tagline: 'Rules horror · Thirteen rooms',
    intro: {
      kicker: 'Night 2',
      title: 'Dorm 404',
      lines: [
        `The morning after the school, both your phones buzz with a text from an unknown number: "East dorms, Floor 4, Room 404. I'm waiting for you. — Xiaoyu"`,
        'Xiaoyu is your friend. But Floor 4 of the dorm has been sealed for ten years. The moment the elevator doors open, every light goes out. Beside the elevator, the old dorm rules are still on the wall.',
      ],
      rules: [
        'No riding the elevator after midnight.',
        "If you hear three knocks, don't answer. Stand still until the knocking stops.",
        'The warden does rounds. If she sees you, hide in a wardrobe or hold her in your flashlight.',
        'This floor has only 13 rooms. If you count 14, leave at once.',
        "If there's an extra person in the washroom mirror, don't look back.",
        'There is no Room 404.',
      ],
    },
    outro: {
      kicker: 'Ground Floor',
      title: 'Fourteen Rooms',
      lines: [
        'The elevator drops. 4... 3... 2... Every message "Xiaoyu" sent tonight vanishes from your phones — all but one, sent a minute ago from Floor 4:',
        '"Thank you for opening the door for me."',
        'When the doors open, the floor display flickers: 4... 0... 4.',
        `Then both phones buzz at once. The same unknown number: "Last train, 23:59, Line 4. Don't miss your stop."`,
      ],
    },
  };
  b.objectives = [
    { text: "Read the rules, then find the warden's round log in the halls (if she sees you, hide in a wardrobe or hold her in your flashlight)", done: { note: nLog } },
    { text: "Back to the lobby: one holds the plate at the duty window, the other goes into the warden's office and opens the key cabinet in round order", done: { item: boxKey } },
    { text: 'Put the fuse box key into the fuse box in the elevator lobby', done: { used: boxKey } },
    { text: 'To the laundry: the dryer is locked, and its code is on the washroom mirror (only a flashlight shows it)', done: { sig: dryer } },
    { text: 'Luna takes the blue fuse from the dryer (only Luna can carry it)', done: { item: fBlue } },
    { text: 'Put all three fuses in the fuse box: only Sol can carry the red one, anyone can carry the white', done: { sig: power } },
    { text: "You've counted a fourteenth door. Go into Room 404", done: { note: nPhone } },
    { text: 'One holds the "LIGHT" plate to raise the beam, the other walks across and pounds "CALL ELEVATOR"', done: { sig: call } },
    { text: 'Run back to the lobby! Both of you stand on the plates by the elevator', done: { act: lift } },
    { text: 'Into the elevator!', done: {} },
  ];
  void door404; void officeDoor; void beam; void washOut;
  return b.finish();
}
