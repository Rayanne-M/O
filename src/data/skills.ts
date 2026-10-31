import { BASIC_SKILLS } from '../engine/battle';
import type { Skill } from '../engine/types';

// Les compétences de combat. Une compétence est accordée par une classe, une bénédiction,
// une malédiction ou une synergie (champ "skills"), ou appartient à un monstre.
// Les actions de base (Attaque, Se protéger, Fuir, Attendre) viennent du moteur.
// Les dégâts sont en % de la stat d'attaque : 100 = une attaque normale.
export const skills: Skill[] = [
  ...BASIC_SKILLS,

  // ---------- Héros ----------
  {
    id: 'arcane_bolt',
    name: 'Trait de mana',
    description: 'Un projectile de mana pur : 160 % de dégâts.',
    cost: 8,
    target: 'enemy',
    effects: [{ type: 'damage', percent: 160 }],
  },
  {
    id: 'fireball',
    name: 'Boule de feu',
    description: 'Une boule de feu : 130 % de dégâts de feu et 2 charges de brûlure.',
    cost: 12,
    target: 'enemy',
    effects: [{ type: 'damage', percent: 130, element: 'fire' }, { type: 'burn', stacks: 2 }],
  },
  {
    id: 'heavy_strike',
    name: 'Frappe lourde',
    description: 'Un coup de toutes ses forces : 180 % de dégâts.',
    cost: 6,
    target: 'enemy',
    effects: [{ type: 'damage', percent: 180 }],
  },
  {
    id: 'war_cry',
    name: 'Cri de guerre',
    description: '+30 % de Force pendant 3 tours.',
    cost: 5,
    target: 'self',
    effects: [{ type: 'buff', stat: 'strength', percent: 30, turns: 3 }],
  },
  {
    id: 'twin_strike',
    name: 'Double frappe',
    description: 'Deux coups rapides à 65 %. Chaque coup remplit la jauge de critique.',
    cost: 5,
    target: 'enemy',
    effects: [{ type: 'damage', percent: 65, hits: 2 }],
  },
  {
    id: 'sun_prayer',
    name: 'Prière solaire',
    description: 'Rend 25 % de la vie.',
    cost: 10,
    target: 'self',
    effects: [{ type: 'heal', percent: 25 }],
  },

  // ---------- Objets ----------
  {
    id: 'snip',
    name: 'Couper',
    description: 'Un coup de ciseaux : 110 % de dégâts, deux fois plus contre les cheveux.',
    target: 'enemy',
    effects: [{ type: 'damage', percent: 110, element: 'physical', vsTags: { cheveux: 100 } }],
  },
  {
    id: 'stick_swing',
    name: 'Coup de bâton',
    description: 'Un grand coup de bâton : 130 % de dégâts.',
    cost: 3,
    target: 'enemy',
    effects: [{ type: 'damage', percent: 130, element: 'physical' }],
  },

  // ---------- Monstres ----------
  {
    id: 'hair_lash',
    name: 'Coup de mèche',
    description: 'Une mèche mouillée fouette la cible.',
    target: 'enemy',
    effects: [{ type: 'damage', percent: 100 }],
  },
  {
    id: 'hair_grab',
    name: 'Saisie',
    description: 'Les cheveux s’enroulent et serrent : 150 % de dégâts.',
    target: 'enemy',
    effects: [{ type: 'damage', percent: 150 }],
  },
  {
    id: 'regrow',
    name: 'Repousse',
    description: 'Les mèches coupées repoussent : rend 20 % de la vie.',
    target: 'self',
    effects: [{ type: 'heal', percent: 20 }],
  },
  {
    id: 'bite',
    name: 'Morsure',
    description: 'Des crochets qui piquent.',
    target: 'enemy',
    effects: [{ type: 'damage', percent: 100 }],
  },
  {
    id: 'coin_toss',
    name: 'Pièce d’or',
    description: 'Une pièce lancée très fort, deux fois.',
    target: 'enemy',
    effects: [{ type: 'damage', percent: 60, hits: 2 }],
  },
  {
    id: 'rainbow_escape',
    name: 'Fuite par l’arc-en-ciel',
    description: 'Il glisse sur un arc-en-ciel et disparaît.',
    target: 'self',
    effects: [{ type: 'flee' }],
  },
];
