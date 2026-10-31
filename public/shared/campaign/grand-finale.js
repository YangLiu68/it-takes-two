// Level 30 · Grand Finale: the finale. Every stage puts two ideas from the campaign
// together, and the last gate needs you both.
//   1. ice + red/blue blocks — slide down the ice; your partner swaps the bridges under you
//   2. low gravity + seesaw — a moon seesaw throws one of you onto a sky island; they send the lift down
//   3. rising lava + magnet pads + rope — up the burning tower: pad up, haul your partner, again
//   4. portals + a timer — one starts the clock and reads the route; the other runs the portals
//   5. lights + drums — the order shows only while someone watches; bounce up the pillars to press it
//   6. the last gate — both plates at once, and through

import { LevelBuilder } from '../build.js';
import { PHYS } from '../constants.js';

const RED = '#ff5d5d', BLUE = '#4f86ff';
const COLORS = [['red', '#ff4d5e'], ['yellow', '#ffd23f'], ['green', '#3fd17a'], ['blue', '#3f8cff']];

export function grandFinale(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'grand-finale', name: 'Grand Finale', label: `Level ${index + 1}`, theme: 'playroom', sky: 'aurora' });
  const r = b.rng;
  const pastel = '#f3d9ff', ice = '#bfe8ff', gold = '#ffd166';
  const block = (x, top, z, w, d, y0, o = {}) => b.floor(x, top, z, w, d, { t: top - y0, ...o });
  const rope = (x, z, sx, sz, y0, h, len) => b.zone('tether', x, y0 + 0.3 + h / 2, z, sx, h + 1, sz, { len });

  // -- Start ---------------------------------------------------------------------------------
  b.floor(0, 0, 3, 14, 8, { color: pastel });
  b.checkpoint(0, 0, 2, 6, { hint: 'The final level! Every stage mixes two tricks you have already learned.' });
  b.sign(-4.5, 3.4, 1, 'GRAND FINALE\nIce · Red & Blue · Low gravity\nSeesaws · Lava · Magnets · Rope\nPortals · Memory · Drums', { style: 'prank', w: 5 });

  // -- 1. Ice + red/blue blocks ---------------------------------------------------------------
  // An ice runway with three gaps; red blocks fill gaps 1 and 3, blue fills gap 2.
  const ice1 = [[7, 20], [23, 33], [36, 46], [49, 56]];
  for (const [z0, z1] of ice1) b.floor(0, 0, (z0 + z1) / 2, 4, z1 - z0, { ice: true, color: ice });
  for (const s of [-1, 1]) b.box(s * 2.2, 0.3, 31.5, 0.4, 0.6, 49, { color: pastel });
  const d1 = b.dial(-4.6, 0, 5.2, { values: [RED, BLUE], style: 'color' });
  b.floor(0, 0, 60, 14, 8, { color: pastel }); // the far side, z 56–64
  const d2 = b.dial(4.6, 0, 58.4, { values: [RED, BLUE], style: 'color', links: [d1] });
  b.dials.find((d) => d.id === d1).links.push(d2); // the two switches stay in step
  b.swap(0, 0, 21.5, 4, 3, { dial: d1, on: 0, color: RED });
  b.swap(0, 0, 34.5, 4, 3, { dial: d1, on: 1, color: BLUE });
  b.swap(0, 0, 47.5, 4, 3, { dial: d1, on: 0, color: RED });
  b.sign(-5.6, 2.6, 6.6, 'Pound the switch:\nred and blue blocks\ntake turns', { style: 'prank', w: 3.4 });
  b.sign(0, 2.6, 8.6, 'No stopping on ice!\nLet your partner\nswap the bridge', { style: 'prank' });
  b.gem(0, 1.3, 40);
  b.mark('ice', 0, 0, 7.5);

  // -- 2. Low gravity + seesaw -------------------------------------------------------------------
  b.checkpoint(0, 0, 60, 6, { hint: 'Gravity is low here! The seesaw can fling you up to the sky island; whoever gets up pounds the switch to send the lift down for the partner.' });
  b.floor(0, 0, 70, 14, 12, { color: pastel }); // z 64–76
  b.zone('gravity', 0, 14, 77, 20, 30, 26, { g: 0.5 }); // z 64–90
  b.seesaw(0, 1.0, 69, 9.2, 2.4);
  const SKY = 18;
  block(0, SKY, 86, 10, 8, SKY - 2, { color: gold }); // the sky island, z 82–90
  // The lift comes down for your partner only while you stand on the plate up here.
  const liftSw = b.plate(3, SKY, 84);
  b.act('lift', { op: 'all', in: [liftSw] }, false, [
    { x: 0, y: -0.2, z: 79.4, sx: 3, sy: 0.4, sz: 3, move: [0, SKY, 0] },
  ], { speed: 5, lamp: [0, SKY + 0.4, 81.6] });
  b.sign(0, 3.4, 65, 'Low-gravity seesaw:\none stands, one pounds!', { style: 'prank' });
  b.gem(0, 12, 77);
  b.mark('saw', 0, 1, 69);
  b.mark('lift', 0, 0, 79.4);

  // -- 3. The burning tower: lava, magnet pads, the rope ---------------------------------------------
  b.checkpoint(0, SKY, 86, 6, { hint: 'The lava is rising! Sol bounces off the red pads, Luna off the blue ones: whoever bounces up walks in and hauls the partner up with the rope. Hurry!' });
  const T1 = SKY + 7, T2 = SKY + 14, T3 = SKY + 21;
  block(0, SKY, 94, 12, 8, SKY - 2, { color: '#ffb3a1' }); // base, z 90–98
  block(0, T1, 101, 12, 6, SKY - 2, { color: '#ff9a7a' }); // ledge 1, z 98–104
  block(0, T2, 107, 12, 6, SKY - 2, { color: '#ff8466' }); // ledge 2, z 104–110
  block(0, T3, 115, 12, 10, SKY - 2, { color: '#ff6e52' }); // the top, z 110–120
  for (const s of [-1, 1]) b.box(s * 6.2, T3 / 2 + 4, 105, 0.4, T3 - 2, 30, { color: '#ffb3a1' });
  const tower = b.zone('trigger', 0, SKY + 1.5, 92, 12, 3, 2);
  b.flood(0, 100, 12, 20, { y0: SKY - 4, y1: T3 - 1, speed: 0.32, when: tower, grace: 3 });
  b.pad(-2.5, SKY + 0.08, 96.9, [0, 1, 0], 1, { launch: [0, PHYS.repelSpeed, 0] });
  b.pad(2.5, T1 + 0.08, 102.9, [0, 1, 0], -1, { launch: [0, PHYS.repelSpeed, 0] });
  b.pad(-2.5, T2 + 0.08, 108.9, [0, 1, 0], 1, { launch: [0, PHYS.repelSpeed, 0] });
  rope(0, 104, 14, 28, SKY, T3 - SKY + 3, 5.5);
  b.sign(0, SKY + 3.2, 93, 'Lava\'s coming!\nBounce up, haul your partner!', { style: 'prank' });
  b.gem(4.5, T2 + 1.3, 106);
  b.mark('pad1', -2.5, SKY, 96.9);
  b.mark('pad2', 2.5, T1, 102.9);
  b.mark('pad3', -2.5, T2, 108.9);

  // -- 4. Portals against the clock ------------------------------------------------------------------
  b.checkpoint(0, T3, 116, 6, { hint: 'One pounds the timer switch and the gate opens for just 10 seconds; the note by the switch says which portals to take. The other waits by the portals, listens for the route and rushes through!' });
  const Y = T3;
  b.floor(0, Y, 127, 14, 14, { color: pastel }); // the portal room, z 120–134
  b.wallX(-7, 7, 134, 5, { color: '#c9a6ff', y: Y });
  for (const s of [-1, 1]) b.wallZ(120, 134, s * 7, 5, { color: '#c9a6ff', y: Y });
  // Portal: an arch with a glowing panel you can walk into.
  const portal = (x, z, label, to, good) => {
    for (const s of [-1, 1]) b.box(x + s * 1.2, Y + 1.5, z, 0.3, 3, 0.4, { color: gold });
    b.box(x, Y + 3.1, z, 2.7, 0.3, 0.4, { color: gold });
    b.trap('fake', x, Y + 2.9, z, 2.1, 0.12, { t: 2.8, color: '#b06bff' });
    b.sign(x, Y + 3.8, z, label, { style: 'prank', w: 1.1 });
    b.zone('warp', x, Y + 1.5, z + 0.1, 2, 3, 0.6, { to, text: good ? '' : 'Wrong door! Back to the start.', quiet: good });
  };
  // Start room: three portals; the right one goes to the middle room.
  const routeA = r.int(0, 2), routeB = r.int(0, 1);
  const LET = ['A', 'B', 'C'];
  const back = [0, Y, 123, 0];
  [-4, 0, 4].forEach((x, k) => portal(x, 133.4, LET[k], k === routeA ? [0, Y, 140.6, 0] : back, k === routeA));
  b.floor(0, Y, 144, 12, 10, { color: pastel }); // the middle room, z 139–149 (no way in but the portal)
  b.wallX(-6, 6, 149, 5, { color: '#c9a6ff', y: Y });
  b.wallX(-6, 6, 139, 5, { color: '#c9a6ff', y: Y });
  for (const s of [-1, 1]) b.wallZ(139, 149, s * 6, 5, { color: '#c9a6ff', y: Y });
  [-2.5, 2.5].forEach((x, k) => portal(x, 148.4, LET[k], k === routeB ? [0, Y, 155.6, 0] : back, k === routeB));
  b.floor(0, Y, 157, 12, 6, { color: pastel }); // the last room, z 154–160, then the gate
  b.wallGapsX(-6, 6, 160, 5, [[0, 3]], { color: '#c9a6ff', y: Y, lintel: 3.4 });
  for (const s of [-1, 1]) b.wallZ(154, 160, s * 6, 5, { color: '#c9a6ff', y: Y });
  b.wallX(-6, 6, 154, 5, { color: '#c9a6ff', y: Y });
  const timer = b.pswitch(-4.5, Y, 122, false, 10, gold);
  const timer2 = b.pswitch(3, Y, 165, false, 10, gold);
  b.door(0, 160, 3, 3.3, { op: 'any', in: [timer, timer2] }, { y: Y, latch: false, speed: 10, color: gold });
  b.sign(-4.5, Y + 2.2, 120.3, `Route: door ${LET[routeA]} first,\nthen door ${LET[routeB]}`, { fixed: true, yaw: 0, style: 'paper', w: 2.6 });
  b.sign(-4.5, Y + 3.8, 122, 'Timer switch:\ngate opens 10 s', { style: 'prank' });
  b.floor(0, Y, 168, 14, 16, { color: pastel }); // past the gate, z 160–176
  b.sign(3, Y + 2.6, 165, 'Made it? Pound here\nto open the gate\nfor your partner!', { style: 'prank' });
  b.gem(0, Y + 1.3, 157);
  b.mark('portalA', [-4, 0, 4][routeA], Y, 133.4);
  b.mark('portalB', [-2.5, 2.5][routeB], Y, 148.4);

  // -- 5. Lights + drums ----------------------------------------------------------------------------------
  b.checkpoint(0, Y, 170, 6, { hint: 'The pillar lamps only light up in order while someone stands on the watch plate; the other bounces off the drums onto the pillar tops and pounds the buttons in that order.' });
  const watch = b.plate(-6, Y, 172);
  b.sign(-6, Y + 2.4, 172, 'Watch plate', { style: 'prank' });
  b.floor(0, Y, 184, 18, 16, { color: pastel }); // the drum yard, z 176–192
  const PH = 4.6;
  const pillars = [[-6, 186], [-2, 189], [2, 189], [6, 186]];
  const btn5 = pillars.map(([x, z], i) => {
    block(x, Y + PH, z, 2.4, 2.4, Y, { color: COLORS[i][1] });
    b.bouncer(x, Y + 0.5, z - 2.8, 1.1);
    b.box(x, Y + 0.15, z - 2.8, 1.4, 0.3, 1.4, { mat: 'wood' });
    return b.pswitch(x, Y + PH, z, false, 0.5, COLORS[i][1]);
  });
  const order5 = r.shuffle([0, 1, 2, 3]);
  const SLOT = 0.9, P5 = 4 * SLOT + 1.8;
  order5.forEach((i, k) => b.light(pillars[i][0], Y + PH + 2.2, pillars[i][1], {
    color: COLORS[i][1], intensity: 8, dist: 6, fixture: 'bulb', size: 2.8, pulse: [P5, 1 - (k * SLOT) / P5, (SLOT * 0.7) / P5], when: watch,
  }));
  const seq5 = b.seq(order5.map((i) => btn5[i]));
  b.sign(0, Y + 3.2, 179, 'Bounce off the drums\nonto the pillars!', { style: 'prank' });
  b.gem(-2, Y + PH + 1.3, 189);
  b.mark('pillars', 0, 0, 0);

  // -- 6. The last gate -----------------------------------------------------------------------------------
  b.wallGapsX(-9, 9, 192, 6, [[0, 4]], { color: gold, y: Y, lintel: 4.2 });
  b.door(0, 192, 4, 4, { op: 'all', in: [seq5] }, { y: Y, latch: true, color: gold });
  b.acts[b.acts.length - 1].toast = 'The last door is open!';
  b.floor(0, Y, 202, 18, 20, { color: gold }); // z 192–212
  const pa = b.plate(-6, Y, 198), pb = b.plate(6, Y, 198);
  b.wallGapsX(-9, 9, 204, 7, [[0, 4]], { color: '#ff7ab8', y: Y, lintel: 5 });
  b.door(0, 204, 4, 5, { op: 'all', in: [pa, pb] }, { y: Y, latch: true, color: '#ff7ab8' });
  b.acts[b.acts.length - 1].toast = 'You did it together!';
  b.sign(0, Y + 6.2, 203.6, 'Both of you,\nstand on the plates', { style: 'prank', w: 4 });
  for (const [x, z] of [[-6, 208], [-3, 210], [0, 209], [3, 210], [6, 208]]) b.gem(x, Y + 1.4, z);
  b.sign(0, Y + 4.4, 211, 'You beat the campaign!\nBest partners ever!', { style: 'prank', w: 5 });
  b.goal(0, Y, 208.5);

  b.objectives = [
    { text: 'Slide over the ice while your partner swaps the red/blue bridges', done: { cp: 1 } },
    { text: 'Low-gravity seesaw to the sky island, send the lift down', done: { cp: 2 } },
    { text: 'Lava tower: bounce up, haul your partner, bounce again...', done: { cp: 3 } },
    { text: 'Timed gate: follow the called route through the portals', done: { cp: 4 } },
    { text: 'Watch the lamp order, bounce up the pillars and pound', done: { sig: seq5 } },
    { text: 'Both stand on the last plates!', done: {} },
  ];
  return b.finish();
}
