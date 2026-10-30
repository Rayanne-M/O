import { STAT_KEYS, type Modifier, type SourceKind, type StatKey, type Stats } from './types';

/** Un modificateur avec l'élément qui l'a apporté, pour expliquer d'où vient chaque point. */
export interface Contribution {
  sourceId: string;
  sourceName: string;
  kind: SourceKind;
  modifier: Modifier;
}

export interface StatDetail {
  base: number;
  flat: number;
  percent: number;
  total: number;
  contributions: Contribution[];
}

export type StatBreakdown = Record<StatKey, StatDetail>;

/** Limites de chaque stat après calcul. */
const LIMITS: Partial<Record<StatKey, { min?: number; max?: number }>> = {
  hp: { min: 1 },
  crit: { max: 100 },
};

/**
 * Calcule les stats finales.
 * Formule : (base + somme des bonus fixes) × (1 + somme des pourcentages / 100), arrondi.
 * Les pourcentages s'additionnent entre eux (+10 % et +20 % donnent +30 %).
 */
export function computeStats(base: Stats, contributions: Contribution[]): StatBreakdown {
  const breakdown = {} as StatBreakdown;
  for (const stat of STAT_KEYS) {
    const own = contributions.filter((c) => c.modifier.stat === stat);
    const flat = sum(own.filter((c) => c.modifier.type === 'flat').map((c) => c.modifier.value));
    const percent = sum(own.filter((c) => c.modifier.type === 'percent').map((c) => c.modifier.value));
    const raw = Math.round((base[stat] + flat) * (1 + percent / 100));
    breakdown[stat] = { base: base[stat], flat, percent, total: clamp(stat, raw), contributions: own };
  }
  return breakdown;
}

function clamp(stat: StatKey, value: number): number {
  const { min = 0, max = Infinity } = LIMITS[stat] ?? {};
  return Math.min(max, Math.max(min, value));
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
