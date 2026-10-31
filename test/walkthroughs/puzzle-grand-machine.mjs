// Machine City: six districts, six gears into the core, then the tower climb.
export default async function ({ sol, luna, L, shot }) {
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const item = (label) => L.items.find((i) => i.label === label);
  const sw = (id) => L.switches.find((w) => w.id === id);
  const dial = (id) => L.dials.find((d) => d.id === id);
  const act = (toast) => L.acts.find((a) => a.toast === toast);
  const core = L.locks.find((l) => l.label === 'Machine Core');
  // Several moves back to back inside the page (no round trip between them).
  const chain = (b, tasks) => b.page.evaluate(async (ts) => {
    for (const t of ts) await window.__bot.run(t);
  }, tasks).catch((e) => {
    throw new Error(`${b.name}: ${e.message.split('\n')[0]}`);
  });
  const PHASE = '(g, bot, a) => { const c = (((g.world.time / a[0]) % 1) + 1) % 1; return c >= a[1] && c < a[2]; }';
  const atPhase = (period, lo, hi) => ({ type: 'until', timeout: 9000, fn: PHASE, arg: [period, lo, hi] });
  const leap = (x, top, z, double = false) => ({ type: 'jump', to: [x, top, z], double });
  const hit = async (b, w) => {
    await b.go(w.x, w.z - 1.4, { r: 0.35, stop: true });
    await b.jump({ to: [w.x, w.y + 0.64, w.z] });
    await b.pound();
  };
  // Carry what you hold to the machine core in the middle of the plaza.
  const deliver = async (b, id, side) => {
    await b.go(core.x + side * 1.4, core.z - 1.7, { r: 0.4 });
    await b.waitUsed(id);
    await b.go(core.x + side * 4, core.z - 5, { r: 0.6 }); // out of the way
  };

  // == D1 · toys ==============================================================================
  await both((b) => b.path([[-1.4, 19], [-1.4, 23], [-16.5, 29.5], [-24, 29.5], [-30, 28.5], [-34, 26]], { r: 0.5 }),
    (b) => b.path([[1.4, 19], [1.4, 23], [-16.5, 32.5], [-24, 32.5], [-30, 33.5], [-34, 36]], { r: 0.5 }));
  const seq1 = L.seqs[0];
  for (const id of seq1.ids) await hit(luna, sw(id));
  await luna.waitSig(seq1.id, 5000);
  await shot('d1', sol.page);
  const g1 = item('Red Toy Gear');
  await sol.go(g1.x, g1.z - 1.25, { r: 0.3 });
  await sol.waitHold(g1.id);
  await both(async (b) => {
    await b.path([[-30, 28.5], [-24, 28.5], [-16, 31]], { r: 0.5 });
    await deliver(b, g1.id, -1);
  }, (b) => b.path([[-30, 33.5], [-24, 32.5], [-20, 32.2], [-17, 40], [-17, 52.5]], { r: 0.5 }));

  // == D2 · clocks ============================================================================
  const g2 = item('Blue Clock Gear');
  await luna.path([[-24, 53.5], [-26, 54.5], [-26, 57.6], [-36, 58.4]], { r: 0.5 });
  await sol.path([[-17, 50], [-24, 52.5], [-26, 51.5], [-26, 48.6], [-29.4, 44.4]], { r: 0.4 });
  await sol.go(-29.4, 44.4, { r: 0.22, stop: true });
  // Sliding platforms (period 6): onto the first at its near end, across when
  // both sit at their ends, then onto the far floor.
  await chain(sol, [
    atPhase(6, 0.965, 0.99), leap(-34, 0, 44.4),
    atPhase(6, 0.465, 0.49), leap(-38.6, 0, 44.4, true),
    leap(-44.5, 0, 45, true),
  ]);
  const clock = L.combos[0];
  for (let i = 0; i < clock.dials.length; i++) await sol.setDial(dial(clock.dials[i]), clock.targets[i]);
  await sol.waitSig(clock.id, 5000);
  await shot('d2', luna.page);
  await luna.go(g2.x, g2.z - 1.3, { r: 0.3 });
  await luna.waitHold(g2.id);
  await both(async (b) => {
    await b.go(-42.6, 44.4, { r: 0.22, stop: true });
    await chain(b, [
      atPhase(6, 0.465, 0.49), leap(-38.6, 0, 44.4, true),
      atPhase(6, 0.965, 0.99), leap(-34, 0, 44.4, true),
      leap(-28.4, 0, 44.6, true),
    ]);
    await b.path([[-26, 48], [-26, 51.5], [-20, 52], [-14, 56]], { r: 0.5 });
  }, async (b) => {
    await b.path([[-36, 58.4], [-26, 57.6], [-26, 54.5], [-20, 54], [-8, 45]], { r: 0.5 });
    await deliver(b, g2.id, 1);
  });

  // == D3 · library (lights-out: Sol presses 1 and 3, Luna presses 6) ===============================
  const lamps = L.combos[1];
  const lampSw = lamps.dials.map(sw);
  await both((b) => b.path([[-12.5, 60], [-12.5, 66], [-16.5, 67.5], [-16.5, 70.5]], { r: 0.5 }),
    (b) => b.path([[-9.5, 58], [-9.5, 66], [-5.5, 67.5], [-5.5, 70.5]], { r: 0.5 }));
  await both(async (b) => {
    await hit(b, lampSw[0]);
    await b.go(lampSw[0].x - 1.6, lampSw[0].z + 1, { r: 0.5 });
    await hit(b, lampSw[2]);
  }, (b) => b.path([[-7.5, 76], [-7.5, 83]], { r: 0.5 }).then(() => hit(b, lampSw[5])));
  await sol.waitSig(lamps.id, 5000);
  await shot('d3', sol.page);
  const g3 = item('White Book Gear');
  await both(async (b) => {
    await b.path([[-15, 76], [-16.5, 70.5], [-16.5, 67.5], [g3.x - 1.2, g3.z - 0.4]], { r: 0.45 });
    await b.waitHold(g3.id);
    await b.path([[-12, 62], [-6, 46]], { r: 0.5 });
    await deliver(b, g3.id, -1);
  }, (b) => b.path([[-7.5, 76], [-5.5, 70.5], [-5.5, 67.5], [-9.6, 66.2], [-9.6, 61.5], [10, 61.5]], { r: 0.5 }));

  // == D4 · pirates ===========================================================================
  const e = L.seesaws[0];
  const key = item('Gold Key');
  const g4 = item('Red Pirate Gear');
  const raft = L.acts.find((a) => a.style === 'carrier');
  const raftAt = (b, u) => b.until((g, bot, a) => {
    const r = g.world.acts.find((x) => x.def.id === a[0]);
    return a[1] ? r.parts[0].u > 0.99 : r.parts[0].u < 0.01;
  }, [raft.id, u], 12000);
  await both((b) => b.path([[12, 60], [12, 66], [e.x + 3.4, 66.5], [e.x + 3.4, e.z]], { r: 0.4 }),
    (b) => b.path([[10, 62], [10, 66], [e.x - 3.4, 66.5], [e.x - 3.4, e.z]], { r: 0.4 }));
  await luna.go(e.x - 3.4, e.z, { r: 0.3, stop: true });
  await sol.go(e.x + 3.4, e.z, { r: 0.3, stop: true });
  await luna.until((g) => g.player.grounded && g.player.pos.y > 0.9, null, 3000);
  await sol.pound();
  await luna.go(key.x, key.z, { r: 0.5, timeout: 6000 });
  await luna.until((g) => g.player.grounded && g.player.pos.y > 9.5, null, 4000);
  await luna.waitHold(key.id);
  await shot('nest', luna.page);
  await luna.go(12, 69, { r: 0.6 });
  await luna.until((g) => g.player.grounded && g.player.pos.y < 0.5, null, 5000);
  // Luna rides the raft to the island while Sol holds the dock plate.
  await luna.go(13, 74.6, { r: 0.3, stop: true });
  await sol.path([[16, 66], [4, 68]], { r: 0.3 });
  await sol.go(4, 68, { r: 0.25, stop: true });
  await raftAt(luna, 1);
  await luna.path([[13, 94], [13, 95.2]], { r: 0.4 });
  await luna.waitUsed(key.id);
  // Sol off the plate: the raft comes home. He boards; Luna's island plate takes him over.
  await sol.go(8, 66, { r: 0.5 });
  await raftAt(sol, 0);
  await sol.go(13, 74.6, { r: 0.3, stop: true });
  await luna.go(19, 96, { r: 0.25, stop: true });
  await raftAt(sol, 1);
  await sol.path([[13, 93.5], [g4.x, g4.z - 1.2]], { r: 0.35 });
  await sol.waitHold(g4.id);
  // Sol rides back with the gear; then he holds the dock plate to fetch Luna.
  await sol.go(13, 89.8, { r: 0.3, stop: true });
  await luna.go(16, 97, { r: 0.4 });
  await raftAt(sol, 0);
  await sol.path([[13, 70], [4, 68]], { r: 0.3 });
  await sol.go(4, 68, { r: 0.25, stop: true });
  await raftAt(luna, 1);
  await luna.go(13, 89.8, { r: 0.3, stop: true });
  await sol.go(6, 66, { r: 0.5 });
  await raftAt(luna, 0);
  await shot('raft', sol.page);
  await both(async (b) => {
    await b.path([[10, 65], [10, 61], [6, 46]], { r: 0.5 });
    await deliver(b, g4.id, 1);
  }, (b) => b.path([[13, 70], [12.6, 66], [12.6, 61], [16.5, 55]], { r: 0.5 }));

  // == D5 · pyramid ===========================================================================
  const eye = L.plates.find((p) => p.x === 25 && p.z === 45.5);
  const symbols = L.combos[2];
  const g5 = item('Blue Pyramid Gear');
  await both((b) => b.path([[16, 52], [24, 52], [31.4, 52]], { r: 0.4 }), (b) => b.path([[24, 54], [eye.x, eye.z]], { r: 0.3 }));
  await luna.go(eye.x, eye.z, { r: 0.25, stop: true });
  await sol.go(31.4, 52, { r: 0.22, stop: true });
  await chain(sol, [leap(33.8, 0, 52), leap(36.6, 0, 54.6), leap(39.4, 0, 52.2), leap(42.2, 0, 54.8), leap(45.4, 0, 54.8)]);
  await shot('pyramid-wall', sol.page);
  for (let i = 0; i < symbols.dials.length; i++) await luna.setDial(dial(symbols.dials[i]), symbols.targets[i]);
  await luna.waitSig(symbols.id, 5000);
  // Luna takes the gear to the core; then she'd hold the eye for Sol's way back.
  await luna.go(g5.x, g5.z - 1.3, { r: 0.3 });
  await luna.waitHold(g5.id);
  await luna.path([[24, 53.5], [18, 53.5], [16, 50], [6, 40]], { r: 0.5 });
  await deliver(luna, g5.id, 1);
  await sol.go(44.6, 54.8, { r: 0.22, stop: true });
  await chain(sol, [leap(42.2, 0, 54.8), leap(39.4, 0, 52.2), leap(36.6, 0, 54.6), leap(33.8, 0, 52), leap(30.4, 0, 52)]);
  await sol.path([[28, 52.5], [24, 53], [18, 52.5], [17, 40]], { r: 0.5 });

  // == D6 · detectives =======================================================================
  const caseLock = L.combos[3];
  const g6 = item('White Detective Gear');
  await both((b) => b.path([[17, 31], [24, 30], [32, 28.5], [38, 27]], { r: 0.5 }), (b) => b.path([[17, 33], [24, 32], [32, 33.5], [38, 36]], { r: 0.5 }));
  await shot('clues', sol.page);
  await both((b) => b.path([[32, 28.5], [28, 27.4]], { r: 0.5 }), (b) => b.path([[32, 33.5], [30, 33]], { r: 0.5 }));
  for (let i = 0; i < caseLock.dials.length; i++) await sol.setDial(dial(caseLock.dials[i]), caseLock.targets[i]);
  await sol.waitSig(caseLock.id, 5000);
  await luna.go(g6.x, g6.z - 1.1, { r: 0.3 });
  await luna.waitHold(g6.id);
  await luna.path([[24, 32], [16, 34], [4, 38]], { r: 0.5 });
  await deliver(luna, g6.id, 1);
  const steps = act('The machine core starts up! Steps spiral out of the central tower!');
  await sol.waitAct(steps.id, 6000);
  await shot('core');

  // == The tower ==============================================================================
  await sol.path([[24, 31], [10, 38], [6.4, 41.6]], { r: 0.4 });
  await sol.go(6.4, 41.6, { r: 0.25, stop: true });
  await sol.until((g, b, id) => g.world.acts.find((x) => x.def.id === id).parts.every((p) => p.u > 0.99), steps.id, 10000);
  const climb = [[3.6, 1.4, 43.4], [0.2, 2.8, 43.4], [-3.2, 4.2, 43.4], [-6.8, 5.6, 44.6], [-6.6, 7.0, 49.6], [-6.8, 8.4, 54.2], [-3.8, 9.8, 57.0], [-0.8, 11.2, 56.6], [3.4, 12, 57.4]];
  await chain(sol, climb.map(([x, top, z]) => leap(x, top, z, true)));
  await luna.go(6.4, 41.6, { r: 0.25, stop: true });
  await chain(luna, climb.slice(0, -1).map(([x, top, z]) => leap(x, top, z, true)).concat([leap(2.6, 12, 58.6, true)]));
  // Sol holds the plate; Luna rides the fan up and holds the plate up there.
  await sol.go(5.4, 57.8, { r: 0.25, stop: true });
  await luna.go(1.6, 57.2, { r: 0.25, stop: true }); // stop dead: in the air you'd keep drifting
  await luna.until((g) => g.player.pos.y > 23, null, 7000);
  await luna.jump({ to: [-2.4, 22, 58.2] });
  await luna.go(-3, 58.4, { r: 0.25, stop: true });
  await shot('fan', luna.page);
  await sol.go(1.6, 57.2, { r: 0.25, stop: true });
  await sol.until((g) => g.player.pos.y > 23, null, 7000);
  await sol.jump({ to: [-1.3, 22, 56.6] });
  // Each onto their own pad, hold E, and steer onto the top.
  await sol.go(-1.3, 56.4, { r: 0.22, stop: true });
  await sol.magnet(1100, { to: [-1.3, 28, 52] });
  await sol.go(-1.5, 50.5, { r: 0.6, timeout: 6000 });
  await luna.go(-4.7, 56.4, { r: 0.22, stop: true });
  await luna.magnet(1100, { to: [-4.0, 28, 52] });
  await luna.go(1.5, 50.5, { r: 0.6, timeout: 6000 });
  await sol.go(-1.5, 49.6, { r: 0.6 });
}
