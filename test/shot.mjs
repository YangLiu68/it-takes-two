// Quick visual check: opens one solo player against a running server and
// saves screenshots. Usage: node test/shot.mjs <url> <outDir> [seed] [level]
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const [url = 'http://localhost:3000', out = 'test/screenshots', seed, level = '0'] = process.argv.slice(2);
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(out, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--window-size=1280,800'],
  defaultViewport: { width: 1280, height: 800 },
});
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(url, { waitUntil: 'networkidle0' });
await sleep(800);
if (seed) {
  await page.evaluate((s, l) => {
    document.getElementById('seed').value = s;
    document.getElementById('level-select').value = l;
    document.getElementById('level-select').dispatchEvent(new Event('change'));
  }, seed, level);
  await sleep(800);
}
await page.screenshot({ path: path.join(out, 'lobby.png') });
await page.click('#solo');
await sleep(4800);
await page.screenshot({ path: path.join(out, 'start.png') });

// Fly the camera along the level to preview each checkpoint.
const shots = Number(process.env.SHOTS || 0);
for (let i = 1; i <= shots; i++) {
  await page.evaluate((i) => {
    const g = window.__itt.game;
    const cp = g.level.checkpoints[Math.min(i, g.level.checkpoints.length - 1)];
    g.player.spawnAt(cp.spawns[0]);
    g.cps[g.slot] = cp.idx;
    g.rig.snap(g.player.pos, g.player.yaw);
    g.rig.pitch = 0.45;
    g.rig.targetDist = 13;
  }, i);
  await sleep(900);
  await page.screenshot({ path: path.join(out, `cp${i}.png`) });
}
console.log(errors.length ? errors.join('\n') : 'no console errors');
await browser.close();
