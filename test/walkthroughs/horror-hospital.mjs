// Mercy Hospital: the counter gate, the lift, the trolley rule and the night nurse,
// split wings for the pharmacy code, the freight lift to B1, the morgue
// (one watches, one searches), the breakers, the operating theatre, the chase.
export default async function ({ sol, luna, L, shot, sleep }) {
  // Generous timeouts: walking is real time, and the red light makes you wait.
  for (const b of [sol, luna]) {
    const { go, path } = b;
    b.go = (x, z, o = {}) => go(x, z, { timeout: 90000, ...o });
    b.path = (pts, o = {}) => path(pts, { timeout: 90000, ...o });
  }
  const M = L.marks;
  const item = (label) => L.items.find((i) => i.label === label);
  const act = (toast) => L.acts.find((a) => a.toast && a.toast.includes(toast));
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  // A lift warp takes both of us: the rider walks in, the other one just waits.
  const ride = async (rider, other, pts, zMin) => {
    const walking = rider.path(pts, { r: 0.4 }).catch(() => {});
    for (let k = 0; k < 300; k++) {
      if ((await rider.pos())[2] > zMin) break;
      await sleep(100);
    }
    await rider.wait(50); // stop the leftover walk
    await walking;
    await other.until((g, b, z) => g.player.pos.z > z, zMin, 10000);
    await sleep(600);
  };

  // -- 1F: Luna holds the plate, Sol fetches the visitor's pass. -------------------
  await both((b) => b.path([[-4, 3], [-4, 7.5], [-7, 7.5]]), (b) => b.path([[1.6, 3], [1.6, 10], [M.gatePlate[0], M.gatePlate[2]]]));
  await luna.go(M.gatePlate[0], M.gatePlate[2], { r: 0.3, stop: true });
  const gate = L.acts.find((a) => a.style === 'door' && Math.abs(a.x + 7) < 0.1 && Math.abs(a.z - 9) < 1);
  await sol.waitAct(gate.id, 20000);
  await sol.path([[-7, 10.5], [-6.4, 14.3]], { r: 0.4 });
  await sol.go(M.pass[0], M.pass[2], { r: 0.25 });
  await sol.waitHold(item("Visitor's Pass").id);
  await shot('pass', sol.page);
  await sol.path([[-7, 10.5], [-7, 7.5], [-2, 10], [2.6, 13.4]], { r: 0.4 });
  await sol.waitUsed(item("Visitor's Pass").id);
  await sol.waitAct(act('elevator doors open').id, 20000);
  await ride(luna, sol, [[6, 14], [6, 18.6]], 30);
  await shot('4f');

  // -- 4F: flashlights on the nurse; stop whenever the lights go red. ---------------
  await sol.face('monster');
  await luna.face('monster');
  await both(
    (b) => b.path([[-1, 45], [-1, 48.5], [-21, 48.5], [-21, 44], [M.xray[0], M.xray[2]]]),
    (b) => b.path([[1, 45], [1, 48.5], [21, 48.5], [21, 44], [M.records[0], M.records[2]]]),
  );
  await sol.go(-24, 37.2, { r: 0.35 });
  await shot('radiology', sol.page);
  await shot('records', luna.page);
  // Meet at the pharmacy doorway and dial in 2-0-0-4.
  await both(
    (b) => b.path([[-21, 44], [-21, 48.5], [10, 48.5], [10, 45.4]]),
    (b) => b.path([[21, 44], [21, 48.5], [13.2, 48.5], [13.2, 47.2]]),
  );
  await sol.face(null);
  const combo = L.combos[0];
  for (let i = 0; i < 4; i++) await sol.setDial(L.dials.find((d) => d.id === combo.dials[i]), combo.targets[i]);
  await sol.waitSig(combo.id, 20000);
  await sol.waitAct(act('pharmacy door opens').id, 20000);
  await sol.path([[10, 42], [10, 37.6]], { r: 0.35 });
  await sol.waitHold(item('Freight Elevator Key').id);
  await luna.path([[10, 45], [10, 42], [8.6, 38.6], [8.6, 37.7]], { r: 0.35 });
  await shot('pharmacy', sol.page);
  // To the freight lift at the east end.
  await sol.face('monster');
  await sol.path([[10.4, 41], [10, 45]], { r: 0.5 });
  await both(
    (b) => b.path([[10, 48.5], [25, 48.5], [25.4, 48.0]]),
    (b) => b.path([[9.4, 41], [10, 44], [10, 48.5], [22, 49.5]]),
  );
  await sol.waitUsed(item('Freight Elevator Key').id);
  await sol.waitAct(act('freight elevator opens').id, 20000);
  await ride(sol, luna, [[27.5, 49], [30.2, 49]], 90);
  await sol.face(null);
  await luna.face(null);
  await shot('b1');

  // -- B1: the morgue. Luna keeps her eyes on it; Sol finds drawer 6. --------------
  await sol.path([[-1, 104], [-1, 112], [-6, 112.8]]);
  await sol.until((g) => g.extras.monsters.some((m) => m.cur && m.mode > 0 && m.def.seen), null, 20000);
  await luna.face('monster');
  await luna.path([[1, 104], [1, 111.8], [-4.2, 111.8], [M.watch[0], M.watch[2]]], { r: 0.4 });
  await shot('morgue', luna.page);
  await sol.path([[-13, 112.8], [M.drawer6[0], M.drawer6[2]]], { r: 0.3 });
  await sol.go(M.drawer6[0], M.drawer6[2], { r: 0.25, stop: true });
  await sol.pound();
  await sol.waitHold(item('Operating Room Key').id);
  await shot('drawer', sol.page);
  await luna.face(null);
  // The diary on the desk, then out of Sol's way.
  await luna.go(-4.0, 116.6, { r: 0.35 });
  // The power room: 3, 1, 5 (she died at 3:15).
  await sol.path([[-12, 112.4], [-4, 112.2], [0, 112], [4.6, 112]]);
  await luna.path([[-4.2, 112.2], [1, 112.4], [1, 118]]);
  const seq = L.seqs[0];
  for (const id of seq.ids) {
    const w = L.switches.find((s) => s.id === id);
    await sol.go(w.x, w.z, { r: 0.3, stop: true });
    await sol.pound();
  }
  await sol.waitSig(seq.id, 20000);
  // The operating theatre.
  await both((b) => b.path([[4.6, 112], [0, 112], [-1.3, 133.0]]), (b) => b.path([[1, 131]]));
  await sol.waitUsed(item('Operating Room Key').id);
  await sol.waitAct(act('operating room lights come on').id, 20000);
  await sol.path([[-0.3, 137.6], [-1.6, 138.6]], { r: 0.4 });
  await luna.path([[0.4, 137.6], [1.2, 139.4]], { r: 0.4 });
  await shot('theatre');
  await sol.face('monster');
  await luna.face('monster');
  await luna.path([[1.0, 140.6], [M.cert[0], M.cert[2]]], { r: 0.3 });
  await luna.waitHold(item('Discharge Certificate').id);
  await shot('chase', luna.page);
  // Run for the exit: Sol through the door first, then Luna with the certificate.
  await sol.path([[-0.3, 138], [-0.3, 134], [-1, 120], [-1, 107]], { r: 0.6 });
  await luna.path([[0.4, 139.5], [0.4, 135], [1, 120], [1.4, 105.4]], { r: 0.6 });
  await luna.waitUsed(item('Discharge Certificate').id);
  await luna.waitAct(act('emergency exit opens').id, 20000);
  await shot('exit', luna.page);
  await luna.path([[1.6, 102.2], [6.4, 103]], { r: 0.6 });
  await sol.path([[1.2, 102], [6.4, 101]], { r: 0.6 });
}
