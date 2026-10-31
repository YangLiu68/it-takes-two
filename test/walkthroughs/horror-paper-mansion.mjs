// The Paper Doll Mansion: the embroidery tower (plate + UV screen + chest), three offerings
// past the sedan-bearer, the ancestral rites, the paper-doll corridor over the
// pond, burning the contract, and the run back to the gate with the bride behind.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const item = (label) => L.items.find((i) => i.label === label);
  const sw = (id) => L.switches.find((w) => w.id === id);
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const later = (ms, f) => async (b) => {
    await b.wait(ms);
    await f(b);
  };

  // Into the courtyard (the suona starts) and over to the embroidery tower.
  await sol.face('monster');
  await luna.face('monster');
  await both(
    later(700, (b) => b.path([[-0.7, 7], [-0.7, 9.6], [5.5, 9.9], [5.5, 13], [12.5, 16], [12.5, 22], [16.2, 22], [16.2, 25.5]])),
    (b) => b.path([[0.7, 7], [0.7, 9.4], [6, 9.4], [6, 13], [12.8, 15.5], [12.8, 21.6], [16, 21.6]]),
  );
  // Luna holds the plate and reads the screen in her flashlight; Sol climbs.
  await luna.face([18.5, 1.5, 18.45]);
  await luna.go(M.stairPlate[0], M.stairPlate[2], { r: 0.3, stop: true });
  await shot('uv-screen', luna.page);
  await sol.face(null);
  await sol.path([[21.5, 24], [21.5, 19.3], [M.vestibule[0], M.vestibule[2]]], { r: 0.4 });
  const stairs = L.acts.find((a) => a.parts[0].sy > 8);
  await sol.waitAct(stairs.id, 5000);
  for (let i = 0; i < 7; i++) await sol.jump({ to: [24.35, 0.6 * (i + 1), 21.1 + i] });
  await sol.jump({ to: [24.35, 4.8, 28.4] });
  await sol.until((g) => g.player.pos.y > 4.5, null, 3000);
  // The chest: 3rd month, 7th day → 0307.
  await sol.path([[21.6, 28.3], [19, 28.6]], { r: 0.4 });
  const combo = L.combos[0];
  for (let i = 0; i < 4; i++) await sol.setDial(L.dials.find((d) => d.id === combo.dials[i]), combo.targets[i]);
  await sol.waitSig(combo.id, 4000);
  const ingot = item('Gold Ingot');
  await sol.go(15.8, 29.3, { r: 0.3 });
  await sol.waitHold(ingot.id);
  await shot('loft', sol.page);
  // Jump down; Luna goes for the candle in the kitchen.
  await sol.face('monster');
  await luna.face('monster');
  await both(
    (b) => b.path([[19, 27.4], [19, 26.8], [16.2, 25.5], [16, 22], [12.5, 22]]),
    (b) => b.path([[16, 22], [12.6, 22], [12.6, 12], [16, 12], [16.5, 10.7], [19.5, 13.4]], { r: 0.4 }),
  );
  const candle = item('Red Candle');
  await luna.waitHold(candle.id);
  // Both to the ancestral hall: Sol with the ingot, Luna with the candle.
  await both(
    (b) => b.path([[-12.5, 22], [-16, 22], [-16.6, 18.8], [-18.2, 23.1]], { r: 0.4 }),
    (b) => b.path([[16, 12], [12.6, 12], [12.6, 15.5], [5, 16], [-3, 16], [-3, 22.4], [-12.5, 22.4], [-16, 22], [-18.2, 20.9]], { r: 0.3 }),
  );
  await sol.waitUsed(ingot.id);
  await luna.waitUsed(candle.id);
  // Sol fetches the incense from the shrine and brings it back.
  await sol.path([[-16, 22], [-12.5, 22.6], [11.5, 23.5], [12, 28.9]], { r: 0.4 });
  const incense = item('Incense');
  await sol.waitHold(incense.id);
  await sol.path([[11.5, 23.5], [-12.5, 22.6], [-16, 22], [-18.2, 23.1]], { r: 0.4 });
  await sol.waitUsed(incense.id);
  const altar = L.locks.find((l) => l.label === 'Altar');
  await sol.waitSig(altar.id, 4000);
  await shot('altar');
  // The family tree in the niche, then the rites in generation order.
  await sol.face(null);
  await luna.face(null);
  await luna.path([[-21, 28.5], [M.niche[0], M.niche[2]]], { r: 0.4 });
  await luna.until((g, b, t) => g.extras.found.has(g.level.notes.find((n) => n.title === t).id), 'Shen Family Tree', 8000);
  const rites = L.seqs[0];
  for (const id of rites.ids) {
    const w = sw(id);
    await sol.go(w.x, w.z, { r: 0.3, stop: true });
    await sol.pound();
  }
  await sol.waitSig(rites.id, 5000);
  const north = L.acts.find((a) => a.toast === 'The corridor door opens...');
  await sol.waitAct(north.id, 6000);

  // The corridor: each keeps an eye on one doll.
  await both(
    (b) => b.path([[-16, 22], [-12.5, 23], [-1, 28.6], [-0.5, 30.6]]),
    (b) => b.path([[-21, 28.5], [-17, 24], [-16, 22.6], [-12.5, 22.6], [1, 28.6], [0.5, 30.6]]),
  );
  await sol.face('monster:1');
  await luna.face('monster:2');
  await both(
    (b) => b.path([[-0.4, 33], [-0.4, 36], [0, 39.3], [0, 48.8]], { r: 0.3 }),
    (b) => b.path([[0.4, 33], [0.6, 37.6]], { r: 0.4 }),
  );
  await shot('corridor', sol.page);
  await both(
    (b) => b.go(M.plateW[0], M.plateW[2], { r: 0.3, stop: true }),
    (b) => b.path([[0, 39.3], [0, 48.8], [M.plateE[0], M.plateE[2]]], { r: 0.3 }),
  );
  await luna.go(M.plateE[0], M.plateE[2], { r: 0.3, stop: true });
  const hall = L.acts.find((a) => a.toast === 'The wedding hall door opens.');
  await sol.waitAct(hall.id, 6000);
  await both((b) => b.path([[-1, 57], [-0.6, 61], [-0.6, 63.5]]), (b) => b.path([[1, 57], [0.6, 61], [0.6, 63.5]]));
  await sol.face(null);
  await luna.face(null);

  // The wedding hall: take the contract, read the note, burn it.
  const contract = item('Marriage Contract');
  await both((b) => b.path([[-3, 64], [M.contract[0], M.contract[2]]], { r: 0.3 }), (b) => b.path([[3, 64], [6, 70.6]], { r: 0.3 }));
  await sol.waitHold(contract.id);
  await luna.go(1.2, 62.2, { r: 0.4 });
  await sol.go(M.brazier[0], M.brazier[2], { r: 0.3 });
  await sol.waitUsed(contract.id);
  await shot('bride');

  // Run! Flashlights on her the whole way.
  await sol.face('monster');
  await luna.face('monster');
  await both(
    (b) => b.path([[-0.6, 61.5], [0, 57.5], [0, 48.8], [0, 39.3], [-0.5, 33], [-0.5, 30.6], [5.5, 13.5], [5.5, 9.9], [-0.7, 9.6], [-0.7, 7], [M.gateW[0], M.gateW[2]]], { r: 0.4 }),
    later(900, (b) => b.path([[0.6, 61.5], [0, 57.5], [0, 48.8], [0, 39.3], [0.5, 33], [0.5, 30.6], [6, 13.5], [6.2, 9.4], [0.7, 9.4], [0.7, 7], [M.gateE[0], M.gateE[2]]], { r: 0.4 })),
  );
  await both((b) => b.go(M.gateW[0], M.gateW[2], { r: 0.3, stop: true }), (b) => b.go(M.gateE[0], M.gateE[2], { r: 0.3, stop: true }));
  const gate = L.acts.find((a) => a.style === 'gate');
  await sol.waitAct(gate.id, 6000);
  await shot('gate');
  await both((b) => b.path([[-0.7, 0], [-0.7, -6]]), (b) => b.path([[0.7, 0], [0.7, -6]]));
}
