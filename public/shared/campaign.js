// The main campaign: thirty hand-designed levels, each built around its
// own way of playing — not a reskin of another level. Every level is a string
// of stages that keep changing what you do with that idea, and almost all of
// them need both of you.

import { wipLevel } from './wip.js';
import { BUILDERS as CH1 } from './campaign/ch1.js';
import { BUILDERS as CH2 } from './campaign/ch2.js';
import { BUILDERS as CH3 } from './campaign/ch3.js';
import { BUILDERS as CH4 } from './campaign/ch4.js';
import { BUILDERS as CH5 } from './campaign/ch5.js';

const BUILT = { ...CH1, ...CH2, ...CH3, ...CH4, ...CH5 };

const wip = (key, title) => (index) => wipLevel({ mode: 'classic', index, key, name: title, label: `Level ${index + 1}` });

// [key, title, what it's about] — the order is the difficulty curve.
const PLAN = [
  ['first-steps', 'First Steps', 'Run, jump, double jump, dash, ground pound — and stand on plates together'],
  ['magnet-pals', 'Magnet Pals', 'Red pulls blue, same colors push: zip across, shoot up, then call your partner over'],
  ['seesaw-park', 'Seesaw Park', 'One pounds, one flies: seesaws of every kind'],
  ['weight-doors', 'Pressure Plates', 'Plates open doors, swap roles, pass the baton: puzzles with no clock'],
  ['beat-blocks', 'Beat Blocks', 'Blocks that pop in and out to the beat'],
  ['crumble-run', 'Crumbling Path', 'The path crumbles under your feet — keep running!'],
  ['belt-factory', 'Conveyor Factory', "Belts carry you off; your partner's plate turns them around"],
  ['windy-valley', 'Windy Valley', 'Fans blow you sky-high — but only while your partner holds the plate'],
  ['hammer-hall', 'Hammer Hall', 'Dodge the giant hammers, or get your partner to stop them'],
  ['ride-along', 'Ride Along', 'One rides the platform, the other drives it from a plate'],
  ['cannon-coast', 'Cannon Coast', 'Magnet cannons fire you off, and your partner pulls you in mid-air'],
  ['sprint-gates', 'Sprint Gates', 'One hits the timer switch, the other sprints through before the door shuts'],
  ['invisible-road', 'Invisible Road', "Roads you can't see: one stands on the eye plate and guides the other"],
  ['spin-world', 'Spin World', 'Turntables, windmills and spinning bridges'],
  ['bounce-castle', 'Bounce Castle', 'Bounce drums: pound down to bounce higher'],
  ['piston-press', 'Piston Workshop', 'Pistons that slam down — and lifts that push you up'],
  ['ice-rink', 'Ice Slide', 'No stopping on ice: ride your momentum'],
  ['moon-walk', 'Moon Walk', 'Low gravity: jump high and far, fall nice and slow'],
  ['lava-rise', 'Rising Lava', 'The lava is rising: climb out together'],
  ['red-blue', 'Red & Blue', 'Pound a switch and the red and blue blocks take turns'],
  ['portal-maze', 'Portal Maze', 'Walk into one portal, come out of another'],
  ['delivery', 'Special Delivery', 'Carry parcels only you can hold past every obstacle'],
  ['night-run', 'Night Run', 'Only a flashlight in the dark: one lights the way, the other jumps'],
  ['mirror-lanes', 'Mirror Lanes', "Two lanes: your plates control your partner's path"],
  ['rope-buddies', 'Rope Buddies', 'Tied together by a rope: neither of you gets far alone'],
  ['train-ride', 'Runaway Train', 'Hop around on a speeding train'],
  ['tide-pool', 'Tide Pool', 'The water rises and falls: work it with switches and ride the floats'],
  ['map-maze', 'Map Maze', 'One reads the map from a tower, the other walks the maze'],
  ['simon-dance', 'Memory Dance', 'Remember the order of the lights and dance it out'],
  ['grand-finale', 'Grand Finale', 'Every trick from the whole campaign, all at once'],
];

export const CAMPAIGN = PLAN.map(([key, title, blurb]) => ({ key, title, blurb, build: BUILT[key] || wip(key, title) }));
