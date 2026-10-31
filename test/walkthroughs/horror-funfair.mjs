// Midnight Funfair: ticket gate for two, the carousel brake code, the mirror maze
// (Luna on the eye plate, Sol inside), the ghost ride (Sol holds the door, Luna
// rides), three stamps into the box, then the Ferris wheel climb and the bridge.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const P = (k) => [M[k][0], M[k][2]];
  const item = (label) => L.items.find((i) => i.label === label);
  const sw = (id) => L.switches.find((w) => w.id === id);
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  // Landed where we meant to (at least this high)?
  const at = async (bot, y, what) => {
    const p = await bot.pos();
    if (p[1] < y - 0.7) throw new Error(`${bot.name} missed ${what}: at ${p.map((v) => v.toFixed(1)).join(',')}`);
  };
  // Standing on that car right now?
  const onCar = async (bot, car, what) => {
    const [p, top] = await bot.page.evaluate((id) => {
      const g = window.__itt.game;
      const m = g.world.movers.find((q) => q.def.id === id);
      return [[g.player.pos.x, g.player.pos.y, g.player.pos.z], m.tf.y + m.def.sy / 2];
    }, car.id);
    if (Math.abs(p[1] - top) > 0.5 || Math.abs(p[0] - car.x) > 1.6) throw new Error(`${bot.name} missed ${what}: at ${p.map((v) => v.toFixed(1)).join(',')}, car top ${top.toFixed(1)}`);
  };

  // Ticket gate: both plates at once.
  await both((b) => b.go(...P('turnA'), { r: 0.3, stop: true }), (b) => b.go(...P('turnB'), { r: 0.3, stop: true }));
  await sol.waitAct(L.acts.find((a) => a.style === 'gate' && a.toast && a.toast.includes('ticket gate')).id, 6000);
  await both((b) => b.path([[-1, 15], [-1, 20]]), (b) => b.path([[1, 15], [1, 20]]));
  await shot('plaza');
  // The clown wakes once you walk in: keep the flashlights on it.
  await sol.face('monster');
  await luna.face('monster');

  // -- Carousel: Luna dials the brake in the booth, Sol rides up to the ledge.
  const brake = L.combos[0];
  const gold = item('Gold Stamp');
  await both(async (b) => {
    await b.path([[-3, 25], [-3, 29.4]]);
    await b.jump({ to: [-3, 0.8, 33] });
    await b.path([[-5, 38], [-3, 42], [0, 41.4]], { r: 0.5 });
    await b.go(0, 41.3, { r: 0.35 });
    await b.jump({ to: [M.ledge[0], M.ledge[1], M.ledge[2] + 0.1], double: true });
    await at(b, M.ledge[1], 'the carousel ledge');
  }, async (b) => {
    await b.path([[3, 23], [9.4, 27.6], [9.4, 25], [10.6, 23.6]]);
    for (let i = 0; i < 3; i++) await b.setDial(L.dials.find((d) => d.id === brake.dials[i]), brake.targets[i]);
  });
  await sol.waitSig(brake.id, 5000);
  await sol.waitHold(gold.id);
  await shot('carousel', sol.page);
  // Sol takes the gold stamp to the stamp box; Luna heads for the viewing deck.
  const stampBox = P('stamps');
  await both(async (b) => {
    await b.path([[0, 42.6], [-3, 44], [-3, 47], [-1.5, 55], [-1.5, 59.75], [stampBox[0] + 1, stampBox[1]]]);
    await b.waitUsed(gold.id);
  }, async (b) => {
    await b.path([[10.6, 24.5], [9.4, 25], [9.4, 28], [9.5, 47], [-11, 47], [-12.4, 50]]);
    let x = -14.25;
    for (const top of [1.4, 2.8, 4.2, 5.6]) {
      await b.jump({ to: [x, top, 50] });
      x -= 1.5;
    }
    await b.jump({ to: [-20.6, 7, 50] });
    await b.go(...P('eye'), { r: 0.3, stop: true });
    await at(b, 7, 'the viewing deck');
  });

  // -- Mirror maze: Luna holds the eye plate, Sol walks the real path.
  const red = item('Red Stamp');
  await sol.path([[-1.5, 59.75], [-1.5, 55], [-11, 45], [-24, 40], [-29, 40]]);
  for (let i = 0; i < 16; i++) await sol.go(...P(`maze${i}`), { r: 0.45 });
  await sol.waitHold(red.id);
  await shot('maze', luna.page);
  const out = L.switches.find((w) => w.latch && Math.abs(w.x + 28.5) < 0.1);
  await sol.go(-30.5, 28, { r: 0.4 });
  await sol.go(out.x, out.z, { r: 0.3, stop: true });
  await sol.pound();
  await sol.waitAct(L.acts.find((a) => a.style === 'door' && Math.abs(a.parts[0].x + 26) < 0.1 && Math.abs(a.parts[0].z - 28) < 0.1).id, 5000);
  await sol.path([[-23, 28], [-20, 31], [-11, 44], [-3, 54], [-1.5, 59.75], [stampBox[0] + 1, stampBox[1]]]);
  await sol.waitUsed(red.id);

  // -- Ghost ride: Sol holds the door plate (reading the rhyme), Luna rides.
  const blue = item('Blue Stamp');
  await both(async (b) => {
    await b.path([[-1.5, 59.75], [-1.5, 55], [12, 47], [21, 45.5]]);
    await b.go(...P('holdDoor'), { r: 0.3, stop: true });
  }, async (b) => {
    await b.path([[-20, 50], [-12, 49], [-9, 47], [9, 47], [20, 43], [24, 42]]);
  });
  await luna.waitAct(L.acts.find((a) => a.quiet && a.style === 'door').id, 5000);
  await luna.path([[28, 42], [32, 43.5], [32, 47.5], [32, 54], [44, 54], [48, 52], [48, 45], [48, 36], [44, 30], [40, 28]], { r: 0.6 });
  // Sol can step off now: the door just closes behind her.
  await sol.path([[21, 45.5], [20.2, 47], [20.2, 50]]);
  const rhyme = L.seqs[0];
  for (const id of rhyme.ids) {
    const w = sw(id);
    await luna.go(w.x, w.z, { r: 0.3, stop: true });
    await luna.pound();
  }
  await luna.waitSig(rhyme.id, 5000);
  await luna.go(38, 30.2, { r: 0.3 });
  await luna.waitHold(blue.id);
  await shot('ghost-ride', luna.page);
  await both(async (b) => {
    await b.path([[20.2, 47], [12, 49], [-1.5, 55], [-1.5, 59.75], [-4, 59]]);
  }, async (b) => {
    await b.path([[30, 29], [27.5, 29], [23, 29], [16, 29], [9, 29.5], [9, 47], [-1.5, 55], [-1.5, 59.75], [stampBox[0] + 1, stampBox[1] + 0.8]]);
    await b.waitUsed(blue.id);
  });
  const wheelGate = L.acts.find((a) => a.toast && a.toast.includes('three stamps'));
  await sol.waitAct(wheelGate.id, 6000);
  await shot('stamps');

  // -- The Ferris wheel: the closing music, a second clown, and the climb.
  await both((b) => b.path([[-1.5, 59.75], [-1, 62], [-1, 66], [-3.5, 68.5]]), (b) => b.path([[-1.5, 60.5], [1, 62], [1, 66], [-2.5, 69]]));
  const cars = L.movers.filter((m) => m.motion.type === 'linear' && m.motion.a[2] === 86).sort((a, b) => a.motion.a[0] - b.motion.a[0])
    .map((m) => ({ id: m.id, x: m.motion.a[0], low: m.motion.a[1] + 0.3, high: m.motion.b[1] + 0.3 }));
  const waitCar = (b, car, high) => b.until((g, bot, a) => {
    const m = g.world.movers.find((q) => q.def.id === a.id);
    const top = m.tf.y + m.def.sy / 2;
    return a.high ? top > a.thr : top < a.thr;
  }, { id: car.id, high, thr: high ? car.high - 0.45 : car.low + 0.6 }, 30000);
  const climb = async (b) => {
    await b.go(cars[0].x, 83.4, { r: 0.35 });
    await waitCar(b, cars[0], false);
    await b.jump({ to: [cars[0].x, cars[0].low, 86] });
    await onCar(b, cars[0], 'car 1');
    for (let i = 0; i < 2; i++) {
      await waitCar(b, cars[i], true);
      await b.jump({ to: [cars[i + 1].x, cars[i + 1].low, 86] });
      await onCar(b, cars[i + 1], `car ${i + 2}`);
    }
    await waitCar(b, cars[2], true);
    await b.jump({ to: [M.rest[0], M.rest[1], 86] });
    await at(b, M.rest[1], 'the rest platform');
    await waitCar(b, cars[3], false);
    await b.jump({ to: [cars[3].x, cars[3].low, 86] });
    await onCar(b, cars[3], 'car 4');
    await waitCar(b, cars[3], true);
    await b.jump({ to: [cars[4].x, cars[4].low, 86] });
    await onCar(b, cars[4], 'car 5');
    await waitCar(b, cars[4], true);
    await b.jump({ to: [8.4, 14, 86] });
    await at(b, 14, 'the top');
  };
  await climb(sol);
  await sol.go(...P('topB'), { r: 0.3, stop: true });
  await shot('top', sol.page);
  await climb(luna);
  await luna.go(...P('topA'), { r: 0.3, stop: true });
  const bridge = L.acts.find((a) => a.style === 'bridge');
  await sol.waitAct(bridge.id, 5000);
  await sol.face(null);
  await luna.face(null);
  await sol.wait(1200);
  await both((b) => b.path([[11, 89.6], [11, 96.5], [11.5, 99.4]]), (b) => b.path([[10, 89.6], [10, 96.5], [9.5, 99.4]]));
}
