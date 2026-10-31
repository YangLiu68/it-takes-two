// Candy Factory: clock in, sort candies, mix syrup, gumball tower, chocolate raft,
// hot-air fan, lights-out packing, timed gate, batch number.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const act = (text) => L.acts.find((a) => a.toast && a.toast.includes(text));
  const item = (label) => L.items.find((i) => i.label === label);
  const dialAt = (m) => L.dials.find((d) => Math.abs(d.x - m[0]) < 0.01 && Math.abs(d.z - m[2]) < 0.01);
  const comboOf = (dialId) => L.combos.find((c) => c.dials.includes(dialId));
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);

  // 0. Clock in: Sol on the floor plate, Luna double-jumps onto the shelf plate.
  await both((b) => b.go(M.clockA[0], M.clockA[2], { r: 0.3, stop: true }), async (b) => {
    await b.go(6, 10.2, { r: 0.3 });
    await b.jump({ to: [M.clockB[0], M.clockB[1], M.clockB[2]], double: true });
    await b.go(M.clockB[0], M.clockB[2], { r: 0.3, stop: true });
  });
  await sol.waitAct(act('Clocked in').id, 6000);

  // 1. Sorting lanes: each crosses their own belts.
  const lane = async (b, x) => {
    await b.path([[x * 0.4, 17], [x * 0.4, 20], [x, 23.5], [x, 24.6]]);
    await b.jump({ to: [x, 0, 27.6] });
    await b.go(x, 30.5, { r: 0.4 });
    await b.jump({ to: [x, 0.8, 34] });
    await b.go(x, 37, { r: 0.4 });
    await b.jump({ to: [x, 1.6, 40.5] });
    await b.go(x, 43.5, { r: 0.4 });
    await b.jump({ to: [x, 1.6, 46.5] });
    await b.go(x, 46.75, { r: 0.4 });
  };
  await both((b) => lane(b, -5), (b) => lane(b, 5));
  await sol.waitHold(item('Strawberry candy').id);
  await luna.waitHold(item('Blueberry candy').id);
  await shot('candies');
  await both(async (b) => {
    await b.go(-5, 49.5);
    await b.go(-1.2, 51.6, { r: 0.3 });
  }, async (b) => {
    await b.go(5, 49.5);
    await b.go(1.2, 51.6, { r: 0.3 });
  });
  await sol.waitAct(act('candy pot').id, 6000);

  // 2. Recipe: Sol reads the poster, Luna dials in double the recipe.
  await both((b) => b.path([[-1.5, 55], [-1.5, 58], [-5, 62], [-8, 71]]), (b) => b.path([[1.5, 55], [1.5, 58], [5, 62], [5, 69]]));
  for (let i = 0; i < 3; i++) {
    const d = dialAt(M[`syrup${i}`]);
    await luna.setDial(d, comboOf(d.id).targets[comboOf(d.id).dials.indexOf(d.id)]);
  }
  await luna.waitAct(act('Syrup mixed').id, 6000);
  await shot('syrup');

  // 3. Gumball tower: Luna stands on the seesaw, Sol pounds the other end.
  const e = L.seesaws[0];
  await both((b) => b.path([[-5, 80], [-5, 85], [-1.1, 92], [e.x + 3.4, e.z]]), (b) => b.path([[5, 80], [5, 85], [-7.9, 91], [e.x - 3.4, e.z]]));
  // Catapult (try again if the timing was off and nobody flew).
  for (let k = 0; ; k++) {
    await luna.go(e.x - 3.4, e.z, { r: 0.3, stop: true });
    await sol.go(e.x + 3.4, e.z, { r: 0.3, stop: true });
    await luna.wait(300);
    await sol.pound();
    try {
      await luna.until((g) => g.player.pos.y > 4, null, 2500);
      break;
    } catch (err) {
      if (k >= 2) throw err;
    }
  }
  await luna.go(-4.5, 101.8, { r: 0.6, timeout: 8000 });
  await luna.until((g) => g.player.pos.y > 9 && g.player.grounded, null, 4000);
  await luna.go(-4.5, 110.2, { r: 0.4 });
  await luna.waitHold(item('Giant gumball').id);
  await shot('gumball-top', luna.page);
  // Sol presses the flavour order Luna reads off the wall up there.
  const flavour = L.seqs[0];
  for (const id of flavour.ids) {
    const w = L.switches.find((s) => s.id === id);
    await sol.go(w.x, w.z, { r: 0.3, stop: true });
    await sol.pound();
  }
  await sol.waitSig(flavour.id, 4000);
  // Luna waits for the cookie bridge to come back, then jumps down with it.
  await luna.until((g) => [...g.world.crumbles.values()].every((c) => c.phase === 'idle'), null, 10000);
  await luna.path([[-4.5, 103], [-4.5, 98.5], [2, 98.5], [8, 90.5]]);
  await luna.go(8, 89.3, { r: 0.3 });
  await luna.waitAct(act('gumball machine').id, 6000);

  // 4. Chocolate river: Luna holds the near plate while Sol rides across.
  await both((b) => b.path([[4.5, 102], [4.5, 122], [0, 126], [0, 134.3]], { r: 0.4 }), (b) => b.path([[6.5, 102], [6.5, 122], [-5, 128]], { r: 0.4 }));
  await luna.go(-5, 128, { r: 0.3, stop: true });
  await sol.go(0, 134.3, { r: 0.3, stop: true });
  await sol.until((g) => g.player.pos.z > 145, null, 8000);
  await sol.path([[0, 151.5], [7.5, 150]], { r: 0.4 });
  await shot('raft');
  // Swap: Sol steps off so the raft comes back, Luna boards, Sol holds the far plate.
  await sol.go(5, 151.5, { r: 0.3 });
  await luna.go(-1, 130, { r: 0.4 });
  await luna.until((g) => {
    const a = g.world.acts.find((x) => x.def.style === 'carrier');
    return a && a.parts[0].u < 0.01;
  }, null, 8000);
  await luna.go(0, 134.3, { r: 0.3, stop: true });
  await sol.go(7.5, 150, { r: 0.3, stop: true });
  await luna.until((g) => g.player.pos.z > 145, null, 8000);
  await luna.path([[0, 151.5], [4.5, 153.5]], { r: 0.4 });
  await luna.go(4.5, 153.5, { r: 0.3, stop: true });
  // Hot-air fan: Luna powers it, Sol rides up and powers it from the top for Luna.
  await sol.path([[-1, 151], [-3, 152.5], [M.fan[0], M.fan[2]]], { r: 0.3 });
  await sol.until((g) => g.player.pos.y > 12.6, null, 8000);
  await sol.go(-5, 158.8, { r: 0.3, stop: true });
  await luna.path([[2, 152], [-3, 152.5], [M.fan[0], M.fan[2]]], { r: 0.3 });
  await luna.until((g) => g.player.pos.y > 12.6, null, 8000);
  await luna.go(-2, 164, { r: 0.5 });
  await sol.go(1, 165, { r: 0.5 });
  await shot('fan-top');

  // 5. Lights out: find which lamps to press (each flips itself and its neighbours).
  const lamps = L.dials.filter((d) => d.style === 'color');
  const ids = lamps.map((d) => d.id);
  let press = null;
  for (let mask = 0; mask < 1 << lamps.length && !press; mask++) {
    const v = lamps.map((d) => d.start);
    for (let i = 0; i < lamps.length; i++) {
      if (!(mask & (1 << i))) continue;
      for (const k of [lamps[i].id, ...lamps[i].links]) v[ids.indexOf(k)] ^= 1;
    }
    if (v.every((x) => x === 1)) press = lamps.filter((_, i) => mask & (1 << i));
  }
  if (!press) throw new Error('lights-out has no solution');
  await both((b) => b.go(-2, 172, { r: 0.5 }), (b) => b.go(2, 172, { r: 0.5 }));
  for (const [k, d] of press.entries()) {
    const b = k % 2 ? luna : sol;
    await b.go(d.x, d.z, { r: 0.3, stop: true });
    await b.pound();
    await b.go(d.x, d.z - 1.8, { r: 0.5 });
  }
  await sol.waitAct(act('packing machine').id, 6000);
  await shot('lights');

  // 6. Timed gate: Luna runs out and pounds the timer, Sol races the course.
  await both((b) => b.path([[-1, 188], [-1, 192], [0, 195.4]]), (b) => b.path([[1, 188], [1, 192], [-9, 192], [-32, 192], [M.timer[0], M.timer[2]]]));
  await luna.go(M.timer[0], M.timer[2], { r: 0.3, stop: true });
  await luna.pound();
  const timer = L.switches.find((w) => Math.abs(w.x - M.timer[0]) < 0.01 && Math.abs(w.z - M.timer[2]) < 0.01);
  await sol.waitSig(timer.id, 4000);
  await sol.go(0, 198.6, { r: 0.5 });
  await sol.jump({ to: [0, 12, 203] });
  await sol.go(0, 204, { r: 0.5 });
  await sol.jump({ to: [0, 12, 208.6] });
  await sol.go(0, 212, { r: 0.5 });
  await sol.go(M.keep[0], M.keep[2], { r: 0.3, stop: true });
  await sol.pound();
  const keep = L.switches.find((w) => Math.abs(w.x - M.keep[0]) < 0.01 && Math.abs(w.z - M.keep[2]) < 0.01);
  await sol.waitSig(keep.id, 3000);
  // Luna comes along through the open gate.
  await luna.path([[-32, 192], [-9, 192], [0, 195.4], [0, 198.6]]);
  await luna.jump({ to: [0, 12, 203] });
  await luna.go(0, 204, { r: 0.5 });
  await luna.jump({ to: [0, 12, 208.6] });
  await luna.go(0, 213, { r: 0.5 });
  // Batch number from the three workshop walls.
  const setShip = async (b, i) => {
    const d = dialAt(M[`ship${i}`]);
    const c = comboOf(d.id);
    await b.setDial(d, c.targets[c.dials.indexOf(d.id)]);
  };
  await both(async (b) => {
    await setShip(b, 0);
    await setShip(b, 1);
  }, (b) => setShip(b, 2));
  await sol.waitAct(act('rainbow candy ships').id, 6000);
  await shot('shipped');
  await luna.go(1.5, 233.5);
  await sol.go(-1.5, 233.5);
}
