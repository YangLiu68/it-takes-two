// Beat Blocks: on-beat hops, two tempos + gate, partner-switched red/blue lanes,
// the beat tower, the duet.
export default async function ({ sol, luna, L, shot }) {
  const M = L.marks;
  const both = (fa, fb) => Promise.all([fa(sol), fb(luna)]);
  const blk = (id) => {
    const k = L.blinks.find((x) => x.id === id);
    return { x: k.x, y: k.y + k.sy / 2, z: k.z, id };
  };
  const ground = (x, z) => ({ x, y: 0, z, id: null });
  const dial = (id) => L.dials.find((d) => d.id === id);
  const solid = (bot, id) => bot.until((g, b, sid) => g.extras.swaps.find((s) => s.def.id === sid).c.enabled, id, 6000);
  // Walk a red/blue lane: the partner sets the dial before each coloured block.
  const swapLane = async (runner, switcher, lane, dialId, end) => {
    for (const step of lane) {
      if (step.kind === 'swap') {
        await switcher.setDial(dial(dialId), step.on);
        await solid(runner, step.id);
      }
      await runner.jump({ to: [step.x, 0, step.z] });
    }
    await runner.jump({ to: end });
  };

  // Stage 1: follow the beat (one after the other).
  const run1 = [...M.beat1.map(blk), ground(0, 35)];
  await sol.go(-0.8, 4.6, { r: 0.25, stop: true });
  await sol.beat(run1);
  await luna.go(-0.8, 4.6, { r: 0.25, stop: true });
  await luna.beat([...M.beat1.map(blk), ground(1.4, 35)]);
  await shot('beat1');

  // Stage 2: slow lane and fast lane, then both plates.
  await both((b) => b.go(-4, 40.5, { r: 0.25, stop: true }), (b) => b.go(4, 40.5, { r: 0.25, stop: true }));
  await both((b) => b.beat([...M.slow.map(blk), ground(-4, 72.6)]), (b) => b.beat([...M.fast.map(blk), ground(4, 72.6)]));
  await both((b) => b.go(M.pW[0], M.pW[2], { r: 0.3, stop: true }), (b) => b.go(M.pE[0], M.pE[2], { r: 0.3, stop: true }));
  await sol.waitAct(L.acts.find((a) => a.style === 'door').id, 5000);
  await sol.wait(700);
  await both((b) => b.path([[-1.2, 74.6], [-1.2, 79]], { r: 0.4 }), (b) => b.path([[1.2, 74.6], [1.2, 79]], { r: 0.4 }));

  // Stage 3: Luna switches for Sol, then Sol switches for Luna.
  await sol.go(-2.5, 85.4, { r: 0.25, stop: true });
  await swapLane(sol, luna, M.lane1, M.D1 && L.dials[0].id, [-2.5, 0, 113.4]);
  await shot('swap1');
  await luna.go(2.5, 85.4, { r: 0.25, stop: true });
  await swapLane(luna, sol, M.lane2, L.dials[1].id, [2.5, 0, 113.4]);

  // Stage 4: the beat tower, one after the other.
  const tower = [...M.tower.map(blk), ground(0, 146.5)];
  await sol.go(-2, 119.3, { r: 0.25, stop: true });
  await sol.beat(tower);
  await luna.go(-2, 119.3, { r: 0.25, stop: true });
  await luna.beat([...M.tower.map(blk), ground(1.5, 146.5)]);
  await shot('tower');

  // Stage 5: Sol to the island; he keeps Luna's beat; then he finishes his lane.
  const [b156, b160, b169, b173, b177] = M.duetBlink.map(blk);
  await both((b) => b.go(-4, 151.4, { r: 0.25, stop: true }), (b) => b.go(4, 151.4, { r: 0.25, stop: true }));
  await sol.beat([b156, b160, ground(-4, 164.5)]);
  await sol.go(M.D3[0], M.D3[2], { r: 0.3, stop: true });
  await swapLane(luna, sol, M.duetSwap, L.dials[2].id, [4, 9.6, 183]);
  await shot('duet');
  await sol.beat([b169, b173, b177, ground(-4, 183)]);
  await both((b) => b.go(-1.2, 186.5), (b) => b.go(1.2, 186.5));
}
