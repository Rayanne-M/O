import type { Race } from '../engine/types';
import { flat } from './helpers';

export const races: Race[] = [
  {
    id: 'human',
    name: 'Humain',
    description: 'Polyvalent, un peu bon en tout.',
    tags: ['human'],
    modifiers: [flat('hp', 10), flat('strength', 1), flat('agility', 1), flat('intelligence', 1)],
  },
  {
    id: 'elf',
    name: 'Elfe',
    description: 'Agile et proche de la magie, mais fragile.',
    tags: ['elf', 'nature', 'arcane'],
    modifiers: [flat('agility', 3), flat('intelligence', 3), flat('speed', 2), flat('hp', -10)],
  },
  {
    id: 'orc',
    name: 'Orc',
    description: 'Robuste et brutal. Le sang coule fort dans ses veines.',
    tags: ['orc', 'blood'],
    modifiers: [flat('hp', 20), flat('strength', 4), flat('intelligence', -2)],
  },
  {
    id: 'dwarf',
    name: 'Nain',
    description: 'Solide comme la roche, lent mais increvable.',
    tags: ['dwarf', 'earth'],
    modifiers: [flat('hp', 15), flat('defense', 3), flat('strength', 1), flat('speed', -2)],
  },
];
