import type { Synergy } from '../engine/types';
import { flat, pct } from './helpers';

export const synergies: Synergy[] = [
  {
    id: 'pyromancer',
    name: 'Pyromancien',
    description: 'Un mage qui s’entoure de feu voit ses sorts s’embraser.',
    requires: { class: ['mage'], tags: { fire: 2 } },
    modifiers: [pct('intelligence', 25), flat('crit', 5)],
    passives: ['ignite'],
    skills: ['fireball'],
  },
  // Les trois styles du mage de feu
  {
    id: 'pyre',
    name: 'Bûcher',
    description: 'Style Brûlure : un feu qui ne s’éteint plus.',
    requires: { passives: ['ignite', 'inner_fire'] },
    modifiers: [],
    passives: ['blaze'],
  },
  {
    id: 'pyrotechnician',
    name: 'Artificier',
    description: 'Style Explosion : chaque explosion rallume la suivante.',
    requires: { passives: ['ignite', 'combustion'] },
    modifiers: [],
    passives: ['chain_reaction'],
  },
  {
    id: 'plasma_weaver',
    name: 'Tisseur de plasma',
    description: 'Style Plasma : un feu si chargé d’arcane qu’il traverse tout.',
    requires: { passives: ['flame', 'arcane_surge'] },
    modifiers: [],
    passives: ['plasma'],
  },
  {
    id: 'eclipse',
    name: 'Éclipse',
    description: 'L’ombre et la lumière réunies dans un seul corps.',
    requires: { tags: { shadow: 3, holy: 3 } },
    modifiers: [flat('crit', 10)],
    passives: ['eclipse_power'],
  },
  {
    id: 'arcanist',
    name: 'Arcaniste',
    description: 'Les arcanes s’accumulent en toi.',
    requires: { tags: { arcane: 3 } },
    modifiers: [pct('mana', 30), flat('intelligence', 3)],
  },
  {
    id: 'shadow_blade',
    name: 'Lame de l’ombre',
    description: 'Un roublard qui embrasse l’ombre frappe là où ça fait mal.',
    requires: { class: ['rogue'], tags: { shadow: 3 } },
    modifiers: [flat('crit', 15), pct('agility', 10)],
    passives: ['assassinate'],
  },
  {
    id: 'blood_frenzy',
    name: 'Frénésie sanguinaire',
    description: 'Le sang appelle le sang.',
    requires: { tags: { blood: 2 } },
    modifiers: [pct('strength', 25), flat('crit', 5)],
  },
  {
    id: 'paladin',
    name: 'Paladin',
    description: 'Un guerrier porté par le sacré.',
    requires: { class: ['warrior'], tags: { holy: 2 } },
    modifiers: [pct('hp', 20), flat('defense', 4)],
    passives: ['smite'],
  },
  {
    id: 'silent_warrior',
    name: 'Guerrier ascète',
    description: 'En renonçant à la magie, le guerrier se concentre sur son corps.',
    requires: { class: ['warrior'], ids: ['silence'] },
    modifiers: [pct('strength', 20), pct('hp', 15)],
  },
];
