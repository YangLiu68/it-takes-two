// Saved progress survives a server restart: checkpoints, collectibles and
// solved puzzles come back, finishing a level saves the next one, and
// "start over" clears it.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import WebSocket from 'ws';
import { buildLevel } from '../public/shared/levels.js';

const PORT = 3590;
const SAVE_FILE = path.join(os.tmpdir(), `itt-save-test-${process.pid}.json`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.rmSync(SAVE_FILE, { force: true });

async function startServer() {
  const proc = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(PORT), SAVE_FILE }, stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((r) => proc.stdout.on('data', (d) => d.toString().includes('localhost') && r()));
  return proc;
}

async function stopServer(proc) {
  const done = new Promise((r) => proc.on('exit', r));
  proc.kill('SIGTERM');
  await done;
}

// Minimal client: collects messages, waits for a type.
async function connect() {
  const ws = new WebSocket(`ws://localhost:${PORT}/ws`);
  const msgs = [];
  ws.on('message', (d) => msgs.push(JSON.parse(d.toString())));
  await new Promise((r) => ws.on('open', r));
  const c = {
    send: (m) => ws.send(JSON.stringify(m)),
    async next(type, pred = () => true, timeout = 3000) {
      const t0 = Date.now();
      while (Date.now() - t0 < timeout) {
        const i = msgs.findIndex((m) => m.t === type && pred(m));
        if (i >= 0) return msgs.splice(i, 1)[0];
        await sleep(20);
      }
      throw new Error(`timed out waiting for ${type}`);
    },
    last(type) {
      return [...msgs].reverse().find((m) => m.t === type);
    },
    close: () => ws.close(),
  };
  c.send({ t: 'hello', name: 'Tester' });
  await c.next('welcome');
  return c;
}

// A designed level with checkpoints that has a next level (the first night).
const MODE = 'horror';
const level = buildLevel(MODE, 'save-test', 0);
const CP = Math.min(3, level.checkpoints.length - 2);
const latched = level.acts.find((a) => a.latch && a.when.in.some((id) => level.switches.some((w) => w.id === id && w.latch)));
const latchSwitch = latched ? latched.when.in.find((id) => level.switches.some((w) => w.id === id && w.latch)) : null;
const gem = level.gems[0];

let server = await startServer();
try {
  // 1. Play a bit and check what lands on disk.
  let c = await connect();
  c.send({ t: 'seed', seed: 'save-test', mode: MODE, levelIndex: 0 });
  await c.next('lobby', (m) => m.seed === 'save-test');
  c.send({ t: 'solo' });
  await c.next('start');
  c.send({ t: 'cp', idx: CP });
  if (gem) c.send({ t: 'gem', id: gem.id });
  if (latchSwitch) c.send({ t: 'pound', id: latchSwitch });
  await sleep(600);
  const saved = JSON.parse(fs.readFileSync(SAVE_FILE, 'utf8'));
  assert.equal(saved.seed, 'save-test');
  assert.equal(saved.levelIndex, 0);
  assert.equal(saved.checkpoints[0], CP, 'checkpoint saved');
  if (gem) assert.ok(saved.gems.includes(gem.id), 'collectible saved');
  if (latchSwitch) assert.ok(saved.latchedSignals.includes(latchSwitch), 'solved puzzle saved');
  c.close();

  // 2. Restart the server: the lobby offers to continue and the level resumes.
  await stopServer(server);
  server = await startServer();
  c = await connect();
  const lobby = await c.next('lobby');
  assert.equal(lobby.seed, 'save-test', 'lobby defaults to the saved world');
  assert.ok(lobby.save && lobby.save.matches && lobby.save.checkpoint === CP, 'lobby shows the save');
  c.send({ t: 'solo' });
  const start = await c.next('start');
  assert.equal(start.checkpoints[0], CP, 'resumes at the saved checkpoint');
  if (gem) assert.ok(start.gems.includes(gem.id), 'collectible stays collected');
  if (latchSwitch) assert.equal(start.world.act[latched.id], 1, 'solved puzzle stays solved');

  // 3. Restarting the level from the menu starts it over.
  c.send({ t: 'restart' });
  const restarted = await c.next('start');
  assert.equal(restarted.checkpoints[0], 0, 'restart begins at the first checkpoint');
  c.send({ t: 'cp', idx: 1 });
  await sleep(400);

  // 4. Finishing the level saves the next one.
  c.send({ t: 'goal', in: true });
  await c.next('complete');
  await sleep(100);
  const afterWin = JSON.parse(fs.readFileSync(SAVE_FILE, 'utf8'));
  assert.equal(afterWin.levelIndex, 1, 'next level saved after completing');
  assert.deepEqual(afterWin.checkpoints, [0, 0]);
  c.close();
  await sleep(200);

  await stopServer(server);
  server = await startServer();
  c = await connect();
  const lobby2 = await c.next('lobby');
  assert.equal(lobby2.levelIndex, 1, 'continues on the next level after a restart');

  // 5. Start over clears the save.
  c.send({ t: 'newGame' });
  const cleared = await c.next('lobby', (m) => !m.save);
  assert.equal(cleared.levelIndex, 0);
  await sleep(100);
  assert.ok(!fs.existsSync(SAVE_FILE), 'save file removed');
  c.close();
  console.log('ok: saved progress survives restarts, resumes and can be cleared');
} finally {
  await stopServer(server).catch(() => {});
  fs.rmSync(SAVE_FILE, { force: true });
}
