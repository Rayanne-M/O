import type { Monster } from '../engine/types';

// Le bestiaire en combat. Les tags d'un monstre se comparent aux peurs du héros
// (mêmes mots que les peurs de l'enfance : « araignees », « cheveux », « eau »...).
// resist : 50 = moitié moins de dégâts de cet élément, -50 = moitié plus (faiblesse).
export const monsters: Monster[] = [
  {
    id: 'dummy',
    name: 'Mannequin',
    description: 'De la paille et un vieux sac. Il ne rend pas les coups.',
    tags: [],
    stats: { hp: 500, mana: 0, strength: 0, agility: 0, intelligence: 0, defense: 5, crit: 0, speed: 10 },
    attack: { stat: 'strength', element: 'physical' },
    skills: ['wait'],
    ai: [{ skill: 'wait' }],
  },
  {
    id: 'well_spirit',
    name: 'Esprit du puits',
    description:
      'L’esprit capillaire de la rancœur. Ses cheveux encaissent les coups mais brûlent très bien. Plus le village raconte sa légende, plus il est fort.',
    tags: ['cheveux', 'esprit'],
    stats: { hp: 140, mana: 0, strength: 12, agility: 0, intelligence: 0, defense: 4, crit: 0, speed: 9 },
    attack: { stat: 'strength', element: 'shadow' },
    resist: { physical: 25, shadow: 50, fire: -50, holy: -25 },
    skills: ['hair_lash', 'hair_grab', 'regrow'],
    ai: [
      { skill: 'regrow', hpBelow: 0.4, once: true },
      { skill: 'hair_grab', every: 3 },
      { skill: 'hair_lash' },
    ],
  },
  {
    id: 'giant_spider',
    name: 'Araignée géante',
    description: 'Rapide et nerveuse. Bien plus grosse pour qui en a peur.',
    tags: ['araignees'],
    stats: { hp: 70, mana: 0, strength: 9, agility: 0, intelligence: 0, defense: 2, crit: 10, speed: 14 },
    attack: { stat: 'strength', element: 'physical' },
    resist: { fire: -25 },
    skills: ['bite'],
    ai: [{ skill: 'bite' }],
  },
  {
    id: 'giorgio',
    name: 'Giorgio',
    description:
      'Le gardien du pied de l’arc-en-ciel. Il esquive le premier coup et s’enfuit par un arc-en-ciel quand il est en danger.',
    tags: ['fee'],
    stats: { hp: 90, mana: 0, strength: 0, agility: 8, intelligence: 0, defense: 3, crit: 15, speed: 16 },
    attack: { stat: 'agility', element: 'holy' },
    resist: { holy: 50 },
    skills: ['coin_toss', 'rainbow_escape'],
    passives: ['rainbow_belly'],
    ai: [{ skill: 'rainbow_escape', hpBelow: 0.35 }, { skill: 'coin_toss' }],
  },

  // ---------- Enfance ----------
  {
    id: 'grosse_rousse',
    name: 'La grosse rousse',
    description: 'La poule qui couve dans la grange. Elle pince. Premier combat : de quoi apprendre.',
    tags: ['poule'],
    stats: { hp: 16, mana: 0, strength: 4, agility: 0, intelligence: 0, defense: 0, crit: 0, speed: 9 },
    attack: { stat: 'strength', element: 'physical' },
    skills: ['peck', 'flap'],
    ai: [{ skill: 'flap', every: 3 }, { skill: 'peck' }],
  },
  {
    id: 'well_spirit_young',
    name: 'La Rancunière',
    description:
      'L’esprit capillaire du puits, la nuit où Élio disparaît. Elle grandit avec sa légende, ses cheveux repoussent '
      + 'sauf là où on les coupe net, elle entrave, et elle prépare une noyade qu’il faut interrompre ou encaisser.',
    tags: ['cheveux', 'esprit'],
    stats: { hp: 60, mana: 0, strength: 6, agility: 0, intelligence: 0, defense: 1, crit: 0, speed: 9 },
    growth: { hp: 5, strength: 1 },
    attack: { stat: 'strength', element: 'shadow' },
    resist: { shadow: 50, fire: -50 },
    skills: ['hair_lash', 'hair_bind', 'drown_charge', 'drown', 'whisper', 'emerge'],
    passives: ['hair_regrowth'],
    ai: [
      { skill: 'emerge', hpBelow: 0.5, once: true },
      { skill: 'whisper', once: true },
      { skill: 'drown_charge', every: 4 },
      { skill: 'hair_bind', every: 3 },
      { skill: 'hair_lash' },
    ],
  },
];
