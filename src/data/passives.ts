import type { Passive } from '../engine/types';

// Les passifs changent la façon de combattre. Ils sont accordés par les éléments du build
// (champ "passives") ou par des synergies, et certaines synergies demandent des passifs précis.
// Dans l'atelier, tous les passifs sont aussi disponibles comme « traits » à cocher librement :
// c'est l'endroit où noter une idée de passif avant de l'attribuer à une classe ou une compétence.
// Les tags d'un passif ne comptent que s'il est choisi comme trait.
export const passives: Passive[] = [
  // Mage de feu : la base
  {
    id: 'flame',
    name: 'Flamme',
    description: 'Tes attaques deviennent des attaques de feu.',
    tags: ['fire'],
    effects: [{ type: 'convert', element: 'fire' }],
  },
  {
    id: 'ignite',
    name: 'Brûlure',
    description: 'Chaque attaque de feu pose 1 charge de brûlure (3 tours).',
    tags: ['fire'],
    effects: [{ type: 'applyBurn', stacks: 1, element: 'fire' }],
  },
  // Style Brûlure : beaucoup de charges qui durent
  {
    id: 'inner_fire',
    name: 'Feu intérieur',
    description: 'Les brûlures infligent +40 % de dégâts.',
    tags: ['fire'],
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
    tags: ['fire'],
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
    id: 'arcane_surge',
    name: 'Surcharge arcanique',
    description: 'Tes attaques infligent +15 % de dégâts.',
    tags: ['arcane'],
    effects: [{ type: 'damageBonus', percent: 15 }],
  },
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
    tags: ['martial'],
    effects: [{ type: 'damageBonus', percent: 15, element: 'physical' }],
  },
  {
    id: 'blood_thirst',
    name: 'Soif de sang',
    description: 'Les attaques physiques infligent +10 % de dégâts.',
    tags: ['blood'],
    effects: [{ type: 'damageBonus', percent: 10, element: 'physical' }],
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
    id: 'shadow_veil',
    name: 'Voile d’ombre',
    description: 'Les coups critiques infligent +20 % de dégâts.',
    tags: ['shadow'],
    effects: [{ type: 'critDamage', percent: 20 }],
  },
  {
    id: 'holy_light',
    name: 'Lumière sacrée',
    description: 'Les attaques sacrées infligent +15 % de dégâts.',
    tags: ['holy'],
    effects: [{ type: 'damageBonus', percent: 15, element: 'holy' }],
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
  // Pactes et traits venus de l'histoire (même nom que dans l'enfance, pour les relier)
  {
    id: 'living_hair',
    name: 'Cheveux vivants',
    description:
      'Pacte de l’Esprit du puits : après chaque attaque, tes cheveux frappent aussi (jusqu’à 60 % de dégâts d’ombre). Plus ils sont longs, plus ils frappent fort ; rasés, le pacte dort.',
    tags: ['pact', 'shadow'],
    effects: [{ type: 'extraStrike', name: 'Coup de cheveux', percent: 60, element: 'shadow', scaleWith: 'hair' }],
  },
  {
    id: 'rainbow_belly',
    name: 'Ventre d’arc-en-ciel',
    description: 'Pacte de Giorgio : une fois par combat, tu glisses sur un arc-en-ciel hors d’une attaque.',
    tags: ['pact'],
    effects: [{ type: 'evade', charges: 1, name: 'Arc-en-ciel' }],
  },
  {
    id: 'cautious',
    name: 'Prudent',
    description: 'La peur rend attentif : -25 % de dégâts reçus des créatures dont tu as peur.',
    effects: [{ type: 'fearGuard', percent: 25 }],
  },
  // Monstres
  {
    id: 'hair_regrowth',
    name: 'Repousse',
    description: 'À la fin de chacun de ses tours, rend 5 % de sa vie, sauf si on vient de la couper net.',
    effects: [{ type: 'regen', percent: 5 }],
  },
];
