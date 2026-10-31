// End-to-end smoke test: starts the server, opens two browser players,
// readies up, plays a few seconds and saves screenshots.
//
//   node test/smoke.mjs [outDir]
//
// Uses the locally installed Google Chrome (set CHROME=/path/to/chrome to override).

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import puppeteer from 'puppeteer-core';

const OUT = process.argv[2] || 'test/screenshots';
const PORT = 3567;
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = `http://localhost:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(OUT, { recursive: true });
const server = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(PORT), SAVE_FILE: `${os.tmpdir()}/itt-test-save-${process.pid}.json` }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve) => server.stdout.on('data', (d) => d.toString().includes('localhost') && resolve()));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: process.env.HEADFUL ? false : 'new',
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--window-size=1280,800'],
  defaultViewport: { width: 1280, height: 800 },
});

const errors = [];
async function openPlayer(name) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${name}] ${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`[${name}] pageerror: ${e.message}`));
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.evaluate((n) => {
    const el = document.getElementById('name');
    el.value = n;
    el.dispatchEvent(new Event('change'));
  }, name);
  return page;
}

try {
  const a = await openPlayer('Alex');
  await sleep(800);
  const b = await openPlayer('Bo');
  await sleep(1500);
  await a.screenshot({ path: path.join(OUT, '01-lobby.png') });

  await a.click('#ready');
  await b.click('#ready');
  await sleep(1200);
  await a.screenshot({ path: path.join(OUT, '02-countdown.png') });
  await sleep(4000);
  await a.screenshot({ path: path.join(OUT, '03-start-a.png') });
  await b.screenshot({ path: path.join(OUT, '03-start-b.png') });

  // Walk forward and jump on player A.
  await a.keyboard.down('KeyW');
  await sleep(700);
  await a.keyboard.press('Space');
  await sleep(250);
  await a.keyboard.press('Space');
  await sleep(500);
  await a.keyboard.up('KeyW');
  await sleep(800);
  await a.screenshot({ path: path.join(OUT, '04-moved-a.png') });
  await b.screenshot({ path: path.join(OUT, '04-moved-b.png') });

  const state = await a.evaluate(() => {
    const g = window.__itt.game;
    return {
      mode: g.mode,
      pos: g.player.pos.toArray().map((v) => +v.toFixed(2)),
      partnerPresent: g.remote.present,
      partnerPos: g.remote.pos.toArray().map((v) => +v.toFixed(2)),
      level: g.level.name,
      segments: g.level.segments.map((s) => s.type),
      fps: g.gfx.renderer.info.render.calls,
    };
  });
  console.log(JSON.stringify(state, null, 2));
} catch (e) {
  console.error('smoke test failed:', e);
  process.exitCode = 1;
} finally {
  console.log(errors.length ? `console problems:\n${errors.join('\n')}` : 'no console errors');
  await browser.close();
  server.kill();
}
