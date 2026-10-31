// Level 21 Portal Maze: first portal, the dial-chosen islands, both-portals (plate,
// then a boosted ledge switch), the floor-portal fling, and the sealed maze.
import { sleep } from './lib.mjs';

export default async function ({ sol, luna, L, shot }) {
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  // Walk into a portal and wait until we've come out somewhere else.
  const enter = async (bot, x, z) => {
    const before = await bot.pos();
    await bot.go(x, z, { r: 0.2, timeout: 8000 });
    await bot.until((g, b, a) => Math.hypot(g.player.pos.x - a[0], g.player.pos.z - a[2]) > 4, before, 4000);
    await sleep(300);
  };

  // 1. First portal.
  await enter(sol, -0.4, 14.05);
  await enter(luna, 0.4, 14.05);

  // 2. Luna turns the dial, Sol visits the three islands.
  const dial = L.dials[0];
  for (let k = 0; k < 3; k++) {
    await luna.setDial(dial, k);
    const [x, top, z] = L.marks.islands[k];
    await enter(sol, 5, 46.55);
    const sw = L.switches.find((w) => w.latch && Math.abs(w.x - (x + 1.6)) < 0.1 && Math.abs(w.z - (z + 1)) < 0.1);
    await sol.go(sw.x, sw.z, { r: 0.3, stop: true });
    await sol.pound();
    await sol.waitSig(sw.id, 3000);
    await enter(sol, x - 1.6, z + 2.65);
    void top;
  }
  const bridge = L.acts.find((a) => a.style === 'bridge');
  await sol.waitAct(bridge.id, 5000);
  await sleep(1800);
  await shot('islands');

  // 3. Over the bridge into room A; Luna holds the plate, Sol takes both of them through.
  await both((b) => b.path([[-0.8, 42], [-0.8, 49], [-0.8, 80], [-0.8, 85]], { r: 0.5 }), (b) => b.path([[-2, 46], [0.8, 49], [0.8, 80], [-1, 86.5]], { r: 0.5 }));
  const pA = L.plates.find((p) => p.z === 87 && p.x === -3);
  await luna.go(pA.x, pA.z, { r: 0.3, stop: true });
  await sol.go(1.8, 90.5, { r: 0.4 });
  await enter(sol, 1.8, 91.65);
  // Room B: Sol climbs on Luna's head to reach the ledge switch.
  await luna.go(-20, 87.7, { r: 0.25, stop: true });
  const ledge = L.switches.find((w) => Math.abs(w.y - 4.6) < 0.1);
  for (let tries = 0; ; tries++) {
    // Come round the side (never through Luna), stop just behind her, hop on.
    const [sx, , sz] = await sol.pos();
    if (sz > 87) await sol.path([[-21.9, sz], [-21.9, 86.2]], { r: 0.4 });
    await sol.go(-20, 86.4, { r: 0.25, stop: true });
    await sol.jump({ to: [-20, 1.55, 87.7] });
    void sx;
    const [, y1] = await sol.pos();
    if (y1 > 1.2) {
      await sol.jump({ to: [-20, 4.6, 90.2], double: true });
      const [, y2] = await sol.pos();
      if (y2 > 4.3) break;
    }
    if (tries > 4) throw new Error('could not get up to the ledge');
  }
  await sol.go(ledge.x, ledge.z, { r: 0.3, stop: true });
  await sol.pound();
  await sol.waitSig(ledge.id, 3000);
  await shot('roomB');
  await enter(luna, -15.45, 85);

  // 4. Flung over the chasm: Sol holds the tower plate for Luna's hole, then Luna
  // holds the far plate for Sol's.
  const [pNear, pFar] = [L.plates.find((p) => Math.abs(p.y - 12) < 0.1), L.plates.find((p) => Math.abs(p.y - 6) < 0.1 && p.z === 126)];
  await sol.go(pNear.x, pNear.z, { r: 0.3, stop: true });
  await luna.go(-1, 101, { r: 0.4 });
  await luna.go(-3, 103.2, { r: 0.2, timeout: 6000 });
  await luna.until((g) => g.player.grounded && g.player.pos.z > 115, null, 8000);
  await shot('fling', luna.page);
  await luna.go(pFar.x, pFar.z, { r: 0.3, stop: true });
  await sol.go(1.2, 101, { r: 0.4 });
  await sol.go(3, 103.2, { r: 0.2, timeout: 6000 });
  await sol.until((g) => g.player.grounded && g.player.pos.z > 115, null, 8000);

  // 5. The maze: Luna reads the map on the lookout, Sol walks it, then Luna.
  await both((b) => b.go(-1, 139, { r: 0.6 }), (b) => b.go(8.5, 140, { r: 0.5 }));
  await luna.jump({ to: [9.5, 9, 143], double: true });
  await luna.go(10, 143.5, { r: 0.5 });
  await shot('map', luna.page);
  const { rooms } = L.marks.maze;
  const route = [['0', 'b'], ['2', 'r'], ['4', 'g'], ['1', 'b']];
  const walk = async (bot) => {
    await bot.path([[0, 146.5], [0, 150.5]], { r: 0.4 });
    for (const [k, c] of route) {
      const [cx, cz] = rooms[k];
      const [x, z] = c === 'r' ? [cx - 2.75, cz] : c === 'g' ? [cx + 2.75, cz] : [cx, cz + 2.75];
      await bot.go(cx, cz, { r: 0.6 });
      await enter(bot, x, z);
    }
  };
  await walk(sol);
  const [xp1, xp2] = L.plates.filter((p) => p.z > 179).sort((a, b) => a.x - b.x);
  await sol.go(xp1.x, xp1.z, { r: 0.3, stop: true });
  await luna.jump({ to: [6, 6, 141], double: true });
  await walk(luna);
  await luna.go(xp2.x, xp2.z, { r: 0.3, stop: true });
  const door = L.acts.find((a) => a.style === 'door');
  await sol.waitAct(door.id, 5000);
  await sleep(800);
  await shot('exit');
  await both((b) => b.path([[-1, 184.5], [-1.5, 190.5]], { r: 0.5 }), (b) => b.path([[1, 184.5], [1.5, 190.5]], { r: 0.5 }));
}
