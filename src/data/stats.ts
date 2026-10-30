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
