// Midnight School Rules: red-light hallway, roll call, the patroller upstairs (flashlight it),
// the art room clue, two plates, the safe, Room 4, the chase to the gate.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const item = (label) => L.items.find((i) => i.label === label);
  const lock = (label) => L.locks.find((l) => l.label === label);
  const sw = (id) => L.switches.find((w) => w.id === id);
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);

  // Library → hallway → Class 3 (the bots stand still whenever the lights go red).
  await both((b) => b.path([[-1, 10], [-1, 14], [-1, 37], [-5, 37]]), (b) => b.path([[1, 10], [1, 14], [1, 36], [-4.5, 36]]));
  await shot('class3');
  // Roll call: pound the seats in order.
  const seq = L.seqs[0];
  // Desks fill the room: walk the middle aisle and come at each button from behind its desk.
  for (const id of seq.ids) {
    const w = sw(id);
    await sol.path([[-8.2, w.z - 1.6], [w.x, w.z - 1.6]], { r: 0.4 });
    await sol.go(w.x, w.z, { r: 0.3, stop: true });
    await sol.pound();
    await sol.go(w.x, w.z - 1.6, { r: 0.4 });
  }
  await sol.waitSig(seq.id, 5000);
  const stairKey = item('Stairwell Key');
  await sol.path([[-8.2, 38.9], [-8.2, 42.6]], { r: 0.4 });
  await sol.go(-5.75, 43, { r: 0.25 });
  await sol.waitHold(stairKey.id);
  // Up the hallway to the stairwell door.
  await both((b) => b.path([[-8.2, 42], [-8.2, 37.2], [-4.5, 37.2], [-1.5, 37], [-1.5, 59.5]]), (b) => b.path([[-1.5, 36], [1, 37], [1, 58]]));
  await sol.waitAct(L.acts.find((a) => a.toast && a.toast.includes('stairwell door')).id, 8000);
  await both((b) => b.path([[-1, 64], [-1, 66.5]]), (b) => b.path([[1, 64], [1, 66.5]]));
  await shot('landing');

  // Upstairs: keep the flashlights on the patroller whenever it's near.
  await sol.face('monster');
  await luna.face('monster');
  // Luna holds the near plate; Sol checks the art room, then crosses the beam.
  await luna.path([[0.5, 70], [0, 73.5]], { r: 0.3 });
  await sol.path([[-0.8, 70], [-1, 79], [-7.8, 79], [-7.8, 84]]);
  await sol.until((g, b, id) => g.extras.found.has(id), L.notes.find((n) => n.title.includes('Art Homework')).id, 8000);
  await shot('art-room', sol.page);
  await sol.path([[-7.8, 79], [-1, 79], [-1.5, 85.8], [-1.5, 96.2], [0, 101.5]], { r: 0.35 });
  await sol.go(0, 101.5, { r: 0.3, stop: true });
  const office = L.acts.find((a) => a.toast === 'The office door unlocked.');
  await sol.waitAct(office.id, 8000);
  // Luna crosses too; both go into the office.
  await luna.path([[-1.5, 85.8], [-1.5, 96.2], [0.5, 102]], { r: 0.35 });
  await both((b) => b.path([[1.5, 104], [6, 104.5]]), (b) => b.path([[1.5, 103.5], [8, 103]]));
  await sol.face(null);
  await luna.face(null);
  // The safe: Mei's birthday, 0417.
  const combo = L.combos[0];
  for (let i = 0; i < 4; i++) await sol.setDial(L.dials.find((d) => d.id === combo.dials[i]), combo.targets[i]);
  await sol.waitSig(combo.id, 4000);
  const key4 = item('Room 4 Key');
  await sol.go(12, 101.45, { r: 0.3 });
  await sol.waitHold(key4.id);
  await shot('safe-open');

  // Back over the beam and downstairs to Room 4.
  await sol.face('monster');
  await luna.face('monster');
  await both((b) => b.path([[6, 104], [1.5, 104], [0, 100], [-1.5, 96.2], [-1.5, 85.8], [-0.8, 72], [-0.8, 66]], { r: 0.35 }),
    (b) => b.path([[6, 103], [1.5, 103.5], [1.5, 100], [1.5, 96.2], [1.5, 85.8], [0.8, 72], [0.8, 66]], { r: 0.35 }));
  await sol.face(null);
  await luna.face(null);
  await both((b) => b.path([[1, 60], [1.6, 51.5]]), (b) => b.path([[-1, 60], [-1, 50]]));
  await sol.waitUsed(key4.id);
  await sol.waitAct(L.acts.find((a) => a.quiet).id, 8000);
  await both((b) => b.path([[4.5, 49.5], [8, 49]]), (b) => b.path([[4.5, 50.5], [8, 51]]));
  // Mei's letter sets off the chase.
  await luna.path([[10.5, 52.6], [11, 54.2]], { r: 0.4 });
  await luna.until((g) => g.level.zones.some((z) => z.kind === 'trigger' && z.text && z.text.includes('Run!') && g.world.sig(z.id)), null, 6000);
  await shot('chase', luna.page);
  // Run! Flashlights on it, stop under the red light, out through the library.
  await sol.face('monster');
  await luna.face('monster');
  await both((b) => b.path([[6, 49.5], [1.5, 49.5], [-1, 40], [-1, 14], [-1, 10], [-1, 6], [-5, 6], [-9, 6], [M.gateA[0], M.gateA[2]]], { r: 0.4 }),
    (b) => b.path([[6, 51], [1.5, 50.5], [1, 40], [1, 14], [1, 10], [0.5, 6.8], [-5, 6.8], [-9, 7], [M.gateB[0], M.gateB[2]]], { r: 0.4 }));
  await both((b) => b.go(M.gateA[0], M.gateA[2], { r: 0.3, stop: true }), (b) => b.go(M.gateB[0], M.gateB[2], { r: 0.3, stop: true }));
  const gate = L.acts.find((a) => a.style === 'gate');
  await sol.waitAct(gate.id, 8000);
  await shot('gate');
  await both((b) => b.path([[-19, 5.5], [-23.5, 5]]), (b) => b.path([[-19, 6.5], [-23.5, 7]]));
}
