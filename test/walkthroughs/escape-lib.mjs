// Extra moves for the escape-room walkthroughs (on top of lib.mjs).

// Hop onto a switch (or dial) and pound it. from: the side to come at it from.
export async function press(bot, w, from = [0, -1]) {
  await bot.go(w.x + from[0] * 1.7, w.z + from[1] * 1.7, { r: 0.35 });
  await bot.jump({ to: [w.x, w.y + 0.64, w.z] });
  await bot.go(w.x, w.z, { r: 0.22, stop: true, hop: false, timeout: 3000 });
  await bot.pound();
}

// Turn a dial to the value index wanted (it shows the next value per pound).
export async function dialTo(bot, dial, want, from = [0, -1]) {
  const v0 = await bot.dialValue(dial.id);
  if (v0 === want) return;
  await bot.go(dial.x + from[0] * 1.7, dial.z + from[1] * 1.7, { r: 0.35 });
  await bot.jump({ to: [dial.x, dial.y + 0.64, dial.z] });
  for (let k = 0; k < dial.values.length + 1; k++) {
    const v = await bot.dialValue(dial.id);
    if (v === want) return;
    await bot.go(dial.x, dial.z, { r: 0.22, stop: true, hop: false, timeout: 3000 });
    await bot.pound();
    await bot.until((g, b, a) => (g.extras.dialState[a[0]] ?? -1) !== a[1], [dial.id, v], 3000);
  }
  throw new Error(`${bot.name}: dial ${dial.id} never reached ${want}`);
}

// Wait until an actuator (door, lift, train...) has finished moving: u = 1 out, 0 home.
export const actAt = (bot, id, u, timeout = 15000) => bot.until((g, b, a) => {
  const act = g.world.acts.find((x) => x.def.id === a[0]);
  return act && act.parts.every((p) => (a[1] > 0.5 ? p.u > 0.99 : p.u < 0.01));
}, [id, u], timeout);

// Wait until a moving platform is within r of (x, z).
export const moverNear = (bot, id, x, z, r = 0.6, timeout = 20000) => bot.until((g, b, a) => {
  const m = g.world.movers.find((v) => v.def.id === a[0]);
  return m && Math.hypot(m.tf.x - a[1], m.tf.z - a[2]) < a[3];
}, [id, x, z, r], timeout);

// Wait for a pendulum's head to swing out of the way (just past the middle, heading out).
export const pendulumClear = (bot, id, timeout = 15000) => bot.until((g, b, i) => {
  const p = g.world.pendulums.find((q) => q.def.id === i);
  const h = p.def;
  const ph = 2 * Math.PI * (g.world.time / h.period + h.phase);
  const th = h.amp * Math.sin(ph);
  const vel = Math.cos(ph) * Math.sign(Math.sin(ph));
  return Math.abs(h.len * Math.sin(th)) > 2.6 && vel > 0;
}, id, timeout);

// Is a blink group solid right now, with at least `left` seconds to go?
export const blinkSolid = (bot, group, period, left = 1.0, timeout = 15000) => bot.until((g, b, a) => {
  const cyc = (((g.world.time / a[1]) % 1) + 1) % 1;
  const first = cyc < 0.5;
  const solid = a[0] === 0 ? first : !first;
  const remain = (first ? 0.5 - cyc : 1 - cyc) * a[1];
  return solid && remain > a[2];
}, [group, period, left], timeout);

// Pound a dial n times (each pound turns it, and any linked dials, one step).
export async function turns(bot, dial, n, from = [0, -1]) {
  if (n <= 0) return;
  await bot.go(dial.x + from[0] * 1.7, dial.z + from[1] * 1.7, { r: 0.35 });
  await bot.jump({ to: [dial.x, dial.y + 0.64, dial.z] });
  for (let k = 0; k < n; k++) {
    const v = await bot.dialValue(dial.id);
    await bot.go(dial.x, dial.z, { r: 0.22, stop: true, hop: false, timeout: 3000 });
    await bot.pound();
    await bot.until((g, b, a) => (g.extras.dialState[a[0]] ?? -1) !== a[1], [dial.id, v], 3000);
  }
}

// Jump from step to step ([x, top, z] each); if it slips off, walk back to
// `start` and try again from the bottom.
export async function climb(bot, steps, start, tries = 3) {
  for (let t = 0; t < tries; t++) {
    await bot.go(start[0], start[2], { r: 0.35 });
    // All the hops in one go inside the page (crumbling steps don't wait).
    const ok = await bot.page.evaluate(async (ss) => {
      for (const s of ss) {
        await window.__bot.run({ type: 'jump', to: s, double: true, timeout: 5000 });
        const p = window.__itt.game.player.pos;
        if (p.y < s[1] - 0.4) return false;
      }
      return true;
    }, steps).catch(() => false);
    if (ok) return t;
    bot.log('slipped off — trying again from the bottom');
    await bot.until((g) => !g.player.dead && g.player.grounded, null, 10000);
  }
  throw new Error(`${bot.name}: kept falling off`);
}

// Launch off your own color's pad and steer onto a ledge at height y; if the
// launch doesn't take (or you fall short), walk back and try again.
export async function launchTo(bot, pad, to, tries = 3) {
  for (let t = 0; t < tries; t++) {
    await bot.go(pad.x, pad.z, { r: 0.25, stop: true });
    await bot.magnet(600);
    try {
      await bot.go(to[0], to[2], { r: 0.6, timeout: 4000 });
      await bot.until((g, b, y) => g.player.grounded && g.player.pos.y > y - 0.5, to[1], 2000);
      return t;
    } catch (e) {
      bot.log(`launch didn't make it (${e.message.split(':').pop().trim()}) — again`);
    }
  }
  throw new Error(`${bot.name}: could not launch up to ${to.map((v) => v.toFixed(1)).join(',')}`);
}

// Run several bot tasks back to back inside the page, with no round trip in
// between (for hops across crumbling tiles, where a pause is a fall).
export async function chain(bot, tasks) {
  bot.log(`chain of ${tasks.length}`);
  try {
    return await bot.page.evaluate(async (ts) => {
      for (const t of ts) await window.__bot.run(t);
      return true;
    }, tasks);
  } catch (e) {
    throw new Error(`${bot.name}: ${e.message.replace(/^Error: /, '').split('\n')[0]}`);
  }
}

// A wait-until task for chain(): fn(g, bot, arg) runs in the page.
export const untilTask = (fn, arg = null, timeout = 15000) => ({ type: 'until', fn: fn.toString(), arg, timeout });

// The blink-group check as a chain task.
export const blinkTask = (group, period, left = 1.0) => untilTask((g, b, a) => {
  const cyc = (((g.world.time / a[1]) % 1) + 1) % 1;
  const first = cyc < 0.5;
  const solid = a[0] === 0 ? first : !first;
  return solid && (first ? 0.5 - cyc : 1 - cyc) * a[1] > a[2];
}, [group, period, left]);
