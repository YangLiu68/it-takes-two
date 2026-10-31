// App flow: lobby → level → complete → next level, plus the main loop.

import { Graphics } from './gfx.js';
import { Input } from './input.js';
import { AudioEngine } from './audio.js';
import { Hud } from './hud.js';
import { Net } from './net.js';
import { Game } from './game.js';
import { loadSettings, saveSettings } from './settings.js';
import { generateLevel } from '../shared/levelgen.js';
import { buildLevel, levelMenu, levelLabel, levelCount, MODES } from '../shared/levels.js';
import { CHARACTERS } from '../shared/constants.js';
import { loadCharacterModels } from './character-model.js';
import { TouchControls } from './touch.js';

const $ = (id) => document.getElementById(id);
const settings = loadSettings();
const canvas = $('view');
// Test bots (?bot): cheap graphics so two of them can run side by side.
const BOT = new URLSearchParams(location.search).has('bot');
if (BOT) Object.assign(settings, { quality: 'low', autoQuality: false, volume: 0, music: 0 });

function fatal(text) {
  const b = $('banner');
  b.textContent = text;
  b.hidden = false;
}

let gfx;
try {
  gfx = new Graphics(canvas, settings);
} catch (err) {
  fatal('Your browser could not start WebGL 2. Please use a recent Chrome, Edge, Firefox or Safari.');
  throw err;
}

const input = new Input(canvas);
const touch = new TouchControls($('touch'), { onPause: () => setPaused(true) });
input.touch = touch;
const audio = new AudioEngine(settings);
const hud = new Hud();
const net = new Net();
const app = { gfx, input, audio, hud, net, settings, names: ['', ''], solo: false, models: null, renderEvery: BOT ? 3 : 0 };
app.models = await loadCharacterModels();

let game = null;
let lobby = null;
let screen = 'lobby'; // lobby | playing | complete
let paused = false;
let previewKey = '';
let previewTimer = 0;

gfx.onDowngrade = (q) => hud.toast(`Graphics lowered to ${{ high: 'High', medium: 'Medium', low: 'Low' }[q] || q} for smoother play`);

// ---------------------------------------------------------------------------
// Lobby

const nameInput = $('name');
const seedInput = $('seed');
const levelSelect = $('level-select');

// Lobby tabs: Courses (new prank courses + the classic campaign), Puzzle, Horror.
const TABS = {
  course: { modes: ['classic', 'course'], label: 'Level' },
  puzzle: { modes: ['puzzle'], label: 'Room' },
  horror: { modes: ['horror'], label: 'Night' },
};
const tabOf = (mode) => (mode === 'puzzle' || mode === 'horror' ? mode : 'course');
let tab = 'course';
let builtTab = '';

function fillLevelSelect(t) {
  if (builtTab === t) return;
  builtTab = t;
  levelSelect.innerHTML = '';
  for (const mode of TABS[t].modes) {
    const group = document.createElement('optgroup');
    group.label = mode === 'classic' ? `${MODES.classic.title} (${levelCount('classic')} levels)` : MODES[mode].title;
    for (const item of levelMenu(mode)) {
      const o = document.createElement('option');
      o.value = `${mode}:${item.index}`;
      o.textContent = item.title === item.label ? item.label : `${item.label} · ${item.title}`;
      group.appendChild(o);
    }
    levelSelect.appendChild(group);
  }
  $('level-label').textContent = TABS[t].label;
}

function parsePick(v) {
  const [mode, i] = String(v).split(':');
  return { mode: MODES[mode] ? mode : 'classic', levelIndex: Math.max(0, Number(i) || 0) };
}

document.querySelectorAll('.mode-tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    const t = btn.dataset.tab;
    audio.play('click');
    if (!lobby || tabOf(lobby.mode) === t) return;
    // Jump to where that mode's save left off, else its first level.
    const mode = TABS[t].modes[0];
    const sv = lobby.saves && lobby.saves[mode];
    sendSeed(mode, sv ? sv.levelIndex : 0);
  });
});

nameInput.value = settings.name || '';

function myName() {
  return nameInput.value.trim() || (net.slot === 1 ? 'Player 2' : 'Player 1');
}

nameInput.addEventListener('change', () => {
  settings.name = nameInput.value.trim();
  saveSettings(settings);
  net.name = settings.name;
  net.send({ t: 'name', name: myName() });
});

let seedTimer = 0;
function sendSeed(mode, levelIndex) {
  const pick = mode ? { mode, levelIndex } : parsePick(levelSelect.value);
  net.send({ t: 'seed', seed: seedInput.value.trim(), ...pick });
}
seedInput.addEventListener('input', () => {
  clearTimeout(seedTimer);
  seedTimer = setTimeout(sendSeed, 400);
});
levelSelect.addEventListener('change', () => sendSeed());
$('dice').addEventListener('click', () => {
  const words = ['cozy', 'fuzzy', 'sunny', 'tiny', 'giant', 'happy', 'sleepy', 'bouncy', 'secret', 'velvet'];
  const nouns = ['spool', 'button', 'teapot', 'kite', 'acorn', 'marble', 'pebble', 'cloud', 'mitten', 'lantern'];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  seedInput.value = `${pick(words)}-${pick(nouns)}-${Math.floor(Math.random() * 90 + 10)}`;
  audio.play('click');
  sendSeed();
});
$('ready').addEventListener('click', () => {
  const me = lobby && lobby.players[net.slot];
  net.send({ t: 'name', name: myName() });
  net.send({ t: 'ready', v: !(me && me.ready) });
  audio.play('click');
});
$('swap').addEventListener('click', () => {
  net.send({ t: 'swap' });
  audio.play('click');
});
$('solo').addEventListener('click', () => {
  net.send({ t: 'name', name: myName() });
  net.send({ t: 'solo' });
});
$('save-load').addEventListener('click', () => {
  net.send({ t: 'loadSave' });
  audio.play('click');
});
$('save-reset').addEventListener('click', () => {
  if (confirm('Start over from the first level? The save for this mode will be erased.')) net.send({ t: 'newGame' });
});

function ago(ts) {
  const s = Math.max(0, (Date.now() - ts) / 1000);
  const n = (v, unit) => `${v} ${unit}${v === 1 ? '' : 's'} ago`;
  if (s < 60) return 'just now';
  if (s < 3600) return n(Math.round(s / 60), 'minute');
  if (s < 86400) return n(Math.round(s / 3600), 'hour');
  return n(Math.round(s / 86400), 'day');
}

$('copy').addEventListener('click', async () => {
  const text = $('share-url').textContent;
  let ok = false;
  try {
    await navigator.clipboard.writeText(text);
    ok = true;
  } catch {
    const r = document.createRange();
    r.selectNodeContents($('share-url'));
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
    ok = document.execCommand('copy');
  }
  $('copy').textContent = ok ? 'Copied!' : 'Copy it by hand';
  setTimeout(() => ($('copy').textContent = 'Copy'), 1600);
});

function renderLobby() {
  if (!lobby) return;
  const players = lobby.players;
  app.names = players.map((p, i) => (p ? p.name : CHARACTERS[i].name));
  document.querySelectorAll('.pcard').forEach((card) => {
    const slot = Number(card.dataset.slot);
    const p = players[slot];
    const connected = p && p.connected;
    card.classList.toggle('me', slot === net.slot);
    card.classList.toggle('empty', !connected);
    card.classList.toggle('ready', !!(connected && p.ready));
    card.querySelector('.pname').textContent = connected ? `${p.name}${slot === net.slot ? ' (you)' : ''}` : 'Waiting for partner...';
    card.querySelector('.pstate').textContent = connected ? (p.ready ? '✓ Ready' : 'Not ready') : '';
  });
  const me = players[net.slot];
  const sv = lobby.save;
  const hasSave = !!sv && (sv.levelIndex > 0 || sv.checkpoint > 0 || sv.gems > 0);
  $('save-card').hidden = !hasSave;
  if (hasSave) {
    $('save-title').textContent = sv.matches ? 'Continue where you left off' : 'You have a saved game';
    const where = sv.checkpoint > 0 ? `checkpoint ${sv.checkpoint}/${sv.totalCheckpoints - 1}` : 'start of the level';
    const label = levelLabel(sv.mode || 'classic', sv.levelIndex);
    const buttons = sv.totalGems ? `, gold buttons ${sv.gems}/${sv.totalGems}` : '';
    $('save-detail').textContent = `${label} · ${sv.levelName} — ${where}${buttons} · saved ${ago(sv.savedAt)}`;
    $('save-load').hidden = sv.matches;
  }
  const ready = $('ready');
  ready.textContent = me && me.ready ? 'Cancel' : hasSave && sv.matches ? 'Continue!' : 'Ready!';
  ready.classList.toggle('on', !!(me && me.ready));
  ready.disabled = !net.connected;
  if (document.activeElement !== seedInput) seedInput.value = lobby.seed;
  const mode = lobby.mode || 'classic';
  tab = tabOf(mode);
  document.querySelectorAll('.mode-tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  fillLevelSelect(tab);
  if (document.activeElement !== levelSelect) levelSelect.value = `${mode}:${lobby.levelIndex}`;
  // Every level is designed by hand now: the world seed doesn't change anything.
  $('seed-field').hidden = true;
  $('fields').classList.add('no-seed');
  const item = levelMenu(mode)[lobby.levelIndex];
  let blurb = item?.blurb || '';
  // The level's own blurb, then a line about the chain.
  if (blurb && !/[.!?]$/.test(blurb)) blurb += '.';
  let chain = '';
  if (mode === 'classic') chain = `${levelCount('classic')} levels, each different and harder than the last, played back to back.`;
  if (mode === 'horror') chain = `${levelCount('horror')} nights, played back to back. ⚠ Horror: dark, jump scares, things that chase you. No gore.`;
  else if (mode === 'puzzle') chain = `${levelCount('puzzle')} rooms, each harder than the last, played back to back.`;
  else if (mode === 'course' && levelCount('course') > 1) chain = `${levelCount('course')} courses, played back to back.`;
  if (chain) blurb = blurb ? `${blurb} ${chain}` : chain;
  $('mode-blurb').textContent = blurb;
  $('lobby-card').classList.toggle('horror', mode === 'horror');
  const others = players.filter((p, i) => p && p.connected && i !== net.slot).length;
  $('solo').hidden = others > 0;
  const urls = lobby.urls || [];
  const host = location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  $('share-url').textContent = isLocal ? urls[0] || location.origin : location.origin;
  let status = '';
  if (!net.connected) status = 'Connecting to the game server...';
  else if (others === 0) status = 'Waiting for your partner to join...';
  else if (me && me.ready) status = 'Waiting for your partner to get ready...';
  else status = 'Your partner is here! Press "Ready!" when you are.';
  $('lobby-status').textContent = status;
  schedulePreview(mode, lobby.seed, lobby.levelIndex);
}

// Lobby backdrop. Indoor modes would put the orbiting camera inside walls, so
// they show the first classic level of the world instead.
function previewLevel(mode, seed, levelIndex) {
  if (mode === 'classic' || mode === 'course') return buildLevel(mode, seed, levelIndex);
  return generateLevel(seed, 0);
}

function schedulePreview(mode, seed, levelIndex) {
  const key = `${mode}:${seed}:${levelIndex}`;
  if (key === previewKey || screen !== 'lobby') return;
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    if (screen !== 'lobby') return;
    previewKey = key;
    setGame(new Game(app, { mode: 'menu', level: previewLevel(mode, seed, levelIndex) }));
  }, game ? 250 : 0);
}

function setGame(g) {
  if (game) game.dispose();
  game = g;
}

function showScreen(name) {
  screen = name;
  if (name !== 'complete') stopCountdown();
  $('lobby').hidden = name !== 'lobby';
  $('complete').hidden = name !== 'complete';
  hud.show(name === 'playing' || name === 'complete');
  if (name !== 'playing') setPaused(false);
}

// ---------------------------------------------------------------------------
// Pause & settings

const setSens = $('set-sens');
const setMusic = $('set-music');
const setVol = $('set-vol');
const setQuality = $('set-quality');
const setInvert = $('set-invert');
const setHints = $('set-hints');

function syncSettingsUI() {
  setSens.value = settings.sensitivity;
  setMusic.value = settings.music;
  setVol.value = settings.volume;
  setQuality.value = settings.autoQuality ? 'auto' : settings.quality;
  setInvert.checked = settings.invertY;
  setHints.checked = settings.hints;
}
syncSettingsUI();

function onSettingsChange() {
  settings.sensitivity = Number(setSens.value);
  settings.music = Number(setMusic.value);
  settings.volume = Number(setVol.value);
  settings.invertY = setInvert.checked;
  settings.hints = setHints.checked;
  const q = setQuality.value;
  if (q === 'auto') settings.autoQuality = true;
  else {
    settings.autoQuality = false;
    if (q !== settings.quality) gfx.setQuality(q);
  }
  audio.applyVolume();
  saveSettings(settings);
}
[setSens, setMusic, setVol, setQuality, setInvert, setHints].forEach((el) => el.addEventListener('input', onSettingsChange));

function setPaused(v) {
  paused = v;
  $('pause').hidden = !v;
  if (game && game.mode === 'play') game.setPaused(v);
  if (v) {
    syncSettingsUI();
    input.unlock();
  }
}

$('resume').addEventListener('click', () => {
  setPaused(false);
  if (!input.usingTouch) input.lock();
});
$('restart').addEventListener('click', () => {
  if (confirm('Restart this level for both of you?')) {
    net.send({ t: 'restart' });
    setPaused(false);
  }
});
$('to-lobby').addEventListener('click', () => {
  if (confirm('Take both of you back to the lobby?')) net.send({ t: 'lobby' });
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && screen === 'playing' && !input.locked) setPaused(!paused);
});

document.addEventListener('pointerlockchange', () => {
  if (!input.locked && screen === 'playing' && !paused && !input.usingPad) setPaused(true);
});

canvas.addEventListener('click', () => {
  audio.ensure();
  if (screen === 'playing' && !paused && !input.usingTouch) input.lock();
});

// Any first gesture unlocks audio.
const unlockAudio = () => {
  audio.ensure();
  if (!audio.music && audio.ctx) {
    if (game && game.mode === 'play') audio.startMusic(game.musicKey);
    else audio.startMusic('lobby');
  }
};
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', unlockAudio);
// iOS only lets audio start from the end of a tap.
window.addEventListener('touchend', unlockAudio);

// ---------------------------------------------------------------------------
// Complete screen

// Every mode is a chain that rolls on by itself: a countdown, then
// "continue" goes out automatically. The server waits for both players.
let nextTimer = 0;
let nextLeft = 0;
let nextLabel = '';
let completeLast = false;

function stopCountdown() {
  clearInterval(nextTimer);
  nextTimer = 0;
}

function sendContinue() {
  stopCountdown();
  if (completeLast) {
    net.send({ t: 'lobby' });
    return;
  }
  net.send({ t: 'continue' });
  $('continue').disabled = true;
  $('continue').textContent = nextLabel;
  $('continue-status').textContent = 'Waiting for your partner...';
}

$('continue').addEventListener('click', sendContinue);
$('complete-lobby').addEventListener('click', () => {
  stopCountdown();
  net.send({ t: 'lobby' });
});

function showComplete(msg) {
  showScreen('complete');
  input.unlock();
  hud.closeStory();
  if (game) game.complete = true;
  const m = Math.floor(msg.time / 60);
  const s = Math.floor(msg.time % 60);
  $('complete-name').textContent = msg.name;
  $('stat-time').textContent = `${m}:${String(s).padStart(2, '0')}`;
  $('stat-gems').textContent = `${msg.gems}/${msg.totalGems}`;
  const level = game && game.level;
  const notes = level && level.notes ? level.notes.length : 0;
  if (!msg.totalGems && notes) {
    $('stat-gems').textContent = `${game.extras.found.size}/${notes}`;
    $('stat-gems-label').textContent = 'Notes found';
  } else $('stat-gems-label').textContent = 'Gold buttons';
  const outro = level && level.story && level.story.outro;
  const story = $('complete-story');
  story.hidden = !outro;
  if (outro) {
    story.innerHTML = '';
    for (const line of outro.lines) {
      const p = document.createElement('p');
      p.textContent = line;
      story.appendChild(p);
    }
  }
  const mode = msg.mode || 'classic';
  const DONE = { classic: 'Level clear!', course: 'Course complete!', puzzle: 'You escaped!', horror: 'You survived!' };
  $('complete-title').textContent = outro ? outro.title : DONE[mode] || DONE.classic;
  $('complete').classList.toggle('horror', mode === 'horror');
  $('stat-falls').textContent = `${msg.deaths[0]} · ${msg.deaths[1]}`;
  const stars = 1 + (msg.gems >= msg.totalGems / 2 ? 1 : 0) + (msg.gems >= msg.totalGems ? 1 : 0);
  document.querySelectorAll('#stars span').forEach((el, i) => el.classList.toggle('on', i < stars));

  // What comes next.
  stopCountdown();
  completeLast = !!msg.last;
  const next = $('complete-next');
  const nextIndex = (msg.levelIndex ?? 0) + 1;
  const item = !msg.last ? levelMenu(mode)[nextIndex] : null;
  next.hidden = false;
  next.classList.toggle('done', !!msg.last);
  if (msg.last) {
    const n = levelCount(mode);
    const ALL = {
      classic: `All levels cleared! You beat all ${n} levels of the ${MODES.classic.title}.`,
      course: `All courses cleared! You beat ${MODES.course.title}.`,
      puzzle: `All rooms cleared! You escaped all ${n} rooms.`,
      horror: `All nights survived! You made it through all ${n} nights.`,
    };
    next.textContent = ALL[mode] || ALL.classic;
    nextLabel = 'Back to lobby';
  } else {
    const what = item.title === item.label ? item.label : `${item.label} · ${item.title}`;
    next.textContent = `Up next: ${what}`;
    nextLabel = mode === 'horror' ? 'Next night' : mode === 'puzzle' ? 'Next room' : 'Next level';
  }
  $('complete-lobby').hidden = !!msg.last;
  const btn = $('continue');
  btn.disabled = false;
  btn.textContent = nextLabel;
  $('continue-status').textContent = '';
  if (!msg.last) {
    nextLeft = outro ? 25 : 15;
    btn.textContent = `${nextLabel} in ${nextLeft}s`;
    nextTimer = setInterval(() => {
      nextLeft--;
      if (nextLeft <= 0) sendContinue();
      else btn.textContent = `${nextLabel} in ${nextLeft}s`;
    }, 1000);
  }
  audio.play('complete');
  if (game && game.level.goal) {
    const g = game.level.goal;
    const p = { x: g.x, y: g.y + 1, z: g.z };
    game.fx.confetti(p, [...game.level.theme.blocks, '#ffffff'], 160);
  }
}

// ---------------------------------------------------------------------------
// Networking

net.on('open', () => renderLobby());
net.on('close', () => {
  const b = $('banner');
  b.textContent = 'Connection lost — reconnecting...';
  b.hidden = false;
});
net.on('welcome', () => {
  $('banner').hidden = true;
  renderLobby();
});
// The page keeps retrying, so it joins by itself once a seat frees up.
net.on('full', () => fatal('This game already has two players. When one of them closes the game page, you will join automatically.'));
net.on('taken', () => fatal('Another device joined the game, so this page gave up its seat. Refresh the page to rejoin.'));
net.on('lobby', (msg) => {
  lobby = msg;
  if (msg.phase === 'lobby' && screen !== 'lobby') backToLobby();
  renderLobby();
});

function backToLobby() {
  showScreen('lobby');
  input.unlock();
  previewKey = '';
  if (game && game.mode === 'play') setGame(null);
  hud.countdown(null);
  hud.fade(0);
  if (audio.ctx) audio.startMusic('lobby');
  if (lobby) schedulePreview(lobby.mode || 'classic', lobby.seed, lobby.levelIndex);
}

net.on('toLobby', backToLobby);

net.on('start', (msg) => {
  const connected = lobby ? lobby.players.filter((p) => p && p.connected).length : 1;
  app.solo = connected < 2;
  clearTimeout(previewTimer);
  previewKey = '';
  const level = buildLevel(msg.mode || 'classic', msg.seed, msg.levelIndex);
  setGame(new Game(app, {
    mode: 'play', level, slot: net.slot, startTime: msg.startTime, world: msg.world, gems: msg.gems, notes: msg.notes, checkpoints: msg.checkpoints,
  }));
  showScreen(msg.phase === 'complete' ? 'complete' : 'playing');
  hud.showClickToPlay(false);
  if (msg.phase === 'complete') game.complete = true;
});

for (const t of ['st', 'world', 'gem', 'cp', 'fx', 'goal', 'peer', 'toast', 'note', 'caught', 'mon']) {
  net.on(t, (msg) => game && game.onNet(msg));
}
net.on('peer', (msg) => {
  if (lobby && lobby.players[msg.slot]) lobby.players[msg.slot].name = msg.name;
  app.names[msg.slot] = msg.name || app.names[msg.slot];
});
net.on('complete', showComplete);
net.on('continued', (msg) => {
  if (msg.slot !== net.slot) $('continue-status').textContent = `${app.names[msg.slot]} is ready!`;
});
net.on('emote', () => {});

net.connect(settings.name || '');

// ---------------------------------------------------------------------------
// Main loop

let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, Math.max(0.0001, (now - last) / 1000));
  last = now;
  const inp = input.sample(settings);
  if (inp.pausePressed && screen === 'playing') setPaused(!paused);
  hud.showClickToPlay(screen === 'playing' && !paused && !input.locked && !input.usingPad && !input.usingTouch);
  touch.setVisible(input.usingTouch && screen === 'playing' && !paused);
  document.body.classList.toggle('touch-play', touch.visible);
  if (game) {
    game.frame(dt, inp);
    if (game.mode === 'play') gfx.trackFps(dt);
  }
}
requestAnimationFrame(loop);

// Debug handle for the console.
window.__itt = { app, get game() { return game; } };
