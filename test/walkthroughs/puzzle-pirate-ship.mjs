// Pirate Ship: cannon + partner bond, the torn map, seesaw to the crow's nest,
// compasses, the hold (crumbling / blinking / sliding crates), parrot order.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const act = (text) => L.acts.find((a) => a.toast && a.toast.includes(text));
  const item = (label) => L.items.find((i) => i.label === label);
  const dialAt = (m) => L.dials.find((d) => Math.abs(d.x - m[0]) < 0.01 && Math.abs(d.z - m[2]) < 0.01);
  const comboOf = (dialId) => L.combos.find((c) => c.dials.includes(dialId));
  const target = (d) => comboOf(d.id).targets[comboOf(d.id).dials.indexOf(d.id)];
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);

  // 0. Sol fires across from the cannon, then calls Luna over with the partner bond.
  const pad = L.pads.find((p) => p.launch);
  await sol.go(pad.x, pad.z, { r: 0.25, stop: true });
  await sol.magnet(400);
  await sol.until((g) => g.player.grounded && g.player.pos.z > 30, null, 6000);
  await shot('aboard', sol.page);
  for (let k = 0; ; k++) {
    await both((b) => b.go(0, 31.6, { r: 0.3, stop: true }), (b) => b.go(0, 13.0, { r: 0.3, stop: true }));
    await both((b) => b.magnet(4200), async (b) => {
      await b.wait(500);
      await b.magnet(3000);
    });
    try {
      await luna.until((g) => g.player.pos.z > 28 && g.player.grounded, null, 4000);
      break;
    } catch (err) {
      if (k >= 2) throw err;
    }
  }

  // 1. The torn map: each reads their half in their own cabin, then sets their two wheels.
  await both((b) => b.path([[-1.2, 46], [-1.2, 51], [-7.5, 51]]), (b) => b.path([[1.2, 46], [1.2, 51], [7.5, 51]]));
  await shot('map-half', sol.page);
  const chest = [0, 1, 2, 3].map((i) => dialAt(M[`chest${i}`]));
  await both(async (b) => {
    await b.path([[-1.2, 51], [-1.2, 57]]);
    await b.setDial(chest[0], target(chest[0]));
    await b.setDial(chest[1], target(chest[1]));
    await b.go(-1.2, 57);
  }, async (b) => {
    await b.path([[1.2, 51], [2.5, 57]]);
    await b.setDial(chest[3], target(chest[3]));
    await b.setDial(chest[2], target(chest[2]));
    await b.go(1.2, 57);
  });
  await sol.waitAct(act('The chest pops open').id, 6000);

  // 2. Seesaw: Luna rides up to the crow's nest, Sol pounds.
  const e = L.seesaws[0];
  await both((b) => b.path([[0.8, 63], [e.x + 3.4, e.z]]), (b) => b.path([[-0.8, 63], [e.x - 3.4, e.z]]));
  for (let k = 0; ; k++) {
    await luna.go(e.x - 3.4, e.z, { r: 0.3, stop: true });
    await sol.go(e.x + 3.4, e.z, { r: 0.3, stop: true });
    await luna.wait(300);
    await sol.pound();
    try {
      await luna.until((g) => g.player.pos.y > 4, null, 2500);
      break;
    } catch (err) {
      if (k >= 2) throw err;
    }
  }
  await luna.go(M.nest[0], M.nest[2], { r: 0.8, timeout: 8000 });
  await luna.until((g) => g.player.pos.y > 9 && g.player.grounded, null, 4000);
  await shot('nest', luna.page);
  const nestSw = L.switches.find((w) => w.latch && w.y > 9);
  await luna.go(nestSw.x, nestSw.z, { r: 0.3, stop: true });
  await luna.pound();
  const steps = act('Steps slide out');
  await luna.waitAct(steps.id, 4000);
  await luna.path([[0, 73.5], [0, 70]]);
  // Up the steps to the quarterdeck, one at a time.
  const climb = async (b, endX) => {
    const parts = steps.parts;
    await b.go(parts[0].x, parts[0].z + parts[0].move[2] - 1.8, { r: 0.35 });
    for (const p of parts) await b.jump({ to: [p.x, p.y + p.sy / 2, p.z + p.move[2]], double: true });
    await b.jump({ to: [parts[2].x, 6.5, 86], double: true });
    await b.go(endX, 87, { r: 0.5 });
  };
  await climb(sol, -1.5);
  await climb(luna, 1.5);

  // 3. Captain's cabin: Luna saw the course from the nest.
  await both((b) => b.go(-1, 90.5), (b) => b.go(1, 90.5));
  for (let i = 0; i < 3; i++) {
    const d = dialAt(M[`compass${i}`]);
    await luna.setDial(d, target(d));
  }
  await luna.go(1, 91);
  const key = item("Captain's key");
  await sol.go(4.5, 95.3, { r: 0.3 });
  await sol.waitHold(key.id);
  await shot('compass', sol.page);
  await sol.path([[2, 95], [0, 97.5], [-0.5, 99.3], [-1, 101.5]]);
  await luna.path([[-1, 92], [0, 97.5], [0.8, 99.3], [1.5, 102]]);
  await sol.go(-3.5, 103.4, { r: 0.3 });
  await sol.waitAct(act('hold door').id, 6000);

  // 4. The hold: Sol over the crumbling crates, Luna over the blinking and sliding ones.
  const solRun = async (b) => {
    await b.path([[-0.5, 105.5], [-0.5, 107], [-4.5, 107.4]], { r: 0.35 });
    const hops = [[-4.5, 0, 110.3], [-6.5, 0.8, 113.6], [-3.5, 1.6, 117], [-4.5, 1.6, 120.8], [-6.5, 2.4, 124.2], [-3.5, 2.4, 127.6], [-4.5, 2.4, 131]];
    for (const to of hops) await b.jump({ to, double: true });
    await b.go(-4.5, 131, { r: 0.4 });
  };
  const per = 3.2;
  const lunaRun = async (b) => {
    await b.path([[0.5, 105.5], [0.5, 107], [4.5, 107.5]], { r: 0.35 });
    await b.until((g, bot, p) => {
      const c = ((g.world.time / p) % 1 + 1) % 1;
      return c > 0.03 && c < 0.12;
    }, per, 8000);
    await b.jump({ to: [4.5, 0.4, 110.5] });
    await b.until((g, bot, p) => {
      const c = ((g.world.time / p) % 1 + 1) % 1;
      return c > 0.36 && c < 0.44;
    }, per, 8000);
    await b.jump({ to: [4.5, 0.8, 114.5] });
    await b.jump({ to: [4.5, 0.8, 118.6] });
    await b.go(4.5, 118.8, { r: 0.3, stop: true });
    // The sliding crate: wait for it at this end, ride it, hop off at the far end.
    const crate = L.movers[0];
    await b.until((g, bot, id) => {
      const m = g.world.movers.find((x) => x.def.id === id);
      return m.tf.z < 121.9;
    }, crate.id, 8000);
    await b.jump({ to: [4.5, 0.8, 121.8] });
    await b.until((g, bot, id) => {
      const m = g.world.movers.find((x) => x.def.id === id);
      return m.tf.z > 126.1;
    }, crate.id, 8000);
    await b.jump({ to: [4.5, 0.8, 130.2] });
    await b.go(4.5, 130.6, { r: 0.4 });
  };
  await both(solRun, lunaRun);
  await sol.waitHold(item('Red gem').id);
  await luna.waitHold(item('Blue gem').id);
  await shot('gems');
  await both((b) => b.go(-1.2, 134.6, { r: 0.3 }), async (b) => {
    await b.go(4.5, 132.4, { r: 0.4 });
    await b.jump({ to: [1.2, 2.4, 134.6], double: true });
    await b.go(1.2, 134.6, { r: 0.3 });
  });
  await sol.waitAct(act('vault door').id, 6000);

  // 6. The parrot: Luna listens in the alcove, Sol hits the chests in that order.
  await both((b) => b.path([[-0.8, 139], [-3, 147]]), (b) => b.path([[0.8, 139], [3.5, 142.5], [7, 142.5]]));
  await shot('parrot', luna.page);
  const song = L.seqs[0];
  for (const id of song.ids) {
    const w = L.switches.find((s) => s.id === id);
    await sol.go(w.x, w.z, { r: 0.3, stop: true });
    await sol.pound();
    await sol.go(w.x, w.z - 1.5, { r: 0.5 });
  }
  await sol.waitSig(song.id, 4000);
  await both((b) => b.go(M.plateL[0], M.plateL[2], { r: 0.3, stop: true }), async (b) => {
    await b.path([[3.5, 142.5], [M.plateR[0], M.plateR[2]]]);
    await b.go(M.plateR[0], M.plateR[2], { r: 0.3, stop: true });
  });
  await sol.waitAct(act('Treasure!').id, 6000);
  await luna.go(1.5, 159);
  await sol.go(-1.5, 159);
}
