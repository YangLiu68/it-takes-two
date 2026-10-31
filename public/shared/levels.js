// Every playable level, by mode. All of them are designed by hand now: the
// campaign, prank courses, escape rooms and horror stories. The seed
// only mattered for the old procedural campaign, which still lives in
// levelgen.js (its pieces are what every level is built from).

import { generateLevel } from './levelgen.js';
import { CAMPAIGN } from './campaign.js';
import { COURSES } from './courses.js';
import { PUZZLES } from './puzzles.js';
import { STORIES } from './horror.js';

export const MODES = {
  classic: { label: 'Level', title: 'Campaign', list: CAMPAIGN },
  course: { label: 'Course', title: 'Prank Park', list: COURSES },
  puzzle: { label: 'Room', title: 'Escape Rooms', list: PUZZLES },
  horror: { label: 'Night', title: 'Horror', list: STORIES },
  // The old procedural generator, kept for tests (not in the lobby).
  gen: { label: 'Level', title: 'Random World', count: 100, hidden: true },
};

// How a level is named on cards and menus: Level 3, Course 1, Room 2, Night 1.
export function levelLabel(mode, index) {
  if (mode === 'horror') return `Night ${index + 1}`;
  if (mode === 'puzzle') return `Room ${index + 1}`;
  if (mode === 'course') return `Course ${index + 1}`;
  return `Level ${index + 1}`;
}

export function levelCount(mode) {
  const m = MODES[mode];
  if (!m) return 0;
  return m.list ? m.list.length : m.count;
}

export function buildLevel(mode, seed, index) {
  const m = MODES[mode] || MODES.classic;
  if (!m.list) return { ...generateLevel(seed, index), mode: m === MODES.gen ? 'gen' : 'classic', label: levelLabel('classic', index) };
  const def = m.list[Math.max(0, Math.min(m.list.length - 1, index))];
  return def.build(index);
}

// What the lobby lists for a mode: [{ index, label, title, blurb }].
export function levelMenu(mode) {
  const m = MODES[mode];
  if (!m) return [];
  if (!m.list) return Array.from({ length: m.count }, (_, i) => ({ index: i, label: levelLabel(mode, i), title: levelLabel(mode, i) }));
  return m.list.map((d, i) => ({ index: i, label: levelLabel(mode, i), title: d.title, blurb: d.blurb }));
}
