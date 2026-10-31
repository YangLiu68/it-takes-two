// Level 9 · Hammer Hall: time the hammers; freeze them with the 3-second switch; hold both
// disc plates while hopping the bars; ride the swings; get knocked across by
// the giant hammer; pound the colour code under the hammers.

// In-page predicates (run every frame by the bot).
// Hammer a.k has just swung past point a.at: it's a.gap metres away and still going.
const CLEAR = (g, b, a) => {
  const w = g.world.pendulums[a.k];
  const d = w.def;
  const tt = d.stop || d.run ? w.lt || 0 : g.world.time;
  const head = (t) => {
    const th = d.amp * Math.sin(2 * Math.PI * (t / d.period + d.phase));
    const lx = d.len * Math.sin(th);
    return [d.x + lx * Math.cos(d.yaw), d.z - lx * Math.sin(d.yaw)];
  };
  const [x0, z0] = head(tt), [x1, z1] = head(tt + 0.05);
  const r0 = Math.hypot(x0 - a.at[0], z0 - a.at[1]), r1 = Math.hypot(x1 - a.at[0], z1 - a.at[1]);
  // Just past (not already at the far end of the swing, about to come back).
  return r0 > a.gap && r0 < a.gap + (a.span ?? 1.6) && r1 > r0;
};
// The quick hammers have only just frozen, all swung out to the sides.
const FRESH_FREEZE = (g, b, ks) => {
  const frozen = ks.every((k) => g.world.sigAny(g.world.pendulums[k].def.stop));
  if (!frozen) {
    b.fzStart = 0;
    return false;
  }
  if (!b.fzStart) b.fzStart = performance.now();
  return performance.now() - b.fzStart < 700 && ks.every((k) => Math.abs(g.world.pendulums[k].swing.rotation.z) > 0.5);
};
// Good moment to pound: the quick hammers are crossing the middle, heading out.
const POUND_NOW = (g, b, k) => {
  const w = g.world.pendulums[k];
  const d = w.def;
  if (g.world.sigAny(d.stop)) return false;
  const ph = 2 * Math.PI * ((w.lt || 0) / d.period + d.phase);
  return Math.abs(Math.sin(ph)) < 0.3 && Math.sin(ph) * Math.cos(ph) > 0;
};
const UNFROZEN = (g, b, k) => !g.world.sigAny(g.world.pendulums[k].def.stop);
// The giant hammer is swinging away to the left.
const STEP_IN = (g, b, k) => {
  const d = g.world.pendulums[k].def;
  const ph = 2 * Math.PI * (g.world.time / d.period + d.phase);
  return Math.sin(ph) < -0.3 && Math.cos(ph) < 0;
};

export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const pendIndex = (x, z) => L.pendulums.findIndex((p) => Math.abs(p.x - x) < 0.1 && Math.abs(p.z - z) < 0.1);

  // 1. The hammer bridge: one hammer at a time.
  for (const bot of [sol, luna]) {
    await bot.go(0, 4.5, { r: 0.5 });
    for (const z of [10, 15.5, 21, 26.5]) {
      await bot.go(0, z - 2.6, { r: 0.4, stop: true });
      await bot.goWhen(0, z + 2.6, CLEAR, { k: pendIndex(0, z), at: [0, z], gap: 2.6 }, { r: 0.6 });
    }
    await bot.go(bot === sol ? -2 : 2, 35, { r: 0.6 });
  }
  await shot('bridge');

  // 2. The 3-second freeze. One pounds as the hammers swing out; the other dashes.
  const quick = L.pendulums.filter((p) => p.stop).map((p) => L.pendulums.indexOf(p));
  const freeze = async (pounder, runner, to) => {
    let done = false;
    const run = runner.goWhen(to[0], to[1], FRESH_FREEZE, quick, { r: 0.6, timeout: 90000 }).finally(() => (done = true));
    while (!done) {
      await pounder.until(POUND_NOW, quick[0], 8000).catch(() => {});
      if (done) break;
      await pounder.pound();
      await pounder.until(UNFROZEN, quick[0], 6000).catch(() => {});
    }
    await run;
  };
  await sol.go(M.S1[0], M.S1[2], { r: 0.3, stop: true });
  await luna.go(0, 39.4, { r: 0.4, stop: true });
  await freeze(sol, luna, [0, 56]);
  await freeze(sol, luna, [0, 73.5]);
  await luna.go(M.S2[0], M.S2[2], { r: 0.3, stop: true });
  await sol.go(0, 39.4, { r: 0.4, stop: true });
  await freeze(luna, sol, [0, 56]);
  await freeze(luna, sol, [0, 73.5]);
  await shot('freeze');

  // 3. The disc: hop the bars, both plates at once.
  const bars = L.movers.filter((m) => m.motion.type === 'spin' && Math.abs(m.motion.center[2] - 88) < 0.1).map((m) => m.id);
  for (const bot of [sol, luna]) await bot.page.evaluate((ids) => (window.__bot.dodge = ids), bars);
  const door = L.acts.find((a) => a.when.in.length === 2 && a.when.op === 'all' && Math.abs(a.z - 96) < 1);
  // Get onto both plates at once; a bar can knock you off, so keep going back.
  await both((b) => b.go(-1, 82, { r: 0.6, timeout: 20000 }), (b) => b.go(1, 82, { r: 0.6, timeout: 20000 }));
  for (let tries = 0; ; tries++) {
    await both((b) => b.go(M.pL[0], M.pL[2], { r: 0.4, timeout: 20000 }), (b) => b.go(M.pR[0], M.pR[2], { r: 0.4, timeout: 20000 }));
    if (await sol.waitAct(door.id, 2500).then(() => true, () => false)) break;
    if (tries > 8) throw new Error('never held both disc plates');
  }
  await both((b) => b.go(-1, 95, { r: 0.6, timeout: 15000 }), (b) => b.go(1, 95, { r: 0.6, timeout: 15000 }));
  for (const bot of [sol, luna]) await bot.page.evaluate(() => (window.__bot.dodge = null));
  await both((b) => b.go(-1.5, 99, { r: 0.6 }), (b) => b.go(1.5, 99, { r: 0.6 }));
  await shot('disc');

  // 4. The swings: board each one near the end of its swing, aiming where it will be.
  const swingAt = (bot, i, ahead) => bot.page.evaluate((a) => {
    const g = window.__itt.game;
    const m = g.world.movers.find((q) => Math.abs(q.def.motion.a?.[2] - a.z) < 0.1).def.motion;
    const t = g.world.time + a.ahead;
    const u = (1 - Math.cos(2 * Math.PI * (t / m.period + m.phase))) / 2;
    return m.a[0] + (m.b[0] - m.a[0]) * u;
  }, { z: M[`swing${i}`][2], ahead });
  const ride = async (bot) => {
    await bot.go(-3.6, 103.4, { r: 0.4, stop: true });
    // Board when the first swing will be right in front of you as you land.
    await bot.until((g, b, z) => {
      const mo = g.world.movers.find((q) => Math.abs(q.def.motion.a?.[2] - z) < 0.1).def.motion;
      const u = (1 - Math.cos(2 * Math.PI * ((g.world.time + 0.7) / mo.period + mo.phase))) / 2;
      return Math.abs(mo.a[0] + (mo.b[0] - mo.a[0]) * u + 3.6) < 0.8;
    }, M.swing0[2], 8000);
    await bot.jump({ to: [await swingAt(bot, 0, 0.7), 0, M.swing0[2]] });
    for (let i = 1; i < 4; i++) {
      // Near the end of this swing, wait until the next one will be right
      // alongside by the time you land (about 0.7 s), then jump to that spot.
      await bot.until((g, b, a) => {
        const mot = (z) => g.world.movers.find((q) => Math.abs(q.def.motion.a?.[2] - z) < 0.1);
        const xAt = (m, t) => {
          const mo = m.def.motion;
          const u = (1 - Math.cos(2 * Math.PI * (t / mo.period + mo.phase))) / 2;
          return mo.a[0] + (mo.b[0] - mo.a[0]) * u;
        };
        const here = mot(a[0]).tf.x;
        const next = xAt(mot(a[1]), g.world.time + 1.05);
        return Math.abs(here) > 2.8 && Math.abs(next - here) < 1.0;
      }, [M[`swing${i - 1}`][2], M[`swing${i}`][2]], 12000);
      await bot.jump({ to: [await swingAt(bot, i, 1.05), 0, M[`swing${i}`][2]], double: true, doubleAt: 1 });
    }
    await bot.jump({ to: [Math.max(-4, Math.min(8, await swingAt(bot, 3, 0))), 0, 133.5], double: true });
  };
  await ride(sol);
  await sol.go(-3, 134, { r: 0.6 });
  await ride(luna);
  await luna.go(-3, 136.5, { r: 0.6 });
  await shot('swings');

  // 5. The giant hammer knocks you across.
  const giant = pendIndex(M.spot[0], M.spot[2]);
  const fling = async (bot) => {
    for (let tries = 0; tries < 5; tries++) {
      await bot.go(M.spot[0], M.spot[2] - 2.6, { r: 0.3, stop: true, allowDeath: true, timeout: 15000 });
      // Step in while it swings away to the left; the swing back sends you right.
      await bot.goWhen(M.spot[0], M.spot[2], STEP_IN, giant, { r: 0.25 });
      const flew = await bot.until((g) => g.player.pos.x > 14, null, 4000).then(() => true, () => false);
      if (flew) break;
    }
    await bot.go(M.net[0], M.net[2], { r: 1.2, timeout: 8000 });
  };
  await fling(sol);
  await sol.path([[27, 147], [31, 152]], { r: 0.6 });
  await fling(luna);
  await shot('flung', luna.page);

  // 6. Luna reads the lights from the tower; Sol pounds the buttons under the hammers.
  await luna.go(27, 150, { r: 0.6 });
  await luna.go(21.8, 153.5, { r: 0.4 });
  for (let k = 0; k < 6; k++) await luna.jump({ to: M[`stair${k}`], double: true });
  await luna.jump({ to: [11, 7, 162.8], double: true });
  await luna.go(11, 165.5, { r: 0.4 });
  await luna.go(M.look[0], M.look[2], { r: 0.3, stop: true });
  await shot('tower', luna.page);
  const hub = [27, 165];
  const order = L.seqs[0].ids;
  const btnOf = (id) => [0, 1, 2].map((i) => M[`btn${i}`]).find((m) => L.switches.some((w) => w.id === id && Math.abs(w.x - m[0]) < 0.1 && Math.abs(w.z - m[2]) < 0.1));
  const guard = { '27,161': pendIndex(23, 161), '23,165': pendIndex(23, 169), '31,165': pendIndex(31, 161) };
  await sol.go(25.6, 156.8, { r: 0.4, stop: true });
  await sol.goWhen(25.6, 163.4, CLEAR, { k: pendIndex(23, 161), at: [25.6, 161], gap: 3.4 }, { r: 0.5 });
  // Wait just outside each button's hammer, then jump on and slam it.
  const pre = { '27,161': [27, 162.95], '23,165': [25.2, 165], '31,165': [28.8, 165] };
  for (const id of order) {
    const m = btnOf(id);
    const key = `${m[0]},${m[2]}`;
    const k = guard[key];
    await sol.go(hub[0], hub[1], { r: 0.5, stop: true, timeout: 8000 });
    await sol.go(pre[key][0], pre[key][1], { r: 0.25, stop: true });
    await sol.jumpWhen(CLEAR, { k, at: [m[0], m[2]], gap: 3.4 }, { to: [m[0], m[2] === 161 ? -3 : -3, m[2]], arrive: 0.45 });
    await sol.pound();
    await sol.go(pre[key][0], pre[key][1], { r: 0.4 });
  }
  await sol.waitSig(L.seqs[0].id, 4000);
  // Out through the gate, past the last hammer.
  const h4 = pendIndex(31, 169);
  await sol.goWhen(27, 177, CLEAR, { k: h4, at: [27, 169], gap: 3.6 }, { r: 0.6 });
  await sol.go(24.5, 179.5, { r: 0.6 });
  // Luna comes down the stairs and follows.
  await luna.go(11, 165.5, { r: 0.4 });
  await luna.go(11, 162.8, { r: 0.4 });
  for (let k = 5; k >= 0; k--) await luna.jump({ to: M[`stair${k}`] });
  await luna.jump({ to: [24, -3, 153.5] });
  await luna.go(25.6, 156.8, { r: 0.4, stop: true });
  await luna.goWhen(25.6, 163.4, CLEAR, { k: pendIndex(23, 161), at: [25.6, 161], gap: 3.4 }, { r: 0.5 });
  await luna.go(hub[0], hub[1], { r: 0.5, stop: true });
  await luna.goWhen(27, 177, CLEAR, { k: h4, at: [27, 169], gap: 3.6 }, { r: 0.6 });
  await shot('gate');
  await sol.go(L.goal.x - 1.5, L.goal.z, { r: 0.8 });
  await luna.go(L.goal.x + 1.5, L.goal.z, { r: 0.8 });
}
