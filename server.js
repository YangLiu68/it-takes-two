// LAN game server: serves the browser client and hosts one two-player room.
//
// Each client simulates its own character and streams its state; the server
// relays it to the partner and owns everything shared: puzzle switches,
// collectibles, checkpoints and level flow.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { validateLevel } from './public/shared/levelgen.js';
import { buildLevel, levelCount, MODES } from './public/shared/levels.js';
import { PuzzleState } from './public/shared/logic.js';
import { MonsterSim } from './public/shared/monster.js';
import { inside, redState } from './public/shared/zones.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const THREE = path.join(ROOT, 'node_modules', 'three');
const BASE_PORT = Number(process.env.PORT) || 3000;
const SAVE_FILE = process.env.SAVE_FILE || path.join(ROOT, 'saves', 'progress.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.glb': 'model/gltf-binary',
  '.webmanifest': 'application/manifest+json',
};

function lanAddresses() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) {
      if (a.family === 'IPv4' && !a.internal) out.push(a.address);
    }
  }
  // Prefer typical home-network ranges first.
  return out.sort((a, b) => Number(b.startsWith('192.168.')) - Number(a.startsWith('192.168.')));
}

let PORT = BASE_PORT;
const lanUrls = () => lanAddresses().map((ip) => `http://${ip}:${PORT}`);

function resolveStatic(urlPath) {
  let rel = decodeURIComponent(urlPath.split('?')[0]);
  let root = PUBLIC;
  if (rel.startsWith('/vendor/three/')) {
    root = THREE;
    rel = rel.slice('/vendor/three'.length);
  }
  if (rel === '/' || rel === '') rel = '/index.html';
  const full = path.normalize(path.join(root, rel));
  if (full !== root && !full.startsWith(root + path.sep)) return null;
  return full;
}

const server = http.createServer((req, res) => {
  if (req.url === '/api/info') {
    res.writeHead(200, { 'content-type': MIME['.json'], 'cache-control': 'no-store' });
    res.end(JSON.stringify({ urls: lanUrls(), port: PORT }));
    return;
  }
  const file = resolveStatic(req.url || '/');
  if (!file) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
      return;
    }
    res.writeHead(200, {
      'content-type': MIME[path.extname(file)] || 'application/octet-stream',
      'cache-control': 'no-cache',
    });
    fs.createReadStream(file).pipe(res);
  });
});

// ---------------------------------------------------------------------------

const send = (ws, msg) => {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg));
};

const cleanName = (n, fallback) => {
  const s = String(n || '').replace(/[^\p{L}\p{N} _.\-!?']/gu, '').trim().slice(0, 16);
  return s || fallback;
};

const randomSeed = () => crypto.randomBytes(3).toString('hex');

// ---------------------------------------------------------------------------
// Saved progress: one save per mode on disk, so a session can pick up where
// it left off after the server restarts. The file holds the last-played mode's
// save at the top level (older versions only had that) and the rest in `others`.

const ids = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === 'string') : []);

function parseSave(s, fallbackMode) {
  if (!s || typeof s.seed !== 'string' || !Number.isInteger(s.levelIndex) || s.levelIndex < 0) return null;
  const mode = MODES[s.mode] ? s.mode : fallbackMode;
  const cps = Array.isArray(s.checkpoints) ? s.checkpoints : [];
  return {
    version: 1,
    mode,
    seed: s.seed.replace(/[^\w-]/g, '').slice(0, 24),
    levelIndex: Math.min(levelCount(mode) - 1, s.levelIndex),
    levelName: String(s.levelName || ''),
    levelKey: String(s.levelKey || ''),
    checkpoints: [0, 1].map((i) => (Number.isInteger(cps[i]) && cps[i] > 0 ? cps[i] : 0)),
    totalCheckpoints: Number(s.totalCheckpoints) || 0,
    gems: ids(s.gems),
    totalGems: Number(s.totalGems) || 0,
    latchedSignals: ids(s.latchedSignals),
    latchedActs: ids(s.latchedActs),
    usedItems: ids(s.usedItems),
    notes: ids(s.notes),
    savedAt: Number(s.savedAt) || 0,
  };
}

function readSaves() {
  try {
    const s = JSON.parse(fs.readFileSync(SAVE_FILE, 'utf8'));
    const saves = {};
    const top = parseSave(s, 'classic');
    if (top) saves[top.mode] = top;
    if (s && s.others && typeof s.others === 'object') {
      for (const [mode, v] of Object.entries(s.others)) {
        if (!MODES[mode] || saves[mode]) continue;
        const parsed = parseSave({ ...v, mode }, mode);
        if (parsed) saves[mode] = parsed;
      }
    }
    return { saves, last: top ? top.mode : Object.keys(saves)[0] || 'classic' };
  } catch {
    return { saves: {}, last: 'classic' };
  }
}

function writeSaves(saves, last) {
  const modes = Object.keys(saves).filter((k) => saves[k]);
  if (!modes.length) {
    fs.rmSync(SAVE_FILE, { force: true });
    return;
  }
  const top = saves[last] ? last : modes[0];
  const others = Object.fromEntries(modes.filter((k) => k !== top).map((k) => [k, saves[k]]));
  fs.mkdirSync(path.dirname(SAVE_FILE), { recursive: true });
  const tmp = `${SAVE_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify({ ...saves[top], others }, null, 2));
  fs.renameSync(tmp, SAVE_FILE);
}

// Which designed level sits at this index (saves remember it).
const keyOf = (mode, i) => (MODES[mode] && MODES[mode].list && MODES[mode].list[i] ? MODES[mode].list[i].key : '');

function freshSave(mode, seed, levelIndex) {
  const level = buildLevel(mode, seed, levelIndex);
  return {
    version: 1, mode, seed, levelIndex, levelName: level.name, levelKey: keyOf(mode, levelIndex),
    checkpoints: [0, 0], totalCheckpoints: level.checkpoints.length,
    gems: [], totalGems: level.gems.length, latchedSignals: [], latchedActs: [], usedItems: [], notes: [], savedAt: Date.now(),
  };
}

class Room {
  constructor() {
    this.slots = [null, null];
    this.phase = 'lobby';
    this.mode = 'classic';
    this.seed = randomSeed();
    this.levelIndex = 0;
    this.level = null;
    this.puzzle = null;
    this.monsters = [];
    this.notes = new Set();
    this.lastTick = 0;
    this.startTime = 0;
    this.gems = new Set();
    this.cps = [0, 0]; // checkpoint reached by each character
    this.latchCount = 0;
    this.lastWorld = '';
    this.saveTimer = null;
    const { saves, last } = readSaves();
    this.saves = saves;
    this.mode = last;
    for (const sv of Object.values(this.saves)) {
      // Levels can change between versions. A save made for a different level
      // than the one now at its index keeps its place but not its progress
      // (the old 100-level procedural campaign starts over at level 1).
      const key = keyOf(sv.mode, sv.levelIndex);
      if (sv.levelKey !== key) {
        if (sv.mode === 'classic' && !sv.levelKey) sv.levelIndex = 0;
        Object.assign(sv, { checkpoints: [0, 0], gems: [], latchedSignals: [], latchedActs: [], usedItems: [], notes: [], levelKey: keyOf(sv.mode, sv.levelIndex) });
      }
      const level = buildLevel(sv.mode, sv.seed, sv.levelIndex);
      sv.levelName = level.name;
      sv.totalCheckpoints = level.checkpoints.length;
      sv.totalGems = level.gems.length;
      sv.checkpoints = sv.checkpoints.map((c) => Math.min(c, level.checkpoints.length - 1));
    }
    if (this.save) {
      this.seedFromSave();
      log(`loaded saved game: ${MODES[this.mode].label} ${this.levelIndex + 1} "${this.save.levelName}", checkpoints ${this.save.checkpoints.join('/')}`);
    }
    setInterval(() => this.tick(), 50);
  }

  // The save for the mode picked in the lobby.
  get save() {
    return this.saves[this.mode] || null;
  }

  set save(v) {
    if (v) this.saves[this.mode] = v;
    else delete this.saves[this.mode];
  }

  saveSummary(mode = this.mode) {
    const s = this.saves[mode];
    if (!s) return null;
    return {
      mode,
      seed: s.seed,
      levelIndex: s.levelIndex,
      levelName: s.levelName,
      checkpoint: Math.max(...s.checkpoints),
      totalCheckpoints: s.totalCheckpoints,
      gems: s.gems.length,
      totalGems: s.totalGems,
      savedAt: s.savedAt,
      // Only procedural levels would depend on the world seed.
      matches: mode === this.mode && s.levelIndex === this.levelIndex && (!!MODES[mode].list || s.seed === this.seed),
    };
  }

  // Does the save on disk describe the level about to start?
  saveMatches() {
    const s = this.save;
    return !!s && s.levelIndex === this.levelIndex && (!!MODES[this.mode].list || s.seed === this.seed);
  }

  // Snapshot the current level's progress and write it shortly.
  persist() {
    if (!this.level || !this.puzzle) return;
    this.save = {
      version: 1,
      mode: this.mode,
      seed: this.seed,
      levelIndex: this.levelIndex,
      levelName: this.level.name,
      levelKey: keyOf(this.mode, this.levelIndex),
      checkpoints: [...this.cps],
      totalCheckpoints: this.level.checkpoints.length,
      gems: [...this.gems],
      totalGems: this.level.gems.length,
      latchedSignals: [...this.puzzle.latchedSignals],
      latchedActs: [...this.puzzle.latchedActs],
      usedItems: this.puzzle.usedItems(),
      notes: [...this.notes],
      savedAt: Date.now(),
    };
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.flush(), 200);
  }

  flush() {
    clearTimeout(this.saveTimer);
    this.saveTimer = null;
    try {
      writeSaves(this.saves, this.mode);
    } catch (err) {
      log(`could not save progress: ${err.message}`);
    }
  }

  // Lobby defaults to wherever the save says to continue.
  seedFromSave() {
    if (!this.save) return;
    if (this.save.seed) this.seed = this.save.seed;
    this.levelIndex = this.save.levelIndex;
  }

  // Run puzzle logic; publish changes and save when a switch latches.
  evaluate() {
    if (!this.puzzle) return;
    if (this.puzzle.evaluate(Date.now())) this.publishWorld();
    const n = this.puzzle.latchedSignals.size + this.puzzle.latchedActs.size;
    if (n !== this.latchCount) {
      this.latchCount = n;
      this.persist();
    }
  }

  connected() {
    return this.slots.filter((s) => s && s.ws);
  }

  other(slot) {
    return this.slots[1 - slot];
  }

  broadcast(msg, exceptSlot = -1) {
    this.slots.forEach((s, i) => {
      if (s && i !== exceptSlot) send(s.ws, msg);
    });
  }

  lobbyState() {
    return {
      t: 'lobby',
      phase: this.phase,
      mode: this.mode,
      seed: this.seed,
      levelIndex: this.levelIndex,
      urls: lanUrls(),
      save: this.saveSummary(),
      saves: Object.fromEntries(Object.keys(MODES).map((m) => [m, this.saveSummary(m)])),
      players: this.slots.map((s, i) => (s ? { slot: i, name: s.name, ready: s.ready, connected: !!s.ws } : null)),
    };
  }

  sendLobby() {
    this.broadcast(this.lobbyState());
  }

  join(ws, msg) {
    // Reconnect by token first, then the requested free slot, then any free slot.
    let slot = this.slots.findIndex((s) => s && msg.token && s.token === msg.token);
    if (slot >= 0 && this.slots[slot].ws && this.slots[slot].ws !== ws) {
      try { this.slots[slot].ws.close(4000, 'replaced'); } catch { /* ignore */ }
    }
    if (slot < 0) slot = this.slots.findIndex((s) => !s || !s.ws);
    // Both seats held by one device (a second game tab left open there):
    // a new device takes the seat that joined last instead of being shut out.
    if (slot < 0 && this.slots[0].ws.ip === this.slots[1].ws.ip && ws.ip !== this.slots[0].ws.ip) {
      slot = this.slots[0].ws.joinedAt > this.slots[1].ws.joinedAt ? 0 : 1;
      const old = this.slots[slot].ws;
      log(`another device takes ${this.slots[slot].name}'s seat (both seats were open on one device)`);
      this.leave(old);
      try { old.close(4001, 'taken'); } catch { /* ignore */ }
    }
    if (slot < 0) {
      send(ws, { t: 'full' });
      ws.close();
      return null;
    }
    const prev = this.slots[slot];
    const token = prev && prev.token === msg.token ? prev.token : crypto.randomUUID();
    const p = prev && prev.token === token
      ? prev
      : { token, name: '', ready: false, deaths: 0, inGoal: false, continued: false };
    p.ws = ws;
    ws.joinedAt = Date.now();
    p.name = cleanName(msg.name, slot === 0 ? 'Player 1' : 'Player 2');
    this.slots[slot] = p;
    ws.slot = slot;
    send(ws, { t: 'welcome', slot, token, serverTime: Date.now() });
    this.broadcast({ t: 'peer', slot, connected: true, name: p.name }, slot);
    this.sendLobby();
    if (this.phase !== 'lobby') this.sendStart(slot);
    log(`${p.name} joined as ${slot === 0 ? 'Sol' : 'Luna'}`);
    return slot;
  }

  leave(ws) {
    const slot = ws.slot;
    if (slot === undefined) return;
    const p = this.slots[slot];
    if (!p || p.ws !== ws) return;
    p.ws = null;
    p.ready = false;
    p.inGoal = false;
    if (this.puzzle) {
      this.puzzle.clearSlot(slot);
      this.puzzle.dropSlot(slot);
      this.evaluate();
      this.publishWorld();
    }
    this.broadcast({ t: 'peer', slot, connected: false, name: p.name });
    log(`${p.name} disconnected`);
    if (this.connected().length === 0) {
      // Everyone left: back to the lobby. Progress stays in the save.
      if (this.level) this.flush();
      this.slots = [null, null];
      this.phase = 'lobby';
      this.level = null;
      this.puzzle = null;
      this.monsters = [];
      this.seedFromSave();
    }
    this.sendLobby();
  }

  // resume: continue from the save if it is for this seed and level.
  startLevel(resume = true) {
    this.level = buildLevel(this.mode, this.seed, this.levelIndex);
    const errors = validateLevel(this.level);
    if (errors.length) log(`level warnings: ${errors.join('; ')}`);
    this.puzzle = new PuzzleState(this.level);
    this.monsters = (this.level.monsters || []).map((def) => new MonsterSim(this.level, def));
    this.gems = new Set();
    this.notes = new Set();
    this.cps = [0, 0];
    const s = this.save;
    if (resume && this.saveMatches()) {
      const maxCp = this.level.checkpoints.length - 1;
      this.cps = s.checkpoints.map((c) => Math.max(0, Math.min(maxCp, c)));
      const gemIds = new Set(this.level.gems.map((g) => g.id));
      for (const id of s.gems) if (gemIds.has(id)) this.gems.add(id);
      for (const id of s.latchedSignals) if (this.puzzle.signalDefs.has(id)) this.puzzle.latchedSignals.add(id);
      const actIds = new Set(this.level.acts.map((a) => a.id));
      for (const id of s.latchedActs) if (actIds.has(id)) this.puzzle.latchedActs.add(id);
      this.puzzle.restoreUsed(s.usedItems || []);
      const noteIds = new Set((this.level.notes || []).map((n) => n.id));
      for (const id of s.notes || []) if (noteIds.has(id)) this.notes.add(id);
      if (this.cps.some((c) => c > 0) || this.gems.size) log(`resuming from checkpoints ${this.cps.join('/')} with ${this.gems.size} buttons`);
    }
    this.puzzle.evaluate(Date.now());
    this.latchCount = this.puzzle.latchedSignals.size + this.puzzle.latchedActs.size;
    // Stories open with an intro card to read before the countdown.
    this.startTime = Date.now() + 3500 + (this.level.story?.introMs || 0);
    this.puzzle.startFloods(this.startTime);
    this.phase = 'playing';
    for (const p of this.slots) {
      if (!p) continue;
      p.deaths = 0;
      p.inGoal = false;
      p.continued = false;
      p.ready = false;
      p.pos = null;
      p.alive = true;
      p.graceUntil = 0;
    }
    log(`starting "${this.level.name}" (${MODES[this.mode].label} ${this.levelIndex + 1}${MODES[this.mode].list ? '' : `, seed ${this.seed}`})`);
    this.persist();
    this.slots.forEach((p, i) => p && p.ws && this.sendStart(i));
    this.sendLobby();
  }

  sendStart(slot) {
    const p = this.slots[slot];
    if (!p || !this.level) return;
    send(p.ws, {
      t: 'start',
      mode: this.mode,
      seed: this.seed,
      levelIndex: this.levelIndex,
      startTime: this.startTime,
      world: this.puzzle.snapshot(),
      gems: [...this.gems],
      notes: [...this.notes],
      checkpoints: [...this.cps],
      phase: this.phase,
    });
  }

  publishWorld() {
    if (!this.puzzle) return;
    const snap = this.puzzle.snapshot();
    const key = JSON.stringify(snap);
    if (key === this.lastWorld) return;
    this.lastWorld = key;
    this.broadcast({ t: 'world', ...snap });
  }

  tick() {
    if (this.phase !== 'playing' || !this.puzzle) return;
    this.evaluate();
    if (this.monsters.length) this.tickMonsters();
  }

  inZoneKind(pos, kind) {
    for (const z of this.level.zones || []) {
      if (z.kind === kind && inside(z, pos[0], pos[1], pos[2])) return true;
    }
    return false;
  }

  isHidden(pos) {
    return this.inZoneKind(pos, 'hide');
  }

  tickMonsters() {
    const now = Date.now();
    const dt = this.lastTick ? Math.min(0.1, (now - this.lastTick) / 1000) : 0.05;
    this.lastTick = now;
    const torch = !!this.level.theme.dark;
    const players = this.slots.map((s) => (s && s.ws && s.pos
      ? {
        pos: s.pos, look: s.look, torch, alive: s.alive !== false, present: true,
        hidden: this.isHidden(s.pos), safe: this.inZoneKind(s.pos, 'safe'), grace: (s.graceUntil || 0) > now,
      }
      : null));
    const t = (now - this.startTime) / 1000;
    const sig = this.puzzle.signals;
    for (const m of this.monsters) {
      const over = !!m.def.until && sig[m.def.until] === 1;
      if (!m.awake && !over && m.def.active && sig[m.def.active] === 1) m.wake(m.def.wakeAt);
      if (now < this.startTime) continue;
      // Rules bind it too: under a red light it has to stand still.
      const fz = m.def.freeze && this.level.zones.find((z) => z.id === m.def.freeze);
      const frozen = !!fz && redState(fz, t).red && inside(fz, m.pos[0], m.pos[1], m.pos[2]);
      for (const e of m.update(dt, players, this.puzzle.acts, { frozen, over })) {
        if (e.kind === 'caught') {
          const p = this.slots[e.slot];
          if (p) {
            p.graceUntil = now + 4000;
            p.caughtAt = now; // you keep what you carry when it catches you
          }
          this.puzzle.clearSlot(e.slot);
          this.broadcast({ t: 'caught', slot: e.slot, id: m.def.id });
          this.evaluate();
        } else if (e.kind === 'spotted' || e.kind === 'gaveup' || e.kind === 'vanish') {
          this.broadcast({ t: 'fx', kind: e.kind, id: m.def.id, slot: e.slot, why: e.why });
        }
      }
    }
    this.broadcast({ t: 'mon', m: this.monsters.map((m) => m.state()) });
  }

  checkComplete() {
    if (this.phase !== 'playing') return;
    const players = this.connected();
    if (players.length === 0 || !players.every((p) => p.inGoal)) return;
    this.phase = 'complete';
    // The save now points at the next level, so a restart continues there.
    const hasNext = this.levelIndex + 1 < levelCount(this.mode);
    this.save = freshSave(this.mode, this.seed, hasNext ? this.levelIndex + 1 : this.levelIndex);
    this.flush();
    const time = (Date.now() - this.startTime) / 1000;
    this.broadcast({
      t: 'complete',
      time,
      gems: this.gems.size,
      totalGems: this.level.gems.length,
      deaths: this.slots.map((s) => (s ? s.deaths : 0)),
      name: this.level.name,
      levelIndex: this.levelIndex,
      mode: this.mode,
      last: !hasNext,
    });
    log(`level complete in ${time.toFixed(1)}s`);
  }

  toLobby() {
    if (this.level) this.flush();
    this.phase = 'lobby';
    this.level = null;
    this.puzzle = null;
    this.monsters = [];
    this.seedFromSave();
    for (const s of this.slots) if (s) s.ready = false;
    this.broadcast({ t: 'toLobby' });
    this.sendLobby();
  }

  handle(ws, msg) {
    if (msg.t === 'hello') {
      this.join(ws, msg);
      return;
    }
    if (msg.t === 'ping') {
      send(ws, { t: 'pong', c: msg.c, s: Date.now() });
      return;
    }
    const slot = ws.slot;
    if (slot === undefined) return;
    const p = this.slots[slot];
    if (!p || p.ws !== ws) return;

    switch (msg.t) {
      case 'st':
        if (this.phase !== 'lobby') {
          if (Array.isArray(msg.p) && msg.p.length === 3 && msg.p.every(Number.isFinite)) p.pos = msg.p;
          p.look = Number.isFinite(msg.ly) ? msg.ly : null;
          p.alive = !((msg.f | 0) & 16);
          msg.slot = slot;
          const o = this.other(slot);
          if (o) send(o.ws, msg);
        }
        break;
      case 'name':
        p.name = cleanName(msg.name, p.name);
        this.sendLobby();
        break;
      case 'ready':
        if (this.phase !== 'lobby') break;
        p.ready = !!msg.v;
        this.sendLobby();
        if (this.slots.every((s) => s && s.ws && s.ready)) this.startLevel(true);
        break;
      case 'solo':
        if (this.phase === 'lobby' && this.connected().length === 1) this.startLevel(true);
        break;
      case 'loadSave':
        if (this.phase !== 'lobby' || !this.save) break;
        this.seedFromSave();
        this.sendLobby();
        break;
      case 'newGame':
        // Start over: forget this mode's saved progress and go back to its first level.
        if (this.phase !== 'lobby') break;
        this.save = null;
        this.flush();
        this.levelIndex = 0;
        log('saved progress cleared');
        this.sendLobby();
        break;
      case 'swap':
        if (this.phase !== 'lobby') break;
        this.slots.reverse();
        this.slots.forEach((s, i) => {
          if (s && s.ws) {
            s.ws.slot = i;
            send(s.ws, { t: 'welcome', slot: i, token: s.token, serverTime: Date.now() });
          }
        });
        this.sendLobby();
        break;
      case 'seed':
        if (this.phase !== 'lobby') break;
        if (typeof msg.mode === 'string' && MODES[msg.mode]) this.mode = msg.mode;
        this.seed = String(msg.seed || '').replace(/[^\w-]/g, '').slice(0, 24) || this.seed || randomSeed();
        this.levelIndex = Math.max(0, Math.min(levelCount(this.mode) - 1, Math.floor(Number(msg.levelIndex) || 0)));
        this.sendLobby();
        break;
      case 'plate':
        if (this.phase === 'playing' && this.puzzle) {
          this.puzzle.setPlate(slot, msg.id, !!msg.on);
          this.evaluate();
        }
        break;
      case 'pound':
        if (this.phase !== 'playing' || !this.puzzle) break;
        if (typeof msg.id === 'string' && msg.id.includes(':')) {
          // Seesaw end: catapult whoever stands on the other end.
          const [id, end] = msg.id.split(':');
          this.broadcast({ t: 'fx', kind: 'seesaw', id, end, by: slot });
        } else {
          const r = this.puzzle.pound(msg.id, Date.now());
          if (r && r.dial) this.broadcast({ t: 'fx', kind: 'dial', id: r.dial, v: r.v, by: slot });
          else if (r) this.broadcast({ t: 'fx', kind: 'seq', id: r.seq, n: r.n, ok: r.ok, by: slot });
          this.evaluate();
        }
        break;
      case 'take':
        if (this.phase === 'playing' && this.puzzle && this.puzzle.take(slot, msg.id)) {
          this.broadcast({ t: 'fx', kind: 'take', id: msg.id, by: slot });
          this.evaluate();
        }
        break;
      case 'use':
        if (this.phase === 'playing' && this.puzzle) {
          const item = this.puzzle.use(slot, msg.id);
          if (item) {
            this.broadcast({ t: 'fx', kind: 'use', id: msg.id, item, by: slot });
            this.evaluate();
            this.persist();
          }
        }
        break;
      case 'zone':
        if (this.phase === 'playing' && this.puzzle && this.puzzle.zone(msg.id)) {
          const z = this.level.zones.find((x) => x.id === msg.id);
          if (z && z.monster) {
            const m = this.monsters.find((x) => x.def.id === z.monster);
            if (m) m.wake(z.at);
          }
          this.evaluate();
          this.persist();
        }
        break;
      case 'warp':
        // A warp that takes both of you (a wrong turn, a looping corridor).
        if (this.phase === 'playing' && this.level && (this.level.zones || []).some((z) => z.id === msg.id && z.kind === 'warp' && z.both)) {
          this.puzzle.clearSlot(0);
          this.puzzle.clearSlot(1);
          this.broadcast({ t: 'fx', kind: 'warp', id: msg.id, by: slot });
          this.evaluate();
        }
        break;
      case 'trap':
        // A prank block went off: play it for the partner too.
        if (this.phase === 'playing' && typeof msg.id === 'string') this.broadcast({ t: 'fx', kind: 'trap', id: msg.id.slice(0, 16) }, slot);
        break;
      case 'note':
        if (this.phase === 'playing' && this.level && !this.notes.has(msg.id) && (this.level.notes || []).some((n) => n.id === msg.id)) {
          this.notes.add(msg.id);
          this.broadcast({ t: 'note', id: msg.id, by: slot, count: this.notes.size });
          this.persist();
        }
        break;
      case 'scare':
        // Broke a story rule: the partner sees it happen.
        if (this.phase === 'playing') p.caughtAt = Date.now();
        if (this.phase === 'playing') this.broadcast({ t: 'fx', kind: 'scare', slot, rule: String(msg.rule || '').slice(0, 24) }, slot);
        break;
      case 'crumble':
        // Someone stepped on a crumbling tile: start it falling for the partner too.
        if (this.phase === 'playing' && typeof msg.id === 'string') this.broadcast({ t: 'fx', kind: 'crumble', id: msg.id.slice(0, 16) }, slot);
        break;
      case 'gem':
        if (this.phase === 'playing' && this.level && !this.gems.has(msg.id) && this.level.gems.some((g) => g.id === msg.id)) {
          this.gems.add(msg.id);
          this.broadcast({ t: 'gem', id: msg.id, by: slot, count: this.gems.size });
          this.persist();
        }
        break;
      case 'cp':
        if (this.phase === 'playing' && Number.isInteger(msg.idx) && msg.idx > this.cps[slot] && msg.idx < this.level.checkpoints.length) {
          this.cps[slot] = msg.idx;
          this.broadcast({ t: 'cp', slot, idx: msg.idx });
          this.persist();
        }
        break;
      case 'died':
        if (this.phase === 'playing') {
          p.deaths++;
          if (this.puzzle) {
            this.puzzle.clearSlot(slot);
            // A fall puts what you carried back where it was; being caught or
            // scared by a broken rule doesn't (the long walk back is enough).
            if (Date.now() - (p.caughtAt || 0) > 3000) this.puzzle.dropSlot(slot);
            this.puzzle.resetFloods?.(Date.now());
            this.evaluate();
          }
        }
        break;
      case 'goal':
        p.inGoal = !!msg.in;
        this.broadcast({ t: 'goal', slot, in: p.inGoal });
        this.checkComplete();
        break;
      case 'continue':
        if (this.phase !== 'complete') break;
        p.continued = true;
        this.broadcast({ t: 'continued', slot });
        if (this.connected().every((s) => s.continued)) {
          if (this.levelIndex + 1 < levelCount(this.mode)) {
            this.levelIndex++;
            this.startLevel(true);
          } else {
            // End of this mode's list: back to the lobby.
            this.toLobby();
          }
        }
        break;
      case 'restart':
        if (this.phase !== 'lobby') {
          // Restart means from the top of the level, so don't resume.
          this.broadcast({ t: 'toast', text: `${p.name} restarted the level` });
          this.startLevel(false);
        }
        break;
      case 'lobby':
        this.toLobby();
        break;
      case 'emote':
        this.broadcast({ t: 'emote', slot, k: String(msg.k || '').slice(0, 12) }, slot);
        break;
      default:
        break;
    }
  }
}

function log(s) {
  const t = new Date().toLocaleTimeString();
  console.log(`\x1b[90m${t}\x1b[0m ${s}`);
}

const room = new Room();
const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });

server.on('upgrade', (req, socket, head) => {
  if (!req.url || !req.url.startsWith('/ws')) {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
});

wss.on('connection', (ws, req) => {
  ws.ip = req.socket.remoteAddress;
  ws.isAlive = true;
  ws.on('pong', () => (ws.isAlive = true));
  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }
    if (msg && typeof msg.t === 'string') room.handle(ws, msg);
  });
  ws.on('close', () => room.leave(ws));
  ws.on('error', () => {});
});

setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    ws.ping();
  }
}, 10000);

// Write any pending save before exiting (Ctrl+C).
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    if (room.saveTimer) room.flush();
    process.exit(0);
  });
}

function listen(port, attemptsLeft) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      listen(port + 1, attemptsLeft - 1);
    } else {
      console.error(err.message);
      process.exit(1);
    }
  });
  server.listen(port, '0.0.0.0', () => {
    PORT = port;
    const urls = lanUrls();
    const pink = (s) => `\x1b[1;95m${s}\x1b[0m`;
    console.log('');
    console.log(pink('  Sol & Luna — LAN co-op server'));
    console.log('');
    console.log(`  You:       http://localhost:${port}`);
    for (const u of urls) console.log(`  Partner:   ${u}`);
    if (!urls.length) console.log('  (No LAN address found — are you connected to Wi-Fi?)');
    console.log('');
    console.log('  Both players open a URL in a browser on the same Wi-Fi.');
    console.log('');
  });
}

listen(BASE_PORT, 10);
