// Campaign levels 19–24: key → builder(index).

import { lavaRise } from './lava-rise.js';
import { redBlue } from './red-blue.js';
import { portalMaze } from './portal-maze.js';
import { delivery } from './delivery.js';
import { nightRun } from './night-run.js';
import { mirrorLanes } from './mirror-lanes.js';

export const BUILDERS = {
  'lava-rise': lavaRise,
  'red-blue': redBlue,
  'portal-maze': portalMaze,
  delivery,
  'night-run': nightRun,
  'mirror-lanes': mirrorLanes,
};
