// Level 28 · Map Maze: one of you can see the way, the other has to walk it.
// Everything hidden here is only visible to whoever stands on an eye plate
// (or reads the map), so you have to talk each other through.
//   1. an invisible bridge — Luna on the eye tower calls out the steps
//   2. a floor of fake tiles — Sol reads the map in his booth and calls out squares (A–E, 1–6)
//   3. a hedge maze with fake walls and glass — Luna on the balcony guides Sol to the key and out
//   4. an invisible staircase — Sol on the ground eye plate talks Luna up
//   5. the relay — the guide moves from eye plate to eye plate; the walker opens the way for them

import { LevelBuilder } from '../build.js';

const COLS = 'ABCDE';

export function mapMaze(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'map-maze', name: 'Map Maze', label: `Level ${index + 1}`, theme: 'candy', sky: 'dusk' });
  const r = b.rng;
  const pink = '#ffb3cf', mint = '#9fe3c8', lemon = '#ffe08a', grape = '#c9a6ff';
  const block = (x, top, z, w, d, y0, o = {}) => b.floor(x, top, z, w, d, { t: top - y0, ...o });
  const eye = (x, top, z) => {
    const p = b.plate(x, top, z);
    b.sign(x, top + 2.4, z, '👁 Eye plate\nStand here to see', { style: 'prank', w: 3 });
    return p;
  };

  // -- Start ------------------------------------------------------------------------------
  b.floor(0, 0, 3, 20, 8, { color: pink });
  b.checkpoint(0, 0, 2, 6, { hint: 'In this level, hidden things can only be seen by whoever stands on an "eye plate": one watches, one walks — talk each other through!' });

  // -- 1. The invisible bridge: Luna on the eye tower, Sol walks --------------------------
  block(-4.6, 2, 5.2, 2.4, 2.4, 0, { color: lemon });
  block(-4.6, 4.2, 8.8, 3, 3, -6, { color: lemon });
  const eye1 = eye(-4.6, 4.2, 8.8);
  const cell = (row, col) => [col * 2.5, 8.2 + row * 2.5];
  const path1 = [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2], [4, 2], [4, 1], [5, 1], [5, 0], [6, 0], [6, -1], [7, -1], [7, -2], [8, -2], [9, -2], [9, -1], [10, -1], [10, 0], [11, 0]];
  const used1 = new Set(path1.map(([a, c]) => `${a},${c}`));
  path1.forEach(([row, col], i) => {
    const [x, z] = cell(row, col);
    b.trap('hidden', x, 0, z, 2.45, 2.45, { seer: eye1, color: mint });
    b.mark(`s1_${i}`, x, 0, z);
  });
  // Decoys: a straight row of tiles you can see — and fall straight through.
  for (const [row, col] of [[2, 0], [3, 0], [4, 0], [7, 0], [8, 0], [9, 0], [6, 2], [7, 2], [8, 1], [3, -1], [4, -1]]) {
    if (used1.has(`${row},${col}`)) continue;
    const [x, z] = cell(row, col);
    b.trap('fake', x, 0, z, 2.3, 2.3, { seer: eye1, color: pink });
  }
  b.sign(0, 3.2, 6.6, 'Luna: stand on the eye plate\nup the tower — only the\ngreen tiles are real!', { style: 'prank' });
  b.floor(0, 0, 41, 20, 8, { color: pink }); // far side, z 37–45
  const bridge1Sw = b.pswitch(4, 0, 39.5, true);
  b.act('bridge', { op: 'all', in: [bridge1Sw] }, true, [
    { x: 8.2, y: -8.4, z: 22, sx: 2, sy: 0.8, sz: 30.2, move: [0, 8, 0] },
  ], { speed: 7, mat: 'toy', color: lemon, lamp: [8.2, 0.6, 37.6] });
  b.gem(-2.5, 1.3, 26.7);

  // -- 2. Fake tiles and the map: Sol reads, Luna walks ----------------------------------------
  b.checkpoint(0, 0, 41.5, 6, { hint: 'Sol reads the map in the red booth and calls out squares (like "C3"); Luna only steps on the squares called out. Once across, pound the switch to bridge Sol over.' });
  const gx = (c) => -4.8 + c * 2.4, gz = (row) => 46.4 + row * 2.4;
  // A path from row 1 to row 6 that wanders (seeded, so it's the same every time).
  const path2 = [];
  let c = r.int(0, 4);
  for (let row = 0; row < 6; row++) {
    path2.push([row, c]);
    if (row === 5) break;
    const steps = r.int(0, 2);
    const dir = c <= 1 ? 1 : c >= 3 ? -1 : r.sign();
    for (let k = 0; k < steps && c + dir >= 0 && c + dir <= 4; k++) {
      c += dir;
      path2.push([row, c]);
    }
  }
  const safe2 = new Set(path2.map(([a, cc]) => `${a},${cc}`));
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 5; col++) {
      const kind = safe2.has(`${row},${col}`) ? null : 'fake';
      if (kind) b.trap('fake', gx(col), 0, gz(row), 2.3, 2.3, { color: (row + col) % 2 ? lemon : mint });
      else b.floor(gx(col), 0, gz(row), 2.3, 2.3, { color: (row + col) % 2 ? lemon : mint });
    }
  }
  path2.forEach(([row, col], i) => b.mark(`s2_${i}`, gx(col), 0, gz(row)));
  for (let col = 0; col < 5; col++) b.sign(gx(col), 0.9, 44.6, COLS[col], { style: 'prank', w: 0.9 });
  for (let row = 0; row < 6; row++) b.sign(-7, 0.9, gz(row), String(row + 1), { style: 'prank', w: 0.9 });
  // Sol's booth: only Sol gets in (red barrier); the map is on its back wall.
  const map = [];
  for (let row = 5; row >= 0; row--) map.push(`${row + 1}  ${[0, 1, 2, 3, 4].map((col) => (safe2.has(`${row},${col}`) ? '■' : '□')).join(' ')}`);
  map.push(`    ${COLS.split('').join(' ')}`);
  b.floor(9.5, 0, 47.5, 2, 5, { color: pink }); // the path to the booth, z 45–50
  b.floor(13, 0, 47.5, 5, 5, { color: grape });
  b.room(10.5, 45, 15.5, 50, 3.4, { w: [[47.5, 2.2]] }, { color: grape, t: 0.3 });
  b.box(13, 3.55, 47.5, 5.2, 0.3, 5.2, { color: grape }); // roof
  b.fieldZ(10.5, 1.4, 47.5, 2.2, 2.8, 1);
  b.sign(13, 1.9, 49.7, `Map (■ = safe)\n${map.join('\n')}`, { fixed: true, yaw: Math.PI, style: 'paper', w: 3.6 });
  b.floor(0, 0, 65, 20, 10, { color: pink }); // far side, z 60–70
  const bridge2Sw = b.pswitch(-4, 0, 62, true);
  b.act('bridge', { op: 'all', in: [bridge2Sw] }, true, [
    { x: 7.2, y: -8.4, z: 52.5, sx: 2, sy: 0.8, sz: 15.2, move: [0, 8, 0] },
  ], { speed: 7, mat: 'toy', color: grape, lamp: [7.2, 0.6, 60.4] });
  b.gem(gx(2), 1.3, gz(3));

  // -- 3. The hedge maze: Luna on the balcony, Sol inside ---------------------------------------
  b.checkpoint(0, 0, 64.5, 6, { hint: 'Luna climbs the high balcony on the left and stands on the eye plate: hedges outlined in red are fake (walk right through), ones outlined in green are invisible glass. Sol goes in, grabs the key and opens the north gate.' });
  const N = 5, S = 4.4, MX = -11, MZ = 70, WH = 3;
  b.floor(0, 0, MZ + (N * S) / 2, N * S, N * S, { color: mint }); // maze floor, z 70–92
  const mcx = (i) => MX + S / 2 + i * S, mcz = (j) => MZ + S / 2 + j * S;
  const key = (i, j) => j * N + i;
  const open = new Set();
  const pass = (a, d) => open.add(a < d ? `${a}-${d}` : `${d}-${a}`);
  const isOpen = (a, d) => open.has(a < d ? `${a}-${d}` : `${d}-${a}`);
  const seen = new Set([key(2, 0)]);
  const stack = [[2, 0]];
  while (stack.length) {
    const [i, j] = stack[stack.length - 1];
    const nb = r.shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]]).map(([di, dj]) => [i + di, j + dj]).filter(([a, d]) => a >= 0 && a < N && d >= 0 && d < N && !seen.has(key(a, d)));
    if (!nb.length) {
      stack.pop();
      continue;
    }
    const [a, d] = nb[0];
    pass(key(i, j), key(a, d));
    seen.add(key(a, d));
    stack.push([a, d]);
  }
  // Route entrance → key (centre) → exit, through the open passages.
  const nbrs = (i, j) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([di, dj]) => [i + di, j + dj]).filter(([a, d]) => a >= 0 && a < N && d >= 0 && d < N && isOpen(key(i, j), key(a, d)));
  const bfs = (from, to) => {
    const prev = new Map([[key(...from), null]]);
    const q = [from];
    while (q.length) {
      const [i, j] = q.shift();
      if (i === to[0] && j === to[1]) break;
      for (const n of nbrs(i, j)) if (!prev.has(key(...n))) {
        prev.set(key(...n), [i, j]);
        q.push(n);
      }
    }
    const out = [];
    for (let p = to; p; p = prev.get(key(...p))) out.unshift(p);
    return out;
  };
  const route = [...bfs([2, 0], [2, 2]), ...bfs([2, 2], [2, 4]).slice(1)];
  const onRoute = new Set();
  for (let k = 0; k + 1 < route.length; k++) onRoute.add([key(...route[k]), key(...route[k + 1])].sort((p, q) => p - q).join('-'));
  const eye3 = eye(-15, 7, 81);
  // Walls: real ones are hedges; on the route a few passages get a FAKE hedge
  // (walk through it); elsewhere some hedges are swapped for invisible glass.
  const hedge = (x, z, w, d, kind) => {
    if (kind) b.trap(kind, x, WH, z, w, d, { t: WH, seer: eye3, color: '#5fbf7f' });
    else b.box(x, WH / 2, z, w, WH, d, { color: '#5fbf7f' });
  };
  let fakes = 0;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      for (const [di, dj] of [[1, 0], [0, 1]]) {
        const a = i + di, d = j + dj;
        if (a >= N || d >= N) continue;
        const x = di ? MX + (i + 1) * S : mcx(i), z = dj ? MZ + (j + 1) * S : mcz(j);
        const [w, dd] = di ? [0.4, S] : [S, 0.4];
        const k1 = key(i, j), k2 = key(a, d);
        const id = [k1, k2].sort((p, q) => p - q).join('-');
        if (isOpen(k1, k2)) {
          if (onRoute.has(id) && (fakes < 2 || r.chance(0.35))) {
            hedge(x, z, w, dd, 'fake');
            fakes++;
          }
        } else {
          hedge(x, z, w, dd, r.chance(0.3) ? 'hidden' : null);
        }
      }
    }
  }
  // Outer hedges, with the way in (south) and the locked way out (north).
  b.wallGapsX(MX, -MX, MZ, WH, [[mcx(2), 2.6]], { color: '#4fa86c' });
  b.wallGapsX(MX, -MX, MZ + N * S, WH, [[mcx(2), 2.6]], { color: '#4fa86c' });
  b.wallZ(MZ, MZ + N * S, MX, WH, { color: '#4fa86c' });
  b.wallZ(MZ, MZ + N * S, -MX, WH, { color: '#4fa86c' });
  route.forEach(([i, j], k) => b.mark(`m_${k}`, mcx(i), 0, mcz(j)));
  const mazeKey = b.item('key', mcx(2), 1.0, mcz(2), { color: '#ffcf4d', label: 'Maze key', who: 0 });
  const mazeLock = b.lock(mcx(2) + 1.4, 0, mcz(4), [mazeKey], { label: 'Maze gate', radius: 2.0 });
  b.door(mcx(2), MZ + N * S, 2.6, 3, { op: 'all', in: [mazeLock] }, { latch: true, color: '#ffcf4d' });
  b.acts[b.acts.length - 1].toast = 'The maze gate is open!';
  // The balcony on the west, with steps up from the start of the maze.
  block(-15, 7, 81, 4, 6, 0, { color: lemon });
  block(-15, 2.2, 72.2, 2.4, 2.4, 0, { color: lemon });
  block(-15, 4.4, 75.2, 2.4, 2.4, 0, { color: lemon });
  block(-15, 6.4, 77.8, 2.4, 1.6, 0, { color: lemon });
  b.floor(-13, 0, 68, 6, 4, { color: pink }); // ground by the balcony steps, z 66–70
  b.floor(-2, 0, 96, 30, 8, { color: pink }); // north side, z 92–100
  const bridge3Sw = b.pswitch(4, 0, 95, true);
  b.act('bridge', { op: 'all', in: [bridge3Sw] }, true, [
    { x: -15, y: -1.4, z: 89, sx: 2.4, sy: 0.8, sz: 10.2, move: [0, 8, 0] },
  ], { speed: 6, mat: 'toy', color: lemon, lamp: [-15, 7.6, 84.4] });
  b.sign(mcx(2), 3.6, MZ - 0.6, 'Maze: some hedges are fake,\nsome gaps are glass!', { style: 'prank' });
  b.gem(mcx(0), 1.3, mcz(4));

  // -- 4. The invisible staircase: Sol on the ground eye plate, Luna climbs ------------------------
  b.checkpoint(0, 0, 96.5, 6, { hint: 'Sol stands on the eye plate and tells Luna where the invisible steps are; Luna climbs to the top and stands on the plate to bring the lift up for Sol.' });
  const eye4 = eye(-6, 0, 97.5);
  const T4 = 14;
  block(0, T4, 108, 14, 8, 0, { color: lemon }); // the high ledge, z 104–112
  const stairs4 = [[3.4, 2, 101.6], [5.6, 4, 99.6], [3.0, 6, 98.0], [0.2, 8, 99.4], [-2.4, 10, 101.2], [0.2, 12, 102.2]];
  stairs4.forEach(([x, top, z], i) => {
    b.trap('hidden', x, top, z, 2.2, 2.2, { t: 0.6, seer: eye4, color: mint });
    b.mark(`s4_${i}`, x, top, z);
  });
  for (const [x, top, z] of [[-3.6, 2, 101.6], [-5.4, 4, 100.6], [-4.0, 6.2, 98.6], [6.2, 8.2, 101.8]]) b.trap('fake', x, top, z, 2.2, 2.2, { t: 0.6, seer: eye4, color: pink });
  // The lift only goes up while the climber stands on the plate at the top.
  const liftSw = b.plate(-4, T4, 106);
  b.sign(-4, T4 + 2.4, 106, 'Stand on the plate\nto bring the lift up', { style: 'prank' });
  b.act('lift', { op: 'all', in: [liftSw] }, false, [
    { x: 8.5, y: -0.2, z: 101.5, sx: 3, sy: 0.4, sz: 3, move: [0, T4, 0] },
  ], { speed: 4, lamp: [8.5, T4 + 0.4, 103.4] });
  b.floor(8.5, T4, 104.5, 3, 3, { color: lemon }); // the lift's landing, z 103–106
  b.mark('lift', 8.5, 0, 101.5);
  b.gem(3.0, 7.4, 98.0);

  // -- 5. The relay: the guide moves from eye plate to eye plate ------------------------------------
  b.checkpoint(0, T4, 108, 6, { hint: 'Relay! From the high eye plate on the left, Luna can only see the next stretch. Each time Sol finishes a stretch, he pounds the switch to extend Luna\'s walkway.' });
  const GY = T4 + 3;
  const sec = [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [3, 0], [3, -1], [4, -1], [5, -1], [5, 0]]; // row, col; three sections
  const zs5 = 113.4;
  const c5 = (row, col) => [col * 2.5, zs5 + row * 2.5];
  const islands = [];
  const guide = [];
  for (let k = 0; k < 3; k++) {
    const z0 = 112 + k * 16;
    const gz5 = z0 + 4;
    // The guide's platform with its eye plate, high on the west.
    block(-9, GY, gz5, 4, 5, T4 - 6, { color: grape });
    guide.push(eye(-9, GY, gz5));
    b.mark(`g5_${k}`, -9, GY, gz5);
    // The walker's hidden section and the island at its end.
    sec.forEach(([row, col], i) => {
      const [x, z] = c5(row, col);
      b.trap('hidden', x, T4, z + k * 16, 2.45, 2.45, { seer: guide[k], color: mint });
      b.mark(`s5_${k}_${i}`, x, T4, z + k * 16);
    });
    const iz = z0 + 15.2;
    block(0, T4, iz, 4, 2.4, T4 - 6, { color: lemon });
    islands.push(iz);
    b.mark(`i5_${k}`, 0, T4, iz);
  }
  // Switches on the islands raise the guide's next walkway.
  for (let k = 0; k < 3; k++) {
    const sw = b.pswitch(1.2, T4, islands[k], true);
    const z1 = 112 + k * 16 + 6.5, z2 = k < 2 ? 112 + (k + 1) * 16 + 1.5 : 161;
    b.act('bridge', { op: 'all', in: [sw] }, true, [
      { x: -9, y: GY - 8.4, z: (z1 + z2) / 2, sx: 2, sy: 0.8, sz: z2 - z1 + 0.2, move: [0, 8, 0] },
    ], { speed: 6, mat: 'toy', color: grape, lamp: [-9, GY + 0.6, z1 + 0.6] });
  }
  block(-9, T4 + 1.6, 110, 3, 3, T4 - 6, { color: grape }); // a step up to the guide's walkway
  b.sign(0, T4 + 3.2, 110.5, 'End of each stretch: pound\nthe switch to extend your\npartner\'s high walkway!', { style: 'prank' });
  block(-4, T4, 166, 14, 10, T4 - 6, { color: pink }); // the end, z 161–171
  block(-9, GY, 159, 3, 4, T4 - 6, { color: grape }); // the guide's last step down
  b.gem(0, T4 + 1.3, islands[1]);
  b.goal(-3, T4, 167);

  b.objectives = [
    { text: 'Luna on the eye tower guides Sol over the invisible bridge', done: { act: b.acts[0].id } },
    { text: 'Sol reads the map in the booth, Luna steps only on safe squares', done: { act: b.acts[1].id } },
    { text: 'Luna watches the hedges from above, guides Sol to the key and the north gate', done: { used: mazeKey } },
    { text: 'Sol on the eye plate guides Luna up the invisible stairs', done: { act: b.acts.find((a) => a.style === 'lift').id } },
    { text: 'Relay: Luna watches from each stop, Sol opens the way stretch by stretch', done: {} },
  ];
  return b.finish();
}
