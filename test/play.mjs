// Plays hand-designed levels start to finish with two bots in headless Chrome.
// The bots use the normal controls (see public/src/bot.js), so this is the
// real game: physics, puzzles, monsters. Each level has a walkthrough in
// test/walkthroughs/<mode>-<key>.mjs that says what each player does.
//
//   node test/play.mjs                 every level that has a walkthrough
//   node test/play.mjs horror          every horror story
//   node test/play.mjs puzzle:2 horror:0
//   options: --shots DIR (screenshots)  --port N  --headful  --chain (press "next" instead of going back to the lobby)

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { MODES, levelCount } from '../public/shared/levels.js';
import { botFor, sleep } from './walkthroughs/lib.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const argv = process.argv.slice(2);
const opt = (k, d) => {
  const i = argv.indexOf(k);
  if (i < 0) return d;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
};
const flag = (k) => {
  const i = argv.indexOf(k);
  if (i < 0) return false;
  argv.splice(i, 1);
  return true;
};
const SHOTS = opt('--shots', null);
const PORT = Number(opt('--port', 3600 + Math.floor(Math.random() * 300)));
const HEADFUL = flag('--headful');
const CHAIN = flag('--chain');
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

// Which levels to play.
const keyOf = (mode, i) => MODES[mode].list[i].key;
const wtPath = (mode, i) => path.join(ROOT, 'test', 'walkthroughs', `${mode}-${keyOf(mode, i)}.mjs`);
const wanted = [];
const handMade = Object.keys(MODES).filter((m) => MODES[m].list);
for (const a of argv.length ? argv : handMade) {
  const [mode, idx] = a.split(':');
  if (!MODES[mode] || !MODES[mode].list) throw new Error(`unknown mode ${mode}`);
  const list = idx !== undefined ? [Number(idx)] : [...Array(levelCount(mode)).keys()];
  for (const i of list) {
    if (fs.existsSync(wtPath(mode, i))) wanted.push([mode, i]);
    else if (idx !== undefined) throw new Error(`no walkthrough at ${wtPath(mode, i)}`);
    else console.log(`(skipping ${mode}:${i} ${keyOf(mode, i)}: no walkthrough yet)`);
  }
}

const SAVE = path.join(os.tmpdir(), `itt-play-${process.pid}.json`);
const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), SAVE_FILE: SAVE }, stdio: ['ignore', 'pipe', 'inherit'] });
// A walkthrough promise that rejects outside an await would kill this process
// without the cleanup below; never leave the server running behind it.
process.on('exit', () => server.kill());
process.on('unhandledRejection', (e) => {
  console.error(`\nunhandled rejection: ${e && e.message}`);
  server.kill();
  process.exit(1);
});
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d.toString()));
await new Promise((resolve) => server.stdout.on('data', (d) => d.toString().includes('localhost') && resolve()));

const launchBrowser = () => puppeteer.launch({
  executablePath: CHROME,
  headless: HEADFUL ? false : 'new',
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
  defaultViewport: { width: 640, height: 360 },
});
// Chrome can be slow to start when the machine is busy: retry, and never leave the server running.
let browser;
for (let k = 0; k < 3 && !browser; k++) {
  try {
    browser = await launchBrowser();
  } catch (e) {
    if (k === 2) {
      server.kill();
      throw e;
    }
  }
}
const errors = [];

async function player(name) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`[${name}] ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${name}] ${m.text()}`));
  await page.goto(`http://localhost:${PORT}/?bot`, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => {
    const { Bot } = await import('/src/bot.js');
    window.__bot = new Bot(window.__itt);
  });
  return page;
}

async function waitFor(page, fn, arg, timeout = 10000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await page.evaluate(fn, arg).catch(() => false)) return true;
    await sleep(150);
  }
  return false;
}

const results = [];
try {
  const A = await player('A');
  await sleep(300);
  const B = await player('B');
  await sleep(600);
  let first = true;
  for (const [mode, index] of wanted) {
    const name = `${mode}:${index} ${MODES[mode].list[index].title}`;
    const t0 = Date.now();
    const res = { name, ok: false, time: 0, deaths: [0, 0], error: null };
    results.push(res);
    console.log(`\n▶ ${name}`);
    try {
      if (!(CHAIN && !first)) {
        await A.evaluate((m, i) => window.__itt.app.net.send({ t: 'seed', seed: 'play', mode: m, levelIndex: i }), mode, index);
        await sleep(500);
        for (const P of [A, B]) await P.evaluate(() => window.__itt.app.net.send({ t: 'ready', v: true }));
      }
      first = false;
      const started = await waitFor(A, (a) => {
        const g = window.__itt.game;
        return g && g.mode === 'play' && g.level.mode === a[0] && g.level.index === a[1];
      }, [mode, index], 15000);
      if (!started) throw new Error('level did not start');
      const wait = await A.evaluate(() => window.__itt.game.startTime - window.__itt.app.net.serverNow());
      await sleep(Math.max(0, wait) + 400);
      for (const P of [A, B]) await P.evaluate(() => { window.__bot.deaths = 0; window.__bot.deathLog = []; });
      const slotA = await A.evaluate(() => window.__itt.game.slot);
      const [sol, luna] = slotA === 0 ? [botFor(A, 'Sol'), botFor(B, 'Luna')] : [botFor(B, 'Sol'), botFor(A, 'Luna')];
      const L = await A.evaluate(() => window.__itt.game.level);
      const shot = async (label, page = A) => {
        if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${mode}-${index}-${label}.png`) });
      };
      const walk = (await import(pathToFileURL(wtPath(mode, index)).href)).default;
      await walk({ sol, luna, L, shot, sleep, both: (fa, fb) => Promise.all([fa(sol), fb(luna)]) });
      const done = await waitFor(A, () => !document.getElementById('complete').hidden, null, 20000);
      if (!done) throw new Error('walkthrough ended but the level is not complete');
      res.ok = true;
      res.deaths = await Promise.all([sol, luna].map((b) => b.deaths()));
      for (const b of [sol, luna]) {
        const where = await b.page.evaluate(() => window.__bot.deathLog || []);
        if (where.length) console.log(`    ${b.name} died at ${where.join('; ')}`);
      }
      await shot('complete');
      if (CHAIN) {
        for (const P of [A, B]) await P.evaluate(() => document.getElementById('continue').click());
      } else {
        await A.evaluate(() => window.__itt.app.net.send({ t: 'lobby' }));
      }
    } catch (e) {
      res.error = e.message;
      console.log(`  ✗ ${e.message}`);
      for (const P of [A, B]) {
        const st = await P.evaluate(() => window.__bot && window.__bot.state()).catch(() => null);
        if (st) console.log(`    ${JSON.stringify(st)}`);
      }
      if (SHOTS) {
        await A.screenshot({ path: path.join(SHOTS, `${mode}-${index}-FAIL-A.png`) }).catch(() => {});
        await B.screenshot({ path: path.join(SHOTS, `${mode}-${index}-FAIL-B.png`) }).catch(() => {});
      }
      await A.evaluate(() => window.__itt.app.net.send({ t: 'lobby' })).catch(() => {});
      first = true;
    }
    res.time = (Date.now() - t0) / 1000;
    console.log(`  ${res.ok ? '✓ cleared' : '✗ failed'} in ${res.time.toFixed(0)}s${res.ok ? `, deaths ${res.deaths.join('/')}` : ''}`);
    await sleep(1500);
  }
} catch (e) {
  console.error(`\nplay.mjs crashed: ${e.stack || e.message}`);
  results.push({ name: 'play.mjs', ok: false, time: 0, deaths: [0, 0], error: e.message });
} finally {
  const real = errors.filter((e) => !/favicon|fonts\.g|GPU stall|ReadPixels|WebGL/.test(e));
  if (real.length) console.log(`\nconsole errors:\n${real.slice(0, 12).join('\n')}`);
  await browser.close();
  server.kill();
  fs.rmSync(SAVE, { force: true });
  const warn = serverLog.split('\n').filter((l) => /warn|error/i.test(l));
  if (warn.length) console.log(`\nserver:\n${warn.slice(0, 8).join('\n')}`);
  console.log('\nSummary');
  for (const r of results) console.log(`  ${r.ok ? '✓' : '✗'} ${r.name}${r.ok ? `  (${r.time.toFixed(0)}s, deaths ${r.deaths.join('/')})` : `  — ${r.error}`}`);
  const failed = results.filter((r) => !r.ok).length + (real.length ? 1 : 0);
  process.exit(failed ? 1 : 0);
}
