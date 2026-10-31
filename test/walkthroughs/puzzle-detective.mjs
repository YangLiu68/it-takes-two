// Detective Agency: split archives, knock code, safe, invisible stepping stones,
// museum passes, two plates, photo halves, seesaw to the timetable, accusation.
export default async function ({ sol, luna, L, shot }) {
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const hop = async (b, pts, double = true) => {
    for (const p of pts) await b.jump({ to: p, double });
  };

  // Archives: each into their own room, pick up the fingerprint files.
  await both((b) => b.path([[-4.5, 12], [-4.5, 15.1], [-7.6, 15.2], [-7.6, 24.5], [-6, 25.8]], { r: 0.4 }), (b) => b.path([[4.5, 12], [4.5, 15.1], [7.6, 15.2], [7.6, 24.5], [6, 25.8]], { r: 0.4 }));
  await both((b) => b.until((g) => g.extras.found.size >= 2, null, 6000), (b) => b.until((g) => g.extras.found.size >= 2, null, 6000));
  await shot('archive', sol.page);
  await both((b) => b.path([[-1.6, 26.4], [-1.6, 28.9], [-4.5, 28.9], [-4.5, 32], [-3, 34]], { r: 0.4 }), (b) => b.path([[1.6, 26.4], [1.6, 28.9], [4.5, 28.9], [4.5, 32], [3, 34]], { r: 0.4 }));

  // Study: knock the objects in the order the two half-letters give.
  const knock = L.seqs[0];
  for (const id of knock.ids) {
    const w = L.switches.find((s) => s.id === id);
    await sol.go(w.x, w.z, { r: 0.3, stop: true });
    await sol.pound();
  }
  await sol.waitSig(knock.id, 5000);
  const secret = L.acts.find((a) => a.when.in.includes(knock.id));
  await sol.waitAct(secret.id, 6000);

  // Safe: staff numbers by age.
  // One at a time through the narrow secret door.
  await sol.path([[-0.3, 44], [-0.3, 48], [-0.9, 51.5]], { r: 0.4 });
  await luna.path([[0.3, 44], [0.3, 48], [-4.5, 50.7]], { r: 0.4 });
  const safe = L.combos.find((c) => c.dials.length === 4);
  for (let i = 0; i < 4; i++) await sol.setDial(L.dials.find((d) => d.id === safe.dials[i]), safe.targets[i]);
  await sol.waitSig(safe.id, 5000);
  const red = L.items.find((i) => i.label === 'Red Pass');
  await sol.go(0, 55.3, { r: 0.3 });
  await sol.waitHold(red.id);
  await shot('safe', sol.page);

  // Secret passage: Sol holds the lamp, Luna crosses on the invisible stones.
  await sol.path([[-1.6, 55.4], [-1.2, 57.2], [-0.6, 59], [-2, 60.5]], { r: 0.3 });
  await luna.path([[-2.5, 54.5], [1.4, 55.3], [1.3, 57.2], [0.6, 59], [1.4, 62.3]], { r: 0.3 });
  await sol.go(-2, 60.5, { r: 0.25, stop: true });
  await luna.go(1.4, 62.3, { r: 0.25, stop: true });
  await shot('passage', luna.page);
  const real = L.traps.filter((t) => t.kind === 'hidden').sort((a, c) => a.z - c.z);
  await hop(luna, [...real.map((t) => [t.x, 0, t.z]), [2, 0, 79.6]]);
  const blue = L.items.find((i) => i.label === 'Blue Pass');
  await luna.go(blue.x, blue.z + 0.4, { r: 0.4 });
  await luna.waitHold(blue.id);
  const bridgeSw = L.switches.find((w) => w.latch && Math.abs(w.z - 80) < 0.1);
  await luna.go(bridgeSw.x, bridgeSw.z, { r: 0.3, stop: true });
  await luna.pound();
  const bridge = L.acts.find((a) => a.style === 'bridge');
  await sol.waitAct(bridge.id, 5000);
  await sol.until((g, b, id) => g.world.acts.find((a) => a.def.id === id).parts.every((p) => p.u >= 1), bridge.id, 6000);
  await sol.path([[1.5, 61.6], [3.1, 62.6], [3.1, 78.6], [-1.2, 84.8]], { r: 0.4 });
  await luna.go(1.2, 84.8, { r: 0.4 });
  const gate = L.locks.find((l) => l.label === 'Museum Gate');
  await sol.waitSig(gate.id, 6000);

  // Entrance hall: two plates.
  await both((b) => b.path([[-1, 90], [-7, 92]], { r: 0.3 }), (b) => b.path([[1, 90], [7, 92]], { r: 0.3 }));
  await both((b) => b.go(-7, 92, { r: 0.25, stop: true }), (b) => b.go(7, 92, { r: 0.25, stop: true }));
  const hallDoor = L.acts.find((a) => a.style === 'door' && Math.abs(a.z - 96) < 0.1);
  await sol.waitAct(hallDoor.id, 5000);

  // Gallery: each reads half the photo in their side room.
  await both((b) => b.path([[-1, 95], [-1, 99], [-4.5, 104], [-6.8, 104], [-6.8, 100.9], [-9.5, 100.9], [-9.5, 104]], { r: 0.4 }),
    (b) => b.path([[1, 95], [1, 99], [4.5, 104], [6.8, 104], [6.8, 100.9], [9.5, 100.9], [9.5, 104]], { r: 0.4 }));
  await shot('photo', sol.page);
  await both((b) => b.path([[-9.5, 100.9], [-6.8, 100.9], [-6.8, 104], [-4.5, 104], [-1, 108], [-1, 113]], { r: 0.4 }),
    (b) => b.path([[9.5, 100.9], [6.8, 100.9], [6.8, 104], [4.5, 104], [1, 108], [1, 113]], { r: 0.4 }));

  // Seesaw: Sol stands on the west end, Luna pounds the east end.
  const e = L.seesaws[0];
  // Step onto each end from the front, not across the pivot.
  await both((b) => b.go(e.x - 3.4, e.z - 1.7, { r: 0.3 }), (b) => b.go(e.x + 3.4, e.z - 1.7, { r: 0.3 }));
  await both((b) => b.go(e.x - 3.4, e.z, { r: 0.3 }), (b) => b.go(e.x + 3.4, e.z, { r: 0.3 }));
  await sol.go(e.x - 3.4, e.z, { r: 0.25, stop: true });
  await luna.go(e.x + 3.4, e.z, { r: 0.25, stop: true });
  await luna.pound();
  const stepSw = L.switches.find((w) => w.latch && w.y > 8);
  await sol.go(stepSw.x, stepSw.z - 0.5, { r: 0.6, timeout: 8000 });
  await sol.until((g) => g.player.grounded && g.player.pos.y > 8.5, null, 6000);
  await sol.go(stepSw.x, stepSw.z, { r: 0.3, stop: true });
  await sol.pound();
  const steps = L.acts.find((a) => a.style === 'steps');
  await luna.waitAct(steps.id, 5000);
  await luna.until((g, b, id) => g.world.acts.find((a) => a.def.id === id).parts.every((p) => p.u >= 1), steps.id, 8000);
  const first = steps.parts[0];
  await luna.go(first.x, first.z + first.move[2] - 1.8, { r: 0.4 });
  for (const p of steps.parts) await luna.jump({ to: [p.x + p.move[0], p.y + p.sy / 2, p.z + p.move[2]], double: true });
  const last = steps.parts[steps.parts.length - 1];
  await luna.jump({ to: [last.x, 9, 119.8], double: true });
  // The timetable (Sol is up first, so he copies it).
  await sol.go(-8, 121.3, { r: 0.4 });
  await sol.until((g) => g.extras.found.size >= 4, null, 5000);
  await shot('timetable', sol.page);

  // Sheriff's office: the accusation.
  await both((b) => b.path([[-1.5, 121.3], [-0.6, 123], [-0.6, 129], [-2, 133]], { r: 0.4 }), (b) => b.path([[1.5, 120.5], [0.6, 123], [0.6, 129], [2, 133]], { r: 0.4 }));
  const accuse = L.combos.find((c) => c.dials.length === 3);
  await both(async (b) => {
    await b.setDial(L.dials.find((d) => d.id === accuse.dials[0]), accuse.targets[0]);
    await b.setDial(L.dials.find((d) => d.id === accuse.dials[1]), accuse.targets[1]);
  }, async (b) => {
    await b.setDial(L.dials.find((d) => d.id === accuse.dials[2]), accuse.targets[2]);
  });
  await sol.waitSig(accuse.id, 5000);
  await shot('accuse', sol.page);
  const fin = L.acts.find((a) => a.when.in.includes(accuse.id));
  await sol.waitAct(fin.id, 6000);
  await both((b) => b.path([[-0.6, 140], [-1.2, 147]], { r: 0.5 }), (b) => b.path([[0.6, 140], [1.2, 147]], { r: 0.5 }));
}
