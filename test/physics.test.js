// Runs the real character controller headlessly to check that the level
// generator's assumptions hold: jump limits, launch pads, the cannon and the
// seesaw all land where the puzzles need them to.
import assert from 'node:assert/strict';
import { Physics, Collider } from '../public/src/physics.js';
import { LocalPlayer } from '../public/src/player.js';
import { PHYS, MAX_GAP, MAX_JUMP_HEIGHT, MAX_BOOST_HEIGHT } from '../public/shared/constants.js';
import { generateLevel } from '../public/shared/levelgen.js';
import { buildLevel } from '../public/shared/levels.js';

const DT = 1 / 60;

function makeGame(killY = -50) {
  const physics = new Physics();
  const game = {
    physics,
    level: { killY },
    magnetTarget: null,
    remote: { present: false },
    now: 0,
    net: { serverNow: () => game.now },
    events: [],
    onLocal(type) {
      this.events.push(type);
    },
    respawnLocal() {},
  };
  return game;
}

function addBox(physics, id, x, y, z, sx, sy, sz, yaw = 0, opts = {}) {
  const c = new Collider(id, sx / 2, sy / 2, sz / 2, opts);
  c.set(x, y, z, yaw);
  physics.add(c);
  return c;
}

function levelPhysics(level) {
  const game = makeGame(level.killY);
  // Fans count as powered (their plates are someone else's job).
  game.world = {
    windAt(p) {
      for (const f of level.fans) {
        if (p.y < f.y - 0.6 || p.y > f.y + f.h) continue;
        if (Math.hypot(p.x - f.x, p.z - f.z) > f.r) continue;
        return f.strength;
      }
      return 0;
    },
  };
  for (const s of level.solids) addBox(game.physics, s.id, s.x, s.y, s.z, s.sx, s.sy, s.sz, s.yaw);
  for (const t of level.traps || []) if (t.kind !== 'fake') addBox(game.physics, t.id, t.x, t.y, t.z, t.sx, t.sy, t.sz, t.yaw);
  for (const p of level.pads) if (p.n[1] > 0.5) addBox(game.physics, p.id, p.x, p.y, p.z, 1.9, 0.16, 1.9, 0, { kind: 'pad' });
  for (const e of level.seesaws) {
    for (const [end, side] of [['A', -1], ['B', 1]]) {
      const lx = side * (e.len / 4 + 0.05);
      const c = Math.cos(e.yaw), s = Math.sin(e.yaw);
      addBox(game.physics, `${e.id}:${end}`, e.x + lx * c, e.y - 0.175, e.z - lx * s, e.len / 2 - 0.1, 0.35, e.w, e.yaw, { kind: 'seesaw' });
    }
  }
  return game;
}

const input = (o = {}) => ({ mx: 0, my: 0, jumpPressed: false, jumpHeld: false, dashPressed: false, poundPressed: false, abilityHeld: false, ...o });
// View yaw so that "forward" points along world direction (dx, dz).
const yawToward = (dx, dz) => Math.atan2(-dx, -dz);

function simulate(game, player, seconds, inputFn) {
  const steps = Math.round(seconds / DT);
  for (let i = 0; i < steps; i++) {
    game.now += DT * 1000;
    const { inp, view } = inputFn(i);
    player.update(DT, inp, view);
    if (player.dead) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// 1. Jump limits on flat ground.
{
  const game = makeGame();
  addBox(game.physics, 'floor', 0, -0.5, 0, 400, 1, 400);
  const p = new LocalPlayer(game, 0);
  p.spawnAt([0, 0, 0, 0]);
  const view = { yaw: yawToward(0, 1) };
  simulate(game, p, 1, () => ({ inp: input({ my: 1 }), view }));
  assert.ok(p.grounded, 'should be grounded after running');
  let phase = 0, z0 = 0, maxY = 0, landed = false;
  simulate(game, p, 3, (i) => {
    let o = { my: 1, jumpHeld: true };
    if (phase === 0) { z0 = p.pos.z; o.jumpPressed = true; phase = 1; }
    else if (phase === 1 && p.vel.y <= 0) { o.jumpPressed = true; phase = 2; }
    else if (phase === 2 && p.vel.y <= 0) { o.dashPressed = true; phase = 3; }
    if (phase >= 1) maxY = Math.max(maxY, p.pos.y);
    if (phase >= 3 && p.grounded && !landed) { landed = true; game.dist = p.pos.z - z0; }
    return { inp: input(o), view };
  });
  assert.ok(landed, 'should land');
  const gap = game.dist + 2 * PHYS.radius;
  console.log(`  max jump height ${maxY.toFixed(2)} m (assumed ${MAX_JUMP_HEIGHT.toFixed(2)}), max gap ${gap.toFixed(2)} m (assumed ${MAX_GAP.toFixed(2)})`);
  assert.ok(maxY <= MAX_JUMP_HEIGHT, 'jump higher than the generator assumes');
  assert.ok(maxY > MAX_JUMP_HEIGHT - 0.3, 'jump much lower than the generator assumes');
  assert.ok(gap <= MAX_GAP, `real max gap ${gap} exceeds assumed ${MAX_GAP}`);
}

// 2. Riding a moving platform keeps you on it.
{
  const game = makeGame();
  const plat = addBox(game.physics, 'plat', 0, -0.4, 0, 4, 0.8, 4, 0, { dynamic: true, kind: 'mover' });
  const p = new LocalPlayer(game, 0);
  p.spawnAt([0.5, 0, 0.5, 0]);
  simulate(game, p, 0.3, () => ({ inp: input(), view: { yaw: 0 } }));
  let t = 0;
  simulate(game, p, 3, () => {
    t += DT;
    plat.beginMove();
    plat.set(Math.sin(t * 1.5) * 5, -0.4 + Math.sin(t) * 2, 0, t * 0.8);
    plat.endMove(DT);
    return { inp: input(), view: { yaw: 0 } };
  });
  const local = plat.toLocal(p.pos, p.pos.clone());
  assert.ok(p.grounded && p.ground === plat, 'should still be standing on the platform');
  assert.ok(Math.abs(local.y - plat.hy) < 0.05 && Math.hypot(local.x, local.z) < 1.5, `drifted on platform: ${local.toArray()}`);
}

// 3. Level mechanics on many generated levels.
let launches = 0, cannons = 0, seesaws = 0;
for (let seed = 1; seed <= 25; seed++) {
  for (const index of [0, 1, 2, 15 + seed, 60 + seed]) {
    const level = generateLevel(`phys-${seed}`, index);

    // Magnet launch pad: reach the top of the cliff with the plate on it.
    for (const pad of level.pads.filter((x) => x.launch && Math.abs(x.launch[0]) + Math.abs(x.launch[2]) < 0.01)) {
      const lift = level.acts.find((a) => a.style === 'lift' && Math.hypot(a.parts[0].x - pad.x, a.parts[0].z - pad.z) < 16);
      const plate = level.plates.find((pl) => pl.id === lift.when.in[0]);
      const game = levelPhysics(level);
      const p = new LocalPlayer(game, pad.pol > 0 ? 0 : 1);
      p.spawnAt([pad.x, pad.y + 0.1, pad.z, 0]);
      simulate(game, p, 0.2, () => ({ inp: input(), view: { yaw: 0 } }));
      p.launch(...pad.launch, pad);
      // Straight at the cliff face (the lift-to-plate direction is the segment's forward).
      const dir = { x: plate.x - lift.parts[0].x, z: plate.z - lift.parts[0].z };
      const ok = simulate(game, p, 2.5, () => ({ inp: input({ my: 1 }), view: { yaw: yawToward(dir.x, dir.z) } }));
      assert.ok(ok && p.grounded && Math.abs(p.pos.y - plate.y) < 0.6, `launch pad on seed ${seed}/${index} failed: ended at y=${p.pos.y.toFixed(2)} (top ${plate.y})`);
      launches++;
    }

    // Cannon: with no input at all you land on the far side.
    for (const pad of level.pads.filter((x) => x.launch && Math.abs(x.launch[0]) + Math.abs(x.launch[2]) > 0.01)) {
      const game = levelPhysics(level);
      const p = new LocalPlayer(game, pad.pol > 0 ? 0 : 1);
      p.spawnAt([pad.x, pad.y + 0.1, pad.z, 0]);
      simulate(game, p, 0.2, () => ({ inp: input(), view: { yaw: 0 } }));
      p.launch(...pad.launch, pad);
      const ok = simulate(game, p, 3, () => ({ inp: input(), view: { yaw: 0 } }));
      const flight = Math.hypot(p.pos.x - pad.x, p.pos.z - pad.z);
      assert.ok(ok && p.grounded && Math.abs(p.pos.y - pad.y) < 0.6 && flight > 20, `cannon on seed ${seed}/${index} failed: flew ${flight.toFixed(1)} m, y=${p.pos.y.toFixed(2)}`);
      cannons++;
    }

    // Seesaw: launched player reaches the cliff top.
    for (const e of level.seesaws) {
      const sw = level.switches.find((w) => w.latch && Math.hypot(w.x - e.x, w.z - e.z) < 14 && w.y > e.y + 5);
      const game = levelPhysics(level);
      const end = game.physics.byId.get(`${e.id}:B`);
      const p = new LocalPlayer(game, 0);
      p.spawnAt([end.pos.x, end.top() + 0.05, end.pos.z, 0]);
      simulate(game, p, 0.2, () => ({ inp: input(), view: { yaw: 0 } }));
      assert.ok(p.grounded, 'should stand on seesaw');
      p.launch(0, PHYS.seesawVel, 0, 'seesaw');
      const ok = simulate(game, p, 2.5, () => ({ inp: input({ my: 1 }), view: { yaw: yawToward(sw.x - p.pos.x, sw.z - p.pos.z) } }));
      assert.ok(ok && p.grounded && Math.abs(p.pos.y - sw.y) < 0.6, `seesaw on seed ${seed}/${index} failed: y=${p.pos.y.toFixed(2)} want ${sw.y.toFixed(2)}`);
      // And boosting off a partner can't reach it.
      assert.ok(sw.y - e.y + 1 > MAX_BOOST_HEIGHT + 1, 'seesaw cliff reachable by boosting');
      seesaws++;
    }
  }
}
// 4. Fans: standing on one and drifting toward the ledge it serves lands you on it.
let fans = 0;
for (let seed = 1; seed <= 30; seed++) {
  for (const index of [3, 5, 8, 20 + seed, 70 + seed]) {
    const level = generateLevel(`fan-${seed}`, index);
    for (const f of level.fans) {
      // The ledge: a solid whose top is a bit below the column's top, close by.
      const ledges = level.solids.filter((s) => {
        const top = s.y + s.sy / 2;
        return top > f.y + 4 && top < f.y + f.h + 0.3 && Math.hypot(s.x - f.x, s.z - f.z) < 12;
      }).sort((a, b) => (a.y + a.sy / 2) - (b.y + b.sy / 2));
      const ledge = ledges[0];
      assert.ok(ledge, `fan ${f.id} on ${seed}/${index} has no ledge to reach`);
      const top = ledge.y + ledge.sy / 2;
      const game = levelPhysics(level);
      const p = new LocalPlayer(game, 0);
      p.spawnAt([f.x, f.y + 0.05, f.z, 0]);
      // Ride straight up, then drift toward the ledge once above it.
      const ok = simulate(game, p, 4, () => {
        const above = p.pos.y > top + 0.3;
        return { inp: input({ my: above ? 1 : 0 }), view: { yaw: yawToward(ledge.x - p.pos.x, ledge.z - p.pos.z) } };
      });
      assert.ok(ok && p.grounded && Math.abs(p.pos.y - top) < 0.5, `fan ${f.id} on ${seed}/${index}: ended at y=${p.pos.y.toFixed(2)}, ledge top ${top.toFixed(2)}`);
      fans++;
    }
  }
}
assert.ok(fans > 0, 'no fans exercised');

// 5. Designed levels: the vault's launch pad reaches the shelf, its seesaw the
// stack, and Prank Park's honest spring clears the gap.
let designed = 0;
{
  const level = buildLevel('puzzle', '', 0);
  for (const pad of level.pads.filter((x) => x.launch)) {
    const item = level.items.find((i) => i.who === (pad.pol > 0 ? 0 : 1) && i.y > 5);
    const game = levelPhysics(level);
    const p = new LocalPlayer(game, pad.pol > 0 ? 0 : 1);
    p.spawnAt([pad.x, pad.y + 0.1, pad.z, 0]);
    simulate(game, p, 0.2, () => ({ inp: input(), view: { yaw: 0 } }));
    p.launch(...pad.launch, pad);
    const ok = simulate(game, p, 2.5, () => ({ inp: input({ my: 1 }), view: { yaw: yawToward(item.x - pad.x, item.z - pad.z) } }));
    assert.ok(ok && p.grounded && Math.abs(p.pos.y - (item.y - 0.6)) < 0.7, `vault launch pad: ended at y=${p.pos.y.toFixed(2)}`);
    designed++;
  }
  for (const e of level.seesaws) {
    const sw = level.switches.find((w) => w.latch && w.y > e.y + 5);
    const game = levelPhysics(level);
    const end = game.physics.byId.get(`${e.id}:B`);
    const p = new LocalPlayer(game, 0);
    p.spawnAt([end.pos.x, end.top() + 0.05, end.pos.z, 0]);
    simulate(game, p, 0.2, () => ({ inp: input(), view: { yaw: 0 } }));
    p.launch(0, PHYS.seesawVel, 0, 'seesaw');
    const ok = simulate(game, p, 2.5, () => ({ inp: input({ my: 1 }), view: { yaw: yawToward(sw.x - p.pos.x, sw.z - p.pos.z) } }));
    assert.ok(ok && p.grounded && Math.abs(p.pos.y - sw.y) < 0.6, `vault seesaw: y=${p.pos.y.toFixed(2)} want ${sw.y}`);
    assert.ok(sw.y - e.y + 1 > MAX_BOOST_HEIGHT + 1, 'vault stack reachable by boosting');
    designed++;
  }
}
{
  const level = buildLevel('course', '', 0);
  const springs = level.traps.filter((t) => t.kind === 'launch');
  const honest = springs.filter((t) => t.launch[2] > 5);
  assert.equal(honest.length, 1, 'exactly one honest spring');
  const t = honest[0];
  const game = levelPhysics(level);
  const p = new LocalPlayer(game, 0);
  p.spawnAt([t.x, t.y + t.sy / 2 + 0.05, t.z, 0]);
  simulate(game, p, 0.1, () => ({ inp: input(), view: { yaw: 0 } }));
  p.launch(...t.launch, null);
  const ok = simulate(game, p, 2.5, () => ({ inp: input(), view: { yaw: 0 } }));
  assert.ok(ok && p.grounded && p.pos.z > t.z + 12 && Math.abs(p.pos.y) < 0.6, `honest spring: landed at z=${p.pos.z.toFixed(1)} y=${p.pos.y.toFixed(2)}`);
  designed++;
}

assert.ok(launches > 0 && cannons > 0 && seesaws > 0, 'mechanics were not exercised');
console.log(`ok: physics checks passed (${launches} launch pads, ${cannons} cannons, ${seesaws} seesaws, ${fans} fans, ${designed} designed-level jumps)`);
