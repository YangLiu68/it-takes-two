// Horror stories: dark levels with rules to obey, notes that piece the
// story together, things that chase you and places to hide. Scary, not gory:
// getting caught is a scare and a trip back to the checkpoint.
// They play as one long night: finishing a story leads straight into the next.

import { wipLevel } from './wip.js';
import { nightSchool } from './stories/night-school.js';
import { dorm404 } from './stories/dorm-404.js';
import { lastTrain } from './stories/last-train.js';
import { paperMansion } from './stories/paper-mansion.js';
import { hospital } from './stories/hospital.js';
import { funfair } from './stories/funfair.js';

const wip = (key, title) => (index) => wipLevel({ mode: 'horror', index, key, name: title, label: `Night ${index + 1}` });

export const STORIES = [
  { key: 'night-school', title: 'Midnight School Rules', blurb: "Locked in school after midnight, with the rules taped to the wall. Break one, and something notices you.", build: nightSchool },
  { key: 'dorm-404', title: 'Dorm 404', blurb: "A dorm floor sealed for years. Dark halls like a maze, and a room that shouldn't exist.", build: dorm404 },
  { key: 'last-train', title: 'The Last Train', blurb: 'The last train left long ago, but the PA still calls the stops. Walk a transfer tunnel that repeats itself, dodge the faceless conductor, and find the way out of the dark.', build: lastTrain },
  { key: 'hospital', title: 'Mercy Hospital', blurb: 'Closed for twenty years, its ward rules still on the wall. The night nurse still does her rounds, and Bed 13 is still waiting for someone to take her home.', build: hospital },
  { key: 'paper-mansion', title: 'The Paper Doll Mansion', blurb: 'A ghost-wedding invitation with your names on it. The paper dolls in the old house only move when no one is looking.', build: paperMansion },
  { key: 'funfair', title: 'Midnight Funfair', blurb: 'The last night: a funfair closed for over twenty years, and a clown roaming the plaza. Collect three park stamps and climb to the top of the Ferris wheel.', build: funfair },
];
