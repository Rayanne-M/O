import type { CharacterClass } from '../engine/types';
import { flat } from './helpers';

export const classes: CharacterClass[] = [
  {
    id: 'mage',
    name: 'Mage',
    description: 'Maîtrise les arcanes. Beaucoup de mana, peu de vie.',
    tags: ['mage', 'arcane'],
    modifiers: [flat('mana', 30), flat('intelligence', 12), flat('hp', -10)],
    attack: { stat: 'intelligence', element: 'arcane' },
  },
  {
    id: 'warrior',
    name: 'Guerrier',
    description: 'Combattant au corps à corps, solide et puissant.',
    tags: ['warrior', 'martial'],
    modifiers: [flat('hp', 30), flat('strength', 11), flat('defense', 3)],
    attack: { stat: 'strength', element: 'physical' },
  },
  {
    id: 'rogue',
    name: 'Roublard',
    description: 'Rapide et précis, frappe dans l’ombre.',
    tags: ['rogue', 'shadow'],
    modifiers: [flat('agility', 10), flat('crit', 15), flat('speed', 3)],
    attack: { stat: 'agility', element: 'physical' },
  },
];
