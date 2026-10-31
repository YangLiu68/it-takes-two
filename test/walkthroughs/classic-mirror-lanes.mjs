// Level 24 Mirror Lanes: leapfrog bridges, spot the difference, the seesaw under the
// wall + lift, the X-bridge lane swap, and the gate relay.
import { sleep } from './lib.mjs';

export default async function ({ sol, luna, L, shot }) {
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const S = -4.5, X = 4.5;
  const m = L.marks;
  const stand = (bot, x, z) => bot.go(x, z, { r: 0.3, stop: true });
  const ready = async (bot, act, ms = 1300) => {
    await bot.waitAct(act, 8000);
    await sleep(ms);
  };

  // 1. Leapfrog.
  await both((b) => b.path([[S, 8], [S, 12]], { r: 0.5 }), (b) => b.path([[X, 8], [X, 14]], { r: 0.5 }));
  await stand(sol, S, 13);
  await ready(luna, m.s1.lb1);
  await luna.path([[X, 22], [X, 27]], { r: 0.5 });
  await stand(luna, X, 29);
  await ready(sol, m.s1.sb1);
  await sol.path([[S, 22], [S, 27]], { r: 0.5 });
  await stand(sol, S, 29);
  await ready(luna, m.s1.lb2);
  await luna.path([[X, 38], [X, 43]], { r: 0.5 });
  await stand(luna, X, 45);
  await ready(sol, m.s1.sb2);
  await sol.path([[S, 38], [S, 44]], { r: 0.5 });
  await shot('leapfrog');

  // 2. Spot the difference: both dials to the odd one.
  const [dS, dL] = L.dials.slice().sort((a, b) => a.x - b.x);
  await both((b) => b.setDial(dS, m.odd), (b) => b.setDial(dL, m.odd));
  const same = L.combos[0];
  await sol.waitSig(same.id, 4000);
  const doors2 = L.acts.filter((a) => a.style === 'door' && a.when.in.includes(same.id));
  await sol.waitAct(doors2[0].id, 4000);
  await sleep(800);
  await both((b) => b.path([[S, 74], [S, 77]], { r: 0.5 }), (b) => b.path([[X, 74], [X, 77]], { r: 0.5 }));
  await shot('difference');

  // 3. Seesaw under the wall; Sol up the cliff, then he lifts Luna.
  await stand(sol, -3.4, 82);
  await stand(luna, 3.4, 82);
  await sleep(300);
  await luna.pound();
  await sol.go(S, 89.5, { r: 0.5, timeout: 8000 });
  await sol.until((g, b, y) => g.player.grounded && g.player.pos.y > y - 0.5, m.s3.H, 6000);
  await luna.path([[X, 85.5], [X, 88]], { r: 0.4 });
  await stand(luna, X, 88);
  const spl = L.plates.find((p) => p.id === m.s3.spl);
  await stand(sol, spl.x, spl.z);
  await luna.until((g, b, y) => g.player.pos.y > y - 0.3, m.s3.H, 8000);
  await sleep(400);
  await luna.go(X, 92, { r: 0.4 });
  await shot('seesaw');

  // 4. Both plates, then cross the X.
  const sx = L.plates.find((p) => p.id === m.s4.sx), lx = L.plates.find((p) => p.id === m.s4.lx);
  await both((b) => stand(b, sx.x, sx.z), (b) => stand(b, lx.x, lx.z));
  const swap = L.acts.find((a) => a.style === 'bridge' && a.when.in.includes(sx.id));
  await ready(sol, swap.id);
  await sleep(600);
  await both(async (b) => {
    await b.path([[S, 94.6], [3.9, 106.2], [X, 109]], { r: 0.4 });
  }, async (b) => {
    await b.jump({ to: [3, 10.9, 94.2], double: true });
    await b.jump({ to: [4.1, 12.2, 95.6], double: true });
    await b.path([[-3.9, 106.2], [S, 109]], { r: 0.4 });
  });
  await shot('swap');

  // 5. Gate relay.
  const { sSw, lSw, lGates, sGates } = m.s5;
  const swAt = (x, z) => L.switches.find((w) => w.x === x && w.z === z);
  const gateAt = (x, z) => L.acts.find((a) => a.style === 'door' && a.parts[0].x === x && Math.abs(a.parts[0].z - z) < 0.1);
  for (let i = 0; i < 3; i++) {
    await stand(sol, X, sSw[i]);
    await sol.pound();
    await ready(luna, gateAt(S, lGates[i]).id, 750);
    await luna.go(S, lSw[i], { r: 0.3, stop: true, timeout: 6000 });
    await luna.pound();
    await ready(sol, gateAt(X, sGates[i]).id, 750);
    await sol.go(X, sGates[i] + 1.6, { r: 0.4, timeout: 6000 });
  }
  await shot('relay');
  await sol.path([[X, 149], [1.5, 156]], { r: 0.5 });
  await luna.path([[S, 149.5], [-1.5, 156]], { r: 0.5 });
}
