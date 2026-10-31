// End-to-end co-op test with two real browser players on the tutorial level.
// Teleports players to puzzle spots and checks that shared state syncs:
// plates, seesaw catapult, latched switches, collectibles, partner bond, goal.
//
//   node test/coop.mjs

import { spawn } from 'node:child_process';
import os from 'node:os';
import puppeteer from 'puppeteer-core';

const PORT = 3568;
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(PORT), SAVE_FILE: `${os.tmpdir()}/itt-test-save-${process.pid}.json` }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve) => server.stdout.on('data', (d) => d.toString().includes('localhost') && resolve()));
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'],
  defaultViewport: { width: 960, height: 600 },
});

const errors = [];
let failures = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
}

async function player(name) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`[${name}] ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${name}] ${m.text()}`));
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0' });
  return page;
}

async function waitFor(page, fn, arg, timeout = 4000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await page.evaluate(fn, arg)) return true;
    await sleep(100);
  }
  return false;
}

const teleport = (page, p) => page.evaluate((p) => {
  const g = window.__itt.game;
  g.player.spawnAt(p);
}, p);

try {
  const A = await player('A');
  await sleep(500);
  const B = await player('B');
  await sleep(800);
  // A procedural level (the hidden test mode): it has every shared piece in one place.
  await A.evaluate(() => window.__itt.app.net.send({ t: 'seed', seed: 'coop-test', mode: 'gen', levelIndex: 0 }));
  await sleep(900);
  await A.click('#ready');
  await B.click('#ready');
  const started = await waitFor(A, () => window.__itt.game?.mode === 'play', null, 6000);
  check('both players start the level', started);
  await sleep(4200);

  const level = await A.evaluate(() => {
    const L = window.__itt.game.level;
    return { acts: L.acts, plates: L.plates, switches: L.switches, seesaws: L.seesaws, gems: L.gems, pads: L.pads, goal: L.goal, checkpoints: L.checkpoints, segments: L.segments };
  });
  const slotA = await A.evaluate(() => window.__itt.game.slot);
  check('players got different characters', slotA !== (await B.evaluate(() => window.__itt.game.slot)));

  // 1. Pressure plate holds the door open for the partner.
  const door = level.acts.find((a) => a.style === 'door' && !a.latch);
  const plate = level.plates.find((p) => p.id === door.when.in[0]);
  await teleport(A, [plate.x, plate.y + 0.3, plate.z, 0]);
  const opened = await waitFor(B, (id) => window.__itt.game.world.state.act[id] === 1, door.id);
  check('plate opens the door on the partner’s screen', opened);
  await teleport(A, [plate.x + 3, plate.y + 0.3, plate.z + 3, 0]);
  const closed = await waitFor(B, (id) => window.__itt.game.world.state.act[id] === 0, door.id);
  check('door closes when the plate is released', closed);

  // 2. Seesaw: B stands on one end, A pounds the other.
  const ss = level.seesaws[0];
  const ends = await A.evaluate((id) => {
    const w = window.__itt.game.physics;
    return ['A', 'B'].map((e) => { const c = w.byId.get(`${id}:${e}`); return [c.pos.x, c.top(), c.pos.z]; });
  }, ss.id);
  await teleport(B, [ends[1][0], ends[1][1] + 0.05, ends[1][2], 0]);
  await sleep(500);
  await teleport(A, [ends[0][0], ends[0][1] + 2.5, ends[0][2], 0]);
  await sleep(120);
  await A.keyboard.press('KeyC');
  const launched = await waitFor(B, (y0) => window.__itt.game.player.pos.y > y0 + 6, ends[1][1], 3000);
  check('pounding the seesaw catapults the partner', launched);

  // 3. Latched switch on the cliff raises the steps for everyone.
  const steps = level.acts.find((a) => a.style === 'steps');
  const sw = level.switches.find((w) => w.id === steps.when.in[0]);
  await teleport(A, [sw.x, sw.y + 3, sw.z, 0]);
  await sleep(150);
  await A.keyboard.press('KeyC');
  const stepsOut = await waitFor(B, (id) => window.__itt.game.world.state.act[id] === 1, steps.id);
  check('latched switch slides the steps out for both', stepsOut);
  await sleep(1500);
  const stillOut = await B.evaluate((id) => window.__itt.game.world.state.act[id] === 1, steps.id);
  check('latched switch stays on', stillOut);

  // 4. Shared collectibles.
  const gem = level.gems[0];
  await teleport(A, [gem.x, gem.y - 0.8, gem.z, 0]);
  const gemSync = await waitFor(B, (id) => window.__itt.game.world.gems.get(id).taken && window.__itt.game.gemCount === 1, gem.id);
  check('collectible picked up by A disappears for B', gemSync);

  // 5. Partner bond across the cannon gap.
  const cannon = level.pads.find((p) => p.launch && Math.abs(p.launch[0]) + Math.abs(p.launch[2]) > 0.1);
  const dir = Math.hypot(cannon.launch[0], cannon.launch[2]);
  const fx = cannon.launch[0] / dir, fz = cannon.launch[2] / dir;
  // A on the far side, B at the near edge, facing each other.
  // The cannon's horizontal speed equals its flight distance (1 s flight); the far
  // platform starts 4 m short of that. Stand 1 m onto it.
  const farD = dir - 3, nearD = 5.0;
  await teleport(A, [cannon.x + fx * farD, cannon.y - 0.08, cannon.z + fz * farD, Math.atan2(-fx, -fz)]);
  await teleport(B, [cannon.x + fx * nearD, cannon.y - 0.08, cannon.z + fz * nearD, Math.atan2(fx, fz)]);
  await B.evaluate((yaw) => { const g = window.__itt.game; g.rig.yaw = yaw; g.rig.pitch = 0.1; }, Math.atan2(-fx, -fz));
  await sleep(600);
  await A.keyboard.down('KeyE');
  await sleep(500);
  await B.keyboard.down('KeyE');
  const bonded = await waitFor(B, ([x, z]) => {
    const p = window.__itt.game.player.pos;
    return Math.hypot(p.x - x, p.z - z) < 3.5;
  }, [cannon.x + fx * farD, cannon.z + fz * farD], 4000);
  await A.keyboard.up('KeyE');
  await B.keyboard.up('KeyE');
  check('partner bond pulls B across the gap to A', bonded);

  // 6. Checkpoint progress syncs.
  const cp3 = level.checkpoints[3];
  await teleport(A, [cp3.x, cp3.y + 0.2, cp3.z, 0]);
  const cpSync = await waitFor(B, (s) => window.__itt.game.cps[s] >= 3, slotA);
  check('checkpoint progress is shared', cpSync);

  // 7. Both in the goal finishes the level.
  const goal = level.goal;
  await teleport(A, [goal.x - 1, goal.y + 0.2, goal.z, 0]);
  await teleport(B, [goal.x + 1, goal.y + 0.2, goal.z, 0]);
  const doneA = await waitFor(A, () => !document.getElementById('complete').hidden, null, 4000);
  const doneB = await waitFor(B, () => !document.getElementById('complete').hidden, null, 4000);
  check('level completes when both reach the goal', doneA && doneB);

  // 8. Next level starts after both continue.
  await A.click('#continue');
  await B.click('#continue');
  const next = await waitFor(A, () => window.__itt.game?.level.index === 1, null, 5000);
  check('both continue into level 2', next);
} catch (e) {
  console.error(e);
  failures++;
} finally {
  if (errors.length) console.log(`page errors:\n${errors.join('\n')}`);
  console.log(failures || errors.length ? `FAILED (${failures} checks, ${errors.length} errors)` : 'ok: co-op flow works end to end');
  process.exitCode = failures || errors.length ? 1 : 0;
  await browser.close();
  server.kill();
}
