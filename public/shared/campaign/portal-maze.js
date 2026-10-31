// Level 21 · Portal Maze (portal-maze): walk into a ring, come out somewhere else.
// Learn it; let your partner choose where a portal goes; portals that take
// both of you; drop through a floor portal to be flung over a chasm; and a
// maze of sealed rooms that only your partner has the map for.

import { LevelBuilder } from '../build.js';
import { wallX, wallZ } from './kit4.js';

const C = { orange: '#ffb347', yellow: '#ffd166', green: '#7cff9e', pink: '#ff7ab8', red: '#ff5d5d', blue: '#4f86ff', violet: '#b58cff' };
const FLOOR = '#d8d2ec';
const WALL = { color: '#6d5f9e' };

export function portalMaze(index) {
  const b = new LevelBuilder({ mode: 'classic', index, seed: 'portal-maze', name: 'Portal Maze', label: `Level ${index + 1}`, theme: 'space', sky: 'night' });
  const fl = (x, top, z, w, d, o = {}) => b.floor(x, top, z, w, d, { color: FLOOR, ...o });
  // A standing portal you walk into. along: the axis the ring faces ('z' or 'x').
  const portal = (x, top, z, along, o) => b.zone('warp', x, top + 1.5, z, along === 'z' ? 2.6 : 0.6, 3, along === 'z' ? 0.6 : 2.6, o);

  // -- Start ---------------------------------------------------------------------
  fl(0, 0, 4, 12, 10);
  b.checkpoint(0, 0, 3, 6, { hint: 'Walk into a glowing ring (a portal) and you come out at the circle of the same colour on the ground.' });

  // -- 1. Your first portal ------------------------------------------------------------
  fl(0, 0, 12, 12, 6); // 9..15, then a chasm too wide to jump
  portal(0, 0, 14, 'z', { portal: C.orange, to: [0, 0, 37, 0] });
  b.sign(0, 4.2, 12, 'Too far to jump?\nWalk into the portal!', { style: 'prank' });
  // A side portal to a gem on a floating rock.
  portal(4.5, 0, 13.5, 'z', { portal: C.violet, to: [10, 5, 24.5, 0], side: 0.6 });
  fl(10, 5, 25, 3.4, 3.4);
  b.gem(10, 6.3, 25.8);
  portal(10, 5, 26.4, 'z', { portal: C.violet, to: [4, 0, 37, 0] });

  // -- 2. Your partner picks the destination -------------------------------------------
  fl(0, 0, 42, 16, 16); // 34..50: the hub
  b.checkpoint(0, 0, 37.5, 5, { hint: 'Whoever pounds the colour dial decides where the middle portal leads. Pound the switches on all three islands and the bridge appears!' });
  const dial = b.dial(-5, 0, 43, { values: [C.yellow, C.green, C.pink], style: 'color' });
  b.sign(-5, 3.6, 43, 'Dial: pick which island\nthe portal leads to', { style: 'prank' });
  const islands = [[-16, 4, 60, C.yellow], [0, 7, 70, C.green], [16, 4, 60, C.pink]];
  const keys = islands.map(([x, top, z, color], k) => {
    const on = b.combo([dial], [k], { latch: false });
    portal(5, 0, 46.5, 'z', { portal: color, to: [x, top, z - 1.5, 0], when: on, side: 0.9 });
    fl(x, top, z, 6, 6, { color: '#efe9ff' });
    b.sign(x, top + 3.2, z - 2.8, ['Yellow', 'Green', 'Pink'][k], { style: 'prank', w: 1.8 });
    const sw = b.pswitch(x + 1.6, top, z + 1, true, 1, color);
    portal(x - 1.6, top, z + 2.6, 'z', { portal: color, to: [3, 0, 40, Math.PI] });
    return sw;
  });
  b.gem(0, 8.4, 71.5);
  const bridge = b.act('bridge', { op: 'all', in: keys }, true, [
    { x: 0, y: -6.5, z: 66, sx: 4, sy: 1, sz: 32, move: [0, 6, 0] },
  ], { speed: 4, mat: 'toy', color: '#b58cff', lamp: [3, 0.6, 49.4] });
  b.marks.islands = islands;

  // -- 3. Portals that take both of you --------------------------------------------------
  fl(0, 0, 87, 10, 10); // room A 82..92
  b.checkpoint(0, 0, 84, 4, { hint: 'Purple portals take both of you at once! They only open while someone stands on the plate.' });
  wallZ(b, 82, 92, -5.25, 0, 6, null, WALL);
  wallZ(b, 82, 92, 5.25, 0, 6, null, WALL);
  wallX(b, -5.5, 5.5, 92.25, 0, 6, null, WALL);
  wallX(b, -5.5, 5.5, 81.75, 0, 6, [-2, 2, 0, 3.4], WALL);
  const pA = b.plate(-3, 0, 87);
  b.sign(0, 4.6, 91.7, 'One steps in,\nboth go through', { fixed: true, yaw: Math.PI, style: 'prank', w: 3 });
  portal(1.8, 0, 91.6, 'z', { portal: C.violet, to: [-20, 0, 84, 0], both: true, when: pA });
  // Room B: sealed. The switch is on a ledge too high to reach alone.
  fl(-20, 0, 86, 10, 10); // 81..91
  wallZ(b, 81, 91, -25.25, 0, 8, null, WALL);
  wallZ(b, 81, 91, -14.75, 0, 8, null, WALL);
  wallX(b, -25.5, -14.5, 91.25, 0, 8, null, WALL);
  wallX(b, -25.5, -14.5, 80.75, 0, 8, null, WALL);
  b.box(-20, 3.8, 90.2, 6, 1.6, 1.6, { color: '#8a7cc8' }); // ledge, top 4.6
  const ledgeSw = b.pswitch(-20, 4.6, 90.2, true, 1, C.violet);
  b.sign(-20, 7.2, 90.6, 'Too high?\nJump off your partner\'s head', { fixed: true, yaw: Math.PI, style: 'prank', w: 3 });
  portal(-15.3, 0, 85, 'x', { portal: C.violet, to: [0, 12, 99, 0], both: true, when: ledgeSw });
  b.marks.roomB = [-20, 0, 86];

  // -- 4. Flung over the chasm ---------------------------------------------------------------
  // Two holes in the tower top drop into floor portals that throw you out over
  // the chasm. Each hole's portal only works while its plate is held — one on
  // the tower, one across the chasm.
  const TT = 12;
  fl(0, TT, 99, 12, 6); // 96..102
  b.checkpoint(0, TT, 98.5, 4, { hint: 'Jump into a hole and the portal below flings you over the chasm! The left hole needs someone holding the plate on the tower, the right hole needs someone holding the plate across the chasm.' });
  for (const [x0, x1] of [[-6, -4.2], [-1.8, 1.8], [4.2, 6]]) fl((x0 + x1) / 2, TT, 103.2, x1 - x0, 2.4);
  fl(0, TT, 105.2, 12, 1.6); // 104.4..106
  const pNear = b.plate(4, TT, 98.4);
  const holes = [[-3, C.orange, pNear], [3, C.green, null]];
  b.floor(0, 6, 134, 16, 24, { color: FLOOR }); // landing 122..146
  const pFar = b.plate(4, 6, 126);
  holes[1][2] = pFar;
  holes.forEach(([x, color, when]) => {
    // Shaft walls down to the bottom, where it's spikes.
    wallX(b, x - 1.45, x + 1.45, 101.75, 2, TT, null, WALL);
    wallX(b, x - 1.45, x + 1.45, 104.65, 2, TT, null, WALL);
    wallZ(b, 102, 104.4, x - 1.45, 2, TT, null, WALL);
    wallZ(b, 102, 104.4, x + 1.45, 2, TT, null, WALL);
    b.floor(x, 2, 103.2, 2.4, 2.4, { color: '#3a2f5a' });
    b.zone('kill', x, 2.8, 103.2, 2.4, 1.6, 2.4);
    b.zone('warp', x, 6.0, 103.2, 2.2, 1.8, 2.2, { portal: color, to: [x * 0.7, 10, 109.6, 0], keep: 26, side: 0, when });
    // The ring you fly out of (just for show).
    b.zone('warp', x * 0.7, 11.5, 109, 2.6, 3, 0.6, { portal: color });
  });
  b.sign(0, TT + 3.4, 99.2, 'Hole portals:\nleft ← tower plate\nright ← far-side plate', { style: 'prank' });
  b.sign(4, TT + 2.6, 98.4, 'Hold: left\nhole opens', { style: 'prank', w: 2.2 });
  b.sign(4, 6 + 2.6, 126, 'Hold: right\nhole opens', { style: 'prank', w: 2.2 });
  b.gem(-2.1, 11.2, 113);

  // -- 5. The sealed maze ----------------------------------------------------------------------
  // Seven sealed rooms. Every room has a red (west), blue (north) and green (east)
  // portal. Only the map on the lookout says where each one goes.
  const MY = 6;
  b.checkpoint(0, MY, 139.5, 5, { hint: 'The maze rooms are all sealed — portals are the only way through. The map is on the high lookout to the right: one reads, one walks! In the last room you both need to stand on a plate.' });
  fl(0, MY, 147.5, 4, 3); // into room 0
  const rooms = { 0: [0, 152], 1: [-14, 166], 2: [0, 166], 3: [14, 166], 4: [-14, 180], 5: [14, 180], X: [0, 180] };
  const MAP = { 0: [3, 2, 0], 1: [5, 'X', 0], 2: [4, 0, 3], 3: [0, 5, 2], 4: [2, 0, 1], 5: [3, 0, 4] };
  const into = (k) => [rooms[k][0], MY, rooms[k][1] - 1.2, 0];
  for (const [k, [cx, cz]] of Object.entries(rooms)) {
    fl(cx, MY, cz, 6, 6);
    const H = 5;
    wallZ(b, cz - 3, cz + 3, cx - 3.25, MY, MY + H, null, WALL);
    wallZ(b, cz - 3, cz + 3, cx + 3.25, MY, MY + H, null, WALL);
    wallX(b, cx - 3.5, cx + 3.5, cz - 3.25, MY, MY + H, k === '0' ? [-1.3, 1.3, MY, MY + 3.2] : null, WALL);
    if (k !== 'X') {
      wallX(b, cx - 3.5, cx + 3.5, cz + 3.25, MY, MY + H, null, WALL);
      b.sign(cx, MY + 3.8, cz - 2.95, `Room ${k}`, { fixed: true, yaw: 0, style: 'prank', w: 1.6 });
      const [r, bl, g] = MAP[k];
      portal(cx - 2.7, MY, cz, 'x', { portal: C.red, to: into(r) });
      portal(cx, MY, cz + 2.7, 'z', { portal: C.blue, to: into(bl) });
      portal(cx + 2.7, MY, cz, 'x', { portal: C.green, to: into(g) });
    }
  }
  b.gem(rooms[5][0], MY + 1.2, rooms[5][1]);
  // Exit room: both plates open the north door.
  const [xx, xz] = rooms.X;
  b.sign(xx, MY + 3.8, xz - 2.95, 'EXIT', { fixed: true, yaw: 0, style: 'prank', w: 1.6 });
  const x1 = b.plate(xx - 1.5, MY, xz + 0.5);
  const x2 = b.plate(xx + 1.5, MY, xz + 0.5);
  wallX(b, xx - 3.5, xx + 3.5, xz + 3.25, MY, MY + 5, [-1.6, 1.6, MY, MY + 3.4], WALL);
  const exitDoor = b.door(xx, xz + 3.25, 3.2, 3.4, { op: 'all', in: [x1, x2] }, { y: MY, color: '#b58cff' });
  fl(0, MY, 189.5, 10, 13); // 183..196
  b.goal(0, MY, 191);
  // The lookout with the map.
  fl(10, MY + 3, 144, 6, 6);
  const lines = ['Maze map (red = west wall, blue = north, green = east)'];
  for (const k of ['0', '1', '2', '3', '4', '5']) {
    const [r, bl, g] = MAP[k];
    lines.push(`Room ${k}: red→${r}  blue→${bl}  green→${g}`);
  }
  lines.push('X = EXIT');
  b.sign(10, MY + 6.4, 146.8, lines.join('\n'), { fixed: true, yaw: Math.PI, style: 'paper', w: 5.4 });
  b.marks.maze = { rooms, MAP };

  b.objectives = [
    { text: 'Take the portal across the chasm', done: { cp: 1 } },
    { text: 'One turns the dial, the other pounds the switches on three islands', done: { act: bridge } },
    { text: 'Purple portals: travel together', done: { cp: 3 } },
    { text: 'Drop into a hole and get flung over the chasm', done: { cp: 4 } },
    { text: 'Follow the map out of the sealed maze', done: { act: exitDoor } },
    { text: 'Reach the goal!', done: {} },
  ];
  return b.finish();
}
