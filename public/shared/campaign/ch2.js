// Campaign levels 7–12: key → builder(index).

import { beltFactory } from './belt-factory.js';
import { windyValley } from './windy-valley.js';
import { hammerHall } from './hammer-hall.js';
import { rideAlong } from './ride-along.js';
import { cannonCoast } from './cannon-coast.js';
import { sprintGates } from './sprint-gates.js';

export const BUILDERS = {
  'belt-factory': beltFactory,
  'windy-valley': windyValley,
  'hammer-hall': hammerHall,
  'ride-along': rideAlong,
  'cannon-coast': cannonCoast,
  'sprint-gates': sprintGates,
};
