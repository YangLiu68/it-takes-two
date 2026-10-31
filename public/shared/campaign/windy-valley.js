// Level 8 · Windy Valley: updrafts, used five different ways — climbing the wind,
// powering it for your partner, hopping between columns of wind over a gorge,
// a red/blue switch that decides which fans blow, and a shaft whose hatches
// only your partner can open.

import { LevelBuilder } from '../build.js';
import { slab } from './kit2.js';

const FAN = 56;

export function windyValley(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'windy-valley', name: 'Windy Valley', label: `Level ${index + 1}`, theme: 'garden', sky: 'sunset' });
  const fanBase = (x, top, z, o = {}) => slab(b, x, top, z, o.w ?? 3.4, o.w ?? 3.4, { mat: 'metal', color: o.color, t: 0.6 });
  // A column of wind standing in the gorge: its fan hangs far below.
  const column = (x, z, top, o = {}) => {
    const base = top - (o.h ?? 18);
    fanBase(x, base, z, { w: 3, color: o.color });
    b.fan(x, base, z, o.r ?? 2, top - base, FAN, o.when || null);
    return { x, z, top };
  };

  // -- 0. Start --------------------------------------------------------------------------
  slab(b, 0, 0, 0.5, 12, 11);
  b.checkpoint(0, 0, -1, 8, { hint: 'Walk into the airflow above a fan and the wind carries you up. Drift over to the next platform while you float.' });
  b.sign(0, 3.3, 3.6, 'Updraft!\nStep over a fan to float up', { style: 'prank' });

  // -- 1. Climb the wind ----------------------------------------------------------------------
  fanBase(0, 0.25, 7.2);
  b.fan(0, 0.25, 7.2, 1.5, 9.2, FAN);
  slab(b, 0, 6.4, 13.6, 10, 8.8, { t: 9 });
  fanBase(3, 6.65, 17.2);
  b.fan(3, 6.65, 17.2, 1.5, 9.2, FAN);
  b.gem(3, 16.4, 17.2);
  slab(b, 0, 12.8, 24.75, 12, 11.5, { t: 16 });
  b.mark('fan1', 0, 0.25, 7.2);
  b.mark('fan2', 3, 6.65, 17.2);

  // -- 2. Power the fan for each other -----------------------------------------------------------
  b.checkpoint(0, 12.8, 22, 7, { hint: 'This fan has no power. One stands on the plate to power it and blow their partner up the cliff; then the one up top stands on the plate at the edge to blow you up too.' });
  const PA = b.plate(4.2, 12.8, 28);
  const PB = b.plate(-3, 25, 33.2);
  fanBase(-3, 13.05, 28.5);
  b.fan(-3, 13.05, 28.5, 1.5, 15, FAN, { op: 'any', in: [PA, PB] });
  b.wire(PA, [[4.2, 12.8, 28], [-1.2, 12.8, 28]]);
  b.box(0, 12.8 + (25 - 12.8) / 2 - 8, 37, 14, 25 - 12.8 + 16, 13, { color: '#8fcf7a' }); // the cliff (top 25)
  b.sign(0.5, 16, 26.5, 'The plate powers the fan—\nblow your partner up!', { style: 'prank' });
  b.gem(5, 26.4, 41.5);
  b.mark('PA', 4.2, 12.8, 28);
  b.mark('PB', -3, 25, 33.2);
  b.mark('fanA', -3, 13.05, 28.5);

  // -- 3. Hop the columns across the gorge -------------------------------------------------------
  b.checkpoint(0, 25, 39.5, 7, { hint: 'Columns of wind rise out of the canyon. Jump into one to be held up, and your double jump comes back — hop from one to the next!' });
  b.sign(0, 28.2, 43, 'Wind resets your double jump!\nHop column to column', { style: 'prank' });
  const cols = [column(0, 52, 29), column(4, 61, 31), column(-2, 70, 28), column(2, 79, 30)];
  b.gem(-2, 30, 70);
  slab(b, 0, 27, 91, 12, 10, { t: 3 });
  cols.forEach((c, i) => b.mark(`col${i}`, c.x, c.top, c.z));

  // -- 4. Red row or blue row: your partner picks which fans blow ---------------------------------
  b.checkpoint(0, 27, 89, 7, { hint: "The red and blue fans can't run at the same time. Each time the one crossing jumps, the one left behind flips the switch; once across, stand on the plate and both rows of fans turn on." });
  const sw = b.dial(-3.2, 27, 94.2, { values: ['#ff5d5d', '#4f86ff'], style: 'color' });
  const redOn = b.combo([sw], [0], { latch: false });
  const blueOn = b.combo([sw], [1], { latch: false });
  const far = b.plate(3, 27, 141);
  const rows = [['#ff5d5d', redOn], ['#4f86ff', blueOn], ['#ff5d5d', redOn], ['#4f86ff', blueOn]];
  const tog = rows.map(([color, on], i) => column(0, 104 + 9 * i, 30, { color, when: { op: 'any', in: [on, far] }, h: 16 }));
  b.sign(-3.2, 30, 95.6, 'Pound the switch: red / blue\nOnly one row runs at a time', { style: 'prank' });
  b.sign(3, 29.6, 139.6, 'Stand here:\nboth rows of fans turn on', { style: 'prank' });
  b.gem(0, 31.5, 117.5);
  slab(b, 0, 27, 143, 12, 10, { t: 3 });
  tog.forEach((c, i) => b.mark(`tog${i}`, c.x, c.top, c.z));
  b.mark('switch', -3.2, 27, 94.2);
  b.mark('far', 3, 27, 141);

  // -- 5. The hatch shaft ----------------------------------------------------------------------------
  const s0 = 27;
  const SZ = 156;
  b.checkpoint(0, 27, 143, 7, { hint: "The wind in the shaft never stops, but three hatches block it. One floats up inside the shaft while the other climbs the stairs outside, standing on each floor's plate to open its hatch. At the top, pound the button to open every hatch." });
  slab(b, 0, s0, 156, 16, 16, { t: 2 }); // floor around the shaft (z 148..164)
  const H = 30;
  const wall = { color: '#c9b48a' };
  b.box(-2.25, s0 + H / 2, SZ, 0.5, H, 5, wall);
  b.box(2.25, s0 + H / 2, SZ, 0.5, H, 5, wall);
  b.box(0, s0 + H / 2, SZ + 2.25, 4, H, 0.5, wall);
  b.box(-1.5, s0 + H / 2, SZ - 2.25, 1, H, 0.5, wall); // south wall, door gap in the middle
  b.box(1.5, s0 + H / 2, SZ - 2.25, 1, H, 0.5, wall);
  b.box(0, s0 + 2.9 + (H - 2.9) / 2, SZ - 2.25, 2, H - 2.9, 0.5, wall);
  fanBase(0, s0 + 0.25, SZ, { w: 3 });
  b.fan(0, s0 + 0.25, SZ, 1.6, H + 3, FAN);
  const master = b.pswitch(-3, s0 + H, 162.5, true);
  const ring = [];
  const hatchAt = [8, 16, 24];
  const stepTop = (k) => s0 + 1.4 + 1.6 * k;
  for (let k = 0; k < 14; k++) {
    const th = -Math.PI / 4 + (k * Math.PI) / 4;
    const x = 5.4 * Math.cos(th), z = SZ + 5.4 * Math.sin(th);
    const landing = k === 3 || k === 8 || k === 13;
    slab(b, x, stepTop(k), z, landing ? 3.2 : 2.6, landing ? 3.2 : 2.6, { mat: landing ? 'metal' : 'wood', t: 0.6 });
    ring.push([x, stepTop(k), z]);
  }
  const hatchPlates = [3, 8, 13].map((k) => b.plate(ring[k][0], ring[k][1], ring[k][2]));
  hatchAt.forEach((y, i) => {
    b.act('door', { op: 'any', in: [hatchPlates[i], master] }, false, [
      { x: 0, y: s0 + y, z: SZ, sx: 4, sy: 0.4, sz: 4, move: [4.6, 0, 0] },
    ], { speed: 9, color: '#ffd166', lamp: [2.6, s0 + y + 0.8, SZ - 2.6] });
  });
  b.sign(0, s0 + 3.8, SZ - 2.6, 'The shaft: three hatches\nStair plates open them', { style: 'prank' });
  slab(b, 0, s0 + H, 164.5, 10, 12); // the top (z 158.5..170.5)
  b.sign(-3, s0 + H + 2.6, 164, 'Pound this button:\nall hatches open', { style: 'prank' });
  b.gem(0, s0 + 20, SZ);
  b.mark('shaft', 0, s0, SZ);
  b.mark('master', -3, s0 + H, 162.5);
  ring.forEach((r, k) => b.mark(`step${k}`, r[0], r[1], r[2]));
  b.goal(2, s0 + H, 166.5);

  b.objectives = [
    { text: 'Ride the updrafts up the valley', done: { cp: 1 } },
    { text: 'Power the fan with the plate and blow each other up the cliff', done: { cp: 2 } },
    { text: 'Hop between the wind columns over the canyon', done: { cp: 3 } },
    { text: 'One flips the red/blue switch, the other hops the wind columns across', done: { cp: 4 } },
    { text: 'Open the shaft hatches from the stair plates, then pound the button at the top', done: { sig: master } },
    { text: 'Both reach the summit', done: {} },
  ];
  return b.finish();
}
