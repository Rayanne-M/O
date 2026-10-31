import type { Blessing } from '../engine/types';
import { flat, pct } from './helpers';

export const blessings: Blessing[] = [
  {
    id: 'sun_blessing',
    name: 'Bénédiction solaire',
    description: 'La lumière du soleil te protège et nourrit ta flamme.',
    tags: ['holy', 'fire'],
    modifiers: [pct('hp', 10), flat('intelligence', 2)],
    skills: ['sun_prayer'],
  },
  {
    id: 'forest_favor',
    name: 'Faveur de la forêt',
    description: 'Les esprits des bois guident tes pas.',
    tags: ['nature'],
    modifiers: [flat('agility', 3), flat('speed', 2)],
  },
  {
    id: 'war_god_blessing',
    name: 'Bénédiction du dieu de la guerre',
    description: 'Tes coups portent la colère divine.',
    tags: ['holy', 'martial'],
    modifiers: [pct('strength', 10)],
  },
  {
    id: 'arcane_gift',
    name: 'Don des arcanes',
    description: 'Un flux de mana inépuisable.',
    tags: ['arcane'],
    modifiers: [pct('mana', 20)],
  },
];
