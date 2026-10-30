import type { Passive } from '../engine/types';

// Les passifs changent la façon de combattre. Ils sont accordés par les éléments du build
// (champ "passives") ou par des synergies, et certaines synergies demandent des passifs précis.
export const passives: Passive[] = [
  // Mage de feu : la base
  {
    id: 'flame',
    name: 'Flamme',
    description: 'Tes attaques deviennent des attaques de feu.',
    effects: [{ type: 'convert', element: 'fire' }],
  },
  {
    id: 'ignite',
    name: 'Brûlure',
    description: 'Chaque attaque de feu pose 1 charge de brûlure (3 tours).',
    effects: [{ type: 'applyBurn', stacks: 1, element: 'fire' }],
  },
  // Style Brûlure : beaucoup de charges qui durent
  {
    id: 'inner_fire',
    name: 'Feu intérieur',
    description: 'Les brûlures infligent +40 % de dégâts.',
    effects: [{ type: 'burnBonus', percent: 40 }],
  },
  {
    id: 'blaze',
    name: 'Brasier',
    description: 'Chaque attaque de feu pose 1 charge de brûlure de plus.',
    effects: [{ type: 'applyBurn', stacks: 1, element: 'fire' }],
  },
  // Style Explosion : accumuler puis tout faire sauter
  {
    id: 'combustion',
    name: 'Combustion',
    description: 'À 3 charges de brûlure, elles explosent : 100 % des dégâts qu’il leur restait, d’un coup.',
    effects: [{ type: 'detonate', threshold: 3, percent: 100 }],
  },
  {
    id: 'chain_reaction',
    name: 'Réaction en chaîne',
    description: 'Après une explosion, la cible reçoit 2 nouvelles charges de brûlure.',
    effects: [{ type: 'afterDetonate', burnStacks: 2 }],
  },
  // Style Plasma : le feu chargé d'arcane traverse les armures
  {
    id: 'plasma',
    name: 'Plasma',
    description: 'Les attaques de feu ignorent toute la défense et infligent +25 % de dégâts.',
    effects: [
      { type: 'pierce', percent: 100, element: 'fire' },
      { type: 'damageBonus', percent: 25, element: 'fire' },
    ],
  },
  // Autres classes
  {
    id: 'heavy_blows',
    name: 'Coups lourds',
    description: 'Les attaques physiques infligent +15 % de dégâts.',
    effects: [{ type: 'damageBonus', percent: 15, element: 'physical' }],
  },
  {
    id: 'sharp_blades',
    name: 'Lames affûtées',
    description: 'Les coups critiques infligent +40 % de dégâts.',
    effects: [{ type: 'critDamage', percent: 40 }],
  },
  {
    id: 'assassinate',
    name: 'Assassinat',
    description: 'Les coups critiques infligent +60 % de dégâts.',
    effects: [{ type: 'critDamage', percent: 60 }],
  },
  {
    id: 'smite',
    name: 'Châtiment',
    description: 'Tes attaques deviennent sacrées et infligent +20 % de dégâts.',
    effects: [
      { type: 'convert', element: 'holy' },
      { type: 'damageBonus', percent: 20, element: 'holy' },
    ],
  },
  {
    id: 'eclipse_power',
    name: 'Éclipse',
    description: 'Ni lumière ni ombre ne t’arrêtent : +30 % de dégâts et la moitié de la défense ignorée.',
    effects: [
      { type: 'damageBonus', percent: 30 },
      { type: 'pierce', percent: 50 },
    ],
  },
];
