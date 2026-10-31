// Level 13 · Invisible Road: paths you can't see. Whoever stands on an eye plate sees
// the hidden blocks (green) and the fake ones (red) — and only they do, so
// they have to talk their partner across. Every stage changes who sees what.

import { LevelBuilder } from '../build.js';
import { plankBridge } from './kit3.js';

const GREEN = '#7dffb0';

export function invisibleRoad(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'invisible-road', name: 'Invisible Road', label: `Level ${index + 1}`, theme: 'twilight', sky: 'dusk' });
  const r = b.rng;

  // -- 1. Stepping stones nobody can see ---------------------------------------------
  b.floor(0, 0, 0, 12, 10, { mat: 'wood' });
  b.checkpoint(0, 0, -1.5, 7, { hint: 'An invisible road! Whoever stands on the eye plate can see the hidden blocks (green) and the fake ones (red), but nobody else can. Tell your partner where to jump!' });
  const eye1 = b.plate(-3.5, 0, 2.5);
  b.sign(-3.5, 3.1, 2.5, 'Eye plate\nOnly the one on it can see', { w: 4 });
  b.sign(3, 3.4, 4, 'The road you can see...\nmight not be real', { w: 4 });
  const stones = [[1, 0, 8], [3, 0.4, 11.6], [1.5, 0.8, 15.2], [0.2, 0.4, 18.6], [0.8, 0, 22], [2.5, 0, 25.5]];
  stones.forEach(([x, top, z], i) => {
    b.trap('hidden', x, top, z, 2.6, 2.6, { seer: eye1, color: GREEN });
    b.mark(`s1-${i}`, x, top, z);
  });
  // The tempting, visible, straight path is all fakes.
  for (const z of [8, 12, 16, 20, 24]) b.trap('fake', -2.8, 0, z, 2.6, 2.6, { seer: eye1 });
  // A button floating over nothing marks a hidden stone off to the side.
  b.trap('hidden', 5.2, 0.4, 19, 2.2, 2.2, { seer: eye1, color: GREEN });
  b.gem(5.2, 1.8, 19);
  b.gem(1.5, 2.4, 15.2);
  b.floor(0, 0, 31.5, 18, 7, { mat: 'wood' });
  const back1 = b.pswitch(3.5, 0, 31, true);
  b.sign(3.5, 2.9, 31, 'Pound the button:\na bridge for your partner', { w: 3.6 });
  plankBridge(b, -5.3, 5, 28, 0, back1, { w: 2 });
  b.mark('back1', 3.5, 0, 31);

  // -- 2. Two lanes: take turns seeing ------------------------------------------------
  b.checkpoint(0, 0, 30.5, 6, { hint: 'Two tracks, take turns being the eyes: Luna stands on this eye plate to guide Sol down the left; once across, Sol stands on the far eye plate to guide Luna down the right.' });
  const eyeA = b.plate(2.5, 0, 33);
  const eyeB = b.plate(-4, 0, 67.5);
  b.sign(2.5, 2.9, 33, 'Eye: see the left track', { w: 3.2 });
  b.sign(-4, 2.9, 67.5, 'Eye: see the right track', { w: 3.2 });
  b.sign(-4, 3.4, 36, 'Left: half of it is fake', { w: 3.6 });
  b.sign(4, 3.4, 36, 'Right: truly invisible', { w: 3.6 });
  const rows = [38.5, 42.5, 46.5, 50.5, 54.5, 58.5, 62.5];
  rows.forEach((z, i) => {
    // Lane A (left, x≈-4): both tiles visible, one fake.
    const realA = r.sign();
    for (const side of [-1, 1]) {
      const x = -4 + side * 1.5;
      if (side === realA) {
        b.floor(x, 0, z, 2.6, 2.6, { color: b.color(), t: 0.8 });
        b.mark(`A${i}`, x, 0, z);
      } else {
        b.trap('fake', x, 0, z, 2.6, 2.6, { seer: eyeA });
      }
    }
    // Lane B (right, x≈+4): the real tile is invisible, the visible one is fake.
    const realB = r.sign();
    for (const side of [-1, 1]) {
      const x = 4 + side * 1.5;
      if (side === realB) {
        b.trap('hidden', x, 0, z, 2.6, 2.6, { seer: eyeB, color: GREEN });
        b.mark(`B${i}`, x, 0, z);
      } else {
        b.trap('fake', x, 0, z, 2.6, 2.6, { seer: eyeB });
      }
    }
    if (i === 3) b.gem(-4 + realA * 1.5, 2.2, z);
  });
  b.floor(0, 0, 69, 18, 8, { mat: 'wood' });

  // -- 3. Flash: the path only shows for three seconds -----------------------------------
  b.checkpoint(0, 0, 70, 6, { hint: 'Flash switch: pound it and the hidden road glows for 3 seconds, so both of you can see it. One pounds, the other memorizes the route and jumps ahead!' });
  const flash = b.pswitch(-5.5, 0, 69.5, false, 3);
  b.sign(-5.5, 2.9, 69.5, 'Flash switch\nGlows for 3 sec', { w: 3 });
  const path3 = [[0, 0, 76.5], [3, 0.5, 79.8], [5, 1, 83.2], [2.5, 1.5, 86.4], [-0.5, 1.5, 89.6], [-3, 1, 92.8], [-1, 0.5, 96], [2, 0.5, 99.2], [0, 0, 102.4]];
  path3.forEach(([x, top, z], i) => {
    b.trap('hidden', x, top, z, 2.4, 2.4, { reveal: flash, color: GREEN });
    b.mark(`m${i}`, x, top, z);
  });
  for (const [x, z] of [[-3, 78], [0, 84], [5, 92], [-4, 99]]) b.trap('fake', x, 0.5, z, 2.4, 2.4, { reveal: flash });
  b.gem(-0.5, 3.0, 89.6);
  b.floor(0, 0, 108.5, 18, 7, { mat: 'wood' });
  const back3 = b.pswitch(4, 0, 108, true);
  b.sign(4, 2.9, 108, 'Pound: a bridge\nfor your partner', { w: 3.4 });
  plankBridge(b, 7.5, 73, 105, 0, back3, { w: 2 });
  b.mark('back3', 4, 0, 108);

  // -- 4. The maze of invisible walls ----------------------------------------------------
  b.checkpoint(0, 0, 108, 6, { hint: 'A maze: the real walls are invisible, and the walls you can see are fake — walk right through them! One climbs the lookout tower to the eye plate and guides the other to the button at the end.' });
  const C = 5, R = 7, S = 3.4, X0 = -8.5, Z0 = 112;
  const cx = (i) => X0 + S / 2 + i * S;
  const cz = (j) => Z0 + S / 2 + j * S;
  const key = (i, j) => j * C + i;
  const open = new Set();
  const pass = (a, c) => open.add(a < c ? `${a}-${c}` : `${c}-${a}`);
  const isOpen = (a, c) => open.has(a < c ? `${a}-${c}` : `${c}-${a}`);
  const seen = new Set([key(2, 0)]);
  const stack = [[2, 0]];
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
  b.floor(0, 0, Z0 + (R * S) / 2, C * S, R * S, { color: '#3d3550' });
  const WH = 2.8;
  const wallMat = { color: '#5b4f7a' };
  // Outer walls (visible and real), with the entrance and exit gaps.
  b.wallGapsX(X0, -X0, Z0, WH, [[cx(2), 3]], wallMat);
  const zN = Z0 + R * S;
  b.wallGapsX(X0, -X0, zN, WH, [[cx(2), 3]], wallMat);
  b.wallZ(Z0, zN, X0, WH, wallMat);
  b.wallZ(Z0, zN, -X0, WH, wallMat);
  // Inner walls: real ones are invisible; some openings get a visible fake wall.
  const wallBit = (x, z, alongX, real) => {
    const w = alongX ? S - 0.1 : 0.3, d = alongX ? 0.3 : S - 0.1;
    if (real) b.trap('hidden', x, WH, z, w, d, { t: WH, seer: eyeTower, reveal: mazeDone, color: GREEN });
    else b.trap('fake', x, WH, z, w, d, { t: WH, seer: eyeTower, reveal: mazeDone, color: '#8c7bb8' });
  };
  // The lookout tower beside the entrance.
  b.box(-7.5, 0.8, 109, 2.2, 1.6, 2.2, { color: '#6a5a8a' });
  b.box(-9.6, 1.6, 109.5, 2.2, 3.2, 2.2, { color: '#6a5a8a' });
  b.box(-11.6, 2.4, 111, 2.6, 4.8, 4, { color: '#6a5a8a' });
  const eyeTower = b.plate(-11.6, 4.8, 111.5);
  b.sign(-11.6, 7.6, 111.5, 'Lookout tower: eye plate', { w: 3.4 });
  b.mark('tower0', -7.5, 1.6, 109);
  b.mark('tower1', -9.6, 3.2, 109.5);
  b.mark('tower2', -11.6, 4.8, 111.5);
  const mazeDone = b.pswitch(cx(0), 0, cz(0), true); // placeholder, moved below
  for (let j = 0; j < R; j++) {
    for (let i = 0; i < C; i++) {
      if (i < C - 1) {
        const real = !isOpen(key(i, j), key(i + 1, j));
        if (real || r.chance(0.45)) wallBit(cx(i) + S / 2, cz(j), false, real);
      }
      if (j < R - 1) {
        const real = !isOpen(key(i, j), key(i, j + 1));
        if (real || r.chance(0.45)) wallBit(cx(i), cz(j) + S / 2, true, real);
      }
    }
  }
  // The button: in the cell farthest from the entrance.
  const dist = new Map([[key(2, 0), 0]]);
  const prev = new Map();
  const q = [[2, 0]];
  while (q.length) {
    const [i, j] = q.shift();
    for (const [a, c] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
      if (a < 0 || a >= C || c < 0 || c >= R || dist.has(key(a, c)) || !isOpen(key(i, j), key(a, c))) continue;
      dist.set(key(a, c), dist.get(key(i, j)) + 1);
      prev.set(key(a, c), [i, j]);
      q.push([a, c]);
    }
  }
  let far = [2, 0];
  for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) if (dist.get(key(i, j)) > dist.get(key(far[0], far[1]))) far = [i, j];
  const sw = b.switches.find((w) => w.id === mazeDone);
  Object.assign(sw, { x: cx(far[0]), z: cz(far[1]) });
  b.gem(cx(far[0]), 1.6, cz(far[1]));
  // Route marks for the walkthrough: entrance → button, and button → exit.
  const routeTo = (to) => {
    const out = [];
    for (let c = to; c; c = prev.get(key(c[0], c[1]))) out.unshift(c);
    return out;
  };
  routeTo(far).forEach(([i, j], k) => b.mark(`in${k}`, cx(i), 0, cz(j)));
  // From the button to the exit cell (2, R-1): BFS from the button.
  const dist2 = new Map([[key(far[0], far[1]), 0]]);
  const prev2 = new Map();
  const q2 = [far];
  while (q2.length) {
    const [i, j] = q2.shift();
    for (const [a, c] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
      if (a < 0 || a >= C || c < 0 || c >= R || dist2.has(key(a, c)) || !isOpen(key(i, j), key(a, c))) continue;
      dist2.set(key(a, c), 1);
      prev2.set(key(a, c), [i, j]);
      q2.push([a, c]);
    }
  }
  const out2 = [];
  for (let c = [2, R - 1]; c; c = prev2.get(key(c[0], c[1]))) out2.unshift(c);
  out2.forEach(([i, j], k) => b.mark(`out${k}`, cx(i), 0, cz(j)));
  const fromStart = routeTo([2, R - 1]);
  fromStart.forEach(([i, j], k) => b.mark(`thru${k}`, cx(i), 0, cz(j)));
  const exitDoor = b.door(cx(2), zN, 3, WH, { op: 'all', in: [mazeDone] }, { latch: true, color: '#b48cff' });
  b.acts[b.acts.length - 1].toast = 'The exit is open! All the maze walls are visible now.';
  b.sign(cx(2), 3.6, zN - 0.3, 'EXIT', { fixed: true, yaw: Math.PI, w: 1.6 });
  void exitDoor;

  // -- 5. The invisible staircase ----------------------------------------------------------
  const top5 = 12;
  b.floor(0, 0, zN + 4.2, 14, 8, { mat: 'wood' });
  const z5 = zN + 4.2;
  b.checkpoint(0, 0, z5, 6, { hint: 'Climb! Mixed in with the invisible steps are some that vanish when you land on them (they grow back). The one below stands on the eye plate to guide; whoever gets up first stands on the top eye plate to guide their partner.' });
  const eyeLow = b.plate(4, 0, z5 - 1);
  const eyeTop = b.plate(3, top5, z5 + 18);
  b.sign(4, 2.9, z5 - 1, 'Eye: see the steps', { w: 3.2 });
  const steps = [[-3, 1.5, 6], [-0.5, 3, 7.5], [2, 4.5, 6.5], [4, 6, 8.5], [1.5, 7.5, 10], [-1, 9, 9], [-3.5, 10.5, 11], [-1.5, 12, 13]];
  steps.forEach(([x, top, dz], i) => {
    const z = z5 + dz;
    if (i === 1 || i === 4) b.trap('vanish', x, top, z, 2.2, 2.2, { t: 0.6, delay: 0.8, reset: 3, color: '#ff9ec8' });
    else b.trap('hidden', x, top, z, 2.2, 2.2, { t: 0.6, seer: [eyeLow, eyeTop], color: GREEN });
    b.mark(`up${i}`, x, top, z);
  });
  // The ladder you'd climb if you trusted your eyes.
  for (let k = 0; k < 5; k++) b.trap('fake', 5.5, 1.5 + k * 1.5, z5 + 5 + k * 1.2, 2.2, 2.2, { t: 0.6, seer: [eyeLow, eyeTop] });
  b.gem(4, 7.4, z5 + 8.5);
  b.floor(0, top5, z5 + 20, 12, 12, { mat: 'wood' });
  b.sign(3, top5 + 2.9, z5 + 18, 'Eye: guide your partner up', { w: 3.4 });
  b.goal(-1, top5, z5 + 22);
  return b.finish();
}
