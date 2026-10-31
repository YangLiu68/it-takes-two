// Puzzle 5 · Pirate Ship: find Captain Redbeard's treasure. Fire across
// to the ship and pull your partner after you, piece together the torn map,
// catapult up to the crow's nest, set the captain's compasses, cross the hold
// on crumbling and blinking crates, and do what the parrot says.

import { LevelBuilder } from '../build.js';

const SOL_RED = '#ff6b4a';
const LUNA_BLUE = '#4f86ff';
const PLANK = '#b07a4a';
const HULL = '#7a4a2a';
const WALL = { color: '#c98d55', t: 0.4, mat: 'wood' };

export function pirateShip(index) {
  const b = new LevelBuilder({ mode: 'puzzle', index, seed: 'pirate-ship', name: 'Pirate Ship', label: `Room ${index + 1}`, theme: 'bath', sky: 'sunset' });
  const r = b.rng;
  const sign = (x, y, z, text, o = {}) => b.sign(x, y, z, text, { style: 'prank', ...o });
  const poster = (x, y, z, yaw, text, w = 3.4) => b.sign(x, y, z, text, { fixed: true, yaw, style: 'paper', w });

  // The sea: fall in and you swim back to the last checkpoint.
  b.box(0, -3.5, 80, 90, 1, 200, { color: '#2f8fc9' });
  b.zone('kill', 0, -2.4, 80, 90, 1.2, 200);

  // -- 0. The dock: fire across, then pull your partner over --------------------------------
  b.plat(0, 0, 6.75, 14, 13.5, 4, { mat: 'wood', color: PLANK });
  for (const [x, z] of [[-6.5, 0.5], [6.5, 0.5], [-6.5, 13], [6.5, 13]]) b.box(x, 0.8, z, 0.6, 1.6, 0.6, { mat: 'wood', color: HULL });
  b.checkpoint(0, 0, 3, 6, { hint: 'The ship is out at sea, too far to jump! Sol stands on the red cannon pad and holds E to fly aboard, then holds E at the bow to call Luna. Luna holds E too and gets pulled across.' });
  const cannonZ = 8.5, landZ = 34;
  const vy = 17, T = (2 * vy) / 34;
  b.pad(0, 0.08, cannonZ, [0, 1, 0], 1, { launch: [0, vy, (landZ - cannonZ) / T] });
  sign(0, 3.4, 6.4, 'Sol: stand on the cannon pad, hold E!', { w: 4 });
  sign(4, 3.0, 10.5, 'Partner bond: the one across\nholds E to call, then the\nother holds E and flies over', { w: 4.6 });

  // -- 1. The deck and the torn map ---------------------------------------------------------------
  const DECK_Z0 = 30, DECK_Z1 = 100;
  b.plat(0, 0, (DECK_Z0 + DECK_Z1) / 2, 18, DECK_Z1 - DECK_Z0, 4, { mat: 'wood', color: PLANK });
  b.box(-9.2, 0.6, 68, 0.4, 1.2, 64, { mat: 'wood', color: HULL });
  b.box(9.2, 0.6, 68, 0.4, 1.2, 64, { mat: 'wood', color: HULL });
  b.checkpoint(0, 0, 38, 6, { hint: 'The treasure map is torn in two! Sol goes to the fore cabin (red door), Luna to the aft cabin (blue door). Each reads a half, then enter the deck chest code together.' });
  sign(0, 3.4, 33.5, 'Aboard? Hold E to call your partner!', { w: 4 });
  // Two cabins, each with half of the map; roofs so nobody can climb in.
  const steps = [r.int(2, 9), r.int(1, 9), r.int(2, 9), r.int(1, 9)];
  const paces = (n) => (n === 1 ? '1 pace' : `${n} paces`);
  const cabin = (x0, x1, pol, half) => {
    const door = pol > 0 ? x1 : x0;
    b.room(x0, 46, x1, 56, 4.2, pol > 0 ? { e: [[51, 2.4]] } : { w: [[51, 2.4]] }, WALL);
    b.box((x0 + x1) / 2, 4.45, 51, x1 - x0 + 0.4, 0.5, 10.4, { mat: 'wood', color: HULL });
    b.fieldZ(door, 2.1, 51, 2.4, 4.2, pol);
    const wallX = pol > 0 ? x0 + 0.25 : x1 - 0.25;
    poster(wallX, 2.3, 51, pol > 0 ? Math.PI / 2 : -Math.PI / 2, half, 3.6);
    b.light(wallX + (pol > 0 ? 1 : -1), 3.6, 51, { intensity: 6, dist: 7, fixture: 'bulb', color: '#ffd9a0' });
  };
  cabin(-9, -2.5, 1, `Treasure Map (left half)\nStart at Skull Rock:\nfirst go North ${paces(steps[0])},\nthen East ${paces(steps[1])}...`);
  cabin(2.5, 9, -1, `Treasure Map (right half)\n...next South ${paces(steps[2])},\nlast West ${paces(steps[3])}.\nThe treasure is under the X!`);
  sign(-5.75, 5.6, 46, 'Fore cabin · Sol only', { w: 3 });
  sign(5.75, 5.6, 46, 'Aft cabin · Luna only', { w: 3 });
  const dirs = ['North', 'East', 'South', 'West'];
  const chest = dirs.map((d, i) => {
    const x = -4.5 + i * 3;
    const id = b.dial(x, 0, 59, { color: '#ffd23f', h: 1.8 });
    sign(x, 3.4, 59, d, { w: 1 });
    return id;
  });
  b.box(0, 0.5, 60.6, 4, 1, 1.2, { mat: 'wood', color: HULL });
  sign(0, 5, 60.6, 'Deck chest: dial in the paces\nfor each direction on the map', { w: 4.6 });
  const mapCode = b.combo(chest, steps);
  b.wallGapsX(-9, 9, 62, 4.2, [[0, 4]], { ...WALL, lintel: 3.6 });
  const deckGate = b.door(0, 62, 4, 3.6, { op: 'all', in: [mapCode] }, { latch: true, color: HULL });
  b.acts[b.acts.length - 1].toast = 'Click! The chest pops open, and so does the door to the stern!';
  for (let i = 0; i < 4; i++) b.mark(`chest${i}`, -4.5 + i * 3, 0, 59);

  // -- 2. The mast: seesaw up to the crow's nest -------------------------------------------------
  b.checkpoint(6.5, 0, 64.5, 3, { hint: "One stands on one end of the seesaw, the other pounds (C) the other end to fling them up to the crow's nest. Up there you can see the course for the captain's compasses — remember it!" });
  b.seesaw(0, 1.0, 67, 9.2, 2.4);
  sign(-5.5, 3.4, 69, 'One stands on one end,\nthe other pounds (C) the other', { w: 3.6 });
  const NEST = 9.6;
  // A solid mast tower: whoever flies up slides up its face and over the top.
  b.plat(0, NEST, 75.5, 6.4, 6.4, NEST + 1, { mat: 'wood', color: HULL });
  b.box(0, NEST + 0.6, 78.6, 6.4, 1.2, 0.2, { mat: 'wood', color: HULL });
  b.box(-3.1, NEST + 0.6, 75.5, 0.2, 1.2, 6.4, { mat: 'wood', color: HULL });
  b.box(3.1, NEST + 0.6, 75.5, 0.2, 1.2, 6.4, { mat: 'wood', color: HULL });
  const arrows = ['↑', '→', '↓', '←'];
  const course = [r.int(0, 3), r.int(0, 3), r.int(0, 3)];
  if (course[0] === 0 && course[1] === 0 && course[2] === 0) course[1] = 2;
  poster(-1.3, NEST + 0.8, 78.45, Math.PI, `Course in the spyglass:\n${course.map((i) => dirs[i]).join(' → ')}`, 2.8);
  const nestSw = b.pswitch(1.8, NEST, 75.5, true);
  sign(1.8, NEST + 2.4, 75.5, 'Pound to slide out steps', { w: 2.6 });
  b.mark('nest', 0, NEST, 75.5);
  // The quarterdeck, too high to boost up to, and the steps the nest switch slides out.
  const QD = 6.5;
  b.plat(0, QD, 92, 18, 16, QD + 4, { mat: 'wood', color: PLANK });
  const stepParts = [1.6, 3.25, 4.9].map((top, i) => ({ x: -6.5 + i * 2.3, y: top - 0.4, z: 85.6, sx: 2.2, sy: 0.8, sz: 2, move: [0, 0, -2.6], delay: i * 0.15 }));
  const stepsAct = b.act('steps', { op: 'all', in: [nestSw] }, true, stepParts, { speed: 3, mat: 'wood', color: '#e6c08f', lamp: [-4.2, QD + 0.3, 84.2] });
  b.acts[b.acts.length - 1].toast = 'Steps slide out of the quarterdeck!';
  sign(-4.2, QD + 2.6, 84.4, "Captain's Cabin", { w: 2 });

  // -- 3. The captain's cabin: three compasses --------------------------------------------------
  b.room(-6, 88, 6, 98, 4, { s: [[0, 2.4]], n: [[0, 2.4]] }, { ...WALL, y: QD });
  b.box(0, QD + 4.25, 93, 12.4, 0.5, 10.4, { mat: 'wood', color: HULL });
  b.checkpoint(0, QD, 86, 4, { hint: "Captain's cabin: turn the three compasses to the course seen from the crow's nest." });
  const compass = [-3, 0, 3].map((x) => b.dial(x, QD, 93.5, { values: arrows, color: '#7ee0ff', h: 1.7 }));
  poster(-3.6, QD + 2.4, 97.75, Math.PI, 'Compass: ↑ North  → East\n↓ South  ← West\nSet the course left to right', 3.6);
  b.box(4.5, QD + 0.45, 96.5, 2, 0.9, 1, { mat: 'wood', color: HULL });
  const compassOk = b.combo(compass, course);
  const captainKey = b.item('key', 4.5, QD + 1.4, 96.5, { color: '#ffd23f', label: "Captain's key", when: compassOk });
  b.light(0, QD + 3.4, 93, { intensity: 8, dist: 9, fixture: 'bulb', color: '#ffd9a0' });
  for (let i = 0; i < 3; i++) b.mark(`compass${i}`, [-3, 0, 3][i], QD, 93.5);

  // -- 4. The hold: crumbling crates and blinking crates -------------------------------------------
  b.plat(0, 0, 103, 18, 6, 4, { mat: 'wood', color: PLANK });
  b.wallZ(100, 150, -9, 8, WALL);
  b.wallZ(100, 150, 9, 8, WALL);
  b.checkpoint(0, 0, 102.5, 4, { hint: "The hold: open the door with the captain's key. Inside it splits in two — Sol gets the red gem, Luna the blue gem. Don't linger on crumbling crates, and time your jumps on the blinking ones!" });
  const holdLock = b.lock(-3.5, 0, 104.5, [captainKey], { label: 'Hold door' });
  b.wallGapsX(-9, 9, 106, 8, [[0, 3]], { ...WALL, lintel: 4 });
  const holdDoor = b.door(0, 106, 3, 4, { op: 'all', in: [holdLock] }, { latch: true, color: HULL });
  b.acts[b.acts.length - 1].toast = 'The hold door opens.';
  b.plat(0, 0, 107, 18, 2, 4, { mat: 'wood', color: PLANK });
  b.wallZ(108, 133, 0, 8, WALL);
  b.field(-4.5, 4, 108, 9, 8, 0.3, 1);
  b.field(4.5, 4, 108, 9, 8, 0.3, -1);
  sign(-4.5, 4.6, 107.6, 'Sol side', { w: 2 });
  sign(4.5, 4.6, 107.6, 'Luna side', { w: 2 });
  // Sol: crumbling crates.
  const solPath = [[-4.5, 0, 110.3], [-6.5, 0.8, 113.6], [-3.5, 1.6, 117]];
  for (const [x, y, z] of solPath) b.crumble(x, y, z, 3, 2.6);
  b.plat(-4.5, 1.6, 120.8, 4, 2.6, 1, { mat: 'wood', color: PLANK });
  for (const [x, y, z] of [[-6.5, 2.4, 124.2], [-3.5, 2.4, 127.6]]) b.crumble(x, y, z, 3, 2.6);
  b.plat(-4.5, 2.4, 131, 9, 3.6, 1, { mat: 'wood', color: PLANK });
  const redGem = b.item('gem', -4.5, 3.5, 131, { who: 0, color: SOL_RED, label: 'Red gem' });
  sign(-6.5, 3.4, 110.3, "Crumbling crates: don't stop!", { w: 3.2 });
  // Luna: blinking crates and a sliding crate.
  b.blink(4.5, 0.4, 110.5, 3, 3, 0, 3.2);
  b.blink(4.5, 0.8, 114.5, 3, 3, 1, 3.2);
  b.plat(4.5, 0.8, 118.3, 4, 2.6, 1, { mat: 'wood', color: PLANK });
  b.mover(3, 0.8, 3, { type: 'linear', a: [4.5, 0.4, 121.7], b: [4.5, 0.4, 126.3], period: 6, phase: 0 }, { steady: true, mat: 'wood', color: '#e6c08f' });
  b.plat(4.5, 0.8, 130.6, 9, 4.4, 1, { mat: 'wood', color: PLANK });
  const blueGem = b.item('gem', 4.5, 1.9, 130.6, { who: 1, color: LUNA_BLUE, label: 'Blue gem' });
  sign(6.5, 3.4, 110.5, 'Blinking crates:\nonly stand on them when lit', { w: 3 });

  // -- 5. The vault door: both gems ------------------------------------------------------------------
  const VT = 2.4;
  b.plat(0, VT, 135, 18, 4, 4, { mat: 'wood', color: PLANK });
  b.checkpoint(0, VT, 134.5, 3, { hint: 'The vault door needs both gems.' });
  const vaultLock = b.lock(0, VT, 135.5, [redGem, blueGem], { label: 'Vault door' });
  b.wallGapsX(-9, 9, 137, 8, [[0, 3]], { ...WALL, lintel: 4, y: VT });
  const vaultDoor = b.door(0, 137, 3, 4, { op: 'all', in: [vaultLock] }, { latch: true, y: VT, color: '#ffd23f' });
  b.acts[b.acts.length - 1].toast = 'The vault door creaks open...';

  // -- 6. The treasure room: the parrot's song --------------------------------------------------------
  b.plat(0, VT, 146, 18, 18, 4, { mat: 'wood', color: PLANK });
  b.checkpoint(-4, VT, 140, 3, { hint: 'The parrot is in the little nook on the right (Luna only). Luna listens to the order it squawks, Sol hits the chests in that order. Then both stand on the plates!' });
  b.room(5, 139, 9, 146, 4, { w: [[142.5, 2]], e: null }, { ...WALL, y: VT });
  b.box(7, VT + 4.25, 142.5, 4.4, 0.5, 7.4, { mat: 'wood', color: HULL });
  b.fieldZ(5, VT + 2, 142.5, 2, 4, -1);
  const gems = [['Red', '#ff5d5d'], ['Green', '#4fd18b'], ['Gold', '#ffd23f'], ['Blue', '#4f86ff']];
  const song = r.shuffle(gems.slice());
  poster(8.75, VT + 2.2, 142.5, -Math.PI / 2, `The parrot squawks:\n"${song.map(([n]) => n).join('! ')}!"`, 2.8);
  b.box(7.8, VT + 0.6, 141, 0.2, 1.2, 0.2, { mat: 'wood', color: HULL }); // the parrot's perch
  b.box(7.8, VT + 1.25, 141, 1.0, 0.1, 0.1, { mat: 'wood', color: HULL });
  const chestBtn = {};
  r.shuffle(gems.slice()).forEach(([n, color], i) => {
    const x = -6 + i * 3;
    chestBtn[n] = b.pswitch(x, VT, 150, false, 0.6, color);
    b.box(x, VT + 0.5, 151.6, 1.6, 1, 1, { color, mat: 'wood' });
    sign(x, VT + 2.4, 151.6, `${n} chest`, { w: 1.6 });
  });
  const parrot = b.seq(song.map(([n]) => chestBtn[n]));
  const liftL = b.plate(-5, VT, 146);
  const liftR = b.plate(3, VT, 146);
  sign(-1, VT + 3.6, 146, 'Both hold the plates\nto lift the treasure gate', { w: 4 });
  b.wallGapsX(-9, 9, 155, 8, [[0, 4]], { ...WALL, lintel: 4.5, y: VT });
  const finalGate = b.door(0, 155, 4, 4.5, { op: 'all', in: [parrot, liftL, liftR] }, { latch: true, y: VT, color: '#ffd23f' });
  b.acts[b.acts.length - 1].toast = 'Treasure! Gold everywhere!';
  b.wallX(-9, 9, 165, 8, { ...WALL, y: VT });
  b.wallZ(150, 165, -9, 8, { ...WALL, y: VT });
  b.wallZ(150, 165, 9, 8, { ...WALL, y: VT });
  b.plat(0, VT, 160, 18, 10, 4, { mat: 'wood', color: PLANK });
  for (const [x, z] of [[-5, 162], [5, 162], [-2, 163], [3, 163.5]]) b.box(x, VT + 0.5, z, 1.6, 1, 1.2, { color: '#ffd23f', mat: 'metal' });
  b.goal(0, VT, 160);
  b.gem(0, 4.5, 75.5);
  b.gem(-8, 1.2, 40);
  b.gem(4.5, 3.6, 124);
  b.mark('plateL', -5, VT, 146);
  b.mark('plateR', 3, VT, 146);

  b.objectives = [
    { text: 'Cannon boarding: Sol stands on the cannon pad and holds E to fly aboard', done: { cp: 1 } },
    { text: 'Partner bond: Sol holds E at the bow to call, Luna holds E too and flies over', done: { cpBoth: 1 } },
    { text: 'Sol takes the fore cabin, Luna the aft: each reads half the map, then open the deck chest', done: { act: deckGate } },
    { text: "Seesaw your partner up to the crow's nest: note the course, pound the button for the steps", done: { act: stepsAct } },
    { text: "Captain's cabin: set the three compasses to the course", done: { sig: compassOk } },
    { text: "Take the captain's key and open the hold", done: { act: holdDoor } },
    { text: 'The hold: Sol gets the red gem, Luna the blue gem; open the vault door together', done: { act: vaultDoor } },
    { text: 'Hit the chests in the order the parrot says, then both hold the plates', done: { act: finalGate } },
    { text: 'Stand by the treasure together', done: {} },
  ];
  return b.finish();
}
