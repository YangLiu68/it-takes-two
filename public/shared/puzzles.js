// Puzzle levels (escape rooms): keys, locks, codes and split-up rooms where
// each partner holds the answer the other needs. Ten escape rooms, each longer
// and harder than the last; finishing one leads straight into the next.

import { wipLevel } from './wip.js';
import { toyVault } from './escape/toy-vault.js';
import { clockShop } from './escape/clock-shop.js';
import { magicLibrary } from './escape/magic-library.js';
import { iceCastle } from './escape/ice-castle.js';
import { grandMachine } from './escape/grand-machine.js';
import { spaceStation } from './escape/space-station.js';
import { detective } from './escape/detective.js';
import { candyFactory } from './escape/candy-factory.js';
import { pirateShip } from './escape/pirate-ship.js';
import { pyramid } from './escape/pyramid.js';

const wip = (key, title) => (index) => wipLevel({ mode: 'puzzle', index, key, name: title, label: `Room ${index + 1}` });

export const PUZZLES = [
  { key: 'toy-vault', title: 'Toy Vault', blurb: 'Split up: one of you can see the code, the other punches it in. Two key halves make one key.', build: toyVault },
  { key: 'clock-shop', title: 'Clock Shop', blurb: 'Stopped clocks, cuckoos, a giant pendulum and linked gears: one reads the clues, the other does the work, then up the clock tower you go.', build: clockShop },
  { key: 'magic-library', title: 'Magic Library', blurb: 'Swapped riddles, a bookshelf maze, invisible magic words, flying books and star lamps: it takes both of you to break the seal on the forbidden book.', build: magicLibrary },
  { key: 'candy-factory', title: 'Candy Factory', blurb: 'Fix the production line: sort candy, mix syrup, ride a chocolate boat across the river, then enter the batch numbers you collected along the way.', build: candyFactory },
  { key: 'pirate-ship', title: 'Pirate Ship', blurb: 'Board by cannon, piece together a torn treasure map, seesaw up to the crow\'s nest, set the captain\'s compass, then listen to the parrot to open the treasure.', build: pirateShip },
  { key: 'pyramid', title: 'Pyramid', blurb: 'Solve the obelisk riddles, spot the traps with the Eye of Horus, dodge swinging axes, turn the linked star rings, light nine braziers and climb to the top.', build: pyramid },
  { key: 'space-station', title: 'Space Station', blurb: 'The station has lost power: race through the airlock, restore five modules, take turns powering fans, send each other oxygen tanks, swing across magnet rails and read the docking code off a star chart.', build: spaceStation },
  { key: 'detective', title: 'Detective Agency', blurb: 'The Moonstone has been stolen: split up to read the files and a torn letter, open a secret door and a safe, cross an invisible passage, piece together a torn photo, then name the thief, the time and the tool.', build: detective },
  { key: 'ice-castle', title: 'Ice Castle', blurb: 'Seven frozen halls: a light-path model, an ice-pillar song, a snowman\'s snowballs, an ice-slide maze and a sculpture code, then climb to the Snow Queen\'s throne together.', build: iceCastle },
  { key: 'grand-machine', title: 'Machine City', blurb: 'The grand finale: six districts, six gears — toys, clocks, book lamps, pirates, pyramid, detectives — then climb the central tower together!', build: grandMachine },
];
