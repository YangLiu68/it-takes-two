// Placeholder for a level that is still being built: a small room with a
// sign and the goal. Levels marked wip skip the content checks in the tests.

import { LevelBuilder } from './build.js';
import { DARK } from './stories/common.js';

export function wipLevel({ mode, index, key, name, label }) {
  const b = new LevelBuilder({ mode, index, seed: key, name, label, theme: mode === 'horror' ? 'twilight' : 'playroom', sky: 'day', overrides: mode === 'horror' ? DARK : {} });
  b.floor(0, 0, 6, 12, 16, { color: '#3a3a40' });
  b.checkpoint(0, 0, 2, 6, { flag: false, hint: 'This level is still being built.' });
  b.sign(0, 2.6, 8, `${name}\nUnder construction...`, { style: mode === 'horror' ? 'horror' : 'prank' });
  b.light(0, 3.5, 6, { intensity: 10, dist: 12 });
  b.goal(0, 0, 11);
  const level = b.finish();
  level.wip = true;
  return level;
}
