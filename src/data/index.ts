import type { BattleData, GameData } from '../engine/types';
import { blessings } from './blessings';
import { classes } from './classes';
import { curses } from './curses';
import { equipment } from './equipment';
import { monsters } from './monsters';
import { passives } from './passives';
import { skills } from './skills';
import { baseStats } from './stats';
import { synergies } from './synergies';
import { tagLabels } from './tags';

export { STAT_DESCRIPTIONS, STAT_LABELS } from './stats';
export { tagLabels } from './tags';

/** Tout le contenu du jeu. Pour ajouter du contenu, il suffit de modifier les fichiers de ce dossier. */
export const gameData: GameData = { baseStats, classes, blessings, curses, equipment, synergies, passives, tagLabels };

/** Le contenu des combats : compétences et monstres. */
export const battleData: BattleData = { skills, monsters };
