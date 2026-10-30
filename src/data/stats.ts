import type { StatKey, Stats } from '../engine/types';

/** Stats de départ de tout personnage, avant race, classe et le reste. */
export const baseStats: Stats = {
  hp: 50,
  mana: 20,
  strength: 5,
  agility: 5,
  intelligence: 5,
  defense: 2,
  crit: 5,
  speed: 10,
};

export const STAT_LABELS: Record<StatKey, string> = {
  hp: 'Vie',
  mana: 'Mana',
  strength: 'Force',
  agility: 'Agilité',
  intelligence: 'Intelligence',
  defense: 'Défense',
  crit: 'Critique (%)',
  speed: 'Vitesse',
};

/** Ce que fait chaque stat, affiché au survol dans l'atelier. */
export const STAT_DESCRIPTIONS: Record<StatKey, string> = {
  hp: 'Points de vie. À 0, le personnage tombe. Pas encore utilisé par le combat d’entraînement.',
  mana: 'Réserve d’énergie pour les sorts et compétences. Pas encore utilisé par le combat d’entraînement.',
  strength: 'Puissance physique. Fait les dégâts du Guerrier (dégâts d’un coup = Force).',
  agility: 'Adresse et précision. Fait les dégâts du Roublard (dégâts d’un coup = Agilité).',
  intelligence: 'Maîtrise de la magie. Fait les dégâts du Mage (dégâts d’un coup = Intelligence). Les brûlures valent 15 % de la stat d’attaque par tour.',
  defense: 'Réduit chaque coup reçu d’autant de points. Le mannequin d’entraînement a 5 de défense.',
  crit: 'Chance de coup critique. Une jauge se remplit de cette valeur à chaque coup : à 100 %, le coup est critique (+50 % de dégâts de base).',
  speed: 'Rapidité d’action, qui décidera de l’ordre des tours. Pas encore utilisé par le combat d’entraînement.',
};
