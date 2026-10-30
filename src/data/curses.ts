import type { Curse } from '../engine/types';
import { flat, pct } from './helpers';

// Une malédiction a surtout des défauts, mais elle donne droit à une bénédiction de plus
// et ses tags peuvent activer des synergies puissantes.
export const curses: Curse[] = [
  {
    id: 'blood_curse',
    name: 'Malédiction du sang',
    description: 'Ta vie s’écoule, mais ta rage grandit.',
    tags: ['blood'],
    modifiers: [pct('hp', -20), flat('strength', 3), flat('crit', 5)],
  },
  {
    id: 'shadow_mark',
    name: 'Marque de l’ombre',
    description: 'L’ombre t’a marqué. Tu es plus fragile en pleine lumière.',
    tags: ['shadow'],
    modifiers: [flat('defense', -3), flat('hp', -5)],
  },
  {
    id: 'silence',
    name: 'Vœu de silence',
    description: 'Les arcanes te sont presque fermées.',
    tags: [],
    modifiers: [pct('mana', -50), flat('intelligence', -3)],
  },
  {
    id: 'consumed_soul',
    name: 'Âme consumée',
    description: 'Le feu te ronge de l’intérieur, et brûle plus fort que jamais.',
    tags: ['fire'],
    modifiers: [pct('hp', -15), pct('mana', -10)],
    passives: ['inner_fire'],
  },
  {
    id: 'fragility',
    name: 'Os de verre',
    description: 'Ton corps encaisse mal les coups, mais il est plus léger.',
    tags: ['light'],
    modifiers: [pct('defense', -40), flat('speed', 2)],
  },
];
