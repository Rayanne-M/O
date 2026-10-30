import type { GameData } from '../engine/types';
import { blessings } from './blessings';
import { classes } from './classes';
import { curses } from './curses';
import { equipment } from './equipment';
import { races } from './races';
import { baseStats } from './stats';
import { synergies } from './synergies';
import { tagLabels } from './tags';

export { STAT_LABELS } from './stats';
export { tagLabels } from './tags';

/** Tout le contenu du jeu. Pour ajouter du contenu, il suffit de modifier les fichiers de ce dossier. */
export const gameData: GameData = { baseStats, races, classes, equipment, blessings, curses, synergies, tagLabels };
