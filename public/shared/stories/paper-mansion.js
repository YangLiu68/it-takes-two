// Story 5 · The Paper Doll Mansion: an old courtyard house made ready
// for a ghost wedding. A paper sedan-bearer walks the courtyard while the
// suona plays (hide in the sedan chairs), three offerings go on the ancestral
// altar, the bride's birthday is embroidered into a screen that only shows in
// a flashlight, paper dolls in the corridor move only while nobody looks at
// them, and burning the marriage contract wakes the bride.

import { LevelBuilder } from '../build.js';
import { DARK } from './common.js';

const RED = '#7a1616';
const GOLD = '#c79a3a';
const LANTERN = '#ff4a2a';

// A red bridal sedan chair you can climb into; the open side faces `facing`.
function sedan(b, x, z, facing) {
  const m = { color: RED };
  const W = 1.5, D = 1.2, h = 2.4, t = 0.12;
  const open = { n: [0, 1], s: [0, -1], e: [1, 0], w: [-1, 0] }[facing];
  if (open[1] !== 0) {
    b.box(x, h / 2, z - open[1] * D / 2, W, h, t, m);
    b.box(x - W / 2, h / 2, z, t, h, D, m);
    b.box(x + W / 2, h / 2, z, t, h, D, m);
  } else {
    b.box(x - open[0] * D / 2, h / 2, z, t, h, W, m);
    b.box(x, h / 2, z - W / 2, D, h, t, m);
    b.box(x, h / 2, z + W / 2, D, h, t, m);
  }
  const [rw, rd] = open[1] !== 0 ? [W + 0.3, D + 0.3] : [D + 0.3, W + 0.3];
  b.box(x, h + 0.08, z, rw, 0.16, rd, { color: GOLD });
  b.box(x, h + 0.3, z, rw - 0.5, 0.3, rd - 0.5, { color: RED });
  b.zone('hide', x, 1.2, z, open[1] !== 0 ? W - 0.2 : D - 0.1, 2.4, open[1] !== 0 ? D - 0.1 : W - 0.2);
}

function lantern(b, x, y, z, o = {}) {
  b.light(x, y, z, { color: LANTERN, intensity: o.intensity ?? 7, dist: o.dist ?? 8, flicker: o.flicker ?? 0.25, fixture: 'bulb', when: o.when, off: o.off });
}

function table(b, x, z, w = 1.4, d = 0.8, h = 0.8) {
  b.box(x, h / 2, z, w, h, d, { mat: 'wood', color: '#3a2016' });
}

export function paperMansion(index) {
  const b = new LevelBuilder({
    mode: 'horror', index, seed: 'paper-mansion', name: 'The Paper Doll Mansion', label: 'Night 5',
    theme: 'twilight', sky: 'day',
    overrides: { ...DARK, fog: '#0a0304', fogDensity: 0.05, hemiSky: '#2a1416', hemiGround: '#0e0607', hemiIntensity: 0.4 },
  });
  const H = 4.5;
  const w = { color: '#3d2a24', t: 0.4 };
  const roof = { color: '#1c1210' };

  // -- Floors ------------------------------------------------------------------------------
  b.floor(0, 0, -6, 8, 12, { color: '#2a2622' }); // the alley outside
  b.floor(0, 0, 4, 12, 8, { color: '#33281f' }); // gate house
  b.floor(0, 0, 20, 28, 24, { color: '#3a3430' }); // front courtyard
  b.floor(18, 0, 12, 8, 8, { color: '#2e2620' }); // kitchen
  b.floor(20, 0, 25, 12, 14, { mat: 'wood', color: '#3a2a20' }); // embroidery tower
  b.floor(-21, 0, 22, 14, 16, { color: '#2c2420' }); // ancestral hall
  b.floor(-21, 0, 30.9, 2.6, 1.8, { color: '#2c2420' }); // niche behind the altar
  b.floor(0, 0, 36, 6, 8, { mat: 'wood', color: '#3a2a20' }); // corridor, before the pond
  b.floor(0, 0, 54, 6, 12, { mat: 'wood', color: '#3a2a20' }); // corridor, after the pond
  for (const s of [-1, 1]) {
    b.floor(s * 4.2, 0, 36, 2.4, 3, { mat: 'wood', color: '#3a2a20' }); // doll niches
    b.floor(s * 4.2, 0, 55, 2.4, 4, { mat: 'wood', color: '#3a2a20' }); // plate alcoves
  }
  b.floor(0, 0, 68, 20, 16, { color: '#3a1414' }); // wedding hall

  // -- Alley and the gate house (start) -------------------------------------------------------
  b.wallZ(-12, 0, -4, H, w);
  b.wallZ(-12, 0, 4, H, w);
  b.wallX(-4, 4, -12, H, w);
  b.wallGapsX(-6, 6, 0, H, [[0, 3.2]], { ...w, lintel: 3.3 });
  b.wallZ(0, 8, -6, H, w);
  b.wallZ(0, 8, 6, H, w);
  b.box(0, H + 0.25, 4, 12.4, 0.5, 8.4, roof);
  b.checkpoint(0, 0, 4, 4, { flag: false, hint: 'The gate shut by itself behind you. Read the house rules on the wall first.' });
  b.sign(-5.75, 2.4, 4.5, "HOUSE RULES\n1. Hear the wedding horns?\n    Hide in a sedan chair.\n2. A paper doll watches you?\n    Watch it back.\n3. The ancestral hall is safe.\n4. Don't linger at the mirror.\n5. Never lift the bride's veil.\n6. Exit: both on the threshold.", { fixed: true, yaw: Math.PI / 2, style: 'paper', w: 3.6 });
  table(b, 3.5, 6.6, 1.0, 0.7, 0.7);
  b.note(3.5, 0.85, 6.6, 'Ghost Wedding Invitation', "Tonight, at the midnight hour,\nMiss Xiu'e of the Shen family\nshall wed (the name is blotted out in ink).\n\nCordially invited:\n(Below are both your names. The ink is still wet.)");
  const gateW = b.plate(-3.5, 0, 3);
  const gateE = b.plate(3.5, 0, 3);
  b.sign(0, 3.9, 0.25, 'THRESHOLD', { fixed: true, yaw: 0, style: 'horror', w: 1.4 });
  lantern(b, 0, 3.9, 4, { intensity: 9 });
  b.mark('gateW', -3.5, 0, 3);
  b.mark('gateE', 3.5, 0, 3);

  // -- Front courtyard: lanterns, paper dolls, sedan chairs, the suona ------------------------
  b.wallGapsX(-14, 14, 8, H, [[0, 3]], { ...w, lintel: 3.2 });
  b.wallGapsZ(8, 32, -14, H, [[22, 3]], { ...w, lintel: 3.2 });
  b.wallGapsZ(8, 32, 14, H, [[12, 2.4], [22, 2.4]], { ...w, lintel: 3 });
  b.wallGapsX(-14, 14, 32, H, [[0, 3]], { ...w, lintel: 3.3 });
  b.box(0, 1.6, 11, 8, 3.2, 0.5, { color: '#4a3a32' }); // screen wall (a spirit screen)
  b.sign(0, 2.2, 11.3, 'DOUBLE HAPPINESS', { fixed: true, yaw: 0, style: 'horror', w: 1.2 });
  b.box(-6, 0.45, 20, 1.8, 0.9, 1.8, { color: '#55524c' }); // the well
  sedan(b, -10.5, 27, 'e');
  sedan(b, 8, 26, 's');
  b.box(12, 0.6, 30.6, 1.6, 1.2, 1.0, { color: '#4a3a32' }); // little shrine
  const incense = b.item('incense', 12, 1.5, 29.7, { who: 0, color: '#ff6b4a', label: 'Incense' });
  for (const [x, z, yaw] of [[-12.8, 10, Math.PI / 4], [12.8, 9.6, -Math.PI / 4], [-12.8, 30.6, Math.PI * 0.75], [-4, 31, Math.PI], [5, 31, Math.PI], [12.9, 17, -Math.PI / 2]]) {
    b.figure(x, 0, z, { look: 'paper', yaw, watch: true });
  }
  for (const [x, z] of [[-12.5, 9.5], [12.5, 9.5], [-12.5, 30.5], [12.5, 26], [0, 31.4], [-8, 13]]) lantern(b, x, 3.4, z, { dist: 9 });
  b.note(3, 0.8, 14.5, 'Crumpled Note', "When the horns play, we come out to carry the sedan.\nIf we see the living, we carry them off.\n\nBut we can't get into the sedan chairs —\nonly a bride may sit inside.");
  const suona = b.zone('trigger', 0, 1.5, 9.4, 6, 3, 2.2, { fx: ['sting', 'whisper'], text: "The horns... they're playing somewhere deep in the courtyard. When you hear the horns, hide in a sedan chair!" });
  b.checkpoint(-6.5, 0, 9.8, 2.6, { flag: false, hint: 'A paper sedan-bearer walks the courtyard. If it sees you, hide in a sedan chair or hold it in your flashlight.' });

  // The sedan-bearer: walks the courtyard while the suona plays, until the
  // offerings are on the altar.
  const altarItems = [];

  // -- Kitchen: the red candle (Luna only) ---------------------------------------------------
  b.wallX(14, 22, 8, H, w);
  b.wallX(14, 22, 16, H, w);
  b.wallZ(8, 16, 22, H, w);
  b.box(18, H + 0.25, 12, 8.4, 0.5, 8.4, roof);
  b.box(19.5, 0.5, 14.8, 3, 1, 1.4, { color: '#4a4440' }); // stove
  const candle = b.item('candle', 19.5, 1.35, 14.8, { who: 1, color: '#4f86ff', label: 'Red Candle' });
  table(b, 16.5, 9.6, 1.6, 0.9);
  b.note(16.5, 0.9, 9.6, "Steward's Ledger", 'Prepare: twelve paper dolls, two sedan chairs, one band of horns.\nPrepare: one bundle of incense, a pair of red candles, a plate of gold ingots, for the ancestors.\n\nThe master says the young miss died too soon, never wed. She must have her wedding.\nThe groom... for the groom, we will invite two passers-by.');
  b.figure(21.2, 0, 9, { look: 'doll', yaw: -Math.PI * 0.75, watch: true });
  b.light(18, 3.9, 12, { color: '#ffb070', intensity: 5, dist: 7, flicker: 0.5, fixture: 'bulb' });

  // -- Embroidery tower: the screen, the stair gate, the loft with the chest ------------------
  const HT = 8.5;
  b.wallX(14, 26, 18, HT, w);
  b.wallX(14, 26, 32, HT, w);
  b.wallZ(18, 32, 26, HT, w);
  b.wallZ(18, 32, 14, HT - H, { ...w, y: H });
  b.box(20, HT + 0.25, 25, 12.4, 0.5, 14.4, roof);
  b.checkpoint(16.2, 0, 25.5, 3, { flag: false, hint: 'A mechanism blocks the tower stairs: one of you stands on the plate, the other goes up.' });
  // The screen on the south wall, with her birthday embroidered in thread
  // that only shows in a beam.
  b.box(18.5, 1.3, 18.35, 3.6, 2.6, 0.1, { color: '#6a1c1c' });
  b.sign(18.5, 2.9, 18.45, "Xiu'e's Screen", { fixed: true, yaw: 0, style: 'paper', w: 2.0 });
  b.sign(18.5, 1.5, 18.45, '3rd month, 7th day', { fixed: true, yaw: 0, style: 'uv', w: 2.6 });
  const stairPlate = b.plate(18.5, 0, 22.5);
  b.sign(18.5, 1.9, 22.5, 'MECHANISM', { style: 'horror', w: 1.0 });
  b.mark('stairPlate', 18.5, 0, 22.5);
  // Stairs up the east side, behind a gate that's open only while the plate is held.
  b.wallZ(20.2, 27.6, 22.85, HT, { ...w, t: 0.3 });
  const steps = [];
  for (let i = 0; i < 7; i++) {
    const top = 0.6 * (i + 1);
    const z = 21.1 + i;
    b.box(24.35, top / 2, z, 2.9, top, 1.0, { mat: 'wood', color: '#4a3020' });
    steps.push([24.35, top, z]);
  }
  const stairGate = b.door(24.35, 20.2, 2.9, HT - 0.1, { op: 'all', in: [stairPlate] }, { latch: false, color: '#5a1c1c', speed: 12 });
  b.mark('vestibule', 24.35, 0, 19.2);
  // The loft (4.8 m up: too high to jump).
  const LOFT = 4.8;
  b.box(20, LOFT - 0.25, 29.7, 11.6, 0.5, 4.2, { mat: 'wood', color: '#3a2a20' });
  b.box(24.35, LOFT + 1.4, 31.68, 2.0, 2.6, 0.1, { mat: 'metal', color: '#c8d2dc' }); // the mirror
  b.sign(24.35, LOFT + 3.0, 31.6, "Don't linger at the mirror", { fixed: true, yaw: Math.PI, style: 'paper', w: 2.0 });
  b.zone('kill', 24.35, LOFT + 1.2, 30.7, 3.0, 2.4, 2.2, { scare: 'Your reflection turned its head... half a beat too late...' });
  b.box(15, LOFT + 0.5, 30.9, 1.2, 1.0, 1.0, { color: RED }); // her chest
  const dialX = [16.4, 18.2, 20.0, 21.8];
  const dials = dialX.map((x) => b.dial(x, LOFT, 30.4, { h: 1.6 }));
  const chest = b.combo(dials, [0, 3, 0, 7]);
  b.sign(18.8, LOFT + 2.9, 31.65, "XIU'E'S CHEST · 4 digits: MMDD\n(pound the buttons to turn them)", { fixed: true, yaw: Math.PI, style: 'paper', w: 3.6 });
  const ingot = b.item('ingot', 15, LOFT + 0.8, 29.4, { color: '#ffd166', label: 'Gold Ingot', when: chest });
  b.light(15, LOFT + 1.6, 30.2, { color: '#ffd166', intensity: 3, dist: 3, fixture: 'none', when: chest });
  const nDiary = b.note(19, LOFT + 0.8, 28.5, "Xiu'e's Diary", "Father wants to marry me off to a man I have never met.\nI won't.\n\nI stitched my birthday into the screen. Only lamplight can show it.\n\nIf anyone finds this diary — don't let them keep the marriage contract. Burn it, and the marriage is void.");
  b.light(20, 3.9, 22.5, { color: '#ff8a6a', intensity: 6, dist: 8, flicker: 0.3, fixture: 'bulb' });
  b.light(19, LOFT + 2.8, 29.5, { color: '#ff8a6a', intensity: 6, dist: 8, flicker: 0.4, fixture: 'bulb' });
  for (let i = 0; i < 4; i++) b.mark(`dial${i}`, dialX[i], LOFT, 30.4);

  // -- Ancestral hall (safe): the altar, the tablets, the hidden niche --------------------------
  b.wallX(-28, -14, 14, H, w);
  b.wallGapsX(-28, -14, 30, H, [[-21, 2.6]], { ...w, lintel: 2.8 });
  b.wallZ(14, 30, -28, H, w);
  b.box(-21, H + 0.25, 22.9, 14.4, 0.5, 18.2, roof);
  b.wallZ(30, 31.8, -22.3, H, w);
  b.wallZ(30, 31.8, -19.7, H, w);
  b.wallX(-22.3, -19.7, 31.8, H, w);
  b.zone('safe', -21, 1.5, 22, 13.2, 3, 15.2);
  b.checkpoint(-16.6, 0, 18.4, 3.2, { flag: false, hint: "The ancestors protect this hall; they can't get in. Three offerings: incense, a red candle, a gold ingot." });
  b.box(-25.8, 0.45, 22, 2.0, 0.9, 7, { mat: 'wood', color: '#2a140e' }); // altar table
  b.sign(-27.75, 3.2, 22, 'SHEN ANCESTRAL HALL', { fixed: true, yaw: Math.PI / 2, style: 'horror', w: 2.4 });
  const altar = b.lock(-19.5, 0, 22, [], { label: 'Altar', radius: 2.2 });
  const names = ['Shen Dechang', 'Shen Wenyuan', 'Shen Chengye', "Shen Xiu'e"];
  const tabletZ = [19.6, 21.2, 22.8, 24.4];
  const placed = b.rng.shuffle(names.slice());
  const tabletSw = {};
  placed.forEach((name, i) => {
    const z = tabletZ[i];
    b.box(-26.2, 1.4, z, 0.2, 1.0, 0.7, { mat: 'wood', color: '#1a0c08' });
    b.sign(-26.05, 1.45, z, `In memory of\n${name}`, { fixed: true, yaw: Math.PI / 2, style: 'paper', w: 0.7 });
    tabletSw[name] = b.pswitch(-23.4, 0, z, false, 0.6);
  });
  const rites = b.seq(names.map((n) => tabletSw[n]));
  b.sign(-22.2, 2.6, 15.4, 'ANCESTOR RITES\nPound at each tablet, in order', { fixed: true, yaw: 0, style: 'paper', w: 3.0 });
  for (const z of [18.9, 25.1]) b.light(-25.8, 1.1, z, { color: '#ffb060', intensity: 4, dist: 7, flicker: 0.35, fixture: 'candle' });
  b.light(-21, 3.9, 22, { color: '#ff9050', intensity: 5, dist: 9, flicker: 0.2, fixture: 'bulb' });
  const niche = b.door(-21, 30, 2.6, 2.8, { op: 'all', in: [altar] }, { latch: true, color: '#2a140e', speed: 3 });
  b.acts[b.acts.length - 1].toast = 'A hidden niche opens behind the altar.';
  const nTree = b.note(-21, 1.0, 31.2, 'Shen Family Tree', "1st generation  Shen Dechang\n2nd generation  Shen Wenyuan\n3rd generation  Shen Chengye\n4th generation  Shen Xiu'e (died unwed)\n\nThe rites start with the first generation and go down, one by one. Not one out of order.");
  b.mark('niche', -21, 0, 30.7);

  // The bearer, now that the altar exists.
  b.monster({
    look: 'paper', y: 0,
    nodes: [[-9, 14], [-9, 29], [10.5, 29], [10.5, 14], [0, 22]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0], [4, 0], [4, 1], [4, 2], [4, 3]],
    patrol: [2, 3, 0, 1, 2, 4, 0, 1, 4, 3],
    start: 2, active: suona, until: altar,
    speed: 2.4, chase: 4.8, sight: 11, giveUp: 9, rest: 6,
    area: [[-14, 8.6, 14, 32]],
  });
  altarItems.push(incense, candle, ingot);
  b.locks.find((l) => l.id === altar).accepts = altarItems;

  // -- The corridor over the lotus pond: paper dolls that move when nobody looks ---------------
  const northGate = b.door(0, 32, 3, 3.2, { op: 'all', in: [rites, altar] }, { latch: true, color: '#5a1c1c', speed: 3 });
  b.acts[b.acts.length - 1].toast = 'The corridor door opens...';
  b.checkpoint(0, 0, 29.4, 3.2, { flag: false, hint: "The paper dolls in the corridor only move when nobody is looking. Watch each other's backs!" });
  for (const s of [-1, 1]) {
    b.wallGapsZ(32, 60, s * 3, H, [[36, 3], [55, 4]], w);
    b.wallZ(40, 48, s * 3, 3, { ...w, y: -3 });
    b.room(s < 0 ? -5.4 : 3, 34.5, s < 0 ? -3 : 5.4, 37.5, H, s < 0 ? { e: null } : { w: null }, w);
    b.room(s < 0 ? -5.4 : 3, 53, s < 0 ? -3 : 5.4, 57, H, s < 0 ? { e: null } : { w: null }, w);
  }
  b.box(0, H + 0.25, 46, 11, 0.5, 28.4, roof);
  b.box(0, -0.3, 44, 0.9, 0.6, 8.2, { mat: 'wood', color: '#4a3a2b' }); // the plank over the pond
  b.box(0, -2.6, 44, 6, 0.4, 8, { color: '#0e2a22' }); // black water
  b.zone('kill', 0, -1.4, 44, 6, 1.6, 8, { scare: 'A paper hand reaches out of the water and drags you under...' });
  b.sign(0, 2.6, 39.6, 'LOTUS POND', { fixed: true, yaw: Math.PI, style: 'paper', w: 1.2 });
  for (const z of [34, 50, 58]) lantern(b, 0, 3.9, z, { intensity: 5, dist: 7, flicker: 0.45 });
  const dollWake = b.zone('trigger', 0, 1.5, 33.6, 6, 3, 2.4, { fx: 'whisper', text: "...Rustle... rustle... the sound of paper scraping. Don't look away." });
  const plateW = b.plate(-4.2, 0, 55);
  const plateE = b.plate(4.2, 0, 55);
  b.mark('plateW', -4.2, 0, 55);
  b.mark('plateE', 4.2, 0, 55);
  b.wallGapsX(-10, 10, 60, 5, [[0, 3]], { ...w, lintel: 3.3 });
  const hallDoor = b.door(0, 60, 3, 3.2, { op: 'all', in: [plateW, plateE] }, { latch: true, color: '#7a1616', speed: 3 });
  b.acts[b.acts.length - 1].toast = 'The wedding hall door opens.';
  b.sign(0, 3.9, 59.75, 'WEDDING HALL', { fixed: true, yaw: Math.PI, style: 'horror', w: 1.6 });
  const inHall = b.zone('trigger', 0, 1.5, 62.4, 6, 3, 2.4, { fx: 'slam', text: 'Behind you, every paper doll collapses at once.' });
  const dollNodes = [[-4.2, 36], [4.2, 36], [0, 36], [0, 39.6], [0, 48.4], [0, 52], [0, 58], [-4.2, 55], [4.2, 55]];
  const dollEdges = [[0, 2], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [5, 7], [5, 8], [6, 7], [6, 8]];
  for (const start of [0, 1]) {
    b.monster({
      look: 'paper', y: 0, nodes: dollNodes, edges: dollEdges, patrol: [], start,
      active: dollWake, until: inHall, seen: true,
      speed: 1.5, chase: 4.2, sight: 16, giveUp: 12, rest: 4, catchR: 1.1,
      area: [[-5.4, 32.2, 5.4, 59.8]],
    });
  }

  // -- Wedding hall and the bride -------------------------------------------------------------
  b.wallX(-10, 10, 76, 5, w);
  b.wallZ(60, 76, -10, 5, w);
  b.wallZ(60, 76, 10, 5, w);
  b.box(0, 5.25, 68, 20.4, 0.5, 16.4, roof);
  b.checkpoint(0, 0, 63.4, 3.2, { flag: false, hint: 'Burn the marriage contract in the brazier and the marriage is void. Then — run.' });
  b.box(0, 0.15, 74.3, 3, 0.3, 2, { color: '#5a1010' }); // dais
  b.sign(0, 3.3, 75.75, 'DOUBLE HAPPINESS', { fixed: true, yaw: Math.PI, style: 'horror', w: 2.0 });
  table(b, -6, 72, 1.6, 0.9);
  table(b, 6, 71.5, 1.6, 0.9);
  const contract = b.item('contract', -6, 1.2, 72, { color: '#e0405a', label: 'Marriage Contract' });
  b.note(6, 0.9, 71.5, "The Bridesmaid's Note", 'There is no face under the veil.\n\nWhen the contract burns, she will wake. She will want to keep her grooms.\n\nRun to the gate and stand on the threshold together — the gate only answers to the living.');
  const brazier = b.lock(0, 0, 67, [contract], { label: 'Brazier', radius: 2.2 });
  b.light(0, 1.6, 67, { color: '#ff7a2a', intensity: 6, dist: 6, flicker: 0.5, fixture: 'none' });
  b.figure(0, 0.3, 74, { look: 'bride', yaw: Math.PI, until: brazier });
  b.figure(1.6, 0.3, 74, { look: 'paper', yaw: Math.PI, until: brazier });
  for (const [x, z] of [[-8, 62], [8, 62], [-8, 74], [8, 74]]) lantern(b, x, 4.2, z, { intensity: 6, dist: 9 });
  b.zone('trigger', 0, 1.5, 68, 19, 3, 15, { when: brazier, fx: ['slam', 'lightsOut', 'sting'], text: 'The veil... lifts by itself. There is nothing underneath. Run! Back to the gate!' });
  b.mark('contract', -6, 0, 70.9);
  b.mark('brazier', -1.4, 0, 65.6);

  // She chases you all the way back to the gate. Flashlights hold her; the
  // plank slows her; the ancestral hall is out of bounds for her; once the
  // gate opens she's gone.
  const brideNodes = [[0, 73], [2.5, 69], [2.5, 64], [0, 61.5], [0, 58], [0, 52], [0, 48.4], [0, 39.6], [0, 34], [0, 30], [0, 22], [5.5, 13], [5.5, 9.6], [0, 9.6], [0, 6], [0, 2.8]];
  const chain = brideNodes.map((_, i) => i);
  const gate = b.act('gate', { op: 'all', in: [gateW, gateE, brazier] }, true, [
    { x: 0, y: 1.6, z: 0, sx: 3.1, sy: 3.2, sz: 0.3, move: [0, 3.5, 0] },
  ], { speed: 3, color: '#2a140e', lamp: [0, 3.6, 0.4] });
  b.acts[b.acts.length - 1].toast = 'The gate is open — get out!';
  b.monster({
    look: 'bride', y: 0, nodes: brideNodes, edges: chain.slice(1).map((i) => [i - 1, i]),
    patrol: [...chain, ...chain.slice(1, -1).reverse()],
    active: brazier, wakeAt: [0, 0, 73], until: gate,
    speed: 3.0, chase: 5.0, sight: 16, giveUp: 15, rest: 5,
    area: [[-10, 60, 10, 76], [-5.4, 32, 5.4, 60], [-14, 8, 14, 32], [-6, 0, 6, 8]],
  });
  b.goal(0, 0, -7, Math.PI, { style: 'exit' });

  b.story = {
    introMs: 9000,
    tagline: 'Chinese folk horror · Ghost wedding',
    intro: {
      kicker: 'Night 5',
      title: 'The Paper Doll Mansion',
      lines: [
        'Less than a day after the hospital, both your phones light up: the unknown number has sent a photo — a bright red invitation with both your names on it.',
        `"Miss Xiu'e of the Shen family weds tonight at midnight. You two are cordially invited." The address is an old mansion west of town, empty for decades. The moment you step over the threshold, the gate swings shut behind you.`,
      ],
      rules: [
        'Hear the wedding horns? Hide in a sedan chair.',
        'When a paper doll is watching you, watch it back.',
        "The ancestors protect the ancestral hall: they can't get in.",
        "Don't linger in front of the mirror in the embroidery tower.",
        "Never, ever lift the bride's veil.",
        'To leave by the gate, both of you must stand on the threshold.',
      ],
    },
    outro: {
      kicker: 'Dawn',
      title: 'The Feast Is Over',
      lines: [
        'The gate creaks shut behind you. One by one, the red lanterns inside go out, and the horns fade into the distance, like a bridal procession finally on its way.',
        "After sunrise you go back for one more look: the mansion's gate is sealed with paper strips and thick with dust, as if no one had opened it in decades. Only on the threshold lies a red paper flower, still damp.",
        'Your phones light up again. The same unknown number: "The last night. The carousel at the funfair is still waiting for you."',
      ],
    },
  };
  b.objectives = [
    { text: "Go to the embroidery tower: one stands on the mechanism plate, the other goes upstairs to find Xiu'e's chest", done: { note: nDiary } },
    { text: "Open Xiu'e's chest (her birthday is stitched into the screen: shine a flashlight on it)", done: { sig: chest } },
    { text: 'Put the three offerings on the altar in the ancestral hall: incense (only Sol can carry it), red candle (only Luna can carry it), gold ingot', done: { sig: altar } },
    { text: 'Following the family tree, pound the buttons before the tablets, generation by generation', done: { act: northGate } },
    { text: 'Cross the corridor: paper dolls freeze while watched. Stand on both plates by the wedding hall door together', done: { act: hallDoor } },
    { text: 'Burn the marriage contract in the brazier to void the marriage', done: { sig: brazier } },
    { text: 'Run! Back to the gate, both of you on the threshold', done: { act: gate } },
    { text: 'Get out!', done: {} },
  ];
  void stairGate; void niche; void nTree; void steps;
  return b.finish();
}
