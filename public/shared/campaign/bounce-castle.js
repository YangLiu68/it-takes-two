// Level 15 · Bounce Castle: bounce drums. Learn the big pound-bounce, then drums
// that only exist while your partner stands on a plate, pillars you both have
// to pound at the same moment, drums your partner swaps red/blue mid-air, and
// a drum that rises up the castle wall while you bounce on it.

import { LevelBuilder } from '../build.js';
import { plankBridge } from './kit3.js';

export function bounceCastle(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'bounce-castle', name: 'Bounce Castle', label: `Level ${index + 1}`, theme: 'playroom', sky: 'day' });
  const R = 1.5;
  // A drum on a post; returns its id.
  const drum = (x, top, z, o = {}) => {
    const id = b.drum(x, top, z, R, o);
    if (!o.move) b.box(x, top - 0.35 - 8, z, 1.2, 16, 1.2, { mat: 'wood', deep: true });
    b.mark(id, x, top, z);
    return id;
  };

  // -- 1. Learn to bounce ----------------------------------------------------------------
  b.floor(0, 0, 0, 12, 10, { mat: 'wood' });
  b.checkpoint(0, 0, -1.5, 7, { hint: 'Step on a drum and it bounces you! Press C (ground pound) in mid-air to land on the drum and bounce higher — the only way up to the top ledge.' });
  b.sign(-3.5, 3.2, 3, 'Drums bounce you up', { w: 3.4 });
  const d1 = drum(0, 0.5, 8);
  b.floor(0, 4.6, 14.5, 10, 6, { color: '#ffb7d5' });
  const d2 = drum(0, 5.1, 15.5, { });
  b.sign(3, 7.6, 14, 'At the top, press C\nPound the drum: bounce higher!', { w: 4 });
  const H = 12.8;
  b.floor(0, H, 22, 10, 6, { color: '#9ad7ff' });
  b.gem(0, 9.6, 17.5);
  b.mark('L1', 0, 4.6, 13.2);
  b.mark('L2', 0, H, 21.5);

  // -- 2. Drums that need your partner --------------------------------------------------------
  b.checkpoint(0, H, 22.5, 5, { hint: 'The see-through drums only appear while someone stands on the plate. One holds it, the other bounces across; on the middle island, swap and hold the plate there.' });
  const p0 = b.plate(-3, H, 20.5);
  b.sign(-3, H + 2.9, 20.5, 'Hold: drums appear', { w: 3 });
  const a1 = drum(0, H + 0.5, 29);
  const p1 = b.plate(2.5, H, 42.5);
  const sw2 = b.pswitch(3.5, H, 63.5, true);
  const a2 = drum(0, H + 0.5, 36, { when: [p0, p1] });
  b.floor(0, H, 42.5, 8, 5, { color: '#ffd166' });
  b.sign(2.5, H + 2.9, 42.5, 'Hold: drums appear\non both sides', { w: 3.8 });
  const b1 = drum(0, H + 0.5, 49, { when: [p1, sw2] });
  const b2 = drum(0, H + 0.5, 56);
  b.gem(0, H + 4.2, 36);
  b.mark('island', -2, H, 42.5);
  b.mark('p0', -3, H, 20.5);
  b.mark('p1', 2.5, H, 42.5);
  b.mark('sw2', 3.5, H, 63.5);

  // -- 3. Pound together ------------------------------------------------------------------------
  b.floor(0, H, 70, 16, 22, { mat: 'wood' });
  b.sign(3.5, H + 2.9, 63.5, 'Pound: drums stay for good', { w: 3.4 });
  b.checkpoint(0, H, 66, 6, { hint: 'There is a button on top of each tall pillar. Pound-bounce up there, then pound both buttons at the same time (within 1 second)!' });
  const pillar = (x) => {
    b.plat(x, H + 8, 75, 2.6, 2.6, 8.4, { color: '#c98bff' });
    return b.pswitch(x, H + 8, 75, false, 1.2);
  };
  const swL = pillar(-4.5);
  const swR = pillar(4.5);
  const dL = drum(-4.5, H + 0.5, 71.2);
  const dR = drum(4.5, H + 0.5, 71.2);
  b.sign(0, H + 4.6, 75, '1, 2, 3 — pound!', { w: 3.6 });
  b.mark('pilL', -4.5, H + 8, 75);
  b.mark('pilR', 4.5, H + 8, 75);
  b.gem(0, H + 2, 77);
  b.wallGapsX(-8, 8, 81.2, 6, [[0, 3]], { color: '#c98bff', t: 0.6, y: H, lintel: 4.5 });
  const gate = b.door(0, 81.2, 3, 4.5, { op: 'all', in: [swL, swR] }, { latch: true, y: H, color: '#ff9ec8' });
  b.acts[b.acts.length - 1].toast = 'The castle gate is open!';
  void gate;

  // -- 4. Red / blue drums -----------------------------------------------------------------------
  b.floor(0, H, 85, 14, 7, { mat: 'wood' });
  b.checkpoint(0, H, 85, 5, { hint: 'Only one color of drum, red or blue, can be out at a time. One stands by the switch and flips the color each time their partner bounces off a drum!' });
  const dial = b.dial(-4, H, 84.5, { values: ['#ff5d5d', '#4f86ff'], style: 'color', h: 1.6 });
  const red = b.combo([dial], [0], { latch: false });
  const blue = b.combo([dial], [1], { latch: false });
  b.sign(-4, H + 3.4, 84.5, 'Pound: swap drums', { w: 3 });
  const colorDrums = [[1.5, 92, red], [-1.5, 98.5, blue], [1.5, 105, red], [-1.5, 111.5, blue]].map(([x, z, when]) => {
    const id = drum(x, H + 0.5, z, { when });
    return { id, x, z, when };
  });
  // Tint them so you can tell which is which.
  for (const d of colorDrums) b.bouncers.find((q) => q.id === d.id).tint = d.when === red ? '#ff5d5d' : '#4f86ff';
  void colorDrums;
  b.floor(0, H, 119, 12, 8, { mat: 'wood' });
  const sw4 = b.pswitch(3.5, H, 118, true);
  b.sign(3.5, H + 2.9, 118, 'Pound: a bridge\nfor your partner', { w: 3.4 });
  plankBridge(b, 5.5, 88.5, 115, H, sw4, { w: 2 });
  b.gem(-1.5, H + 3.2, 98.5);
  b.mark('dial', -4, H, 84.5);
  b.mark('sw4', 3.5, H, 118);

  // -- 5. The rising drum -------------------------------------------------------------------------
  b.floor(0, H, 128, 14, 10, { mat: 'wood' });
  b.checkpoint(0, H, 124.5, 5, { hint: 'While someone holds the plate, the drum rises up the castle wall. Pound-bounce on the raised drum to reach the top of the castle! Then whoever is up top holds the plate there to raise a drum for their partner.' });
  const pb = b.plate(-4.5, H, 126);
  const top = H + 15.5;
  const pt = b.plate(3, top, 136.5);
  const lift = b.drum(0, H + 0.5, 131, R, { move: [0, 7, 0], moveWhen: [pb, pt], speed: 4 });
  b.mark(lift, 0, H + 0.5, 131);
  b.box(0, H + 4, 132.8, 3.4, 8, 0.6, { color: '#c98bff' }); // the rail it climbs
  b.sign(-4.5, H + 2.9, 126, 'Hold: the drum rises', { w: 3.2 });
  b.plat(0, top, 139, 12, 10, 16, { color: '#ffd6e8' });
  b.sign(3, top + 2.9, 136.5, 'Hold: raise the drum\nfor your partner', { w: 3.4 });
  b.gem(-3, top + 1.2, 141);
  b.mark('pb', -4.5, H, 126);
  b.mark('pt', 3, top, 136.5);
  b.mark('castle', -2, top, 137.5);
  b.goal(0, top, 141);

  void d1; void d2; void a1; void a2; void b1; void b2; void dL; void dR;
  return b.finish();
}
