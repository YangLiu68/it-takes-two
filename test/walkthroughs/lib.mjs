// Helpers for walkthroughs: a remote control for one bot-driven player.
// Every call goes through the game's normal controls (see public/src/bot.js).
//
//   await sol.go(x, z)                    walk there (hops over small bumps)
//   await sol.path([[x, z], ...])         walk a route
//   await sol.jump({ to: [x, y, z], double: true, dash: true })
//   await sol.pound()                     ground pound (standing: hop + pound)
//   await sol.magnet(ms, { to })          hold the magnet button
//   await sol.until((g, bot, arg) => ..., arg, timeoutMs)   wait for a condition in the page
//   await sol.sig(id) / sol.waitSig(id) / sol.waitAct(id)
//   sol.face('monster' | [x, y, z] | null)  keep the camera (flashlight) on something

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function botFor(page, name) {
  const t0 = Date.now();
  const log = (s) => {
    if (process.env.VERBOSE) console.log(`    ${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s ${name}: ${s}`);
  };
  const call = async (task) => {
    log(`${task.type}${task.x !== undefined ? ` ${task.x.toFixed?.(1) ?? task.x},${task.z.toFixed?.(1) ?? task.z}` : ''}${task.to ? ` → ${task.to.map((v) => v.toFixed(1)).join(',')}` : ''}`);
    try {
      return await page.evaluate((t) => window.__bot.run(t), task);
    } catch (e) {
      throw new Error(`${name}: ${e.message.replace(/^Error: /, '').split('\n')[0]}`);
    }
  };
  const until = (fn, arg = null, timeout = 30000) => call({ type: 'until', fn: fn.toString(), arg, timeout });
  // Stand still until fn(g, bot, arg) is true in the page, then walk to (x, z) — no round trip in between.
  const goWhen = (x, z, fn, arg = null, o = {}) => call({ type: 'go', x, z, fn: fn.toString(), arg, timeout: 30000, ...o });
  const bot = {
    name,
    page,
    log,
    go: (x, z, o = {}) => call({ type: 'go', x, z, ...o }),
    goWhen,
    // Stand still until fn is true in the page, then jump (same options as jump).
    jumpWhen: (fn, arg, o = {}) => call({ type: 'jump', fn: fn.toString(), arg, timeout: 30000, ...o }),
    async path(pts, o = {}) {
      for (const [x, z] of pts) await call({ type: 'go', x, z, r: o.r ?? 0.7, ...o });
    },
    jump: (o = {}) => call({ type: 'jump', ...o }),
    pound: () => call({ type: 'pound' }),
    magnet: (ms, o = {}) => call({ type: 'magnet', ms, ...o }),
    // Swing along ceiling magnets [[x, y, z], ...] (opposite color), then drop and land.
    swing: (pads, o = {}) => call({ type: 'swing', pads, timeout: 4000 + pads.length * 3000, ...o }),
    // Big bounce off a drum (pound on landing), then fly to `to` (and pound there with pound: true).
    bounce: (drum, to, o = {}) => call({ type: 'bounce', drum, to, ...o }),
    // Hop along blink blocks on the beat: [{ x, y, z, id }] (id null = solid ground).
    beat: (blocks, o = {}) => call({ type: 'beat', blocks, timeout: 6000 + blocks.length * 4000, ...o }),
    wait: (ms) => call({ type: 'wait', ms, timeout: ms + 5000 }),
    until,
    face: (aim) => page.evaluate((a) => {
      window.__bot.aim = a;
    }, aim),
    pitch: (v) => page.evaluate((a) => {
      window.__bot.pitch = a;
    }, v),
    pos: () => page.evaluate(() => {
      const p = window.__itt.game.player.pos;
      return [p.x, p.y, p.z];
    }),
    slot: () => page.evaluate(() => window.__itt.game.slot),
    deaths: () => page.evaluate(() => window.__bot.deaths),
    sig: (id) => page.evaluate((i) => window.__itt.game.world.sig(i), id),
    waitSig: (id, timeout = 30000) => until((g, b, i) => g.world.sig(i), id, timeout),
    waitAct: (id, timeout = 30000) => until((g, b, i) => g.world.state.act[i] === 1, id, timeout),
    // Wait until this player carries the item.
    waitHold: (id, timeout = 8000) => until((g, b, i) => (g.extras.itemState[i] || [-1])[0] === g.slot, id, timeout),
    // Wait until the item has gone into its lock.
    waitUsed: (id, timeout = 8000) => until((g, b, i) => (g.extras.itemState[i] || [-1, 0])[1] === 1, id, timeout),
    // Wait until no awake monster is within r metres (or until it's frozen / gone).
    waitClear: (r = 8, timeout = 30000) => until((g, b, rr) => g.extras.monsters.every((m) => !m.cur || m.mode === 0 || m.mode === 7 || m.pos.distanceTo(g.player.pos) > rr), r, timeout),
    dialValue: (id) => page.evaluate((i) => window.__itt.game.extras.dialState[i] ?? window.__itt.game.level.dials.find((d) => d.id === i).start, id),
  };
  // Turn a dial (pound it) until it shows the value index wanted.
  bot.setDial = async (dial, want) => {
    const n = dial.values.length;
    await bot.go(dial.x, dial.z, { r: 0.35, stop: true });
    for (let k = 0; k < n + 1; k++) {
      const v = await bot.dialValue(dial.id);
      if (v === want) return;
      await bot.pound();
      await bot.until((g, b, a) => (g.extras.dialState[a[0]] ?? -1) !== a[1], [dial.id, v], 3000);
    }
    throw new Error(`${name}: dial ${dial.id} never reached ${want}`);
  };
  return bot;
}
