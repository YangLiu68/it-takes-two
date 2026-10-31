// Level 26 Runaway Train: board when the train is in, jump the bars, hold the gate for
// each other, run up the long train, dispatch the right train, hop between the
// two cars to dodge the blocks.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const sw = (id) => L.switches.find((w) => w.id === id);
  const at = async (bot, y, what) => {
    const p = await bot.pos();
    if (p[1] < y - 0.6) throw new Error(`${bot.name} missed ${what}: at ${p.map((v) => v.toFixed(1)).join(',')}`);
  };
  const movers = L.movers.filter((m) => m.motion.type === 'linear' && m.mat !== 'hazard');
  const carAt = (z) => movers.find((m) => Math.abs(m.motion.a[2] - z) < 0.01);
  // Wait until a car is near one end of its run.
  const atEnd = (bot, car, end, tol = 0.7) => bot.until((g, b, a) => {
    const c = g.physics.byId.get(a.id);
    return c && Math.abs(c.pos.z - a.z) < a.tol;
  }, { id: car.id, z: end === 'a' ? car.motion.a[2] : car.motion.b[2], tol }, 30000);
  // jumpIf: a bar will reach me in a moment (by my speed over the ground), or
  // I'm at the front edge of a car that isn't the last one (a.cars: back→front).
  const jumpTest = ((g, b, a) => {
    const p = g.player;
    const gr = p.ground;
    const gv = gr && gr.vel ? gr.vel.z : 0;
    const vz = p.vel.z + gv;
    // Time until my body reaches the bar (radius + half its thickness short of it):
    // jump 0.13–0.32 s before, so my feet are above it when it passes.
    for (const z of a.bars) {
      const tau = Math.abs(vz) > 0.5 ? (z - p.pos.z - 0.75 * Math.sign(vz)) / vz : Infinity;
      if (tau > 0.13 && tau < 0.32) return true;
    }
    if (a.cars && gr) {
      const k = a.cars.indexOf(gr.id);
      if (k >= 0 && k < a.cars.length - 1 && p.pos.z - gr.pos.z > 1.15) return true;
    }
    return false;
  }).toString();
  // Ride a car (stand at a local spot) until it reaches z, jumping bars on the way.
  const ride = (bot, car, lx, lz, untilZ, bars = []) => bot.go(0, 0, {
    attach: { id: car.id, local: [lx, 0, lz] }, r: 0.4, hold: true, timeout: 40000,
    doneIf: ((g, b, a) => {
      const c = g.physics.byId.get(a.id);
      return c && Math.abs(c.pos.z - a.z) < 0.6;
    }).toString(),
    jumpIf: jumpTest,
    arg: { id: car.id, z: untilZ, bars },
  });
  const board = (bot, car, lx, lz) => bot.jump({ attach: { id: car.id, local: [lx, 0, lz] } });

  // 1. The first train.
  const c1 = carAt(10.6);
  await both((b) => b.go(-1, 6.2, { r: 0.3, stop: true }), (b) => b.go(1, 6.2, { r: 0.3, stop: true }));
  await atEnd(sol, c1, 'a', 0.25);
  await both((b) => board(b, c1, -1, 1.2), (b) => board(b, c1, 1, -1.2));
  await both((b) => ride(b, c1, -1, 1.2, c1.motion.b[2], [21, 31, 41]), (b) => ride(b, c1, 1, -1.2, c1.motion.b[2], [21, 31, 41]));
  await both((b) => b.jump({ to: [-1, 0, 55] }), (b) => b.jump({ to: [1, 0, 55] }));
  for (const b of [sol, luna]) await at(b, 0, 'station B');
  await shot('train1');

  // 2. The gatekeeper: Luna holds the gate open, Sol rides; then Sol holds it for Luna.
  const c2 = carAt(64.6);
  const [pB, pC] = L.plates.slice(0, 2);
  await luna.go(pB.x, pB.z, { r: 0.3, stop: true });
  await sol.go(0, 60.6, { r: 0.3, stop: true });
  await atEnd(sol, c2, 'a', 0.25);
  await board(sol, c2, 0, 0);
  await ride(sol, c2, 0, 0, c2.motion.b[2]);
  await sol.jump({ to: [0, 0, 103] });
  await at(sol, 0, 'station C');
  await sol.go(pC.x, pC.z, { r: 0.3, stop: true });
  await luna.go(0, 60.6, { r: 0.3, stop: true });
  await atEnd(luna, c2, 'a', 0.25);
  await board(luna, c2, 0, 0);
  await ride(luna, c2, 0, 0, c2.motion.b[2]);
  await luna.jump({ to: [1, 0, 103] });
  await at(luna, 0, 'station C');

  // 3. Run the train: on at the back, forward car by car, off the front.
  const cars = [0, 1, 2, 3].map((k) => carAt(111.3 + k * 4.6));
  await both((b) => b.go(-0.8, 108.6, { r: 0.3, stop: true }), (b) => b.go(0.8, 108.6, { r: 0.3, stop: true }));
  await atEnd(sol, cars[0], 'a', 0.25);
  const run = async (b, lx) => {
    await board(b, cars[0], lx, 0);
    // Run for the front car, jumping each gap (and any bar) on the way.
    // Not flat out: a full-speed jump would sail past a 3 m car.
    await b.go(0, 0, { attach: { id: cars[3].id, local: [lx, 0, 0.6] }, r: 0.5, speed: 0.7, timeout: 12000, jumpIf: jumpTest, arg: { bars: [131, 146], cars: cars.map((c) => c.id) } });
    const p = await b.pos();
    if (p[1] < -0.5) throw new Error(`${b.name} fell off the train`);
    await ride(b, cars[3], lx, 0.6, cars[3].motion.b[2], [131, 146]);
    await b.jump({ to: [lx, 0, 164.5] });
    await at(b, 0, 'the far station');
  };
  await both((b) => run(b, -0.7), async (b) => {
    await b.wait(250);
    await run(b, 0.7);
  });
  await shot('train3');

  // 4. The dispatcher: Luna to the signal box; Sol onto the right train.
  const lever = L.dials[0];
  const good = M.good;
  await luna.go(-5.4, 163.4, { r: 0.3, stop: true });
  await luna.jump({ to: [-7, 1.4, 163.4] });
  await at(luna, 1.4, 'the box step');
  await luna.jump({ to: [-8.6, 3, 166], double: true });
  await at(luna, 3, 'the signal box');
  await luna.setDial(lever, [-3.5, 0, 3.5].indexOf(good[0]));
  await sol.path([[good[0], 168.5], [good[0], 173.2]], { r: 0.4 });
  await sol.go(good[0], 173.2, { r: 0.3, stop: true });
  const go = L.switches.find((w) => !w.dial && w.duration === 14);
  await luna.go(go.x, go.z, { r: 0.3, stop: true });
  await luna.pound();
  await sol.until((g) => g.player.pos.z > 202.5, null, 15000);
  await sol.path([[good[0], 208], [good[0], 212]], { r: 0.5 });
  const bsw = L.switches.find((w) => w.latch && w.z === 213.5);
  await sol.go(bsw.x, bsw.z, { r: 0.3, stop: true });
  await sol.pound();
  await luna.waitAct(L.acts.find((a) => a.style === 'bridge').id, 4000);
  await luna.wait(1400);
  await luna.path([[-9.5, 167.5], [-9.5, 171], [-9.5, 210], [-8, 213], [1, 215]], { r: 0.6 });
  await shot('dispatch');

  // 5. The last stretch: both on the left car; hop across before each block.
  const left = carAt(222.4), right = movers.find((m) => m !== left && Math.abs(m.motion.a[2] - 222.4) < 0.01);
  const blocks = L.movers.filter((m) => m.mat === 'hazard' && m.sy > 2).map((m) => [m.motion.a[0], m.motion.a[2]]);
  await both((b) => b.go(-2.2, 218.4, { r: 0.3, stop: true }), (b) => b.go(-1.6, 217.2, { r: 0.3, stop: true }));
  await atEnd(sol, left, 'a', 0.25);
  const stretch = async (b, lz) => {
    let car = left;
    await board(b, car, 0, lz);
    for (const [bx, bz] of blocks) {
      const mine = car === left ? -2.2 : 2.2;
      if (mine !== bx) continue;
      // Stay put until the block on my track is close, then hop to the other car.
      await b.go(0, 0, {
        attach: { id: car.id, local: [0, 0, lz] }, r: 0.4, hold: true, timeout: 20000,
        doneIf: ((g, bb, a) => a.z - g.player.pos.z < 3.6).toString(), arg: { z: bz },
      });
      car = car === left ? right : left;
      await board(b, car, 0, lz);
    }
    await ride(b, car, 0, lz, left.motion.b[2]);
    await b.jump({ to: [car === left ? -2.2 : 2.2, 0, 268], double: true });
    await at(b, 0, 'the end of the line');
  };
  await both((b) => stretch(b, 1.6), (b) => stretch(b, -1.6));
  await both((b) => b.go(-1.4, 270), (b) => b.go(1.4, 270));
}
