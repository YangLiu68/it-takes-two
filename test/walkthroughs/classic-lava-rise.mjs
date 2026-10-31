// Level 19 Rising Lava: race to the valve, hold the lava for your partner, take turns
// in two shafts, seesaw each other up two cliffs, a last sprint and two plates.
import { sleep } from './lib.mjs';

// Climb a list of [x, top, z] blocks with double jumps.
async function climb(bot, pts, onStep) {
  for (let i = 0; i < pts.length; i++) {
    const [x, y, z] = pts[i];
    await bot.jump({ to: [x, y, z], double: true });
    await bot.go(x, z, { r: 0.5, timeout: 4000 });
    if (onStep) onStep(i);
  }
}

// Wait until a mover's centre is within r of [x, z] (optionally y above/below).
const waitMover = (bot, id, test) => bot.until((g, b, a) => {
  const m = g.world.movers.find((q) => q.def.id === a.id);
  if (!m) return false;
  const p = m.tf;
  return new Function('p', `return ${a.test}`)(p);
}, { id, test }, 20000);

export default async function ({ sol, luna, L, shot }) {
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const sw = (pred) => L.switches.find(pred);

  // 1. Race the lava up the spiral; the first up pounds the valve.
  const s1 = [[3.5, 1.4, 12.5], [3.5, 2.8, 17], [3.5, 4.2, 21.5], [-0.5, 5.6, 21.5], [-4, 7.0, 21.5], [-4, 8.4, 17], [-4, 9.8, 12.5], [0.5, 11.0, 15.5], [0, 11.6, 20], [0, 12, 25.5]];
  let solAt = -1;
  await both((b) => b.path([[-1, 8], [1.2, 11.2]], { r: 0.4 }), (b) => b.path([[1, 6]], { r: 0.4 }));
  const solClimb = climb(sol, s1, (i) => (solAt = i));
  const lunaClimb = (async () => {
    await luna.go(0.5, 11, { r: 0.4 });
    for (let i = 0; i < s1.length; i++) {
      while (solAt < Math.min(i + 1, s1.length - 1)) await sleep(100);
      const [x, y, z] = s1[i];
      await luna.jump({ to: [x, y, z], double: true });
      await luna.go(x, z, { r: 0.5, timeout: 4000 });
    }
  })();
  await solClimb;
  const valve1 = sw((w) => w.latch && Math.abs(w.y - 12) < 0.1);
  await sol.go(valve1.x, valve1.z, { r: 0.3, stop: true });
  await sol.pound();
  await lunaClimb;
  await shot('valve');

  // 2. Luna holds the cooling plate on the balcony; Sol climbs the movers.
  const hold = L.plates.find((p) => Math.abs(p.x - 6.5) < 0.1 && Math.abs(p.y - 13.6) < 0.1);
  await luna.go(2.2, 30.2, { r: 0.4 });
  await luna.jump({ to: [hold.x, hold.y, hold.z], double: true });
  await luna.go(hold.x, hold.z, { r: 0.3, stop: true });
  await luna.waitSig(hold.id, 4000);
  await sol.go(-2, 30.2, { r: 0.4 });
  await sol.jump({ to: [-3, 13.2, 33.6], double: true });
  await sol.go(-3, 33.4, { r: 0.4 });
  const [m1, m2] = L.movers.filter((m) => m.motion.type === 'linear' && m.sx === 3);
  await waitMover(sol, m1.id, 'p.x < -4.75');
  await sol.jump({ to: [-4.6, 14.4, 38.2], double: true });
  await waitMover(sol, m1.id, 'p.x > 0.6');
  await sol.jump({ to: [4.5, 15.6, 41.6], double: true });
  await sol.go(4.3, 42, { r: 0.4 });
  await waitMover(sol, m2.id, 'p.y < 15.45');
  await sol.jump({ to: [0, 15.6, 45], double: true });
  await sol.go(0, 45, { r: 0.4, timeout: 3000 });
  await waitMover(sol, m2.id, 'p.y > 20.1');
  await sol.jump({ to: [-5, 22.4, 46], double: true });
  await sol.go(-5, 46, { r: 0.5, timeout: 3000 });
  await sol.jump({ to: [-2, 24, 51], double: true });
  const top2 = sw((w) => w.latch && Math.abs(w.y - 24) < 0.1);
  await sol.go(top2.x, top2.z, { r: 0.3, stop: true });
  await sol.pound();
  await shot('hold');
  const steps2 = L.acts.find((a) => a.style === 'steps' && a.parts[0].move[0] < 0);
  await luna.waitAct(steps2.id, 5000);
  await sleep(1500);
  for (const p of steps2.parts) await luna.jump({ to: [p.x + p.move[0], p.y + p.sy / 2, p.z], double: true });
  await luna.jump({ to: [5, 24, 51], double: true });

  // 3. Two shafts, take turns on the plates.
  const solPts = L.marks.solPts, lunaPts = L.marks.lunaPts;
  const plateAt = (pt) => L.plates.find((p) => Math.abs(p.x - pt[0]) < 0.1 && Math.abs(p.y - pt[1]) < 0.1 && Math.abs(p.z - pt[2]) < 0.1);
  await both((b) => b.path([[-4, 57.5], [-4, 61]], { r: 0.4 }), (b) => b.path([[4, 57.5], [4, 61]], { r: 0.4 }));
  const sP1 = plateAt(solPts[1]), sP2 = plateAt(solPts[5]), lP1 = plateAt(lunaPts[3]), lP2 = plateAt(lunaPts[7]);
  const sP3 = L.plates.find((p) => Math.abs(p.y - 39) < 0.1 && p.x < 0);
  const stand = async (bot, pt) => bot.go(pt[0], pt[2], { r: 0.3, stop: true });
  await both(async (b) => {
    await climb(b, solPts.slice(0, 2));
    await stand(b, solPts[1]);
  }, async (b) => {
    await climb(b, lunaPts.slice(0, 4));
    await stand(b, lunaPts[3]);
  });
  await sol.waitSig(lP1.id, 4000);
  await climb(sol, solPts.slice(2, 6));
  await stand(sol, solPts[5]);
  await luna.waitSig(sP2.id, 4000);
  await climb(luna, lunaPts.slice(4, 8));
  await stand(luna, lunaPts[7]);
  await sol.waitSig(lP2.id, 4000);
  await climb(sol, solPts.slice(6, 8));
  await sol.jump({ to: [-3, 39, 71.5], double: true });
  await sol.go(sP3.x, sP3.z, { r: 0.3, stop: true });
  await luna.waitSig(sP3.id, 4000);
  await luna.jump({ to: [3, 39, 71.5], double: true });
  await shot('shafts');
  await both((b) => b.go(-3, 76.5, { r: 0.5 }), (b) => b.go(3, 76.5, { r: 0.5 }));

  // 4. Seesaw cliffs: one flies up and lets the steps out for the other.
  const [cA, cB] = L.marks.cliffs;
  const seesawUp = async (flier, pounder, c) => {
    const [, base, sz, face, top] = c;
    const swc = sw((w) => w.latch && Math.abs(w.y - top) < 0.1);
    await Promise.all([flier.go(-3.4, sz, { r: 0.3, stop: true }), pounder.go(3.4, sz, { r: 0.3, stop: true })]);
    await sleep(300);
    await pounder.pound();
    await flier.go(swc.x, swc.z, { r: 0.4, timeout: 8000 });
    await flier.until((g, b, y) => g.player.pos.y > y - 0.5 && g.player.grounded, top, 6000);
    await flier.go(swc.x, swc.z, { r: 0.3, stop: true });
    await flier.pound();
    const steps = L.acts.find((a) => a.style === 'steps' && Math.abs(a.parts[0].z - (face + 1.6)) < 0.1);
    await pounder.waitAct(steps.id, 5000);
    await sleep(1200);
    const first = steps.parts[0];
    await pounder.go(first.x, face - 1 - 1.7, { r: 0.4 });
    for (const p of steps.parts) await pounder.jump({ to: [p.x + p.move[0], p.y + p.sy / 2, p.z + p.move[2]], double: true });
    await pounder.jump({ to: [3.7, top, face + 2], double: true });
    void base;
  };
  await seesawUp(luna, sol, cA);
  await shot('cliff1');
  // Luna came up on the left and Sol on the right: keep it that way (no crossing).
  await both((b) => b.go(2, cB[2] - 2.5, { r: 0.5 }), (b) => b.go(-2, cB[2] - 2.5, { r: 0.5 }));
  await seesawUp(luna, sol, cB);

  // 5. Sprint up before the lava, then both plates.
  await both((b) => b.go(1.5, 112, { r: 0.6 }), (b) => b.go(-1.5, 112, { r: 0.6 }));
  const run = L.marks.run;
  let at = -1;
  await both(async (b) => {
    await b.go(2, 115.3, { r: 0.4 });
    await climb(b, run, (i) => (at = i));
    await b.jump({ to: [-4, run[6][1] + 1.4, 151], double: true });
  }, async (b) => {
    await b.go(-1, 115.3, { r: 0.4 });
    for (let i = 0; i < run.length; i++) {
      while (at < i) await sleep(80);
      await b.jump({ to: run[i], double: true });
      await b.go(run[i][0], run[i][2], { r: 0.5, timeout: 4000 });
    }
    await b.jump({ to: [-2, run[6][1] + 1.4, 151], double: true });
  });
  const [pA, pB] = L.plates.filter((p) => p.z > 150);
  await both((b) => b.go(pA.x, pA.z, { r: 0.3, stop: true }), (b) => b.go(pB.x, pB.z, { r: 0.3, stop: true }));
  const bridge = L.acts.find((a) => a.style === 'bridge');
  await sol.waitAct(bridge.id, 5000);
  await sleep(1800);
  await shot('summit');
  await luna.path([[0.7, 156], [0.7, 163], [1.5, 167]], { r: 0.4 });
  await sol.path([[-0.7, 156], [-0.7, 163], [-1.5, 167]], { r: 0.4 });
}
