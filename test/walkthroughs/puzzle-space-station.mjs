// Space Station: timed airlock, lights-out power board, fan shaft, oxygen relay,
// magnet lanes, star-chart docking code, synchronized launch.
export default async function ({ sol, luna, L, shot }) {
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const actFor = (sig) => L.acts.find((a) => a.when.in.includes(sig));
  const Y = 16;
  const Z1 = 14, Z2 = 32, Z3 = 54, Z4 = 76, Z5 = 100, Z6 = 136, Z7 = 158;

  // -- Airlock: Sol runs out to the timer, Luna dashes through the door.
  const timer = L.switches.find((w) => !w.latch && !w.dial && w.x > 30);
  const latch = L.switches.find((w) => w.latch && Math.abs(w.z - (Z1 + 16)) < 0.1);
  await both((b) => b.path([[4, 7], [7, 7], [30, 7], [timer.x, timer.z]], { r: 0.4 }), (b) => b.path([[0, 9], [0, 12.9]], { r: 0.3 }));
  await sol.go(timer.x, timer.z, { r: 0.3, stop: true });
  await sol.pound();
  const d1 = actFor(timer.id);
  await luna.waitAct(d1.id, 3000);
  await luna.path([[0, 16], [-1.2, 18.4]], { r: 0.3 });
  const hop = async (b, pts) => {
    for (const p of pts) await b.jump({ to: p });
  };
  await hop(luna, [[-1.2, 0, Z1 + 7.4], [1.4, 0, Z1 + 11], [1.6, 0, Z1 + 15]]);
  await luna.go(latch.x, latch.z, { r: 0.3, stop: true });
  await luna.pound();
  await luna.waitSig(latch.id, 3000);
  await shot('airlock');
  // Sol comes back in; the crumbled tiles have reset by now.
  await sol.path([[30, 7], [8.5, 7], [3, 9], [0, 12], [-1.2, 18.4]], { r: 0.4 });
  await sol.until((g) => [...g.world.crumbles.values()].every((c) => c.phase === 'idle'), null, 8000);
  await hop(sol, [[-1.2, 0, Z1 + 7.4], [1.4, 0, Z1 + 11], [0, 0, Z1 + 15]]);

  // -- Power room: solve lights-out on the ring.
  const mods = L.dials.filter((d) => d.style === 'color');
  const power = L.combos.find((c) => c.dials.includes(mods[0].id));
  let presses = null;
  for (let m = 0; m < 32 && !presses; m++) {
    const v = mods.map((d) => d.start);
    for (let i = 0; i < 5; i++) {
      if (!(m & (1 << i))) continue;
      for (const id of [mods[i].id, ...mods[i].links]) {
        const k = mods.findIndex((d) => d.id === id);
        v[k] = (v[k] + 1) % 2;
      }
    }
    if (v.every((x, i) => x === power.targets[i])) presses = [0, 1, 2, 3, 4].filter((i) => m & (1 << i));
  }
  const press = async (b, d) => {
    await b.go(d.x, d.z, { r: 0.3, stop: true });
    const v = await b.dialValue(d.id);
    await b.pound();
    await b.until((g, bb, a) => (g.extras.dialState[a[0]] ?? -1) !== a[1], [d.id, v], 3000);
  };
  await both((b) => b.path([[-1, Z2 + 2], [-5, Z2 + 3], [-5, Z2 + 6], [-5, Z2 + 12]]), (b) => b.path([[1, Z2 + 2], [5, Z2 + 3], [5, Z2 + 6], [5, Z2 + 12]]));
  await both(async (b) => {
    for (const i of presses.filter((i) => mods[i].x < 0)) await press(b, mods[i]);
  }, async (b) => {
    for (const i of presses.filter((i) => mods[i].x > 0)) await press(b, mods[i]);
  });
  await sol.waitSig(power.id, 5000);
  await shot('power');

  // -- Fan shaft: take turns powering each other's fans.
  await both((b) => b.path([[-5, Z2 + 20], [-5, Z3 + 1], [4, Z3 + 2.5]], { r: 0.4 }), (b) => b.path([[5, Z2 + 20], [5, Z3 + 1], [-4, Z3 + 3.5]], { r: 0.4 }));
  await sol.go(4, Z3 + 2.5, { r: 0.3, stop: true });
  await luna.go(-4, Z3 + 6, { r: 0.3 });
  await luna.until((g) => g.player.pos.y > 10.3, null, 8000);
  await luna.go(-4, Z3 + 10, { r: 0.6 });
  await luna.until((g) => g.player.grounded && g.player.pos.y > 8.5, null, 5000);
  await luna.go(-5, Z3 + 17, { r: 0.3, stop: true });
  await sol.go(4, Z3 + 6, { r: 0.3 });
  await sol.until((g) => g.player.pos.y > 17.3, null, 8000);
  await sol.go(4, Z3 + 10, { r: 0.6 });
  await sol.until((g) => g.player.grounded && g.player.pos.y > 15.5, null, 5000);
  await sol.go(5, Z3 + 13, { r: 0.3, stop: true });
  await shot('shaft', sol.page);
  await luna.go(-1.7, Z3 + 12.5, { r: 0.3 });
  await luna.until((g) => g.player.pos.y > 17.3, null, 8000);
  await luna.go(2.5, Z3 + 12.5, { r: 0.6 });
  await luna.until((g) => g.player.grounded && g.player.pos.y > 15.5, null, 5000);
  await luna.go(5, Z3 + 18.5, { r: 0.3, stop: true });
  const shaftDoor = L.acts.find((a) => Math.abs(a.z - (Z3 + 22)) < 0.1 && a.y > 15);
  await sol.waitAct(shaftDoor.id, 5000);

  // -- Oxygen relay: each does their wing, then fetch the tank the partner sent.
  await both((b) => b.path([[4, Z3 + 20.5], [4, Z4 + 2], [-6.5, Z4 + 6], [-6.5, Z4 + 9], [-9.4, Z4 + 9.6]], { r: 0.35 }),
    (b) => b.path([[4.6, Z3 + 20.5], [4.6, Z4 + 2], [6.5, Z4 + 6], [6.5, Z4 + 9], [5, Z4 + 9.9]], { r: 0.35 }));
  await both(async (b) => {
    await hop(b, [[-9.4, Y + 1.2, Z4 + 12.3], [-6, Y + 2.4, Z4 + 14.2], [-9, Y + 3.6, Z4 + 16.4], [-8.5, Y + 4.2, Z4 + 20]]);
    await b.go(-6.75, Z4 + 21.8, { r: 0.3, stop: true });
    await b.pound();
  }, async (b) => {
    await hop(b, [[5, Y, Z4 + 12.6], [8.2, Y + 0.5, Z4 + 14.8], [5.2, Y + 1, Z4 + 17.2], [5.5, Y + 1.5, Z4 + 20.2]]);
    await b.go(6.75, Z4 + 21.8, { r: 0.3, stop: true });
    await b.pound();
  });
  await shot('o2-wings');
  // Step into the teleporters back to the hall.
  await both((b) => b.go(-10.2, Z4 + 22.5, { r: 0.6 }), (b) => b.go(10.2, Z4 + 22.5, { r: 0.6 }));
  await both((b) => b.until((g) => g.player.pos.z < 82, null, 4000), (b) => b.until((g) => g.player.pos.z < 82, null, 4000));
  const red = L.items.find((i) => i.label === 'Red Oxygen Tank');
  const blue = L.items.find((i) => i.label === 'Blue Oxygen Tank');
  await both((b) => b.go(red.x, red.z + 0.3, { r: 0.4 }), (b) => b.go(blue.x, blue.z + 0.3, { r: 0.4 }));
  await sol.waitHold(red.id);
  await luna.waitHold(blue.id);
  await both((b) => b.go(-1.2, Z4 + 5.4, { r: 0.4 }), (b) => b.go(1.2, Z4 + 5.4, { r: 0.4 }));
  const o2 = L.locks.find((l) => l.label === 'Life Support');
  await sol.waitSig(o2.id, 6000);

  // -- Magnet lanes: red pads pull Luna, blue pads pull Sol.
  await both((b) => b.path([[0.6, Z4 + 9], [0.6, Z5 - 1], [3.5, Z5 + 3.5]], { r: 0.4 }), (b) => b.path([[-0.6, Z4 + 9], [-0.6, Z5 - 1], [-3.5, Z5 + 3.5]], { r: 0.4 }));
  const swing = (b, x) => b.swing(L.pads.filter((p) => Math.abs(p.x - x) < 0.1 && p.n[1] < 0 && p.z > Z5).sort((a, c) => a.z - c.z).map((p) => [p.x, p.y, p.z]));
  await both((b) => swing(b, 3.5), (b) => swing(b, -3.5));
  await shot('lanes');
  const [G1, G2] = L.plates.filter((p) => Math.abs(p.z - (Z5 + 29.5)) < 0.1).sort((a, c) => a.x - c.x);
  await both((b) => b.go(G2.x, G2.z, { r: 0.3, stop: true }), (b) => b.go(G1.x, G1.z, { r: 0.3, stop: true }));
  const gate = L.acts.find((a) => a.parts.some((p) => Math.abs(p.z - (Z5 + 33)) < 0.1));
  await sol.waitAct(gate.id, 5000);

  // -- Star chart: Sol reads the chart, Luna turns the docking wheels.
  // They swap sides here, so one goes first.
  await luna.path([[-1, Z5 + 33], [0, Z6 + 1.5], [5, Z6 + 3], [5, Z6 + 5], [8.4, Z6 + 5.1], [8.4, Z6 + 8], [5.5, Z6 + 14]], { r: 0.4 });
  await sol.path([[1, Z5 + 33], [0, Z6 + 1.5], [-5, Z6 + 3], [-5, Z6 + 5], [-8.4, Z6 + 5.1], [-8.4, Z6 + 8], [-7.5, Z6 + 12]], { r: 0.4 });
  await shot('star-chart', sol.page);
  const dock = L.combos.find((c) => c !== power);
  for (let i = 0; i < dock.dials.length; i++) await luna.setDial(L.dials.find((d) => d.id === dock.dials[i]), dock.targets[i]);
  await luna.waitSig(dock.id, 5000);
  await shot('docked', luna.page);

  // -- Launch: pound together, cross the bridge, board.
  await both((b) => b.path([[-5, Z6 + 20], [-5, Z7 + 1], [-4, Z7 + 4.8]], { r: 0.4 }), (b) => b.path([[5, Z6 + 20], [5, Z7 + 1], [4, Z7 + 4.8]], { r: 0.4 }));
  const [A, B] = L.switches.filter((w) => !w.latch && !w.dial && Math.abs(w.z - (Z7 + 4.8)) < 0.1).sort((a, c) => a.x - c.x);
  await both((b) => b.go(A.x, A.z, { r: 0.25, stop: true }), (b) => b.go(B.x, B.z, { r: 0.25, stop: true }));
  const bridge = L.acts.find((a) => a.style === 'bridge');
  for (let k = 0; k < 4; k++) {
    await both((b) => b.pound(), (b) => b.pound());
    if (await sol.waitAct(bridge.id, 1500).then(() => true, () => false)) break;
  }
  await sol.waitAct(bridge.id, 3000);
  await both((b) => b.path([[-1, Z7 + 9], [-1, Z7 + 28]], { r: 0.5 }), (b) => b.path([[1, Z7 + 9], [1.5, Z7 + 29]], { r: 0.5 }));
}
