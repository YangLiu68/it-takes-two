// Magic Library: swapped riddles, the shelf maze (Luna on the balcony), the
// invisible ink, flying and blinking books, the star lamps, the wind book
// and the seal.
import { press, dialTo, turns, moverNear, launchTo, chain, blinkTask } from './escape-lib.mjs';

export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const item = (label) => L.items.find((i) => i.label === label);
  const dial = (id) => L.dials.find((d) => d.id === id);
  const seq = (prefix) => Object.keys(M).filter((k) => k.startsWith(prefix)).sort((a, c) => Number(a.slice(prefix.length)) - Number(c.slice(prefix.length))).map((k) => M[k]);

  // 0 · Riddles: each sets the wheels on their own side.
  await both((b) => b.path([[-4, 7], [-8, 9], [-8, 12.6]]), (b) => b.path([[4, 7], [8, 9], [8, 12.6]]));
  await shot('riddles', sol.page);
  const rid = L.combos[0];
  await both(async (b) => {
    await dialTo(b, dial(rid.dials[0]), rid.targets[0]);
    await dialTo(b, dial(rid.dials[1]), rid.targets[1]);
  }, async (b) => {
    await dialTo(b, dial(rid.dials[2]), rid.targets[2]);
    await dialTo(b, dial(rid.dials[3]), rid.targets[3]);
  });
  await sol.waitSig(rid.id, 4000);

  // 1 · The maze. Luna launches up to the balcony and walks to the far end.
  const lunaUp = async () => {
    await luna.path([[8, 18], [8, 21], [12, 21.4]], { r: 0.3 });
    await launchTo(luna, { x: 12, z: 21.4 }, [12, 7.2, 25]);
    await shot('balcony', luna.page);
    await luna.path([[12, 40], [12, 58.3]], { r: 0.5 });
    await luna.go(12, 61, { r: 0.5 });
    await luna.until((g) => g.player.grounded && g.player.pos.y < 0.5, null, 5000);
    await luna.go(4, 62.5, { r: 0.4 });
  };
  const solMaze = async () => {
    await sol.path([[-8, 18], [-8, 21.5], [-4, 21.5]], { r: 0.4 });
    await sol.path(seq('mzA').map((p) => [p[0], p[2]]), { r: 0.5 });
    const ink = item('Magic ink');
    await sol.go(ink.x, ink.z, { r: 0.5 });
    await sol.waitHold(ink.id);
    await shot('ink', sol.page);
    await sol.path(seq('mzB').map((p) => [p[0], p[2]]), { r: 0.5 });
    await sol.path([[0, 60], [-4.6, 61.6]], { r: 0.4 });
    await sol.waitUsed(ink.id);
  };
  await Promise.all([lunaUp(), solMaze()]);
  await sol.waitAct(L.acts.find((a) => a.toast === 'The ink stand lights up and the door opens.').id, 6000);

  // 2 · Invisible ink: Luna looks around, Sol pounds the books.
  await both((b) => b.path([[-1, 64], [0.5, 66.6], [4, 69.5]]), (b) => b.path([[1, 64], [-0.5, 66.6], [-4, 69.5], [-8, 73]]));
  await luna.face([-13.7, 2.4, 72]);
  await luna.wait(800);
  await shot('uv', luna.page);
  await luna.face(null);
  const books = L.seqs[0];
  for (const id of books.ids) await press(sol, L.switches.find((w) => w.id === id), [-1, 0]);
  await sol.waitSig(books.id, 5000);

  // 3 · Flying books (Luna) and blinking books (Sol).
  const lunaBooks = async () => {
    await luna.path([[-10.5, 76], [-7, 83.5], [-7, 88.5]], { r: 0.3 });
    const [m1, m2] = L.movers;
    await moverNear(luna, m1.id, -7, 91, 0.35);
    await luna.go(-7, 91, { r: 0.6, hop: false });
    await moverNear(luna, m1.id, -7, 96, 0.3);
    await luna.go(-7, 99.5, { r: 0.5, hop: false });
    await moverNear(luna, m2.id, -7, 102.5, 0.3);
    await luna.go(-7, 102.6, { r: 0.6, hop: false });
    await moverNear(luna, m2.id, -7, 107, 0.3);
    await luna.go(-7, 110.6, { r: 0.4, hop: false });
    await luna.waitHold(item('Quill').id);
    await shot('quill', luna.page);
  };
  const solBlinks = async () => {
    await sol.path([[8, 80], [7, 84], [7, 88.4]], { r: 0.3 });
    const blinkPeriod = L.blinks[0].period;
    for (let k = 0; k < 3; k++) {
      await chain(sol, [blinkTask(k % 2, blinkPeriod, 1.1), { type: 'jump', to: M[`blink${k}`] }, { type: 'jump', to: M[`rest${k}`] }]);
    }
    await sol.jump({ to: [7, 0, 117.4] });
    await press(sol, L.switches.find((w) => w.latch && Math.abs(w.z - 118) < 0.1), [-1, 0]);
  };
  await Promise.all([lunaBooks(), solBlinks()]);
  const bridge = L.acts.find((a) => a.style === 'bridge');
  await luna.waitAct(bridge.id, 6000);
  await luna.path([[-7, 114.7], [-7, 117], [-2.8, 119.4]], { r: 0.4 });
  await luna.waitUsed(item('Quill').id);
  await sol.go(1.5, 120.5, { r: 0.4 });
  await sol.waitAct(L.acts.find((a) => a.toast === 'The quill starts writing by itself... the door opens.').id, 6000);

  // 4 · Star lamps: find how often to flip each (mod 2), then flip.
  await both((b) => b.path([[-0.8, 122], [-0.8, 124], [-3, 125]]), (b) => b.path([[0.8, 122], [0.8, 124], [3, 125]]));
  const stars = L.combos[1];
  const ls = stars.dials.map(dial);
  let q = null;
  for (let c = 0; c < 32 && !q; c++) {
    const t = [0, 1, 2, 3, 4].map((k) => (c >> k) & 1);
    if (ls.every((d, j) => (d.start + t[j] + t[(j + 1) % 5] + t[(j + 4) % 5]) % 2 === 1)) q = t;
  }
  if (!q) throw new Error('star lamps have no solution');
  const out = (d) => {
    const dx = d.x - 0, dz = d.z - 131, l = Math.hypot(dx, dz);
    return [dx / l, dz / l];
  };
  for (let k = 0; k < 5; k++) if (q[k]) await turns(k < 3 ? sol : luna, ls[k], 1, out(ls[k]));
  await sol.waitSig(stars.id, 4000);
  await shot('stars');

  // 5 · The wind book, then the seal.
  await both((b) => b.path([[-0.8, 138], [-0.8, 142.6], [0, 156]], { r: 0.5 }), (b) => b.path([[0.8, 138], [0.8, 142.6], [M.windLow[0], M.windLow[2]]], { r: 0.4 }));
  await luna.go(M.windLow[0], M.windLow[2], { r: 0.3, stop: true });
  await sol.go(M.wind[0], M.wind[2] - 1.2, { r: 0.4 });
  await sol.go(M.wind[0], M.wind[2], { r: 0.45, speed: 0.4 });
  await sol.until((g) => g.player.pos.y > 12.8, null, 8000);
  await sol.go(-2, 163, { r: 0.5, timeout: 6000 });
  await sol.until((g) => g.player.grounded && g.player.pos.y > 11.5, null, 5000);
  await sol.go(M.windTop[0], M.windTop[2], { r: 0.3, stop: true });
  await luna.go(M.wind[0], M.wind[2] - 1.2, { r: 0.4 });
  await luna.go(M.wind[0], M.wind[2], { r: 0.45, speed: 0.4 });
  await luna.until((g) => g.player.pos.y > 12.8, null, 8000);
  await luna.go(M.sealB[0], M.sealB[2], { r: 0.4, timeout: 6000 });
  await luna.until((g) => g.player.grounded && g.player.pos.y > 11.5, null, 5000);
  await luna.go(M.sealB[0], M.sealB[2], { r: 0.3, stop: true });
  await sol.go(M.sealA[0], M.sealA[2], { r: 0.3, stop: true });
  const seal = L.acts.find((a) => a.toast === 'The seal is broken! The forbidden book is inside.');
  await sol.waitAct(seal.id, 6000);
  await shot('seal');
  const goal = L.goal;
  await luna.go(goal.x + 1.3, goal.z - 0.5);
  await sol.go(goal.x - 1.3, goal.z - 0.5);
}
