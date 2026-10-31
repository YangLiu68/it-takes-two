// Level 22 · Special Delivery (delivery): carry parcels to mailboxes. Drop off a ledge
// and the parcel goes back where you found it. Each stage carries differently:
// a first delivery, parcels only one of you may touch, a relay through two
// lanes where the parcel changes hands at each hatch, an express run through
// hammers before the door shuts, and four parcels for the big lock.

import { LevelBuilder } from '../build.js';
import { PHYS } from '../constants.js';
import { wallX, wallZ } from './kit4.js';

const BROWN = '#d9a066';
const RED = '#ff6b4a';
const BLUE = '#4f86ff';
const FL = '#f2e2c4';

export function delivery(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'delivery', name: 'Special Delivery', label: `Level ${index + 1}`, theme: 'garden', sky: 'sunset' });
  const fl = (x, top, z, w, d, o = {}) => b.floor(x, top, z, w, d, { color: FL, ...o });
  const parcel = (x, top, z, o = {}) => b.item('parcel', x, top + 1.0, z, { color: o.who === 0 ? RED : o.who === 1 ? BLUE : BROWN, label: o.label || 'Parcel', who: o.who ?? null, when: o.when });
  const Y = 1.6;

  // -- Start + 1. The first delivery ------------------------------------------------------
  fl(0, 0, 4, 12, 10);
  b.checkpoint(0, 0, 3, 6, { hint: 'Pick up the parcel (just walk into it) and deliver it to the mailbox on the far side. If you fall, the parcel goes back where it was!' });
  const p1 = parcel(3, 0, 6, { label: 'First parcel' });
  b.sign(3, 3.4, 6, 'Delivery!\nTake it to the mailbox\nover there', { style: 'prank' });
  for (const [x, top, z] of [[0, 0.8, 12.5], [3, 1.6, 17], [0, 2.4, 21.5], [-3, 1.6, 26]]) fl(x, top, z, 3, 3, { t: 0.8, color: '#e8c79a' });
  b.gem(3, 3.4, 17);
  fl(0, Y, 33, 10, 8); // depot 29..37
  const l1 = b.lock(0, Y, 34.5, [p1], { label: 'Mailbox' });
  wallX(b, -5, 5, 37.25, Y, Y + 5, [-2, 2, Y, Y + 4], { color: '#c98f5a' });
  const g1 = b.door(0, 37.25, 4, 4, { op: 'all', in: [l1] }, { y: Y, color: '#ffb347' });

  // -- 2. Only you can carry it -------------------------------------------------------------
  // The red parcel is locked in a cage your partner opens by standing on a plate;
  // the blue one is on a shelf only a magnet launch reaches.
  fl(0, Y, 47, 20, 20); // warehouse 37..57
  b.checkpoint(0, Y, 40, 5, { hint: 'Only Sol can carry red parcels, only Luna blue ones. The cage door opens while your partner holds the plate. The blue parcel is on a high shelf — Luna, stand on the blue magnet pad and hold E to bounce up!' });
  // Cage.
  wallZ(b, 49, 55, -10.25, Y, Y + 4, null, { color: '#a0785a' });
  wallX(b, -10.5, -3.5, 48.75, Y, Y + 4, null, { color: '#a0785a' });
  wallX(b, -10.5, -3.5, 55.25, Y, Y + 4, null, { color: '#a0785a' });
  wallZ(b, 49, 55, -3.75, Y, Y + 4, [50.6, 53.4, Y, Y + 3.4], { color: '#a0785a' });
  const cagePlate = b.plate(7, Y, 41.5);
  b.door(-3.75, 52, 2.8, 3.4, { op: 'all', in: [cagePlate] }, { axis: 'z', y: Y, latch: false, color: '#ff8f6b' });
  b.sign(7, Y + 2.6, 41.5, 'Hold: cage\ndoor opens', { style: 'prank', w: 2.2 });
  const p2s = parcel(-7, Y, 52, { who: 0, label: 'Red parcel' });
  // Shelf + launch pad.
  b.box(7, Y + 3.5, 53.5, 6, 7, 5, { color: '#b98a5e' }); // top Y + 7
  b.pad(7, Y + 0.08, 48.5, [0, 1, 0], -1, { launch: [0, PHYS.repelSpeed, 0] });
  b.sign(7, Y + 3.2, 47, 'Luna: stand on\nthe blue pad, hold E', { style: 'prank' });
  const p2l = parcel(7, Y + 7, 53.5, { who: 1, label: 'Blue parcel' });
  b.gem(9, Y + 8.6, 55);
  const l2 = b.lock(0, Y, 55, [p2s, p2l], { label: 'Duo mailbox' });
  wallX(b, -10, 10, 57.25, Y, Y + 5, [-2, 2, Y, Y + 4], { color: '#c98f5a' });
  b.door(0, 57.25, 4, 4, { op: 'all', in: [l2] }, { y: Y, color: '#ffb347' });

  // -- 3. The relay -------------------------------------------------------------------------
  // Two lanes, one each. A parcel changes hands at each hatch: drop yours in,
  // your partner's comes out on their side. Each of you also helps the other's lane.
  fl(0, Y, 59.5, 20, 5); // 57..62
  b.checkpoint(0, Y, 59.6, 4, { hint: 'Relay! Sol takes the red lane on the left, Luna the blue lane on the right. Drop a parcel into a hatch in the wall and a new one pops out on your partner\'s side.' });
  b.field(-5, Y + 2, 62.2, 8, 4, 0.3, 1);
  b.field(5, Y + 2, 62.2, 8, 4, 0.3, -1);
  b.box(0, Y + 2.5, 87.6, 0.6, 5, 51.2, { color: '#c98f5a' }); // divider 62..113
  for (const x of [-9.25, 9.25]) b.box(x, Y + 2.5, 87.6, 0.5, 5, 51.2, { color: '#c98f5a' });
  // Sol, leg 1: ride the shuttle over the gap.
  fl(-5, Y, 65.5, 8, 7); // 62..69
  const pa = parcel(-5, Y, 66, { who: 0, label: 'Red parcel A' });
  b.mover(3, 0.8, 3, { type: 'linear', a: [-5, Y - 0.4, 70.5], b: [-5, Y - 0.4, 77.5], period: 6, phase: 0 }, { steady: true, color: '#ffb347' });
  fl(-5, Y, 86, 8, 14); // 79..93
  const r1 = b.lock(-1.8, Y, 81, [pa], { label: 'Hatch 1' });
  const ps = b.plate(-5, Y, 90);
  b.sign(-5, Y + 2.6, 90, 'Hold: stops the\nhammers on Luna\'s side', { style: 'prank' });
  // Luna, leg 2: crumbling tiles under a hammer that stops while Sol holds his plate.
  fl(5, Y, 72, 8, 20); // 62..82
  const pb = parcel(3.5, Y, 80.5, { who: 1, label: 'Blue parcel B', when: r1 });
  for (const z of [84, 88, 92]) b.crumble(5, Y, z, 3, 3);
  b.pendulum(5, Y + 7.35, 88, 6.4, 1.05, 2.6, 0, [1.4, 1.4, 2.0]);
  b.pendulums[b.pendulums.length - 1].stop = ps;
  for (const side of [-1, 1]) b.box(5 + side * 3.8, Y - 3.03, 88, 0.6, 21.95, 0.6, { mat: 'metal', deep: true });
  b.box(5, Y + 7.65, 88, 8.2, 0.5, 0.6, { mat: 'metal' });
  fl(5, Y, 98.5, 8, 5); // 96..101
  const r2 = b.lock(1.8, Y, 98.5, [pb], { label: 'Hatch 2' });
  fl(5, Y, 107, 8, 12); // 101..113
  const pl3 = b.plate(5, Y, 104);
  b.sign(5, Y + 2.6, 104, 'Hold: reverses the\nbelt on Sol\'s side', { style: 'prank' });
  // Sol, leg 3: a belt that runs against you unless Luna flips it.
  fl(-5, Y, 97, 8, 8); // 93..101
  const pc = parcel(-3.5, Y, 98, { who: 0, label: 'Red parcel C', when: r2 });
  b.belt(-5, Y, 107, 4, 12, 7, [0, -1], { flip: pl3 });
  fl(0, Y, 116, 20, 6); // 113..119
  const l3 = b.lock(-5, Y, 116.5, [pc], { label: 'Mailbox' });
  wallX(b, -10, 10, 119.25, Y, Y + 5, [-2, 2, Y, Y + 4], { color: '#c98f5a' });
  b.door(0, 119.25, 4, 4, { op: 'all', in: [l3] }, { y: Y, color: '#ffb347' });
  b.gem(-5, Y + 1.2, 75);

  // -- 4. Express ---------------------------------------------------------------------------
  // The mailbox room's door only opens for 12 seconds; between it and you, hammers.
  fl(0, Y, 122, 14, 6); // 119..125
  b.checkpoint(0, Y, 122, 4, { hint: 'Express delivery! One pounds the timer switch and the door opens for just 12 seconds; the other rushes the parcel past the hammers. Once inside, open the door for your partner.' });
  const p4s = parcel(-4, Y, 121.5, { who: 0, label: 'Red express' });
  const p4l = parcel(4, Y, 121.5, { who: 1, label: 'Blue express' });
  const t4 = b.pswitch(-6, Y, 124, false, 12, '#7cff9e');
  b.sign(-6, Y + 3, 124, 'Timer switch\n(door opens 12 s)', { style: 'prank' });
  fl(0, Y, 135, 3.2, 20, { color: '#e8c79a' }); // 125..145
  const hammers = [129, 135, 141];
  hammers.forEach((z, k) => {
    b.pendulum(0, Y + 7.35, z, 6.4, 1.05, 3.4, k * 0.31, [1.4, 1.4, 2.0]);
    for (const side of [-1, 1]) b.box(side * 3.8, Y - 3.03, z, 0.6, 21.95, 0.6, { mat: 'metal', deep: true });
    b.box(0, Y + 7.65, z, 8.2, 0.5, 0.6, { mat: 'metal' });
  });
  wallX(b, -7, 7, 145.25, Y, Y + 5, [-1.8, 1.8, Y, Y + 4], { color: '#c98f5a' });
  fl(0, Y, 149, 10, 8); // 145..153
  const t4b = b.pswitch(3.5, Y, 147.5, false, 12, '#7cff9e');
  const door4 = b.door(0, 145.25, 3.6, 4, { op: 'any', in: [t4, t4b] }, { y: Y, latch: false, color: '#7cff9e' });
  const l4 = b.lock(0, Y, 150.5, [p4s, p4l], { label: 'Express mailbox' });
  wallX(b, -5, 5, 153.25, Y, Y + 5, [-2, 2, Y, Y + 4], { color: '#c98f5a' });
  b.door(0, 153.25, 4, 4, { op: 'all', in: [l4] }, { y: Y, color: '#ffb347' });
  b.marks.hammers = hammers;

  // -- 5. Four parcels for the big lock -------------------------------------------------------
  fl(1, Y, 163, 28, 20); // 153..173, x -13..15
  b.checkpoint(0, Y, 156, 5, { hint: 'The big mailbox needs four parcels: on the tall pillar (seesaw launch), in the carousel (Luna hops on the spinning platform), in the vault (both stand on the two plates at once) and on the high shelf (jump off your partner\'s head).' });
  // a) On the pillar: seesaw.
  b.seesaw(-8, Y + 1.0, 156, 9.2, 2.4);
  b.box(-8, Y + 9.6 / 2 - 0.5, 165, 6, 10.6, 8, { color: '#b98a5e' }); // top Y + 9.6
  const p5a = parcel(-8, Y + 9.6, 164, { who: 0, label: 'Pillar parcel' });
  b.gem(-6, Y + 10.8, 167);
  // b) In the middle of the carousel.
  b.mover(2.6, 0.6, 2.6, { type: 'orbit', center: [8, Y + 2.1, 159], radius: 4, speed: 0.5, phase: 0 }, { steady: true, color: '#7cd6ff' });
  b.floor(8, Y + 4.4, 159, 2.2, 2.2, { t: 4.4, color: '#b98a5e' }); // pedestal, top Y + 4.4
  const p5b = parcel(8, Y + 4.4, 159, { who: 1, label: 'Carousel parcel' });
  // c) In the vault: both plates at once.
  const va = b.plate(-12, Y, 171), vb = b.plate(12, Y, 155);
  wallZ(b, 165, 171, 4.75, Y, Y + 4, [166.6, 169.4, Y, Y + 3.4], { color: '#a0785a' });
  wallZ(b, 165, 171, 11.25, Y, Y + 4, null, { color: '#a0785a' });
  wallX(b, 4.5, 11.5, 164.75, Y, Y + 4, null, { color: '#a0785a' });
  wallX(b, 4.5, 11.5, 171.25, Y, Y + 4, null, { color: '#a0785a' });
  b.door(4.75, 168, 2.8, 3.4, { op: 'all', in: [va, vb] }, { axis: 'z', y: Y, color: '#ffd166' });
  const p5c = parcel(8, Y, 168, { label: 'Vault parcel' });
  // d) On the high shelf: boost.
  b.box(0, Y + 2.5, 164, 4, 5, 3, { color: '#b98a5e' }); // top Y + 5
  const p5d = parcel(0, Y + 5, 164, { label: 'Shelf parcel' });
  b.sign(0, Y + 7.6, 164, 'Too high:\njump off your\npartner\'s head', { style: 'prank' });
  const l5 = b.lock(0, Y, 170.5, [p5a, p5b, p5c, p5d], { label: 'Big mailbox' });
  wallX(b, -13, 13, 173.25, Y, Y + 5, [-2, 2, Y, Y + 4], { color: '#c98f5a' });
  const gate = b.door(0, 173.25, 4, 4, { op: 'all', in: [l5] }, { y: Y, color: '#ffb347' });
  fl(0, Y, 179, 10, 12); // 173..185
  b.goal(0, Y, 180);
  b.marks.p5 = { seesaw: [-8, Y, 156], pillar: [-8, Y + 9.6, 164], orbit: [8, Y, 159], pedestal: [8, Y + 4.4, 159], vault: [8, Y, 168], shelf: [0, Y + 5, 164] };

  b.objectives = [
    { text: 'Deliver the parcel to the far mailbox', done: { act: g1 } },
    { text: 'Get the red and blue parcels into the duo mailbox', done: { sig: l2 } },
    { text: 'Relay: hatch 1 → hatch 2 → mailbox', done: { sig: l3 } },
    { text: 'Express: two rush parcels', done: { sig: l4 } },
    { text: 'Four parcels for the big mailbox', done: { act: gate } },
    { text: 'Reach the goal!', done: {} },
  ];
  void door4;
  return b.finish();
}
