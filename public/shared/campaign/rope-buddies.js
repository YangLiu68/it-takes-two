// Level 25 · Rope Buddies: tied together by a rope. Every stage is a different thing
// a rope does to two people:
//   1. stepping stones — you can't get far apart, so you go one stone at a time
//   2. gaps wider than the rope — jump at the same moment or you both fall
//   3. cliffs — one of you gets up (magnet pad), then walks away and hauls the other up
//   4. reverse belts — one lane runs backwards faster than you can walk; your partner drags you up it
//   5. the tower — a seesaw throws one of you onto it, they haul the other, then one last jump together

import { LevelBuilder } from '../build.js';
import { PHYS } from '../constants.js';

const ROPE = '#ff7ab8';

export function ropeBuddies(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'rope-buddies', name: 'Rope Buddies', label: `Level ${index + 1}`, theme: 'garden', sky: 'dawn' });
  // Feet from y0 - 1 up to y0 + h count as inside (fall further and the rope lets go).
  const rope = (x, z, sx, sz, y0, h, len) => b.zone('tether', x, y0 + 0.3 + h / 2, z, sx, h + 1, sz, { len });

  // -- Start ------------------------------------------------------------------------------
  b.floor(0, 0, 4, 12, 10, { mat: 'wood' });
  b.checkpoint(0, 0, 2.5, 6, { hint: 'Inside the pink zones you two are tied together by a rope: whoever wanders off drags the other along.' });
  b.sign(0, 3.2, 7.5, 'Pink zone = rope\nNo wandering off, move together!', { style: 'prank' });

  // -- 1. Stepping stones (rope 6): one stone at a time ------------------------------------
  const stones = [[0, 12.5], [2.6, 17], [-1, 21.5], [2.2, 26], [-1.6, 30.5], [1, 35]];
  for (const [x, z] of stones) b.floor(x, 0, z, 3, 3, { color: '#c9b48a' });
  b.gem(2.2, 1.4, 26);
  b.floor(0, 0, 43, 12, 10, { mat: 'wood' });
  rope(0, 24, 16, 46, 0, 5, 6); // z 1–47
  b.sign(0, 3.0, 10, 'The stones are far apart:\none jumps first,\nthe other follows', { style: 'prank' });

  // -- 2. Gaps wider than the rope (rope 3.5): jump together -----------------------------
  b.checkpoint(0, 0, 43, 6, { hint: 'The gap is longer than the rope! Jump at the same moment — whoever jumps first gets yanked down by the rope.' });
  b.sign(0, 3.2, 46.5, 'Gap longer than the rope:\ncount "1, 2, 3" and jump together!', { style: 'prank' });
  b.floor(0, 0, 57.5, 10, 6, { color: '#9fc98a' }); // gap 6.5
  b.floor(0, 1.2, 71, 10, 6, { color: '#9fc98a' }); // gap 7.5, a step up
  b.floor(0, 1.2, 87.5, 12, 10, { mat: 'wood' }); // gap 8.5
  b.gem(0, 3.2, 64.2);
  rope(0, 65, 14, 36, 0, 6, 3.5); // z 47–83
  b.mark('gap1', 0, 0, 47.6);
  b.mark('gap2', 0, 0, 60.1);
  b.mark('gap3', 0, 1.2, 73.6);

  // -- 3. Cliffs: up one of you goes, then haul the other (rope 5.5) ----------------------
  b.checkpoint(0, 1.2, 86.5, 6, { hint: 'Sol stands on the red magnet pad and holds E to bounce up the cliff; Luna waits at the foot of the wall. The one up top walks forward to haul the partner up!' });
  const C1 = 8.2, C2 = 14.6;
  b.box(0, (C1 - 2) / 2, 97.5, 12, C1 + 2, 10, { color: '#8a7a5a' }); // cliff 1: z 92.5–102.5
  b.box(0, (C2 - 2) / 2, 108.25, 12, C2 + 2, 11.5, { color: '#7a6c50' }); // cliff 2: z 102.5–114
  b.pad(-2.5, 1.28, 91.2, [0, 1, 0], 1, { launch: [0, PHYS.repelSpeed, 0] });
  b.pad(2.5, C1 + 0.08, 101.2, [0, 1, 0], -1, { launch: [0, PHYS.repelSpeed, 0] });
  b.sign(-2.5, 3.6, 89, 'Sol: stand on the\nred pad, hold E', { style: 'prank' });
  b.sign(0, C1 + 2.4, 95, 'Made it up? Walk on —\nhaul your partner up!', { style: 'prank' });
  b.sign(2.5, C1 + 2.6, 99.4, 'Luna: stand on the\nblue pad, hold E', { style: 'prank' });
  b.gem(4.5, C1 + 1.2, 101.5);
  rope(0, 99.5, 14, 27, 1.2, C2 + 2, 5.5); // z 86–113
  b.mark('pad1', -2.5, 1.2, 91.2);
  b.mark('pad2', 2.5, C1, 101.2);

  // -- 4. Reverse belts: drag your partner up them (rope 4) ---------------------------------
  b.checkpoint(0, C2, 108.5, 6, { hint: 'One lane is a backwards belt, faster than you can run. The other walks forward in the next lane and drags the partner through with the rope!' });
  const Y = C2;
  // Two lanes with a wall between them. A low roof over each belt so you can't hop up it.
  const lane = (x, z0, z1, belt) => {
    const z = (z0 + z1) / 2, d = z1 - z0;
    if (belt) {
      b.belt(x, Y, z, 2.6, d, 12, [0, -1]);
      b.box(x, Y + 2.05, z, 2.6, 0.3, d, { color: '#6f8a5a' });
    } else {
      b.floor(x, Y, z, 2.6, d, { color: '#d9c7a0' });
    }
  };
  b.floor(0, Y, 115, 6.4, 2, { color: '#d9c7a0' }); // entry, z 114–116
  lane(-1.5, 116, 131, false);
  lane(1.5, 116, 131, true); // first half: Luna's lane runs backwards
  b.box(0, Y + 3, 123.5, 0.4, 6, 15, { color: '#6f8a5a' });
  b.field(-1.5, Y + 1, 115.6, 2.6, 2, 0.3, 1);
  b.field(1.5, Y + 1, 115.6, 2.6, 2, 0.3, -1);
  b.floor(0, Y, 134, 6.4, 6, { color: '#d9c7a0' }); // rest, z 131–137 (room to pull your partner off)
  lane(-1.5, 137, 151, true); // second half: Sol's lane runs backwards
  lane(1.5, 137, 151, false);
  b.box(0, Y + 3, 144, 0.4, 6, 14, { color: '#6f8a5a' });
  b.field(-1.5, Y + 1, 137.2, 2.6, 2, 0.3, 1);
  b.field(1.5, Y + 1, 137.2, 2.6, 2, 0.3, -1);
  b.sign(0, Y + 7, 115.2, 'Backwards belt, ceiling too low to jump:\nthe one in the next lane pulls!', { style: 'prank' });
  b.sign(0, Y + 7, 136.5, 'Now it\'s Sol\'s turn to be dragged!\nKeep pulling until your partner\nis off the belt', { style: 'prank' });
  b.gem(-1.5, Y + 1.2, 127);
  b.mark('laneS', -1.5, Y, 116.6);
  b.mark('laneL', 1.5, Y, 116.6);
  rope(0, 133.75, 8, 37.5, Y, 5, 3.5); // z 115–152.5, right up to the tower's rope

  // -- 5. The tower: seesaw, haul, one last jump together ------------------------------------
  b.floor(0, Y, 157, 12, 12, { mat: 'wood' }); // z 151–163
  b.checkpoint(0, Y, 154.5, 5, { hint: 'One stands on one end of the seesaw, the other pounds the other end: fly up onto the tower, then walk in to haul your partner up. The last jump — together!' });
  b.seesaw(0, Y + 1.0, 158.5, 9.2, 2.4);
  const T = Y + 11;
  b.box(0, (Y + T) / 2 - 1, 171, 10, T - Y + 2, 16, { color: '#8a7a5a' }); // tower: z 163–179
  b.sign(0, Y + 3.2, 155, 'One stands,\none pounds!', { style: 'prank' });
  b.sign(0, T + 2.6, 166, 'Walk in to haul your partner up,\nthen jump together!', { style: 'prank' });
  b.gem(-3.4, T + 4, 163.5);
  b.floor(0, T, 193, 12, 10, { mat: 'wood' }); // goal platform, z 188–198: a 9 m gap
  b.gem(0, T + 2.8, 183.5);
  rope(0, 165.5, 14, 26, Y, T - Y + 4, 11); // z 152.5–178.5: room to fly and to haul
  rope(0, 188.5, 14, 20, T, 5, 5); // z 178.5–198.5: the last gap is longer than this rope
  b.mark('saw', 0, Y + 1, 158.5);
  b.mark('towerEdge', 0, T, 178.4);
  b.goal(0, T, 193.5);

  b.objectives = [
    { text: 'Cross the stones — one jumps first, the other follows', done: { cp: 1 } },
    { text: 'Gap longer than the rope: jump at the same time', done: { cp: 2 } },
    { text: 'One bounces up the cliff and hauls the partner up (twice)', done: { cp: 3 } },
    { text: 'Backwards belts: the one in the next lane drags the partner through', done: { cp: 4 } },
    { text: 'Seesaw one up the tower, haul the other up, then jump to the goal together', done: {} },
  ];
  return b.finish();
}
