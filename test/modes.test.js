// The hand-designed modes: every level builds and validates, its puzzles can
// be solved with the pieces it contains, and the monsters behave.
import assert from 'node:assert/strict';
import { buildLevel, levelCount, MODES } from '../public/shared/levels.js';
import { validateLevel } from '../public/shared/levelgen.js';
import { PuzzleState } from '../public/shared/logic.js';
import { MonsterSim, makeWalls, sightClear } from '../public/shared/monster.js';
import { redState, inside } from '../public/shared/zones.js';
import { LevelBuilder } from '../public/shared/build.js';

// Dial a combo in: plain dials one by one; linked dials (lights-out style) by
// searching over presses.
function solveCombo(ps, c) {
  const val = () => c.dials.map((d) => ps.dials.get(d).v);
  const done = () => val().every((v, i) => v === c.targets[i]);
  const linked = c.dials.some((d) => ps.dials.get(d).def.links.length);
  if (!linked) {
    for (const d of c.dials) for (let k = 0; k < 20 && ps.dials.get(d).v !== c.targets[c.dials.indexOf(d)]; k++) ps.turn(d);
    ps.evaluate(1);
    return done();
  }
  const all = [...ps.dials.keys()];
  const key = () => all.map((d) => ps.dials.get(d).v).join(',');
  const set = (k) => k.split(',').forEach((v, i) => (ps.dials.get(all[i]).v = Number(v)));
  const start = key();
  const prev = new Map([[start, null]]);
  const q = [start];
  while (q.length) {
    const k = q.shift();
    set(k);
    if (done()) {
      ps.evaluate(1);
      return true;
    }
    for (const d of c.dials) {
      set(k);
      ps.turn(d);
      const n = key();
      if (!prev.has(n) && prev.size < 200000) {
        prev.set(n, k);
        q.push(n);
      }
    }
  }
  set(start);
  return false;
}

// Can act `a` be made to open by turning dials (everything else as solved)?
// Searches over presses of the dials behind the combos it waits on.
function openWithDials(ps, a) {
  const combos = a.when.in.map((id) => ps.combos.get(id)).filter(Boolean);
  if (!combos.length) return false;
  const press = [...new Set(combos.flatMap((c) => c.dials))];
  const all = [...ps.dials.keys()];
  const key = () => all.map((d) => ps.dials.get(d).v).join(',');
  const set = (k) => k.split(',').forEach((v, i) => (ps.dials.get(all[i]).v = Number(v)));
  const open = () => {
    ps.evaluate(1);
    return ps.acts[a.id] === 1;
  };
  const start = key();
  if (open()) return true;
  const seen = new Set([start]);
  const q = [start];
  let ok = false;
  while (q.length && !ok) {
    const k = q.shift();
    for (const d of press) {
      set(k);
      ps.turn(d);
      if (open()) {
        ok = true;
        break;
      }
      const n = key();
      if (!seen.has(n) && seen.size < 300000) {
        seen.add(n);
        q.push(n);
      }
    }
  }
  set(start);
  ps.evaluate(1);
  return ok;
}

let count = 0;
for (const mode of Object.keys(MODES)) {
  if (!MODES[mode].list) continue; // the procedural generator has its own test
  assert.ok(levelCount(mode) > 0, `${mode} has levels`);
  for (let i = 0; i < levelCount(mode); i++) {
    const level = buildLevel(mode, 'any', i);
    if (level.wip) continue; // still being built
    count++;
    const name = `${mode} ${i + 1} (${level.name})`;
    assert.deepEqual(validateLevel(level), [], name);
    assert.equal(JSON.stringify(buildLevel(mode, 'other', i)), JSON.stringify(level), `${name} must not depend on the seed`);
    assert.equal(level.mode, mode);
    assert.ok(level.goal, `${name} has a goal`);

    // Solve it: carry every item to its lock, pound every code in order, hold
    // every plate, enter every zone. Then every door must be open.
    const ps = new PuzzleState(level);
    for (const c of level.combos || []) assert.ok(solveCombo(ps, c), `${name}: combo ${c.id} can be dialled in`);
    for (const z of level.zones) if (z.kind === 'trigger') ps.zone(z.id);
    for (const q of level.seqs) for (const id of q.ids) ps.pound(id, 0);
    for (const p of level.plates) ps.setPlate(0, p.id, true);
    // Every button (timed ones too: the evaluation below happens within their window).
    for (const w of level.switches) if (!w.dial) ps.pound(w.id, 0);
    // Timed buttons pounded together (sync bridges, timers) count while they hold.
    const inSeq = new Set(level.seqs.flatMap((q) => q.ids));
    for (const w of level.switches) if (!w.latch && !w.dial && !inSeq.has(w.id)) ps.pound(w.id, 0);
    ps.evaluate(1);
    for (const l of level.locks) {
      for (const id of l.accepts) {
        const it = level.items.find((x) => x.id === id);
        const slot = it.who ?? 0;
        assert.ok(ps.take(slot, id), `${name}: can pick up ${it.label}`);
        assert.equal(ps.take(1 - slot, id), false, 'someone else is already carrying it');
        assert.equal(ps.use(slot, l.id), id, `${name}: ${it.label} fits ${l.label}`);
        ps.evaluate(1);
      }
    }
    // Anything still shut must open for some setting of the dials it watches
    // (unlatched combos can't all hold at once: a selector dial, linked lamps…).
    for (const a of level.acts) if (ps.acts[a.id] !== 1) assert.ok(openWithDials(ps, a), `${name}: ${a.style} ${a.id} never opens`);

    // Items for one character only.
    for (const it of level.items.filter((x) => x.who !== null)) {
      const fresh = new PuzzleState(level);
      for (const q of level.seqs) for (const id of q.ids) fresh.pound(id, 0);
      fresh.evaluate(1);
      assert.equal(fresh.take(1 - it.who, it.id), false, `${name}: ${it.label} is only for one of you`);
    }
    // Something to do in every mode.
    if (mode === 'course') assert.ok(level.traps.length >= 10, `${name} has prank blocks`);
    if (mode === 'horror') {
      assert.ok(level.monsters.length > 0 && level.notes.length >= 3 && level.story?.intro && level.story?.outro, `${name} has a monster, notes and a story`);
      assert.ok(level.zones.some((z) => z.kind === 'hide'), `${name} has hiding places`);
      assert.ok(level.theme.dark, `${name} is dark`);
    }
  }
}

// Wrong order resets a code.
{
  const level = buildLevel('puzzle', '', 0);
  const q = level.seqs[0];
  const ps = new PuzzleState(level);
  ps.pound(q.ids[0], 0);
  ps.pound(q.ids[2], 0);
  ps.pound(q.ids[1], 0);
  ps.pound(q.ids[3], 0);
  ps.evaluate(1);
  assert.equal(ps.signals[q.id], 0, 'wrong order must not open it');
  for (const id of q.ids) ps.pound(id, 0);
  ps.evaluate(1);
  assert.equal(ps.signals[q.id], 1, 'right order opens it');
}

// Dropping out returns what you carried.
{
  const level = buildLevel('puzzle', '', 0);
  const it = level.items.find((x) => x.who === 0);
  const ps = new PuzzleState(level);
  assert.ok(ps.take(0, it.id));
  ps.dropSlot(0);
  assert.equal(ps.held(0), null);
  assert.ok(ps.take(0, it.id), 'it can be picked up again');
}

// Monsters: walls block sight, lockers hide you, and it catches someone in plain view.
{
  const level = buildLevel('horror', '', 0);
  const def = level.monsters[0];
  const m = new MonsterSim(level, def);
  m.wake(def.wakeAt);
  const walls = makeWalls(level, 0);
  assert.equal(sightClear(walls, {}, [0, 0, 90], [0, 0, 40]), false, 'walls block sight between floors');
  const near = [def.wakeAt[0], 0, def.wakeAt[2] - 6];
  const players = [{ pos: near, alive: true, hidden: false, present: true }, null];
  let caught = false, spotted = false;
  for (let k = 0; k < 400 && !caught; k++) {
    for (const e of m.update(0.05, players, {})) {
      if (e.kind === 'spotted') spotted = true;
      if (e.kind === 'caught') caught = true;
    }
  }
  assert.ok(spotted && caught, 'monster sees and catches a player standing in the open');
  const m2 = new MonsterSim(level, def);
  m2.wake(def.wakeAt);
  const hiddenP = [{ pos: near, alive: true, hidden: true, present: true }, null];
  for (let k = 0; k < 200; k++) for (const e of m2.update(0.05, hiddenP, {})) assert.notEqual(e.kind, 'caught', 'hidden players are safe');
  assert.ok(sightClear(walls, {}, [0, 0, 20], [0, 0, 40]), 'the hallway is open');
  // Red light freezes it.
  const red = level.zones.find((z) => z.kind === 'redlight');
  let t = 0;
  while (!redState(red, t).red) t += 0.1;
  assert.ok(inside(red, 0, 0, 40) && redState(red, t).red);
}

// The dorm maze: every cell reachable by the supervisor's patrol.
{
  const level = buildLevel('horror', '', 1);
  const def = level.monsters[0];
  assert.equal(new Set(def.patrol).size, def.nodes.length, 'patrol covers the whole maze');
}

// The chase rules, on a test corridor: floor, a 6 m hole with one plank across,
// more floor, and a safe room at the far end.
{
  const b = new LevelBuilder({ mode: 'horror', index: 0, seed: 't', name: 't', label: 't' });
  b.floor(0, 0, 10, 6, 20);
  b.box(1.5, -0.3, 23, 0.6, 0.6, 6.2); // the plank, off-centre
  b.floor(0, 0, 36, 6, 20);
  const safe = b.zone('safe', 0, 1.5, 43, 6, 3, 6);
  const stop = b.zone('trigger', 0, 1.5, 0, 2, 2, 2);
  const nodes = [[0, 0, 2], [0, 0, 18], [1.5, 0, 19.8], [1.5, 0, 26.2], [0, 0, 28], [0, 0, 44]];
  b.monster({ nodes, edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]], patrol: [], start: 0, sight: 60, chase: 5, speed: 2, until: stop });
  b.checkpoint(0, 0, 2, 4);
  b.goal(0, 0, 44);
  const level = b.finish();
  const def = level.monsters[0];
  const player = (pos, o = {}) => ({ pos, alive: true, present: true, hidden: false, safe: false, grace: false, look: null, torch: false, ...o });
  const run = (m, players, secs, acts = {}, o = {}) => {
    const ev = [];
    for (let k = 0; k < secs * 20; k++) ev.push(...m.update(0.05, players, acts, o));
    return ev;
  };
  // It never walks over the hole: the only way across is the plank, and it's slow on it.
  {
    const m = new MonsterSim(level, def);
    const across = player([0, 0, 34]);
    let maxOff = 0, plankT = 0;
    for (let k = 0; k < 400; k++) {
      m.update(0.05, [across, null], {});
      if (m.pos[2] > 20.2 && m.pos[2] < 25.8) {
        maxOff = Math.max(maxOff, Math.abs(m.pos[0] - 1.5));
        plankT += 0.05;
      }
    }
    assert.ok(maxOff < 0.35, `stays on the plank over the hole (strayed ${maxOff.toFixed(2)} m)`);
    assert.ok(plankT > 5.6 / (def.chase * 0.6), `slows down on the plank (${plankT.toFixed(1)} s on it)`);
  }
  // A flashlight on it holds it still; looking away lets it move.
  {
    const m = new MonsterSim(level, def);
    m.pos = [0, 0, 6];
    const lit = player([0, 0, 14], { torch: true, look: Math.PI });
    run(m, [lit, null], 2);
    assert.ok(Math.abs(m.pos[2] - 6) < 0.01 && m.state()[4] === 6, 'frozen in the beam');
    lit.look = 0;
    run(m, [lit, null], 1);
    assert.ok(m.pos[2] > 7, 'moves again once the light is off it');
  }
  // Into a safe room: it gives up and walks home.
  {
    const m = new MonsterSim(level, def);
    m.pos = [0, 0, 30];
    const p = player([0, 0, 38]);
    run(m, [p, null], 0.5);
    assert.equal(m.mode, 'chase');
    p.pos = [0, 0, 43];
    p.safe = true;
    const ev = run(m, [p, null], 0.5);
    assert.ok(ev.some((e) => e.kind === 'gaveup' && e.why === 'safe'), 'gives up at the safe room');
    run(m, [p, null], 20);
    assert.ok(Math.hypot(m.pos[0] - m.home[0], m.pos[2] - m.home[2]) < 1, 'walked back home');
  }
  // It gives up after a while even if it can still see you, and won't look for a bit.
  {
    const m = new MonsterSim(level, def);
    m.pos = [0, 0, 2];
    const p = player([0, 0, 18], { torch: true, look: Math.PI }); // keeps it lit, so it never reaches you
    const ev = run(m, [p, null], def.giveUp + 1);
    assert.ok(ev.some((e) => e.kind === 'gaveup' && e.why === 'tired'), 'a chase has an end');
  }
  // Out of its area, it can't see you.
  {
    const m = new MonsterSim(level, { ...def, area: [[-3, 0, 3, 20]] });
    const ev = run(m, [player([0, 0, 34]), null], 2);
    assert.ok(!ev.some((e) => e.kind === 'spotted'), 'ignores players outside its area');
  }
  // Its `until` signal ends it for good.
  {
    const m = new MonsterSim(level, def);
    const ev = run(m, [player([0, 0, 8]), null], 1, {}, { over: true });
    assert.ok(ev.some((e) => e.kind === 'vanish') && m.state()[4] === 7, 'gone once the chase is over');
    run(m, [player([0, 0, 3]), null], 3);
    assert.equal(m.mode, 'gone');
  }
  // After a catch it heads home and leaves you alone for a moment.
  {
    const m = new MonsterSim(level, def);
    m.pos = [0, 0, 6];
    const p = player([0, 0, 8]);
    const ev = run(m, [p, null], 2);
    assert.ok(ev.some((e) => e.kind === 'caught'));
    const again = run(m, [p, null], 3);
    assert.ok(!again.some((e) => e.kind === 'caught'), 'no second catch straight away');
  }
}

console.log(`ok: ${count} designed levels build, validate and can be solved; monsters see, hide and catch`);
