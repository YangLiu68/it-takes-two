// Level 14 · Spin World: everything turns. Spinning crosses, the hands of a giant
// clock, a bridge your partner turns into place, rings of platforms orbiting a
// tower, and a jump-rope turntable where you have to stand your ground together.

import { LevelBuilder } from '../build.js';
import { plankBridge } from './kit3.js';

export function spinWorld(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'spin-world', name: 'Spin World', label: `Level ${index + 1}`, theme: 'candy', sky: 'sunset' });

  // -- 1. Spinning crosses -------------------------------------------------------------
  b.floor(0, 0, 0, 12, 8, { mat: 'wood' });
  b.checkpoint(0, 0, -1, 7, { hint: 'Hop across the spinning crosses one by one. Wait for an arm to swing round in front of you, then jump!' });
  b.sign(0, 3.2, 3, 'The crosses mesh like gears:\njump when the arms line up!', { w: 4.4 });
  const arm = 10.5, R = arm / 2;
  // Meshing like gears: opposite spins with matching phases, so an arm of one
  // meets an arm of the next every quarter turn.
  const crosses = [[10.55, 0.5, 0.2], [22.35, -0.5, -0.2], [34.15, 0.5, 0.2]];
  crosses.forEach(([zc, speed, ph], k) => {
    const color = b.color();
    b.mover(arm, 0.8, 2.6, { type: 'spin', center: [0, -0.4, zc], speed, phase: ph }, { color, steady: true });
    b.mover(arm - 0.02, 0.78, 2.58, { type: 'spin', center: [0, -0.41, zc], speed, phase: ph + Math.PI / 2 }, { color, steady: true });
    b.mark(`cross${k}`, 0, 0, zc);
  });
  b.gem(0, 1.6, 22.35);
  b.floor(0, 0, 44.7, 12, 8, { mat: 'wood' });

  // -- 2. The clock ----------------------------------------------------------------------
  const zc2 = 59;
  b.checkpoint(0, 0, 44.2, 6, { hint: 'A giant clock! Hop on the slow hour hand and ride it across. Jump when the minute hand sweeps by!' });
  b.sign(-3.5, 3.4, 47, 'Hour hand: slow\nMinute hand: fast — jump it!', { w: 4.4 });
  // The hour hand is short and slow; the minute hand is longer, faster and sweeps just above it.
  b.mover(17, 0.8, 3.0, { type: 'spin', center: [0, -0.4, zc2], speed: 0.28, phase: Math.PI / 2 }, { color: '#fff1c4', steady: true });
  b.mover(19, 0.45, 0.5, { type: 'spin', center: [0, 0.95, zc2], speed: -0.85, phase: 0.4 }, { mat: 'hazard', color: '#ff5d5d', hazard: 'push', steady: true });
  b.box(0, 2.9, zc2, 1.4, 0.6, 1.4, { mat: 'metal' }); // the hub cap
  b.mark('clock', 0, 0, zc2);
  for (let k = 0; k < 12; k++) {
    // Hour marks around the dial.
    const a = (k / 12) * Math.PI * 2;
    if (k % 3 === 0) continue;
    b.box(Math.cos(a) * 10.4, -0.6, zc2 + Math.sin(a) * 10.4, 0.8, 0.4, 0.8, { color: '#ffd166' });
  }
  b.gem(7.5, 1.6, zc2);
  b.gem(-7.5, 1.6, zc2);
  b.floor(0, 0, zc2 + 14.3, 10, 8, { mat: 'wood' });

  // -- 3. The bridge your partner turns ----------------------------------------------------
  const zA = zc2 + 18.3; // north edge of the clock's far island
  const half = 8.7;
  const zb = zA + half + 0.2;
  const zB = zb + half + 0.2; // south edge of the far cliff
  b.checkpoint(0, 0, zA - 3.5, 6, { hint: 'Teamwork: the bridge only turns while someone stands on the plate. One holds it and hops off when the bridge lines up — the one crossing is the one who shouts "Stop!"' });
  const plA = b.plate(-3, 0, zA - 1.8);
  const plB = b.plate(3, 0, zB + 1.8);
  b.sign(-3, 2.9, zA - 1.8, 'Hold: the bridge turns', { w: 3 });
  b.sign(3, 2.9, zB + 1.8, 'Hold: the bridge turns', { w: 3 });
  const bridge = b.mover(half * 2, 0.6, 4, { type: 'spin', center: [0, -0.3, zb], speed: 0.25, phase: 0 }, { color: '#7fd6ff', steady: true });
  bridge.run = [plA, plB];
  b.box(0, -6.4, zb, 1.5, 11.4, 1.5, { mat: 'metal' }); // the pivot post
  b.gem(5.5, 1.4, zb);
  b.mark('bridge', 0, 0, zb);
  b.mark('plA', -3, 0, zA - 1.8);
  b.mark('plB', 3, 0, zB + 1.8);
  b.floor(0, 0, zB + 4, 12, 8, { mat: 'wood' });

  // -- 4. Orbit rings around a tower -------------------------------------------------------
  const zc4 = zB + 8 + 9.8;
  const towerTop = 8.0;
  const deck = 9.6; // the walkway and the jump-rope disc, above the top ring's riders
  b.checkpoint(0, 0, zB + 3.4, 6, { hint: 'Platforms circle the tower. Jump up ring by ring to the top! Your partner can stand on the plate to stop every platform — shout "Stop!" at the right moment.' });
  const stopA = b.plate(-3.5, 0, zB + 5.8);
  const stopB = b.plate(0, deck, zc4 + 8.2); // on the landing deck, looking back down
  b.sign(-3.5, 2.9, zB + 5.8, 'Hold: platforms stop', { w: 3.2 });
  b.plat(0, towerTop, zc4, 3, 4, 22, { color: '#c98bff' });
  // Outer and inner rings by turns, all going the same way at a walking pace,
  // so a jump between rings is with the flow; they line up every few seconds.
  // Rings at the same radius turn together, a sixth of a turn apart, so a
  // platform is never right over the one below it.
  const rings = [[8, 1.6, 0.3, 0], [4, 3.2, 0.6, 0.4], [8, 4.8, 0.3, Math.PI / 3], [4, 6.4, 0.6, 0.4 + Math.PI / 3]];
  rings.forEach(([radius, top, speed, ph], k) => {
    for (let i = 0; i < 3; i++) {
      const m = b.mover(2.6, 0.5, 2.6, { type: 'orbit', center: [0, top - 0.25, zc4], radius, speed, phase: (i * Math.PI * 2) / 3 + ph }, { steady: true });
      m.stop = [stopA, stopB];
      m.ring = k;
    }
  });
  b.gem(8, 6.6, zc4);
  b.sign(0, deck + 2.9, zc4 + 8.2, 'Hold: platforms stop\nso your partner can climb', { w: 3.6 });
  b.mark('tower', 0, towerTop, zc4 - 0.8);
  b.mark('rings', 0, 0, zc4);
  b.mark('stopA', -3.5, 0, zB + 5.8);
  // A spring on top of the tower throws you over the rings onto the deck.
  b.trap('launch', 0, towerTop + 0.4, zc4 + 1.3, 2.6, 1.4, { t: 0.4, look: 'spring', launch: [0, 15, 11], reset: 1.2, color: '#ffb7d5' });
  b.mark('spring', 0, towerTop + 0.4, zc4 + 1.3);
  b.sign(1.9, towerTop + 2.4, zc4 + 1.3, 'Spring →', { w: 1.8 });
  const zw0 = zc4 + 5.7, zw1 = zw0 + 6;
  b.floor(0, deck, (zw0 + zw1) / 2, 5, zw1 - zw0, { color: '#c98bff', t: 0.4 });
  b.mark('deck', 0, deck, (zw0 + zw1) / 2);

  // -- 5. Jump rope -------------------------------------------------------------------------
  const zd = zw1 + 7.5;
  b.checkpoint(0, deck, zw0 + 2.4, 3.5, { flag: false, hint: 'Jump rope! Jump the low bars, but never jump the high ones — stand still and they pass over your head. Stand on both side plates together to raise the bridge.' });
  b.floor(0, deck, zd, 15, 15, { mat: 'wood' });
  b.box(0, deck + 1.25, zd, 1.6, 2.5, 1.6, { mat: 'metal' });
  const low = b.mover(13.2, 0.6, 0.6, { type: 'spin', center: [0, deck + 0.6, zd], speed: 1.1, phase: 0 }, { mat: 'hazard', color: '#ff5d5d', hazard: 'push', steady: true });
  // Same speed, a quarter turn apart: red, orange, red, orange... a rhythm.
  const high = b.mover(13.2, 0.4, 0.5, { type: 'spin', center: [0, deck + 2.0, zd], speed: 1.1, phase: Math.PI / 2 }, { color: '#ffb02e', hazard: 'push', steady: true });
  low.rope = 'low';
  high.rope = 'high';
  // A fence round the edge (beyond the bars' reach): get hit and you stay on the disc.
  const fence = { y: deck, color: '#ffd6e8', t: 0.3 };
  b.wallGapsX(-7.5, 7.5, zd - 7.4, 2.2, [[0, 4.4]], fence);
  b.wallGapsX(-7.5, 7.5, zd + 7.4, 2.2, [[0, 3.4]], fence);
  b.wallZ(zd - 7.5, zd + 7.5, -7.4, 2.2, fence);
  b.wallZ(zd - 7.5, zd + 7.5, 7.4, 2.2, fence);
  b.sign(0, deck + 4.2, zd - 6.8, 'Red-white striped bar: jump!\nTall orange bar: stand still!', { w: 4 });
  const left = b.plate(-5.5, deck, zd);
  const right = b.plate(5.5, deck, zd);
  const exit = plankBridge(b, 0, zd + 7.5, zd + 14, deck, [], { w: 3 });
  b.acts.find((a) => a.id === exit).when = { op: 'all', in: [left, right] };
  b.mark('ropeL', -5.5, deck, zd);
  b.mark('ropeR', 5.5, deck, zd);
  b.mark('disc', 0, deck, zd);
  b.gem(0, deck + 3.4, zd + 4);
  b.floor(0, deck, zd + 18, 10, 8, { mat: 'wood' });
  b.goal(0, deck, zd + 18.5);
  return b.finish();
}
