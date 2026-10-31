// Dorm 404: the log in the maze, the key cabinet (one holds the duty plate),
// the washroom mirror (back out without looking back), the laundry dryer code,
// three fuses + the key into the fuse box, Room 404's beam (one holds the
// light), the call, and the run back to the elevator with flashlights on her.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const xz = (m) => [m[0], m[2]];
  const mon = L.monsters[0];
  const nodes = mon.nodes;
  const adj = nodes.map(() => []);
  for (const [a, b] of mon.edges) {
    adj[a].push(b);
    adj[b].push(a);
  }
  const cellOf = (x, z) => nodes.findIndex((n) => Math.abs(n[0] - x) <= 3 && Math.abs(n[2] - z) <= 3);
  const route = (from, to) => {
    const prev = new Map([[from, -1]]);
    const q = [from];
    while (q.length) {
      const n = q.shift();
      if (n === to) break;
      for (const m of adj[n]) if (!prev.has(m)) {
        prev.set(m, n);
        q.push(m);
      }
    }
    const out = [];
    for (let n = to; n !== -1; n = prev.get(n)) out.unshift(n);
    return out;
  };
  // Walk the corridors from one cell to another, cell centre to cell centre.
  const maze = (bot, from, to) => bot.path(route(cellOf(...from), cellOf(...to)).map((k) => [nodes[k][0], nodes[k][2]]), { r: 0.8 });
  const ENTRY = [0, 13];
  const item = (label) => L.items.find((i) => i.label === label);
  const note = (title) => L.notes.find((n) => n.title === title);
  const zoneText = (t) => L.zones.find((z) => z.kind === 'trigger' && z.text && z.text.includes(t));
  const fusebox = async (bot, it) => {
    const spot = xz(bot.name === 'Sol' ? M.fuseboxA : M.fuseboxB);
    await bot.path([[spot[0] > 4 ? 2 : -0.5, 8], spot], { r: 0.4 });
    await bot.waitUsed(it.id);
  };
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);

  await sol.face('monster');
  await luna.face('monster');

  // 1. Sol fetches the red fuse (only he can carry it); Luna finds the supervisor's log.
  const red = item('Red Fuse');
  const log = note("Warden's Round Log");
  const bed0 = xz(M.bed0);
  await both(
    async (b) => {
      await b.path([[-0.8, 8], [-0.8, 12.5]]);
      await maze(b, ENTRY, xz(M.fuseRed));
      await b.go(...xz(M.fuseRed), { r: 0.5 });
      await b.waitHold(red.id);
      await maze(b, xz(M.fuseRed), ENTRY);
      await fusebox(b, red);
    },
    async (b) => {
      await b.path([[0.8, 8], [0.8, 12.5]]);
      await maze(b, ENTRY, bed0);
      await b.go(...bed0, { r: 0.4 });
      await b.until((g, bot, id) => g.extras.found.has(id), log.id, 8000);
      await maze(b, bed0, ENTRY);
      await b.path([[0, 8], [-3, 4], xz(M.duty)], { r: 0.4 });
      await b.go(...xz(M.duty), { r: 0.3, stop: true });
    },
  );
  await shot('lobby');

  // 2. Luna holds the duty plate; Sol goes into the office and opens the key cabinet.
  const officeDoor = L.acts.find((a) => a.style === 'door' && Math.abs(a.parts[0].x + 6) < 0.1);
  await sol.path([[2, 7.5], [-4.6, 7.5]], { r: 0.4 });
  await sol.waitAct(officeDoor.id, 8000);
  await sol.path([[-7.5, 7.5], [-11, 7.5]], { r: 0.4 });
  const seq = L.seqs[0];
  for (const id of seq.ids) {
    const w = L.switches.find((s) => s.id === id);
    await sol.go(w.x, w.z, { r: 0.3, stop: true });
    await sol.pound();
  }
  await sol.waitSig(seq.id, 5000);
  const key = item('Fuse Box Key');
  await sol.go(-12.2, 8.5, { r: 0.4 });
  await sol.waitHold(key.id);
  await shot('office', sol.page);
  await sol.path([[-7.5, 7.5], [-4.6, 7.5], [-1, 6]], { r: 0.5 });
  await fusebox(sol, key);

  // 3. Sol reads the mirror and backs out without looking round; Luna dials the dryer.
  const mirror = zoneText('In the mirror');
  const washOut = zoneText('footsteps');
  const blue = item('Blue Fuse');
  await both(
    async (b) => {
      await b.path([[-0.8, 8], [-0.8, 12.5]]);
      await maze(b, ENTRY, [-18, 25]);
      await b.face([-31, 1.9, 25]);
      await b.path([[-21, 25], [-25, 25], xz(M.mirror)], { r: 0.5 });
      await b.waitSig(mirror.id, 5000);
      await b.pitch(0.06);
      await b.wait(1500);
      await shot('mirror', b.page);
      await b.pitch(0.28);
      // Walk out backwards, eyes on the mirror.
      await b.path([[-25, 25], [-21.5, 25], [-18.5, 25]], { r: 0.5 });
      await b.waitSig(washOut.id, 5000);
      await b.face('monster');
      // Then the white fuse.
      const white = item('White Fuse');
      await maze(b, [-18, 25], xz(M.fuseWhite));
      await b.go(...xz(M.fuseWhite), { r: 0.5 });
      await b.waitHold(white.id);
      await maze(b, xz(M.fuseWhite), ENTRY);
      await fusebox(b, white);
    },
    async (b) => {
      await b.path([[0, 4], [0.8, 8], [0.8, 12.5]]);
      await maze(b, ENTRY, [18, 19]);
      await b.path([[21, 19], [24, 19.5]], { r: 0.5 });
      const combo = L.combos.find((c) => c.dials.length === 3);
      for (let i = 0; i < 3; i++) await b.setDial(L.dials.find((d) => d.id === combo.dials[i]), combo.targets[i]);
      await b.waitSig(combo.id, 4000);
      await b.go(...xz(M.fuseBlue), { r: 0.3 });
      await b.waitHold(blue.id);
      await shot('laundry', b.page);
      await b.path([[24, 19], [21, 19], [18, 19]], { r: 0.6 });
      await maze(b, [18, 19], ENTRY);
      await fusebox(b, blue);
    },
  );
  const power = L.locks.find((l) => l.label === 'Fuse Box');
  await sol.waitSig(power.id, 5000);
  await shot('power');

  // 4. Room 404: Luna holds the light, Sol walks the beam and calls the elevator.
  const door404 = L.acts.find((a) => a.toast && a.toast.includes('fourteen rooms'));
  await both((b) => b.path([[-0.8, 8], [-0.8, 12.5]]), (b) => b.path([[0.8, 8], [0.8, 12.5]]));
  await both(async (b) => {
    await maze(b, ENTRY, [18, 37]);
    await b.go(19.4, 38.4, { r: 0.4 }); // out of Luna's way
  }, async (b) => {
    await b.wait(800);
    await maze(b, ENTRY, [18, 37]);
  });
  await sol.waitAct(door404.id, 8000);
  await luna.path([[18, 40.5], [20.3, 42.4]], { r: 0.4 });
  await luna.until((g, bot, id) => g.extras.found.has(id), note("Xiaoyu's Phone — Unsent Draft").id, 6000);
  await luna.go(...xz(M.plate404), { r: 0.3, stop: true });
  await sol.face(null);
  await sol.path([[18, 40.5], xz(M.beamStart)], { r: 0.3 });
  const beam = L.acts.find((a) => a.style === 'bridge');
  await sol.waitAct(beam.id, 6000);
  await sol.wait(800);
  await sol.path([[18, 50], [18, 56], xz(M.beamEnd)], { r: 0.3 });
  await sol.go(...xz(M.call), { r: 0.3, stop: true });
  await sol.pound();
  const call = L.switches.find((s) => s.latch && Math.abs(s.z - M.call[2]) < 0.1);
  await sol.waitSig(call.id, 4000);
  await shot('call', sol.page);
  await sol.path([[18, 62.5], [18, 56], [18, 50], [18, 45.2], [18, 42.5]], { r: 0.3 });

  // 5. Run! Flashlights on whoever is following, back to the elevator.
  await sol.face('monster');
  await both(async (b) => {
    await b.path([[17.4, 40.5], [17.4, 37]], { r: 0.6 });
    await maze(b, [18, 37], ENTRY);
    await b.path([[-0.8, 9], xz(M.liftA)], { r: 0.4 });
    await b.go(...xz(M.liftA), { r: 0.3, stop: true });
  }, async (b) => {
    await b.wait(600);
    await b.path([[18.6, 40.5], [18.6, 37]], { r: 0.6 });
    await maze(b, [18, 37], ENTRY);
    await b.path([[0.8, 9], xz(M.liftB)], { r: 0.4 });
    await b.go(...xz(M.liftB), { r: 0.3, stop: true });
  });
  const lift = L.acts.find((a) => a.toast && a.toast.includes('elevator doors open'));
  await sol.waitAct(lift.id, 8000);
  await shot('lift');
  await sol.face(null);
  await luna.face(null);
  await luna.path([[1, -1], [1, -4.6]], { r: 0.4 });
  await sol.path([[-1, -1], [-1, -4.6]], { r: 0.4 });
}
