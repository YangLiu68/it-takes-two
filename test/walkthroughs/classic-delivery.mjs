// Level 22 Special Delivery: first delivery, who-only parcels (cage plate, launch shelf), the
// two-lane relay, the express run through hammers, and four parcels for the big lock.
import { sleep } from './lib.mjs';

export default async function ({ sol, luna, L, shot }) {
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const Y = 1.6;
  const item = (label) => L.items.find((i) => i.label === label);
  const hop = (bot, x, y, z) => bot.jump({ to: [x, y, z], double: true });
  // A pendulum's phase on this player's screen: wait until it's swung clear.
  // ok(phi): phi = angle inside sin(), mod 2π.
  const waitPend = (bot, z, test) => bot.until((g, b, a) => {
    const p = g.world.pendulums.find((q) => Math.abs(q.def.z - a.z) < 0.1);
    const h = p.def;
    const t = g.world.clock(p, g.world.time, 0);
    const phi = (((2 * Math.PI * (t / h.period + h.phase)) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    return new Function('phi', `return ${a.test}`)(phi);
  }, { z, test }, 20000);
  const waitMover = (bot, id, test) => bot.until((g, b, a) => {
    const m = g.world.movers.find((q) => q.def.id === a.id);
    return m && new Function('p', `return ${a.test}`)(m.tf);
  }, { id, test }, 30000);

  // 1. First parcel across the blocks.
  const p1 = item('First parcel');
  await sol.go(3, 5.4, { r: 0.4 });
  await sol.waitHold(p1.id);
  const blocks = [[0, 0.8, 12.5], [3, 1.6, 17], [0, 2.4, 21.5], [-3, 1.6, 26], [-1, Y, 30.5]];
  for (const pt of blocks) await hop(sol, ...pt);
  await sol.go(-1, 33, { r: 0.4 });
  await sol.waitUsed(p1.id);
  await luna.go(1, 8, { r: 0.4 });
  for (const pt of blocks) await hop(luna, pt[0] + 0.6, pt[1], pt[2]);
  await shot('first');

  // 2. Cage (Luna holds the plate) and the shelf (Luna launches).
  await both((b) => b.path([[-1, 39], [-1, 44]], { r: 0.5 }), (b) => b.path([[1, 39], [7, 41.5]], { r: 0.4 }));
  await luna.go(7, 41.5, { r: 0.3, stop: true });
  const p2s = item('Red parcel');
  await sol.path([[-2, 52], [-6.6, 52]], { r: 0.4 });
  await sol.waitHold(p2s.id);
  await sol.path([[-2, 52], [-0.8, 53.6]], { r: 0.4 });
  await sol.waitUsed(p2s.id);
  const p2l = item('Blue parcel');
  await luna.go(7, 48.5, { r: 0.25, stop: true });
  await luna.magnet(500);
  await luna.go(7, 53.5, { r: 0.5, timeout: 6000 });
  await luna.waitHold(p2l.id);
  await luna.path([[4.5, 53.5], [3.5, 53.5], [1.2, 54.6]], { r: 0.5 });
  await luna.waitUsed(p2l.id);
  await shot('warehouse');

  // 3. Relay.
  const pa = item('Red parcel A'), pb = item('Blue parcel B'), pc = item('Red parcel C');
  await both((b) => b.path([[-1, 58.5], [-5, 60], [-5, 65.4]], { r: 0.4 }), (b) => b.path([[1, 58.5], [5, 60], [5, 70]], { r: 0.4 }));
  await sol.waitHold(pa.id);
  const shuttle = L.movers.find((m) => m.motion.type === 'linear' && Math.abs(m.motion.a[0] + 5) < 0.1);
  await sol.go(-5, 68.4, { r: 0.3 });
  await waitMover(sol, shuttle.id, 'p.z < 70.8');
  await sol.go(-5, 70.6, { r: 0.4, timeout: 3000 });
  await waitMover(sol, shuttle.id, 'p.z > 77.2');
  await sol.go(-5, 80.5, { r: 0.4, timeout: 3000 });
  await sol.go(-2.6, 81.2, { r: 0.4 });
  await sol.waitUsed(pa.id);
  await luna.go(3.6, 80.3, { r: 0.4 });
  await luna.waitHold(pb.id);
  await luna.go(5, 81.4, { r: 0.3, stop: true });
  // Sol stops the hammer when it's swung out of Luna's way (as seen on her screen).
  await sol.go(-5, 88, { r: 0.3, stop: true });
  await waitPend(luna, 88, 'Math.abs(Math.sin(phi)) > 0.8 && Math.abs(Math.sin(phi + 0.3)) > Math.abs(Math.sin(phi))');
  const ps = L.plates.find((p) => p.x === -5 && p.z === 90);
  await sol.go(ps.x, ps.z, { r: 0.3, stop: true });
  await luna.waitSig(ps.id, 3000);
  await sleep(300);
  for (const z of [84, 88, 92]) await hop(luna, 5, Y, z);
  await hop(luna, 5, Y, 97.5);
  await luna.go(2.8, 98.5, { r: 0.4 });
  await luna.waitUsed(pb.id);
  await sol.path([[-5, 94], [-3.6, 97.6]], { r: 0.4 });
  await sol.waitHold(pc.id);
  await sol.go(-5, 100.4, { r: 0.3, stop: true });
  const pl3 = L.plates.find((p) => p.x === 5 && p.z === 104);
  await luna.path([[5, 101.5], [pl3.x, pl3.z]], { r: 0.3 });
  await luna.go(pl3.x, pl3.z, { r: 0.3, stop: true });
  await sol.waitSig(pl3.id, 3000);
  await sol.path([[-5, 112.6], [-5, 115.2]], { r: 0.4 });
  await sol.waitUsed(pc.id);
  await luna.path([[5, 114.5], [1.5, 116]], { r: 0.5 });
  await shot('relay');

  // 4. Express: Luna starts the timer, Sol runs the hammers; then the other way round.
  const p4s = item('Red express'), p4l = item('Blue express');
  await both((b) => b.path([[-1, 118], [-1, 120.5], [-3.6, 121.4]], { r: 0.4 }), (b) => b.path([[1, 118], [1, 120.5], [3.6, 121.4]], { r: 0.4 }));
  await sol.waitHold(p4s.id);
  await luna.waitHold(p4l.id);
  const t4 = L.switches.find((w) => !w.dial && w.duration === 12 && w.z < 130);
  const t4b = L.switches.find((w) => !w.dial && w.duration === 12 && w.z > 130);
  const runHammers = async (bot) => {
    await bot.go(0, 124.4, { r: 0.3 });
    for (const z of L.marks.hammers) {
      await bot.go(0, z - 2.4, { r: 0.3, stop: true });
      // Go right after the head has swept past the middle.
      await waitPend(bot, z, '(phi % Math.PI) > 0.4 && (phi % Math.PI) < 0.75');
      await bot.go(0, z + 2.2, { r: 0.4, timeout: 3000 });
    }
    await bot.path([[0, 146.6], [0.6, 149.6]], { r: 0.4 });
  };
  // Knocked off by a hammer? The parcel goes home: pick it up and try again.
  const alive = (bot) => bot.page.evaluate(() => window.__bot.run({ type: 'until', fn: '(g) => !g.player.dead && g.player.grounded', allowDeath: true, timeout: 10000 }));
  const express = async (runner, timer, sw, parcel, home) => {
    for (let tries = 0; ; tries++) {
      try {
        if (!(await runner.until((g, b, i) => (g.extras.itemState[i] || [-1])[0] === g.slot, parcel.id, 200).then(() => true, () => false))) {
          await runner.path(home, { r: 0.4 });
          await runner.waitHold(parcel.id);
        }
        await timer.go(sw.x, sw.z, { r: 0.3, stop: true });
        await timer.pound();
        await runHammers(runner);
        await runner.waitUsed(parcel.id);
        return;
      } catch (e) {
        if (tries >= 3 || !/died/.test(e.message)) throw e;
        await alive(runner);
      }
    }
  };
  await express(sol, luna, t4, p4s, [[-1, 120.5], [-3.6, 121.4]]);
  await express(luna, sol, t4b, p4l, [[1, 120.5], [3.6, 121.4]]);
  await shot('express');

  // 5. Four parcels.
  const P = L.marks.p5;
  await both((b) => b.path([[-1, 152], [-1, 155]], { r: 0.5 }), (b) => b.path([[1, 152], [1, 155]], { r: 0.5 }));
  // a) Seesaw: Sol flies up the pillar.
  const p5a = item('Pillar parcel'), p5b = item('Carousel parcel'), p5c = item('Vault parcel'), p5d = item('Shelf parcel');
  await sol.go(P.seesaw[0] - 3.4, P.seesaw[2], { r: 0.3, stop: true });
  await luna.go(P.seesaw[0] + 3.4, P.seesaw[2], { r: 0.3, stop: true });
  await sleep(300);
  await luna.pound();
  await sol.go(P.pillar[0], P.pillar[2], { r: 0.5, timeout: 8000 });
  await sol.waitHold(p5a.id, 8000);
  await sol.path([[-8, 160.4], [-8, 159], [-0.8, 169.4]], { r: 0.3 });
  await sol.waitUsed(p5a.id);
  // b) Luna rides the carousel to the pedestal.
  const orbit = L.movers.find((m) => m.motion.type === 'orbit');
  await luna.go(14.4, 159, { r: 0.3, stop: true });
  await waitMover(luna, orbit.id, 'p.z > 159.9 && p.z < 160.7 && p.x > 11');
  await hop(luna, 12, Y + 2.4, 159);
  await hop(luna, P.pedestal[0], P.pedestal[1], P.pedestal[2]);
  await luna.waitHold(p5b.id, 5000);
  await luna.path([[8, 161.6], [3.3, 162], [3.3, 167.5], [0.8, 169.4]], { r: 0.3 });
  await luna.waitUsed(p5b.id);
  // c) Vault: both plates at once.
  const [va, vb] = [L.plates.find((p) => p.x === -12 && p.z === 171), L.plates.find((p) => p.x === 12 && p.z === 155)];
  await both((b) => b.go(va.x, va.z, { r: 0.3, stop: true }), (b) => b.path([[3.3, 167], [3.3, 162], [12, 157.4], [vb.x, vb.z]], { r: 0.4 }));
  await luna.go(vb.x, vb.z, { r: 0.3, stop: true });
  const vdoor = L.acts.find((a) => a.style === 'door' && a.when.in.includes(va.id));
  await sol.waitAct(vdoor.id, 5000);
  await sleep(800);
  await sol.path([[2, 168], [4, 168], [7.6, 168]], { r: 0.4 });
  await sol.waitHold(p5c.id);
  await sol.path([[4, 168], [0.8, 169.5]], { r: 0.3 });
  await sol.waitUsed(p5c.id);
  // d) Luna stands on Sol's head to reach the shelf.
  await sol.path([[3.1, 167.5], [3.1, 161.4]], { r: 0.4 });
  await sol.go(0, 161.6, { r: 0.25, stop: true });
  for (let tries = 0; ; tries++) {
    await luna.go(0, 159.6, { r: 0.3, stop: true });
    await luna.jump({ to: [0, 3.1, 161.6] });
    const [, y1] = await luna.pos();
    if (y1 > Y + 1.2) {
      await luna.jump({ to: [P.shelf[0], P.shelf[1], P.shelf[2]], double: true });
      const [, y2] = await luna.pos();
      if (y2 > P.shelf[1] - 0.3) break;
    }
    if (tries > 4) throw new Error('could not get onto the shelf');
  }
  // Landed on the front edge: walk over to the parcel.
  await luna.go(P.shelf[0], P.shelf[2], { r: 0.5 });
  await luna.waitHold(p5d.id, 5000);
  await luna.path([[1.2, 165], [1.2, 167.4], [0.8, 169.4]], { r: 0.3 });
  await luna.waitUsed(p5d.id);
  const gate = L.acts.find((a) => a.style === 'door' && a.when.in.length === 1 && a.z > 172);
  await sol.waitAct(gate.id, 5000);
  await sleep(1000);
  await shot('bigLock');
  await both((b) => b.path([[-3.1, 162.5], [-3.1, 168], [-1, 172], [-1.5, 179.5]], { r: 0.5 }), (b) => b.path([[1, 172], [1.5, 179.5]], { r: 0.5 }));
}
