import type { Equipment } from '../engine/types';
import { flat, pct } from './helpers';

// Les objets portés. Un par emplacement : arme (weapon), armure (armor), bijou (trinket).
// Comme les autres éléments du build, un objet donne des stats, des tags (qui comptent pour les synergies),
// des passifs et des compétences : c'est souvent l'arme qui ouvre une action en combat.
// Les objets de l'enfance gardent l'identifiant de l'histoire (« ciseaux », « baton », « ruban »),
// pour qu'un objet ramassé dans le village serve directement en combat.
export const equipment: Equipment[] = [
  {
    id: 'ciseaux',
    name: 'Ciseaux du barbier',
    description: 'Pris en cachette sur l’étagère du fond. Rien ne coupe mieux les cheveux.',
    slot: 'weapon',
    tags: [],
    modifiers: [flat('strength', 2), flat('agility', 2)],
    skills: ['snip'],
  },
  {
    id: 'baton',
    name: 'Bâton',
    description: 'Un bon bâton ramassé au bord du chemin.',
    slot: 'weapon',
    tags: ['martial'],
    modifiers: [flat('strength', 3)],
    skills: ['stick_swing'],
  },
  {
    id: 'ruban',
    name: 'Ruban bleu',
    description: 'Le ruban d’Élio. Le garder rassure.',
    slot: 'trinket',
    tags: ['esprit'],
    modifiers: [pct('hp', 10), flat('speed', 1)],
    passives: ['cautious'],
  },
  {
    id: 'ember_staff',
    name: 'Bâton de braise',
    description: 'Un bâton dont le bout ne s’éteint jamais. Compte comme Feu pour les synergies.',
    slot: 'weapon',
    tags: ['fire'],
    modifiers: [flat('intelligence', 4)],
    passives: ['flame'],
  },
  {
    id: 'chainmail',
    name: 'Cotte de mailles',
    description: 'Lourde mais solide.',
    slot: 'armor',
    tags: ['martial'],
    modifiers: [flat('defense', 4), flat('speed', -1)],
  },
];
