// Generates many levels and checks structural invariants plus a few
// reachability rules derived from the movement physics.
import assert from 'node:assert/strict';
import { generateLevel, validateLevel, SEGMENT_TYPES, levelHeat } from '../public/shared/levelgen.js';
import { PuzzleState } from '../public/shared/logic.js';
import { MAX_BOOST_HEIGHT, PHYS } from '../public/shared/constants.js';

let levels = 0;
const seen = new Set();
const t0 = Date.now();

for (let seed = 1; seed <= 60; seed++) {
  for (const index of [0, 1, 2, 3, 4, 8, 11, 12 + (seed % 10), 30 + seed, 99]) {
    const level = generateLevel(`seed-${seed}`, index);
    levels++;
    const errors = validateLevel(level);
    assert.deepEqual(errors, [], `seed ${seed} level ${index}: ${errors.join(', ')}`);

    // Determinism: same inputs, same output.
    const again = generateLevel(`seed-${seed}`, index);
    assert.equal(JSON.stringify(again), JSON.stringify(level), 'generator must be deterministic');

    for (const s of level.segments) seen.add(s.type);

    // Every actuator can be switched on by its inputs.
    const ps = new PuzzleState(level);
    for (const p of level.plates) ps.setPlate(0, p.id, true);
    for (const w of level.switches) ps.pound(w.id, 0);
    ps.evaluate(1);
    for (const a of level.acts) assert.equal(ps.acts[a.id], 1, `act ${a.id} never activates`);

    // Launch-segment cliffs must be too tall to reach by boosting off a partner,
    // but low enough for the magnet launch.
    const repelHeight = (PHYS.repelSpeed * PHYS.repelSpeed) / (2 * PHYS.gravity);
    for (const a of level.acts.filter((x) => x.style === 'lift')) {
      const h = a.parts[0].move[1];
      assert.ok(h > MAX_BOOST_HEIGHT, `lift height ${h} reachable by boosting`);
      assert.ok(h < repelHeight - 0.8, `lift height ${h} unreachable by launch`);
    }

    assert.ok(Number.isFinite(level.killY));
    assert.ok(level.gems.length > 0);
  }
}

for (const t of SEGMENT_TYPES) assert.ok(seen.has(t), `segment type ${t} never generated`);

// Every level should feel different: consecutive levels never share a look,
// and no two levels in a world repeat the same sequence of puzzles.
for (const seed of ['alpha', 'beta', 'gamma', 'ac4684']) {
  const seqs = new Set();
  const names = new Set();
  let prevLook = '';
  let prev = null;
  for (let index = 0; index < 100; index++) {
    const level = generateLevel(seed, index);
    const look = `${level.theme.key}/${level.theme.sky}`;
    assert.notEqual(look, prevLook, `${seed}: levels ${index} and ${index + 1} look the same (${look})`);
    prevLook = look;
    const seq = level.segments.map((s) => s.type).join(',');
    assert.ok(!seqs.has(seq), `${seed}: level ${index + 1} repeats an earlier level`);
    seqs.add(seq);
    assert.ok(!names.has(level.name), `${seed}: level ${index + 1} reuses the name ${level.name}`);
    names.add(level.name);
    if (index > 0) assert.ok(level.segments.length >= 9, 'later levels should be longer');
    // Never easier than the level before: same or more heat, same or more
    // puzzles (not counting a marathon's two extra).
    const base = level.segments.length - (level.twist?.key === 'marathon' ? 2 : 0);
    if (prev) {
      assert.ok(level.heat >= prev.heat, `${seed}: level ${index + 1} is cooler than the one before`);
      assert.ok(base >= prev.base, `${seed}: level ${index + 1} is shorter than the one before`);
    }
    if (index > 5) assert.ok(level.heat > levelHeat(index - 1), 'heat should keep rising');
    prev = { heat: level.heat, base };
  }
}

console.log(`ok: ${levels} levels generated and validated in ${Date.now() - t0} ms`);
