// Ice Castle: gate (crumble/blink + two plates), mirror hall (model → dials),
// bell tower (song → bells), snowman (three snowballs), ice-slide maze,
// sculpture gallery (count → dials), throne (jewels, two-plate lift, crown).
export default async function ({ sol, luna, L, shot }) {
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const item = (label) => L.items.find((i) => i.label === label);
  const sw = (id) => L.switches.find((w) => w.id === id);
  const act = (toast) => L.acts.find((a) => a.toast === toast);
  const dial = (id) => L.dials.find((d) => d.id === id);
  const hopTo = (b, x, top, z, o = {}) => b.jump({ to: [x, top, z], double: true, ...o });
  // Several moves back to back inside the page: no round trip between them, so a
  // slow machine can't make a jump late (crumbling and blinking ice won't wait).
  const chain = (b, tasks) => b.page.evaluate(async (ts) => {
    for (const t of ts) await window.__bot.run(t);
  }, tasks).catch((e) => {
    throw new Error(`${b.name}: ${e.message.split('\n')[0]}`);
  });
  const PHASE = '(g, bot, a) => { const c = (((g.world.time / a[0]) % 1) + 1) % 1; return c >= a[1] && c < a[2]; }';
  const atPhase = (period, lo, hi) => ({ type: 'until', timeout: 8000, fn: PHASE, arg: [period, lo, hi] });
  const leap = (x, top, z, double = false) => ({ type: 'jump', to: [x, top, z], double });
  // Hop onto a button and pound it.
  const hit = async (b, w) => {
    await b.go(w.x, w.z - 1.4, { r: 0.35, stop: true });
    await b.jump({ to: [w.x, w.y + 0.64, w.z] });
    await b.pound();
  };

  // == 1 · the frozen gate ==================================================================
  const B1 = 2.8;
  await both(
    async (b) => {
      await b.path([[-6, 4], [-10, 7.3]], { r: 0.35 });
      await chain(b, [leap(-10, 0, 10.3), leap(-8.4, 0.7, 13.6), leap(-10, 0.3, 16.9), leap(-9, 0, 20.4, true)]);
      await b.go(-9, 21.5, { r: 0.3, stop: true });
    },
    async (b) => {
      await b.path([[6, 4], [10, 7.3]], { r: 0.35 });
      await b.go(10, 7.3, { r: 0.25, stop: true });
      await chain(b, [
        atPhase(B1, 0.0, 0.08), leap(10, 0, 10.3),
        atPhase(B1, 0.36, 0.46), leap(8.4, 0, 13.6),
        atPhase(B1, 0.86, 0.96), leap(10, 0, 16.9),
        leap(9, 0, 20.4, true),
      ]);
      await b.go(9, 21.5, { r: 0.3, stop: true });
    },
  );
  const gate = L.acts.find((a) => a.style === 'gate');
  await sol.waitAct(gate.id, 6000);
  await shot('gate');
  await both((b) => b.path([[-5, 24], [-1, 24.5], [-1, 29.5]]), (b) => b.path([[5, 24], [1, 24.5], [1, 29.5]]));

  // == 2 · the mirror hall ====================================================================
  const mirror = L.combos[0];
  await both(
    async (b) => {
      await b.path([[-7, 30], [-19, 31], [-19, 33]], { r: 0.3 });
      await b.go(-19, 33, { r: 0.22, stop: true });
      await b.magnet(1100, { to: [-19, 0, 40] }); // launch, and steer onto the dais straight away
      await b.go(-19, 40, { r: 0.6, timeout: 6000 });
      await b.until((g) => g.player.grounded && g.player.pos.y > 5.5, null, 4000);
    },
    async (b) => {
      await b.path([[7, 30], [10, 33]], { r: 0.5 });
      for (let i = 0; i < mirror.dials.length; i++) await b.setDial(dial(mirror.dials[i]), mirror.targets[i]);
    },
  );
  await luna.waitSig(mirror.id, 5000);
  await shot('mirrors', luna.page);
  await both(
    (b) => b.path([[-15.5, 43], [-13, 43], [-9, 44], [-9, 48], [-9, 55.5], [-8, 57.6]], { r: 0.5 }),
    (b) => b.path([[11, 49], [11, 51.5], [11, 55.5], [10, 62]], { r: 0.5 }),
  );

  // == 3 · the bell tower =====================================================================
  const song = L.seqs[0];
  await both(
    async (b) => {
      await b.path([[13, 57.6], [13, 62], [13, 66], [13, 71]], { r: 0.5 });
      for (const id of song.ids) await hit(b, sw(id));
    },
    (b) => b.path([[-10, 62], [-10, 66], [-10, 71]], { r: 0.5 }),
  );
  await sol.waitSig(song.id, 5000);
  await shot('bells', sol.page);
  await both((b) => b.path([[13, 80], [13, 86.5], [8, 90]], { r: 0.5 }), (b) => b.path([[-10, 80], [-10, 86.5], [-12.5, 89.5]], { r: 0.5 }));

  // == 4 · the snowman ========================================================================
  const red = item('Red Snowball'), blue = item('Blue Snowball'), white = item('White Snowball');
  const snowman = L.locks.find((l) => l.label === 'Snowman');
  const bridge = L.acts.find((a) => a.style === 'bridge' && a.parts.length === 5);
  // Luna holds the plate; Sol crosses the ice bridge for his snowball.
  await luna.go(-12.5, 89.5, { r: 0.25, stop: true });
  await sol.path([[-8, 94], [-14.3, 98]], { r: 0.4 });
  await sol.waitAct(bridge.id, 4000);
  await sol.wait(400);
  await sol.path([[-18, 98], [-30, 98], [red.x, red.z]], { r: 0.4 });
  await sol.waitHold(red.id);
  await sol.path([[-30, 98], [-18, 98], [-13, 98], [-3, 94], [snowman.x - 0.8, snowman.z - 1.0]], { r: 0.35 });
  await sol.waitUsed(red.id);
  // The seesaw throws Luna up to her snowball.
  const e = L.seesaws[0];
  await both((b) => b.path([[4, 99], [e.x + 3.4, e.z]], { r: 0.4 }), (b) => b.path([[-4, 95], [-4, 99], [e.x - 3.4, e.z]], { r: 0.4 }));
  await luna.go(e.x - 3.4, e.z, { r: 0.3, stop: true });
  await sol.go(e.x + 3.4, e.z, { r: 0.3, stop: true });
  await luna.until((g) => g.player.grounded && g.player.pos.y > 0.9, null, 3000);
  await sol.pound();
  await luna.go(blue.x, blue.z, { r: 0.5, timeout: 6000 });
  await luna.until((g) => g.player.grounded && g.player.pos.y > 10.5, null, 4000);
  await luna.waitHold(blue.id);
  await luna.go(blue.x, 106.5, { r: 0.6 });
  await luna.until((g) => g.player.grounded && g.player.pos.y < 0.5, null, 4000);
  await luna.path([[5, 105], [5, 99.5], [snowman.x + 0.8, snowman.z - 1.0]], { r: 0.35 });
  await luna.waitUsed(blue.id);
  await luna.go(-4, 87.5, { r: 0.6 }); // out of the way
  // Sol runs the crumbling ice for the white one.
  await sol.path([[5, 99.5], [12, 94], [15.4, 91]], { r: 0.4 });
  await sol.go(15.4, 91, { r: 0.25, stop: true });
  const tiles = [[18.3, 0, 91], [21.6, 0.6, 93], [24.9, 1.2, 91], [28.2, 0.6, 93]];
  await chain(sol, [...tiles.map(([x, top, z]) => leap(x, top, z)), leap(32, 0, 92, true)]);
  await sol.go(white.x, white.z, { r: 0.4 });
  await sol.waitHold(white.id);
  await sol.go(31.2, 92.6, { r: 0.3, stop: true });
  await sol.until((g) => [...g.world.crumbles.values()].every((c) => c.phase === 'idle'), null, 12000);
  await chain(sol, [...tiles.slice().reverse().map(([x, top, z]) => leap(x, top, z)), leap(14.5, 0, 92, true)]);
  await sol.go(snowman.x + 0.8, snowman.z - 1.0, { r: 0.35 });
  await sol.waitUsed(white.id);
  const exit4 = act('The snowman winks, and the north ice door opens!');
  await sol.waitAct(exit4.id, 5000);
  await shot('snowman');

  // == 5 · the ice-slide maze ===================================================================
  await sol.path([[11.5, 99], [11.5, 106], [8, 113], [4, 116.5]], { r: 0.5 });
  await luna.path([[12.5, 99], [12.5, 106], [10, 113.2], [2, 113.6], [-3, 116], [-8, 112.5]], { r: 0.5 });
  const cx = (c) => -4 + 4 * c, cz = (r) => 122 + 4 * r;
  // Ride with the slides: aim for each junction, through the slide that leads there.
  const ride = [[cx(2), cz(0), 0.7], [cx(3), cz(0), 1.4], [cx(5), cz(1), 0.9], [cx(4), cz(1), 1.4], [cx(3), cz(2), 0.9], [cx(3), cz(3) - 1.2, 1.2], [cx(1), cz(3), 1.6], [cx(1), cz(4), 0.9]];
  await sol.go(4, 118.5, { r: 0.4 });
  for (const [x, z, r] of ride) await sol.go(x, z, { r });
  await sol.go(0, 138, { r: 0.6 });
  await shot('maze-out', sol.page);
  const out = L.switches.find((w) => w.latch && w.z > 145 && w.z < 150);
  await sol.path([[0, 141], [0, 144]], { r: 0.5 });
  await hit(sol, out);
  const corridor = act('The map room\'s back door opens!');
  await luna.waitAct(corridor.id, 5000);
  await luna.path([[-8.5, 118], [-8.5, 122], [-8.5, 144.5], [-6, 144.5], [-3, 147]], { r: 0.5 });

  // == 6 · the sculpture gallery =================================================================
  const code = L.combos[1];
  await both(
    (b) => b.path([[3.5, 150], [3.5, 154], [9, 160]], { r: 0.5 }),
    async (b) => {
      await b.path([[-3.5, 150], [-3.5, 154], [-10, 157], [-15, 159.3]], { r: 0.4 });
      await b.go(-15, 159.3, { r: 0.25, stop: true });
      await hopTo(b, -15, 0, 163.6);
      await b.setDial(dial(code.dials[0]), code.targets[0]);
      await hopTo(b, -10.6, 0, 165.5);
      await b.setDial(dial(code.dials[1]), code.targets[1]);
      await hopTo(b, -5.4, 0, 164);
      await b.setDial(dial(code.dials[2]), code.targets[2]);
      await hopTo(b, -9.4, 0, 165.5);
      await hopTo(b, -10, 0, 168.9);
    },
  );
  await luna.waitSig(code.id, 5000);
  await shot('gallery-code', luna.page);
  await both((b) => b.path([[9, 178], [5, 182], [5, 185], [5, 190]], { r: 0.5 }), (b) => b.path([[-10, 172], [-10, 185], [-10, 190]], { r: 0.5 }));

  // == 7 · the throne ===========================================================================
  // Sol: the red jewel past the blinking ice (period 2.6).
  const B7 = 2.6;
  const redJ = item('Red Jewel'), blueJ = item('Blue Jewel');
  await sol.path([[-8, 194], [-11.3, 196.8]], { r: 0.35 });
  await sol.go(-11.3, 196.8, { r: 0.22, stop: true });
  await chain(sol, [
    atPhase(B7, 0.0, 0.08), leap(-14.2, 0, 196.8),
    atPhase(B7, 0.36, 0.46), leap(-16.4, 0, 199.8),
    atPhase(B7, 0.86, 0.96), leap(-14.4, 0, 202.8),
    atPhase(B7, 0.36, 0.46), leap(-16.6, 0, 205.8),
    leap(-16.6, 0, 209.2, true),
  ]);
  await sol.go(redJ.x, redJ.z, { r: 0.4 });
  await sol.waitHold(redJ.id);
  await sol.go(-16.6, 208.7, { r: 0.25, stop: true });
  await chain(sol, [
    atPhase(B7, 0.5, 0.58), leap(-16.6, 0, 205.8),
    atPhase(B7, 0.86, 0.96), leap(-14.4, 0, 202.8),
    atPhase(B7, 0.36, 0.46), leap(-16.4, 0, 199.8),
    atPhase(B7, 0.86, 0.96), leap(-14.2, 0, 196.8),
    leap(-10.8, 0, 196.8, true),
  ]);
  await shot('red-jewel', sol.page);
  // Sol holds the fan plate; Luna rides up to the balcony for the blue jewel.
  await both((b) => b.path([[-4, 196], [2, 196]], { r: 0.3 }), (b) => b.path([[-6, 192], [6, 199], [8.5, 202]], { r: 0.4 }));
  await sol.go(2, 196, { r: 0.25, stop: true });
  await luna.go(8.5, 202, { r: 0.3 });
  await luna.until((g) => g.player.pos.y > 10.6, null, 6000);
  await luna.jump({ to: [14.5, 9, 202] });
  await luna.until((g) => g.player.grounded && g.player.pos.y > 8.5, null, 4000);
  await luna.go(blueJ.x, blueJ.z, { r: 0.4 });
  await luna.waitHold(blueJ.id);
  await shot('blue-jewel', luna.page);
  await sol.go(-2, 200, { r: 0.5 });
  await luna.go(9.6, 205.5, { r: 0.4 });
  await luna.until((g) => g.player.grounded && g.player.pos.y < 0.5, null, 4000);
  // The lift: both plates at once.
  const lift = L.acts.find((a) => a.style === 'lift');
  await both((b) => b.path([[-1.4, 210], [-1.4, 215]], { r: 0.3 }), (b) => b.path([[6, 209], [1.4, 210], [1.4, 215]], { r: 0.3 }));
  await both((b) => b.go(-1.4, 215, { r: 0.25, stop: true }), (b) => b.go(1.4, 215, { r: 0.25, stop: true }));
  await sol.waitAct(lift.id, 5000);
  await both((b) => b.until((g) => g.player.pos.y > 11.5, null, 12000), (b) => b.until((g) => g.player.pos.y > 11.5, null, 12000));
  await shot('lift-top');
  await both((b) => b.go(-1, 219.6, { r: 0.4 }), (b) => b.go(1, 219.6, { r: 0.4 }));
  await sol.waitUsed(redJ.id);
  await luna.waitUsed(blueJ.id);
  const crownDoor = act('The crown lights up — the throne door opens!');
  await sol.waitAct(crownDoor.id, 5000);
  await luna.path([[0.6, 222], [1, 226]], { r: 0.5 });
  await sol.path([[-0.6, 222], [-1, 226]], { r: 0.5 });
}
