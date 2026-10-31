// Puzzle 3 · Magic Library. The hardest of the first three:
//   0 riddles: each of you holds the riddles for the other's symbol wheels
//   1 shelf maze: Sol walks the maze for the magic ink, Luna watches from a
//     balcony up on the shelves and calls the turns
//   2 invisible ink: words that only show when you look straight at them;
//     Luna finds all five, Sol pounds the books in that order
//   3 flying books: Luna rides moving books to the quill island, Sol hops
//     the blinking books to raise the bridge that brings her back
//   4 star lamps: five lamps in a ring, each pound flips it and both
//     neighbours (lights-out); light them all
//   5 the forbidden shelf: the wind book blows you up one at a time; two
//     plates up top break the seal, if the ink and the quill are in place

import { LevelBuilder } from '../build.js';
import { PHYS } from '../constants.js';

const LUNA_BLUE = '#4f86ff';

const RIDDLES = {
  Sun: 'A round ball, hot and bright,\nit sinks in the west\nand rises in the east.',
  Moon: 'Now a round plate,\nnow a thin sickle,\nit hangs above the trees.',
  Star: 'They fill the sky, twinkling,\nwinking their bright eyes;\nhidden all day, out at night.',
  Cloud: 'Like cotton, but not cotton,\nit floats in the blue sky,\nnow a horse, now a sheep.',
  Wind: "You can't see it or touch it,\nbut grass bows as it runs by\nand trees sing as it passes.",
  Rain: 'A thousand threads and more\ndrop into the pond\nand vanish without a trace.',
};

export function magicLibrary(index) {
  const b = new LevelBuilder({ mode: 'puzzle', index, seed: 'magic-library', name: 'Magic Library', label: 'Room 3', theme: 'twilight', sky: 'aurora' });
  const r = b.rng;
  const H = 12;
  const wall = { color: '#5b4a7a', t: 0.5 };
  const door = { ...wall, lintel: 5 };
  const shelfColors = ['#6b4a2a', '#7a5636', '#5e3f24', '#845e3a'];
  const tallZ = (z0, z1, x, top = 26) => b.box(x, top / 2, (z0 + z1) / 2, 0.5, top, Math.abs(z1 - z0), wall);
  const tallX = (x0, x1, z, top = 26) => b.box((x0 + x1) / 2, top / 2, z, Math.abs(x1 - x0), top, 0.5, wall);

  // -- 0 · The librarian's riddles -------------------------------------------------------------
  b.floor(0, 0, 10, 28, 20, { mat: 'wood' });
  b.wallX(-14, 14, 0, H, wall);
  b.wallZ(0, 20, -14, H, wall);
  b.wallZ(0, 20, 14, H, wall);
  b.box(0, H / 2, 15, 4, H, 10, wall);
  b.checkpoint(0, 0, 4, 6, { hint: "The librarian left four riddles. The answers to the riddles on your wall are dialed in on your partner's side!" });
  b.sign(0, 3.8, 7.6, "The Librarian's Riddles\nRead the riddles on your wall;\nyour partner dials the answers", { style: 'prank', w: 4.4 });
  b.field(-8, H / 2, 10, 12, H, 0.3, 1);
  b.field(8, H / 2, 10, 12, H, 0.3, -1);
  b.sign(-8, 4.4, 10, 'Sol only', { style: 'prank', w: 2.4 });
  b.sign(8, 4.4, 10, 'Luna only', { style: 'prank', w: 2.4 });
  const symbols = Object.keys(RIDDLES);
  const answers = r.shuffle(symbols.slice()).slice(0, 4);
  const wheelX = [-10.5, -5.5, 5.5, 10.5];
  const wheels = wheelX.map((x, i) => {
    const id = b.dial(x, 0, 15.5, { values: symbols, start: (symbols.indexOf(answers[i]) + 1 + r.int(0, 4)) % symbols.length });
    b.sign(x, 3.2, 15.5, `Riddle ${i + 1}`, { style: 'prank', w: 1.5 });
    return id;
  });
  const riddleText = (i) => `Riddle ${i + 1}\n${RIDDLES[answers[i]]}`;
  // Sol's wall holds riddles 3 and 4 (Luna's wheels); Luna's wall holds 1 and 2.
  b.sign(-13.7, 3.6, 13.2, riddleText(2), { fixed: true, yaw: Math.PI / 2, style: 'paper', w: 4.2 });
  b.sign(-13.7, 3.6, 17.6, riddleText(3), { fixed: true, yaw: Math.PI / 2, style: 'paper', w: 4.2 });
  b.sign(13.7, 3.6, 13.2, riddleText(0), { fixed: true, yaw: -Math.PI / 2, style: 'paper', w: 4.2 });
  b.sign(13.7, 3.6, 17.6, riddleText(1), { fixed: true, yaw: -Math.PI / 2, style: 'paper', w: 4.2 });
  b.sign(-8, 5.6, 19.6, 'Every answer is one of:\nSun Moon Star Cloud Wind Rain', { fixed: true, yaw: Math.PI, style: 'prank', w: 5 });
  b.sign(8, 5.6, 19.6, 'Every answer is one of:\nSun Moon Star Cloud Wind Rain', { fixed: true, yaw: Math.PI, style: 'prank', w: 5 });
  const riddles = b.combo(wheels, answers.map((a) => symbols.indexOf(a)));
  b.wallGapsX(-14, 14, 20, H, [[-8, 3], [8, 3]], door);
  b.door(-8, 20, 3, 5, { op: 'all', in: [riddles] }, { latch: true, color: '#ffb59e' });
  b.door(8, 20, 3, 5, { op: 'all', in: [riddles] }, { latch: true, color: '#8fb4ff' });
  b.acts[b.acts.length - 1].toast = 'All riddles solved! The library doors open.';
  b.gem(0, 1.2, 2);

  // -- 1 · The shelf maze, with Luna's balcony ------------------------------------------------
  const C = 6, R = 9, S = 4, X0 = -14, Z0 = 23;
  b.floor(0, 0, 42.5, 28, 45, { mat: 'wood', color: '#4a3a5a' });
  b.wallZ(20, 65, -14, H, wall);
  b.wallZ(20, 65, 14, H, wall);
  const cx = (i) => X0 + S / 2 + i * S;
  const cz = (j) => Z0 + S / 2 + j * S;
  const key = (i, j) => j * C + i;
  const open = new Set();
  const link = (a, c) => open.add(a < c ? `${a}-${c}` : `${c}-${a}`);
  const linked = (a, c) => open.has(a < c ? `${a}-${c}` : `${c}-${a}`);
  const IN = [2, 0], OUT = [3, R - 1];
  const seen = new Set([key(...IN)]);
  const stack = [IN];
  while (stack.length) {
    const [i, j] = stack[stack.length - 1];
    const nb = r.shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]]).map(([di, dj]) => [i + di, j + dj]).filter(([a, c]) => a >= 0 && a < C && c >= 0 && c < R && !seen.has(key(a, c)));
    if (!nb.length) {
      stack.pop();
      continue;
    }
    link(key(i, j), key(...nb[0]));
    seen.add(key(...nb[0]));
    stack.push(nb[0]);
  }
  for (let k = 0; k < 3; k++) {
    const i = r.int(0, C - 2), j = r.int(1, R - 2);
    link(key(i, j), key(i + 1, j));
  }
  const nbrs = (i, j) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([di, dj]) => [i + di, j + dj]).filter(([a, c]) => a >= 0 && a < C && c >= 0 && c < R && linked(key(i, j), key(a, c)));
  const bfs = (from) => {
    const prev = new Map([[key(...from), null]]);
    const q = [from];
    while (q.length) {
      const cur = q.shift();
      for (const n of nbrs(...cur)) if (!prev.has(key(...n))) {
        prev.set(key(...n), cur);
        q.push(n);
      }
    }
    return prev;
  };
  const pathTo = (prev, to) => {
    const out = [];
    for (let c = to; c; c = prev.get(key(...c))) out.unshift(c);
    return out;
  };
  const fromIn = bfs(IN);
  // The ink waits in the dead end farthest from the way in.
  let inkCell = null, best = -1;
  for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) {
    if (nbrs(i, j).length !== 1 || (i === OUT[0] && j === OUT[1])) continue;
    const d = pathTo(fromIn, [i, j]).length;
    if (d > best) {
      best = d;
      inkCell = [i, j];
    }
  }
  for (let j = 0; j < R; j++) {
    for (let i = 0; i < C; i++) {
      const x = cx(i), z = cz(j);
      const color = shelfColors[(i + j) % shelfColors.length];
      if (i < C - 1 && !linked(key(i, j), key(i + 1, j))) b.box(x + S / 2, 3, z, 0.6, 6, S + 0.6, { mat: 'wood', color });
      if (j < R - 1 && !linked(key(i, j), key(i, j + 1))) b.box(x, 3, z + S / 2, S + 0.6, 6, 0.6, { mat: 'wood', color });
    }
  }
  // Outer edges of the maze (gaps for the way in and out).
  for (let i = 0; i < C; i++) {
    if (i !== IN[0]) b.box(cx(i), 3, Z0, S + 0.6, 6, 0.6, { mat: 'wood', color: shelfColors[i % 4] });
    if (i !== OUT[0]) b.box(cx(i), 3, Z0 + R * S, S + 0.6, 6, 0.6, { mat: 'wood', color: shelfColors[(i + 1) % 4] });
  }
  // Luna's balcony along the east side, on top of the shelves.
  const balTop = 7.2;
  b.box(12, balTop / 2, Z0 + (R * S) / 2, 4, balTop, R * S, { color: '#7a5636' });
  b.pad(12, 0.08, 21.4, [0, 1, 0], -1, { launch: [0, PHYS.repelSpeed, 0] });
  b.sign(12, 3.4, 20.9, 'Luna: stand on the blue pad\nHold E to reach the balcony', { style: 'prank', w: 3 });
  b.checkpoint(-4, 0, 21.5, 3, { hint: 'Shelf maze: Sol goes in to find the magic ink. Luna jumps up to the balcony, sees the way from above and tells Sol where to go!' });
  b.sign(-9, 3.6, 21.2, 'Shelf Maze\nSol: find the magic ink\nLuna: guide Sol from above', { style: 'prank', w: 3.6 });
  const ink = b.item('fuse', cx(inkCell[0]), 1.0, cz(inkCell[1]), { who: 0, color: '#7b3fe0', label: 'Magic ink' });
  b.light(cx(inkCell[0]), 2.4, cz(inkCell[1]), { color: '#c08bff', intensity: 6, dist: 6, fixture: 'none' });
  b.gem(12, balTop + 1.4, 40);
  pathTo(fromIn, inkCell).forEach(([i, j], k) => b.mark(`mzA${k}`, cx(i), 0, cz(j)));
  pathTo(bfs(inkCell), OUT).forEach(([i, j], k) => b.mark(`mzB${k}`, cx(i), 0, cz(j)));
  // The way out: the ink goes on its stand.
  const inkLock = b.lock(-6, 0, 62.5, [ink], { label: 'Ink stand' });
  b.checkpoint(4, 0, 62, 4, { hint: 'Put the magic ink on the ink stand.' });
  b.wallGapsX(-14, 14, 65, H, [[0, 4]], door);
  b.door(0, 65, 4, 5, { op: 'all', in: [inkLock] }, { latch: true, color: '#c08bff' });
  b.acts[b.acts.length - 1].toast = 'The ink stand lights up and the door opens.';
  b.mark('inkLock', -6, 0, 62.5);

  // -- 2 · Invisible ink ----------------------------------------------------------------------
  b.floor(0, 0, 75, 28, 20, { color: '#3e3352' });
  b.wallZ(65, 85, -14, H, wall);
  b.wallZ(65, 85, 14, H, wall);
  b.wallZ(68, 85, 0, H, wall);
  b.checkpoint(0, 0, 66.6, 2.6, { hint: "There's invisible magic writing on Luna's walls. It only shows when you look straight at it. Five in all!" });
  b.field(-7, H / 2, 68, 14, H, 0.3, -1);
  b.field(7, H / 2, 68, 14, H, 0.3, 1);
  b.sign(-7, 4.4, 68, 'Luna only', { style: 'prank', w: 2.4 });
  b.sign(7, 4.4, 68, 'Sol only', { style: 'prank', w: 2.4 });
  const books = [['Red', '#e8202a'], ['Orange', '#ff8a1f'], ['Green', '#2fa84f'], ['Blue', '#1f4fe0'], ['Purple', '#8a3fd1']];
  const order = r.shuffle([0, 1, 2, 3, 4]);
  const spots = [
    { x: -13.7, y: 1.6, z: 72.5, yaw: Math.PI / 2 },
    { x: -9, y: 3.4, z: 84.7, yaw: Math.PI },
    { x: -0.3, y: 1.6, z: 80.5, yaw: -Math.PI / 2 },
    { x: -7, y: 2.4, z: 75.75, yaw: Math.PI },
    { x: -13.7, y: 5.0, z: 80.5, yaw: Math.PI / 2 },
  ];
  b.box(-7, 1.6, 76.1, 3.2, 3.2, 0.6, { mat: 'wood', color: '#6b4a2a' });
  r.shuffle(spots.slice()).forEach((sp, k) => {
    b.sign(sp.x, sp.y, sp.z, `Book ${k + 1}: ${books[order[k]][0]}`, { fixed: true, yaw: sp.yaw, style: 'uv', w: 5.5 });
  });
  b.sign(-0.3, 3.4, 72, 'Hidden words on these walls\nshow only when you face them\nFind all 5, tell Sol the order', { fixed: true, yaw: -Math.PI / 2, style: 'prank', w: 3.6 });
  const layout = r.shuffle([0, 1, 2, 3, 4]);
  const bookSw = {};
  layout.forEach((bi, k) => {
    const z = 71.5 + k * 2.6;
    bookSw[bi] = b.pswitch(11.6, 0, z, false, 0.6, books[bi][1]);
    b.box(13.35, 1.4, z, 0.5, 2.8, 1.2, { color: books[bi][1] });
  });
  const bookSeq = b.seq(order.map((bi) => bookSw[bi]));
  b.sign(6, 4.0, 76, 'Pound these books in the\norder of the magic words\nAsk Luna for the order!', { style: 'prank', w: 3.2 });
  b.wallGapsX(-14, 14, 85, H, [[-7, 3], [7, 3]], door);
  b.door(-7, 85, 3, 5, { op: 'all', in: [bookSeq] }, { latch: true, color: '#8fb4ff' });
  b.door(7, 85, 3, 5, { op: 'all', in: [bookSeq] }, { latch: true, color: '#ffb59e' });
  b.acts[b.acts.length - 1].toast = 'The shelves swing aside with a whoosh!';
  b.gem(12.5, 1.2, 83);

  // -- 3 · Flying books ---------------------------------------------------------------------
  b.floor(0, 0, 87, 28, 4, { mat: 'wood' });
  tallZ(85, 122, -14);
  tallZ(85, 122, 14);
  b.checkpoint(7, 0, 87, 3, { hint: 'Sol: blinking books come and go. Wait on a steady book until the next one appears, then jump. Pound the button on the far side to lower the book bridge!' });
  b.checkpoint(-7, 0, 87, 3, { hint: 'Luna: ride the flying books to the island for the quill. Sol will lower the book bridge for you.' });
  // Luna's way: two moving books and a resting book, out to the island.
  const m1 = b.mover(3, 0.8, 3, { type: 'linear', a: [-7, -0.4, 91], b: [-7, -0.4, 96], period: 6, phase: 0 }, { color: '#ff6fb5' });
  b.floor(-7, 0, 99.5, 3, 3, { color: '#ffd25e' });
  const m2 = b.mover(3, 0.8, 3, { type: 'linear', a: [-7, -0.4, 102.5], b: [-7, -0.4, 107], period: 6, phase: 0.5 }, { color: '#5ee0d6' });
  b.floor(-7, 0, 111, 6, 5, { mat: 'wood' });
  const quill = b.item('tag', -7, 1.0, 111.8, { who: 1, color: LUNA_BLUE, label: 'Quill' });
  b.sign(-7, 4.2, 91.5, 'Luna: ride the flying\nbooks to the island', { style: 'prank', w: 3 });
  // Sol's way: blinking books with steady ones between.
  const blinkAt = [91.5, 99.5, 107.5];
  const restAt = [95.5, 103.5, 111.5];
  blinkAt.forEach((z, k) => b.blink(7, 0, z, 2.8, 2.8, k % 2, 3.2));
  for (const z of restAt) b.floor(7, 0, z, 2.6, 2.6, { color: '#8f7bff' });
  b.sign(7, 4.2, 91.5, 'Sol: blinking books vanish!', { style: 'prank', w: 3 });
  b.floor(0, 0, 119, 28, 6, { mat: 'wood' });
  const bridgeSw = b.pswitch(10, 0, 118, true);
  b.sign(10, 2.9, 119.6, 'Pound to lower\nthe book bridge', { style: 'prank', w: 2.4 });
  const bridge = b.act('bridge', { op: 'all', in: [bridgeSw] }, true, [
    { x: -7, y: -0.3 - 9, z: 114.75, sx: 3, sy: 0.6, sz: 2.6, move: [0, 9, 0] },
  ], { speed: 12, mat: 'toy', color: '#ffd25e', lamp: [-4.8, 0.5, 116.4] });
  const quillLock = b.lock(-1.5, 0, 120.5, [quill], { label: 'Quill stand' });
  b.checkpoint(0, 0, 118.5, 5, { hint: 'Put the quill in the quill stand.' });
  b.wallGapsX(-14, 14, 122, H, [[0, 4]], door);
  b.door(0, 122, 4, 5, { op: 'all', in: [quillLock] }, { latch: true, color: '#8fb4ff' });
  b.acts[b.acts.length - 1].toast = 'The quill starts writing by itself... the door opens.';
  b.gem(7, 2.6, 103.5);
  b.mark('m1', -7, 0, 91);
  b.mark('m2', -7, 0, 102.5);
  b.mark('rest', -7, 0, 99.5);
  blinkAt.forEach((z, k) => b.mark(`blink${k}`, 7, 0, z));
  restAt.forEach((z, k) => b.mark(`rest${k}`, 7, 0, z));
  void m1; void m2;

  // -- 4 · Star lamps (lights-out on a ring) --------------------------------------------------
  b.floor(0, 0, 131, 28, 18, { color: '#2d2440' });
  b.wallZ(122, 140, -14, H, wall);
  b.wallZ(122, 140, 14, H, wall);
  b.checkpoint(0, 0, 123.8, 3, { hint: 'Star lamps: pound a lamp and it flips, along with its two neighbors. Light all five!' });
  b.box(0, 2.5, 131, 2.4, 5, 2.4, { color: '#8f7bff' });
  const lamp = ['#3a3450', '#ffd84d'];
  const presses = [0, 1, 2, 3, 4].map(() => r.int(0, 1));
  if (presses.every((p) => p === 0)) presses[2] = 1;
  const lampStart = [0, 1, 2, 3, 4].map((j) => (1 + presses[j] + presses[(j + 1) % 5] + presses[(j + 4) % 5]) % 2);
  const lamps = [0, 1, 2, 3, 4].map((k) => {
    const a = Math.PI / 2 + (k * Math.PI * 2) / 5;
    return b.dial(Math.cos(a) * 5.5, 0, 131 + Math.sin(a) * 5.5, { values: lamp, style: 'color', start: lampStart[k] });
  });
  lamps.forEach((id, k) => {
    b.dials.find((d) => d.id === id).links = [lamps[(k + 1) % 5], lamps[(k + 4) % 5]];
    const d = b.dials.find((q) => q.id === id);
    b.mark(`lamp${k}`, d.x, 0, d.z);
  });
  const stars = b.combo(lamps, [1, 1, 1, 1, 1]);
  b.sign(0, 6.6, 131, 'Star Lamps\nA pound flips a lamp and\nboth its neighbors\nLight all five!', { style: 'prank', w: 4.4 });
  b.light(0, 6, 131, { color: '#ffe9a8', intensity: 12, dist: 16, fixture: 'none', when: stars });
  b.wallGapsX(-14, 14, 140, H, [[0, 4]], door);
  b.door(0, 140, 4, 5, { op: 'all', in: [stars] }, { latch: true, color: '#ffd84d' });
  b.acts[b.acts.length - 1].toast = 'All five star lamps are lit! The Forbidden Section opens.';
  b.gem(-11, 1.2, 137);

  // -- 5 · The forbidden shelf --------------------------------------------------------------------
  b.floor(0, 0, 156, 28, 32, { mat: 'wood', color: '#3a2e50' });
  tallZ(140, 172, -14);
  tallZ(140, 172, 14);
  tallX(-14, 14, 172);
  b.checkpoint(0, 0, 142.6, 4, { hint: 'One holds the plate so the wind book blows the other up to the forbidden shelf; a plate up there brings the second one up. Then both stand on the plates by the seal!' });
  const top = 12;
  b.box(0, top / 2, 166, 14, top, 10, { mat: 'wood', color: '#5e3f24' });
  b.plat(0, 0.25, 159.1, 3.4, 3.4, 1.2, { mat: 'metal' });
  const windLow = b.plate(-6, 0, 152);
  const windTop = b.plate(-5.4, top, 164.6);
  b.fan(0, 0.25, 159.1, 1.5, 13.4, 58, { op: 'any', in: [windLow, windTop] });
  b.wire(windLow, [[-6, 0, 152], [-6, 0, 159.1], [-1.8, 0, 159.1]]);
  b.sign(-6, 3.0, 150.4, 'Hold the plate:\nthe wind book blows\nyour partner up', { style: 'prank', w: 3.2 });
  // The seal: a cage on top, opened by two plates (and the ink and quill in place).
  const sealA = b.plate(-3, top, 162.6);
  const sealB = b.plate(3, top, 162.6);
  const cageWall = { color: '#8a3fd1', t: 0.4, y: top };
  b.wallZ(166, 171, -3.5, 7, cageWall);
  b.wallZ(166, 171, 3.5, 7, cageWall);
  b.wallX(-3.5, 3.5, 171, 7, cageWall);
  const seal = b.door(0, 166, 7, 7, { op: 'all', in: [inkLock, quillLock, sealA, sealB] }, { latch: true, color: '#c08bff', y: top, speed: 5 });
  b.acts[b.acts.length - 1].toast = 'The seal is broken! The forbidden book is inside.';
  b.sign(0, top + 3.0, 161.2, 'Both stand on the plates\nto break the seal', { style: 'prank', w: 3.2 });
  b.box(0, top + 0.5, 169.6, 1.4, 1, 1, { mat: 'wood', color: '#2a1a10' });
  b.box(0, top + 1.15, 169.6, 0.9, 0.3, 0.7, { color: '#8a3fd1' });
  b.light(0, top + 2.4, 169.6, { color: '#c08bff', intensity: 8, dist: 8, fixture: 'none' });
  b.gem(6, top + 1.4, 168);
  b.goal(0, top, 170);
  b.mark('windLow', -6, 0, 152);
  b.mark('wind', 0, 0.25, 159.1);
  b.mark('windTop', -5.4, top, 164.6);
  b.mark('sealA', -3, top, 162.6);
  b.mark('sealB', 3, top, 162.6);

  b.objectives = [
    { text: 'Swapped riddles: solve all four; your partner dials in the answers', done: { sig: riddles } },
    { text: 'Sol: find the magic ink in the shelf maze (Luna guides from the balcony)', done: { item: ink } },
    { text: 'Put the magic ink on the ink stand at the maze exit', done: { used: ink } },
    { text: 'Luna finds the five invisible words, Sol pounds the books in order', done: { sig: bookSeq } },
    { text: 'Luna rides the flying books to the quill; Sol crosses the blinking books and lowers the bridge', done: { act: bridge } },
    { text: 'Put the quill in the quill stand', done: { used: quill } },
    { text: 'Star lamps: light all five', done: { sig: stars } },
    { text: 'Take turns riding the wind book up to the forbidden shelf, then both hold the plates to break the seal', done: { act: seal } },
    { text: 'Claim the forbidden book! Both step into the goal', done: {} },
  ];
  return b.finish();
}
