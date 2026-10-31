// The Last Train: tickets (line-map code + booth plate), the anomaly corridor (with one
// deliberate wrong call to check the reset), the cab code, two handles from the
// patrolled train, the tunnel chase, the catwalk and the blast door.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const item = (label) => L.items.find((i) => i.label === label);
  const sw = (id) => L.switches.find((w) => w.id === id);
  const actAt = (x, z) => L.acts.find((a) => Math.abs(a.parts[0].x - x) < 0.2 && Math.abs(a.parts[0].z - z) < 0.2);
  const lock = (label) => L.locks.find((l) => l.label === label);

  // -- Ticket hall: Luna presses the stops (Sol reads the map); her ticket comes out.
  const seq = L.seqs[0];
  await luna.path([[1, 6.5], [-6.6, 6.5]]);
  for (const id of seq.ids) {
    const w = sw(id);
    await luna.go(w.x, w.z, { r: 0.3, stop: true });
    await luna.pound();
  }
  await luna.waitSig(seq.id, 5000);
  const blue = item('Blue Ticket');
  await luna.go(-7.6, 13.8, { r: 0.3 });
  await luna.waitHold(blue.id);
  // Luna holds the booth plate; Sol fetches the red ticket.
  await luna.go(M.boothPlate[0], M.boothPlate[2], { r: 0.3, stop: true });
  const boothDoor = actAt(7.5, 5);
  await sol.path([[1.5, 6.5], [7.5, 6.6]]);
  await sol.waitAct(boothDoor.id, 5000);
  await sol.path([[7.5, 4.0], [7.6, 2.5]], { r: 0.35 });
  const red = item('Red Ticket');
  await sol.waitHold(red.id);
  await shot('booth', sol.page);
  await sol.path([[7.5, 4.0], [7.5, 6.6], [-1, 12.2]]);
  await luna.go(-3.4, 12.6, { r: 0.3 });
  const gate = lock('Ticket Gate');
  await sol.waitSig(gate.id, 6000);
  await sol.waitAct(actAt(0, 15).id, 5000);
  await both((b) => b.path([[-0.6, 16.5], [-0.6, 22], [-0.5, 26]]), (b) => b.path([[0.6, 16.5], [0.6, 22], [0.5, 26]]));
  await both((b) => b.until((g) => g.player.pos.x > 25), (b) => b.until((g) => g.player.pos.x > 25));
  await shot('corridor0');

  // -- The corridor. Each room: pound both buttons of the chosen exit together, walk through.
  const inRoom = (b, ox) => b.until((g, bot, x) => Math.abs(g.player.pos.x - x) < 3 && g.player.pos.z > 5 && g.player.pos.z < 29, ox, 10000);
  const choose = async (i, back) => {
    const [ox] = M[`c${i}`];
    await both((b) => inRoom(b, ox), (b) => inRoom(b, ox));
    const zs = back ? 5.6 : 28.4, zv = back ? 2 : 32;
    const gone = async (b) => Math.abs((await b.pos())[0] - ox) > 4;
    // Pound both buttons, then walk through; if the door shut again first, try again.
    for (let attempt = 0; attempt < 4; attempt++) {
      if (!(await gone(sol))) await both((b) => b.go(ox - 1.4, zs, { r: 0.3, stop: true }), (b) => b.go(ox + 1.4, zs, { r: 0.3, stop: true }));
      if (!(await gone(sol))) await both((b) => b.pound(), (b) => b.pound());
      // Whoever gets there first takes both of you through.
      await both((b) => b.go(ox - 0.7, zv, { timeout: 7000 }).catch(() => null), (b) => b.go(ox + 0.7, zv, { timeout: 7000 }).catch(() => null));
      if ((await gone(sol)) && (await gone(luna))) break;
    }
    await both((b) => b.until((g, bot, x) => Math.abs(g.player.pos.x - x) > 4, ox, 5000), (b) => b.until((g, bot, x) => Math.abs(g.player.pos.x - x) > 4, ox, 5000));
  };
  const anomaly = (i) => M[`c${i}`][1] === 1;
  await choose(0, anomaly(0));
  // A deliberate wrong call in exit 1: it must send both of you back to exit 0.
  await choose(1, !anomaly(1));
  const back0 = await sol.pos();
  if (Math.abs(back0[0] - M.c0[0]) > 3) throw new Error(`wrong call should reset to exit 0, ended at x=${back0[0].toFixed(1)}`);
  await shot('reset', sol.page);
  for (let i = 0; i < 6; i++) {
    await choose(i, anomaly(i));
    if (i === 2) await shot('corridor-mid');
  }
  await both((b) => b.until((g) => g.player.pos.x < 5 && g.player.pos.z > 44), (b) => b.until((g) => g.player.pos.x < 5 && g.player.pos.z > 44));
  await shot('platform');

  // -- Platform: Sol dials the cab code; Luna fetches the blue handle from car 3. Flashlights on the conductor.
  await sol.face('monster');
  await luna.face('monster');
  const combo = L.combos[0];
  const dials = async () => {
    for (let i = 0; i < 4; i++) await sol.setDial(L.dials.find((d) => d.id === combo.dials[i]), combo.targets[i]);
    await sol.waitSig(combo.id, 4000);
  };
  const blueHandle = item('Blue Handle');
  const fetchBlue = async () => {
    await luna.path([[1.2, 60], [2.6, 89], [5.6, 89]], { r: 0.4 });
    await luna.go(7.5, 89.5, { r: 0.3 });
    await luna.waitHold(blueHandle.id);
    await luna.path([[5.6, 89], [2.6, 89], [2.4, 56]], { r: 0.4 });
  };
  await Promise.all([dials(), fetchBlue()]);
  await shot('cab-open', sol.page);
  const redHandle = item('Red Handle');
  await sol.path([[2.6, 55], [5.6, 55]], { r: 0.4 });
  await sol.go(7.5, 54.5, { r: 0.3 });
  await sol.waitHold(redHandle.id);
  await sol.path([[5.6, 55], [2.6, 55], [2.6, 47.5]], { r: 0.4 });
  await sol.path([[5.4, 47.5], [6.4, 48.6]], { r: 0.4 });
  await luna.path([[2.6, 47.6], [5.4, 47.5], [6.0, 46.6]], { r: 0.4 });
  const consoleLock = lock('Console');
  await sol.waitSig(consoleLock.id, 6000);
  await shot('console');

  // -- Tunnel: run, freeze under the red light, flashlight on him, regroup in the signal booth.
  await luna.path([[5.4, 47.5], [2.6, 47.5], [1, 52]], { r: 0.45 });
  await both((b) => b.path([[5.4, 47.5], [2.6, 47.5], [-0.8, 52], [-0.8, 98], [-0.8, 106], [-0.8, 139], [-1.5, 141], [-5, 141]], { r: 0.45 }),
    (b) => b.path([[0.8, 98], [0.8, 106], [0.8, 139], [-1.5, 140.5], [-6.5, 140]], { r: 0.45 }));
  await shot('booth-safe');
  // Wait for him to walk away, then the catwalk.
  await sol.waitClear(10, 40000);
  // One at a time on the catwalk.
  await sol.path([[-1.5, 141], [-1.2, 146], [M.cat0[0], M.cat0[2]], [M.cat1[0], M.cat1[2]], [-1, 162]], { r: 0.3 });
  await luna.path([[-1.5, 140.5], [-1.2, 146], [M.cat0[0], M.cat0[2]], [M.cat1[0], M.cat1[2]], [1, 162]], { r: 0.3 });
  await shot('catwalk');
  // The blast door: both buttons at once.
  const blast = actAt(0, 188);
  for (let attempt = 0; attempt < 4; attempt++) {
    await both((b) => b.go(M.swL[0], M.swL[2], { r: 0.3, stop: true }), (b) => b.go(M.swR[0], M.swR[2], { r: 0.3, stop: true }));
    await both((b) => b.pound(), (b) => b.pound());
    if (await sol.waitAct(blast.id, 3000).then(() => true, () => false)) break;
  }
  await sol.waitAct(blast.id, 1000);
  await both((b) => b.path([[-0.6, 186], [-0.6, 191], [-0.8, 199.5]], { r: 0.5 }), (b) => b.path([[0.6, 186], [0.6, 191], [1.2, 199.5]], { r: 0.5 }));
}
