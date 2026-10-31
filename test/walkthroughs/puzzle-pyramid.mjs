// Pyramid: riddles + push the gate, the Eye of Horus trap corridor, sand slides
// and axes, the sarcophagus and offering order, linked star rings, nine
// braziers, the lift relay and a synchronized pound.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const act = (text) => L.acts.find((a) => a.toast && a.toast.includes(text));
  const item = (label) => L.items.find((i) => i.label === label);
  const dialAt = (m) => L.dials.find((d) => Math.abs(d.x - m[0]) < 0.01 && Math.abs(d.z - m[2]) < 0.01);
  const comboOf = (dialId) => L.combos.find((c) => c.dials.includes(dialId));
  const target = (d) => comboOf(d.id).targets[comboOf(d.id).dials.indexOf(d.id)];
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const plate = (x, z) => L.plates.find((p) => Math.abs(p.x - x) < 0.01 && Math.abs(p.z - z) < 0.01);

  // 0. Each reads one obelisk and sets their two wheels; then both push.
  const gate = [0, 1, 2, 3].map((i) => dialAt(M[`gate${i}`]));
  await both(async (b) => {
    await b.path([[-7, 8], [-10, 11.5]]);
    await b.go(-7, 13);
    await b.setDial(gate[0], target(gate[0]));
    await b.setDial(gate[1], target(gate[1]));
    await b.go(-9, 23, { r: 0.3, stop: true });
  }, async (b) => {
    await b.path([[7, 8], [10, 11.5]]);
    await b.go(7, 13);
    await b.setDial(gate[3], target(gate[3]));
    await b.setDial(gate[2], target(gate[2]));
    await b.go(9, 23, { r: 0.3, stop: true });
  });
  await shot('riddles');
  await sol.waitAct(act('stone gate opens').id, 8000);

  // 1. Luna stands on the Eye, Sol hops the safe tiles, then raises the bridge for her.
  const eye = L.plates.find((p) => p.z > 30 && p.z < 33);
  await both((b) => b.path([[-1, 26.5], [-1, 29.5], [-1, 33.4]], { r: 0.4 }), (b) => b.path([[1, 26.5], [1, 29.5], [eye.x, eye.z]], { r: 0.4 }));
  await luna.go(eye.x, eye.z, { r: 0.3, stop: true });
  await shot('eye', luna.page);
  let from = [-1, 33.4];
  for (let k = 0; k < 5; k++) {
    const m = M[`row${k}`];
    await sol.go(from[0] * 0.7 + m[0] * 0.3, from[1] + (k === 0 ? 0.3 : 1.1), { r: 0.3 });
    await sol.jump({ to: [m[0], 0, m[2]], double: true });
    await sol.go(m[0], m[2], { r: 0.4 });
    from = [m[0], m[2]];
  }
  await sol.go(from[0], from[1] + 1.1, { r: 0.3 });
  await sol.jump({ to: [from[0] * 0.5, 0, 64], double: true });
  const bridgeSw = L.switches.find((w) => w.latch && w.z > 63 && w.z < 66);
  await sol.go(bridgeSw.x, bridgeSw.z, { r: 0.3, stop: true });
  await sol.pound();
  await luna.waitAct(act('stone bridge rises').id, 5000);
  await luna.wait(1500);
  await luna.path([[0, 33.6], [0, 63.5], [-1, 68]], { r: 0.4 });

  // 2. Sand slides: belts, then wait out each axe, then a sideways belt.
  const axes = L.pendulums;
  const lane = async (b, side) => {
    const cx = side * 5;
    await b.path([[side * 1.5, 70.5], [side * 1.5, 72], [cx, 74.5], [cx, 75.5]], { r: 0.35 });
    await b.jump({ to: [cx, 0, 78.5] });
    await b.go(cx, 83.5, { r: 0.4 });
    await b.jump({ to: [cx, 0, 85.8] });
    await b.go(cx, 85.8, { r: 0.3, stop: true });
    for (const z of [88, 92]) {
      const h = axes.find((p) => Math.abs(p.x - cx) < 0.1 && Math.abs(p.z - z) < 0.1);
      await b.until((g, bot, a) => {
        const ph = ((2 * Math.PI * (g.world.time / a.period + a.phase)) % Math.PI + Math.PI) % Math.PI;
        return ph > 0.35 && ph < 0.8;
      }, { period: h.period, phase: h.phase }, 10000);
      await b.go(cx, z + 2, { r: 0.35, stop: true });
    }
    await b.go(cx, 94.4, { r: 0.3 });
    await b.jump({ to: [cx + side * 0.6, 0, 97] });
    await b.go(cx + side * 0.9, 100.6, { r: 0.4 });
    await b.jump({ to: [cx, 0, 103.5] });
    await b.go(cx, 104.2, { r: 0.4 });
  };
  await both((b) => lane(b, -1), (b) => lane(b, 1));
  await sol.waitHold(item('Red Scarab').id);
  await luna.waitHold(item('Blue Scarab').id);
  await shot('scarabs');

  // 3. The sarcophagus, then the offering order behind the slab.
  await both((b) => b.path([[-4, 108], [-1, 111], [-1.2, 117.8]], { r: 0.4 }), (b) => b.path([[4, 108], [1, 111], [1.2, 117.8]], { r: 0.4 }));
  await sol.waitAct(act('sarcophagus opens').id, 8000);
  await sol.wait(2500);
  await shot('slab');
  for (const id of L.seqs[0].ids) {
    const w = L.switches.find((s) => s.id === id);
    await sol.go(w.x > 0 ? 3.2 : -3.2, 127, { r: 0.4 });
    await sol.go(w.x, w.z, { r: 0.3, stop: true });
    await sol.pound();
    await sol.go(w.x, 127, { r: 0.4 });
  }
  await sol.waitAct(act('deep in the tomb').id, 5000);

  // 4. Star chamber: Sol reads the star map in his room, Luna turns the rings (left to right).
  await both((b) => b.path([[6, 134], [7.5, 138], [0, 141], [-4, 145], [-8, 145]]), (b) => b.path([[8.5, 134], [7.5, 138], [3, 148]]));
  for (let i = 0; i < 3; i++) {
    const d = dialAt(M[`ring${i}`]);
    await luna.setDial(d, target(d));
  }
  await luna.waitAct(act('Starlight!').id, 5000);
  await shot('rings', luna.page);

  // 5. Braziers: find the presses that light all nine.
  const fires = L.dials.filter((d) => d.style === 'color');
  const fid = fires.map((d) => d.id);
  let best = null;
  for (let mask = 0; mask < 1 << fires.length; mask++) {
    const v = fires.map((d) => d.start);
    for (let i = 0; i < fires.length; i++) if (mask & (1 << i)) for (const k of [fires[i].id, ...fires[i].links]) v[fid.indexOf(k)] ^= 1;
    if (v.every((x) => x === 1)) {
      const n = fires.filter((_, i) => mask & (1 << i));
      if (!best || n.length < best.length) best = n;
    }
  }
  if (!best) throw new Error('braziers have no solution');
  await both((b) => b.path([[-6, 145], [-3, 145], [-1, 158], [-1, 162]]), (b) => b.path([[1, 158], [1, 162]]));
  const left = best.filter((d) => d.x <= 0), right = best.filter((d) => d.x > 0);
  const press = async (b, list) => {
    for (const d of list) {
      await b.go(d.x + (d.x > 0 ? 1.8 : -1.8), d.z, { r: 0.4 });
      await b.go(d.x, d.z, { r: 0.3, stop: true });
      await b.pound();
      await b.go(d.x + (d.x > 0 ? 1.8 : -1.8), d.z, { r: 0.4 });
    }
  };
  await both((b) => press(b, left), (b) => press(b, right));
  await sol.waitAct(act('All nine fires').id, 5000);
  await shot('braziers');

  // 6. Lift relay: Luna holds the plate, Sol rides up; Sol holds the top plate for Luna.
  const pa = plate(0, 193);
  await both((b) => b.path([[-1, 186], [-6, 194], [-6, 198]], { r: 0.35 }), (b) => b.path([[1, 186], [pa.x, pa.z]], { r: 0.35 }));
  await sol.go(-6, 198, { r: 0.3, stop: true });
  await luna.go(pa.x, pa.z, { r: 0.3, stop: true });
  await sol.until((g) => g.player.pos.y > 7.2, null, 8000);
  await sol.path([[-6, 201.5], [-2, 204.5], [2.5, 204.5]], { r: 0.35 });
  await luna.path([[3, 195], [6, 198]], { r: 0.35 });
  await luna.go(6, 198, { r: 0.3, stop: true });
  await sol.go(6, 203.5, { r: 0.3, stop: true });
  await luna.until((g) => g.player.pos.y > 7.2, null, 8000);
  await luna.path([[6, 201.5], [2, 205.5]], { r: 0.4 });
  await shot('ledge');
  // Pound together.
  const syncs = L.switches.filter((w) => !w.latch && Math.abs(w.y - 7.5) < 0.01);
  const sa = syncs.find((w) => w.x < 0), sb = syncs.find((w) => w.x > 0);
  const stairs = act('Steps slide out');
  for (let k = 0; ; k++) {
    await both((b) => b.go(sa.x, sa.z, { r: 0.3, stop: true }), (b) => b.go(sb.x, sb.z, { r: 0.3, stop: true }));
    await both((b) => b.pound(), (b) => b.pound());
    try {
      await sol.waitAct(stairs.id, 2000);
      break;
    } catch (err) {
      if (k >= 3) throw err;
    }
  }
  const climb = async (b) => {
    const parts = stairs.parts;
    await b.go(parts[0].x, parts[0].z + parts[0].move[2] - 1.9, { r: 0.35 });
    for (const p of parts) await b.jump({ to: [p.x, p.y + p.sy / 2, p.z + p.move[2]], double: true });
    await b.jump({ to: [parts[2].x, 15, 217.5], double: true });
  };
  await luna.wait(1500);
  await climb(sol);
  await sol.go(-1.5, 222, { r: 0.5 });
  await climb(luna);
  await luna.go(1.5, 223);
  await sol.go(-1.5, 223);
}
