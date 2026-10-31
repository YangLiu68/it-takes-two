// Clock Shop: set the stopped clock, cuckoo order, two bridges, the fan shelf,
// three gears, the linked-gear hands, and the clock tower.
import { press, dialTo, turns, climb, pendulumClear, chain } from './escape-lib.mjs';

export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const item = (label) => L.items.find((i) => i.label === label);
  const dial = (id) => L.dials.find((d) => d.id === id);

  // 0 · Luna reads the floor clock, Sol sets the wheels.
  await both((b) => b.path([[-4, 7], [-8, 9], [-8, 12]]), (b) => b.path([[4, 7], [8, 9], [8, 11.6]]));
  await shot('clock', luna.page);
  const time = L.combos[0];
  await dialTo(sol, dial(time.dials[0]), time.targets[0]);
  await dialTo(sol, dial(time.dials[1]), time.targets[1]);
  await sol.waitSig(time.id, 4000);

  // 1 · Cuckoo clocks: Sol (east) reads, Luna (west) presses.
  await both((b) => b.path([[-8, 18], [-8, 21.5], [4, 23], [7, 27]]), (b) => b.path([[8, 18], [8, 21.5], [-4, 23], [-7, 27]]));
  await shot('cuckoo', sol.page);
  const cuckoo = L.seqs[0];
  for (const id of cuckoo.ids) await press(luna, L.switches.find((w) => w.id === id), [0, -1]);
  await luna.waitSig(cuckoo.id, 5000);

  // 2 · Two bridges.
  const pend = L.pendulums.slice().sort((a, c) => a.z - c.z);
  const solRun = async () => {
    await sol.path([[6, 38], [6, 42.5], [6, pend[0].z - 2.6]], { r: 0.4 });
    for (let k = 0; k < pend.length; k++) {
      await pendulumClear(sol, pend[k].id);
      const next = k + 1 < pend.length ? pend[k + 1].z - 2.6 : 66.2;
      await sol.go(6, next, { r: 0.4, hop: false });
    }
    await sol.go(6, 66.3, { r: 0.3 });
    await sol.waitHold(item('Red gear').id);
  };
  const lunaRun = async () => {
    await luna.path([[-6, 38], [-6, 43]], { r: 0.3 });
    const hops = [];
    for (let k = 0; k < 6; k++) hops.push({ type: 'jump', to: M[`tile${k}`], timeout: 4000 });
    hops.push({ type: 'jump', to: [-6, 0, 66.2], timeout: 4000 });
    await chain(luna, hops);
    await luna.go(-6, 66.3, { r: 0.3 });
    await luna.waitHold(item('Blue gear').id);
  };
  await Promise.all([solRun(), lunaRun()]);
  await shot('gears');

  // 3 · Red and blue gears into the movement, then the fan for the gold one.
  await both((b) => b.go(1.2, 78.4, { r: 0.3 }), (b) => b.go(-1.2, 78.4, { r: 0.3 }));
  await sol.waitUsed(item('Red gear').id);
  await luna.waitUsed(item('Blue gear').id);
  await luna.go(M.fanLow[0], M.fanLow[2], { r: 0.3, stop: true });
  await sol.go(M.fan[0] - 1.2, M.fan[2], { r: 0.4 });
  await sol.go(M.fan[0], M.fan[2], { r: 0.45, speed: 0.4 });
  await sol.until((g) => g.player.pos.y > 9.2, null, 6000);
  await sol.go(11.6, 86.2, { r: 0.4, timeout: 6000 });
  const gold = item('Gold gear');
  await sol.waitHold(gold.id);
  await shot('gold', sol.page);
  await sol.go(11, 79.5, { r: 0.5 });
  await sol.until((g) => g.player.grounded && g.player.pos.y < 0.5, null, 5000);
  await sol.go(1.2, 78.4, { r: 0.3 });
  await sol.waitUsed(gold.id);
  const lock = L.locks[0];
  await sol.waitSig(lock.id, 4000);

  // 4 · Linked gears: work out how often to turn each (presses commute).
  await both((b) => b.path([[5, 88], [5, 92], [7, 97]]), (b) => b.path([[-3, 84], [-5, 88], [-5, 92], [-7, 97]]));
  const linked = L.combos[1];
  const ds = linked.dials.map(dial);
  const start = ds.map((d) => d.start);
  let q = null;
  for (let c = 0; c < 256 && !q; c++) {
    const t = [c & 3, (c >> 2) & 3, (c >> 4) & 3, (c >> 6) & 3];
    const ok = start.every((v, j) => (v + [j - 1, j, j + 1].filter((i) => i >= 0 && i < 4).reduce((s, i) => s + t[i], 0)) % 4 === 0);
    if (ok) q = t;
  }
  if (!q) throw new Error('linked gears have no solution');
  await turns(luna, ds[0], q[0]);
  await turns(luna, ds[1], q[1]);
  await turns(sol, ds[2], q[2]);
  await turns(sol, ds[3], q[3]);
  await sol.waitSig(linked.id, 4000);
  await shot('linked', sol.page);

  // 5 · The tower: Luna holds the plate, Sol climbs and locks the steps out.
  await both((b) => b.path([[7, 106], [7, 110], [0, 114.6]]), (b) => b.path([[-7, 106], [-7, 110], [M.towerLow[0], M.towerLow[2]]]));
  await luna.go(M.towerLow[0], M.towerLow[2], { r: 0.3, stop: true });
  const steps = [];
  for (let k = 0; k < 11; k++) steps.push(M[`step${k}`]);
  const top = M.towerTop;
  await climb(sol, [...steps, [0, top[1], 134]], [0, 0, 114.6]);
  await press(sol, L.switches.find((w) => w.latch && Math.abs(w.y - top[1]) < 0.1), [0, -1]);
  await shot('tower', sol.page);
  await climb(luna, [...steps, [0, top[1], 134]], [0, 0, 114.6]);
  const goal = L.goal;
  await luna.go(goal.x - 1.5, goal.z - 0.6);
  await sol.go(goal.x + 1.5, goal.z);
}
