// Level 27 · Tide Pool: water as the level's one idea, used five ways.
//   1. the tide comes in — climb out of the basin before it reaches you (boost + steps)
//   2. a flooded hall — hop pillar to pillar to two valves; both open drains it
//   3. the water lift — one of you pounds the valve from a tall pillar, the other rides the raft up
//   4. the swell — rafts bob up and under; each of you needs the other on their island
//   5. two pools — your valve fills your partner's pool, theirs fills yours: take turns rising

import { LevelBuilder } from '../build.js';

const WATER = { look: 'water' };

export function tidePool(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'tide-pool', name: 'Tide Pool', label: `Level ${index + 1}`, theme: 'bath', sky: 'day' });
  const tile = '#d9eef5', stone = '#a9c3cc', wood = '#c9955a';
  // A block standing on the floor at y0 with its top at `top`.
  const block = (x, top, z, w, d, y0, o = {}) => b.floor(x, top, z, w, d, { t: top - y0, color: stone, ...o });

  // -- Start ------------------------------------------------------------------------------
  b.floor(0, 0, 3, 12, 8, { color: tile });
  b.checkpoint(0, 0, 2, 6, { hint: 'The water rises in this level! If it covers you, you get washed away — stay above the water line.' });
  b.sign(0, 3.0, 6.4, 'Water coming? Head for high ground!\nGo under and you wash back\nto the checkpoint', { style: 'prank' });

  // -- 1. The tide comes in: climb out of the basin -----------------------------------------
  b.floor(0, 0, 13, 12, 12, { color: tile }); // basin floor, z 7–19
  for (const s of [-1, 1]) b.box(s * 6.2, 5.5, 20, 0.4, 11, 26, { color: stone });
  block(0, 2, 20.5, 12, 3, 0); // ledge 1, z 19–22
  block(0, 4, 23.5, 12, 3, 0); // ledge 2, z 22–25
  block(0, 9, 29, 12, 8, 0); // the top, z 25–33: 5 m above ledge 2
  const tide = b.zone('trigger', 0, 1.5, 9, 12, 3, 2);
  b.flood(0, 16, 12, 18, { ...WATER, y0: -2, y1: 8.4, speed: 0.35, when: tide });
  b.sign(0, 6.8, 24.8, 'Too high! Jump off your partner\'s head,\nthen pound the switch to drop the steps', { style: 'prank' });
  const stepsSw = b.pswitch(-2.5, 9, 28, true);
  b.act('steps', { op: 'all', in: [stepsSw] }, true, [
    { x: 3.6, y: 5.3, z: 25.8, sx: 2.4, sy: 0.8, sz: 1.6, move: [0, 0, -1.6] },
    { x: 1.0, y: 7.0, z: 25.8, sx: 2.4, sy: 0.8, sz: 1.6, move: [0, 0, -1.6], delay: 0.2 },
  ], { speed: 4, mat: 'toy', color: '#ffd166', lamp: [-2.5, 9.4, 26.4] });
  b.gem(-4, 3.4, 20.5);
  b.mark('boost', 0, 4, 24.3);

  // -- 2. The flooded hall: two valves ---------------------------------------------------------
  b.checkpoint(0, 9, 30.5, 5, { hint: 'The hall is flooded. Hop along the pillars to the valves on both sides and pound one each: the water only drains with both valves open.' });
  const Y2 = 9;
  b.floor(0, Y2, 46, 14, 26, { color: tile }); // hall floor, z 33–59
  for (const s of [-1, 1]) b.box(s * 7.2, Y2 + 3, 46, 0.4, 6, 26, { color: stone });
  b.wallGapsX(-7, 7, 59, 6, [[0, 3]], { color: stone, y: Y2, lintel: 3.6 });
  const P = 11.2;
  for (const [x, z] of [[0, 36], [-3, 40], [3, 40], [-1.2, 52.5], [1.2, 52.5]]) block(x, P, z, 2.4, 2.4, Y2);
  block(-5.0, P, 44.8, 3, 3, Y2);
  block(5.0, P, 44.8, 3, 3, Y2);
  const vL = b.dial(-5.0, P, 44.8, { values: ['SHUT', 'OPEN'] });
  const vR = b.dial(5.0, P, 44.8, { values: ['SHUT', 'OPEN'] });
  const drained = b.combo([vL, vR], [1, 1]);
  b.flood(0, 46, 14, 26, { ...WATER, y0: Y2 - 1, y1: Y2 + 1.3, speed: 4, until: drained });
  b.door(0, 59, 3, 3.5, { op: 'all', in: [drained] }, { y: Y2, latch: true, color: '#7fc8e0' });
  b.acts[b.acts.length - 1].toast = 'The water drained and the door opened!';
  b.sign(0, P + 2.6, 36, 'One valve on each side:\npound both to OPEN', { style: 'prank' });
  b.gem(0, P + 1.3, 52.5);
  b.mark('valveL', -5.0, P, 44.8);
  b.mark('valveR', 5.0, P, 44.8);

  // -- 3. The water lift: valve on a pillar, raft by the exit ---------------------------------
  b.floor(0, Y2, 62, 12, 6, { color: tile }); // entrance, z 59–65
  b.checkpoint(0, Y2, 62, 5, { hint: 'One climbs the tall pillar and pounds the valve; the other first stands on the little raft by the exit: as the water rises, the raft carries you up. Up there, pound the switch to bridge over to your partner on the pillar!' });
  b.floor(0, Y2, 73.5, 12, 17, { color: tile }); // pool floor, z 65–82
  for (const s of [-1, 1]) b.box(s * 6.2, Y2 + 6, 75, 0.4, 12, 30, { color: stone });
  block(0, 20, 86, 12, 8, Y2); // exit ledge, z 82–90, 11 m up
  const stairs = [[2.0, 66.5], [-0.5, 66.5], [-3.0, 66.5], [-5.0, 67.9], [-2.6, 69.3]];
  stairs.forEach(([x, z], i) => block(x, Y2 + 1.85 * (i + 1), z, 2.2, 2.2, Y2));
  block(-4.6, 20, 71.4, 3, 3, Y2); // the valve pillar
  const valve3 = b.pswitch(-4.6, 20, 71.4, true);
  const lift = b.flood(0, 73.5, 12, 17, { ...WATER, y0: Y2 - 2.5, y1: 19.2, speed: 0.75, when: valve3 });
  b.float(2.5, 79.4, 2.0, 2.0, { flood: lift, base: Y2 + 0.5, offset: 0.3, color: wood });
  const bridgeSw = b.pswitch(2.4, 20, 85, true);
  b.act('bridge', { op: 'all', in: [bridgeSw] }, true, [
    { x: -4.6, y: 9.6, z: 77.2, sx: 2.4, sy: 0.8, sz: 9.6, move: [0, 10, 0] },
  ], { speed: 6, mat: 'toy', color: '#ffd166', lamp: [-4.6, 20.4, 82.4] });
  b.sign(2.5, Y2 + 2.8, 77.4, 'Raft: rises\nwith the water', { style: 'prank' });
  b.sign(-4.6, 22.6, 71.4, 'Valve: let the\nwater in!', { style: 'prank' });
  b.gem(-5.0, 16.4 + 1.3, 67.9);
  b.mark('raft3', 2.5, Y2 + 0.5, 79.4);
  b.mark('pillar3', -4.6, 20, 71.4);

  // -- 4. The swell: bobbing rafts and two islands -----------------------------------------------
  b.checkpoint(0, 20, 86, 7, { hint: 'The rafts bob up and down — stay on one while it sinks and you get washed away! Each takes one side; both stand on the plates on the middle islands to open each other\'s door.' });
  b.floor(0, 14, 103, 12, 26, { color: '#6aa9bf' }); // channel bed, z 90–116
  b.flood(0, 103, 12, 26, { ...WATER, y0: 18.6, y1: 19.0, speed: 2 });
  b.box(0, 21, 103, 0.4, 14, 26, { color: stone }); // the wall between the lanes
  const lanes = [-3, 3];
  const bobs = [93.5, 98, 108, 112.5];
  lanes.forEach((x, li) => {
    bobs.forEach((z, k) => {
      const ph = li * 0.5 - 0.27 * k; // each raft rises a little after the one before it
      b.mover(2.4, 0.6, 2.4, { type: 'linear', a: [x, 17.9, z], b: [x, 20.3, z], period: 4.4, phase: ph }, { steady: true, color: wood, mat: 'wood' });
    });
    block(x, 20.2, 103, 3, 3, 14); // the island
  });
  const islandL = b.plate(-3, 20.2, 102.4);
  const islandR = b.plate(3, 20.2, 102.4);
  b.door(3, 104.5, 3, 3, { op: 'all', in: [islandL] }, { y: 20.2, latch: true, color: '#7fc8e0' }); // the right lane's gate
  b.door(-3, 104.5, 3, 3, { op: 'all', in: [islandR] }, { y: 20.2, latch: true, color: '#7fc8e0' }); // the left lane's gate
  b.sign(0, 26, 90.5, 'Jump when the raft is up!\nLeft plate opens the right door,\nright plate opens the left', { style: 'prank' });
  block(0, 20, 120, 12, 8, 14); // far ledge, z 116–124
  b.gem(3, 22.6, 98);
  b.mark('bobs', 0, 0, 0);

  // -- 5. Two pools: take turns raising each other ---------------------------------------------
  b.checkpoint(0, 20, 120, 9, { hint: 'The left pool is Sol\'s, the right is Luna\'s. Your valve fills your PARTNER\'s pool: stand on your raft first, then let your partner add water. Take turns rising level by level!' });
  const Y5 = 20;
  for (const [x, pol] of [[-3.5, 1], [3.5, -1]]) {
    b.floor(x, Y5, 133, 6, 18, { color: tile }); // pool floor, z 124–142
    b.field(x, Y5 + 1.5, 124.3, 6, 3, 0.3, pol);
    b.floor(x, 26, 137.5, 6, 3, { t: 0.6, color: stone }); // first ledge, z 136–139
    b.floor(x, 32, 139, 6, 6, { t: 0.6, color: stone }); // the top, z 136–142
  }
  b.box(0, 30, 133, 1, 22, 18.4, { color: stone }); // the wall between the pools
  for (const s of [-1, 1]) b.box(s * 6.7, 30, 133, 0.4, 22, 18.4, { color: stone });
  const vS1 = b.pswitch(-3.5, Y5, 128, true);
  const vL1 = b.pswitch(3.5, 26, 137.6, true);
  const vS2 = b.pswitch(-3.5, 26, 137.6, true);
  const vL2 = b.pswitch(3.5, 32, 140.4, true);
  const pool = (x, when, y1) => b.flood(x, 133, 6, 18, { ...WATER, y0: Y5 - 1, y1, speed: 0.6, when, grace: 8 });
  const lunaA = pool(3.5, vS1, 26.0), lunaB = pool(3.5, vS2, 32.0);
  const solA = pool(-3.5, vL1, 26.0), solB = pool(-3.5, vL2, 32.0);
  b.float(-3.5, 134.9, 2.2, 2.2, { flood: [solA, solB], base: Y5 + 0.5, offset: 0.3, color: wood });
  b.float(3.5, 134.9, 2.2, 2.2, { flood: [lunaA, lunaB], base: Y5 + 0.5, offset: 0.3, color: wood });
  b.sign(0, 34, 125, 'Your valve → partner\'s pool\nGet on your raft first!', { style: 'prank' });
  b.floor(0, 32, 147, 14, 10, { color: tile }); // the goal platform, z 142–152
  b.gem(-3.5, 34.2, 140.5);
  b.gem(3.5, 28.2, 137.5);
  b.mark('raftS', -3.5, Y5 + 0.5, 134.9);
  b.mark('raftL', 3.5, Y5 + 0.5, 134.9);
  b.goal(0, 32, 147.5);

  b.objectives = [
    { text: 'High tide! Jump off your partner onto the ledge, pound to drop the steps', done: { act: b.acts[0].id } },
    { text: 'Hop the pillars and pound both valves to OPEN', done: { sig: drained } },
    { text: 'One opens the valve from the pillar, the other rides the raft up and bridges over', done: { cp: 3 } },
    { text: 'Jump while the rafts are up; both stand on the island plates', done: { cp: 4 } },
    { text: 'Take turns filling each other\'s pool, rise to the top', done: {} },
  ];
  return b.finish();
}
