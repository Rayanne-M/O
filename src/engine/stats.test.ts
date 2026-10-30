import { describe, expect, it } from 'vitest';
import { computeStats, type Contribution } from './stats';
import type { Modifier, Stats } from './types';

const base: Stats = { hp: 100, mana: 10, strength: 10, agility: 0, intelligence: 0, defense: 10, crit: 50, speed: 0 };

const from = (...modifiers: Modifier[]): Contribution[] =>
  modifiers.map((modifier, i) => ({ sourceId: `s${i}`, sourceName: `Source ${i}`, kind: 'blessing', modifier }));

describe('computeStats', () => {
  it('garde les stats de base sans modificateur', () => {
    expect(computeStats(base, []).strength.total).toBe(10);
  });

  it('ajoute les bonus fixes avant les pourcentages', () => {
    const stats = computeStats(
      base,
      from({ stat: 'strength', type: 'flat', value: 10 }, { stat: 'strength', type: 'percent', value: 50 }),
    );
    // (10 + 10) × 1,5 = 30
    expect(stats.strength.total).toBe(30);
  });

  it('additionne les pourcentages entre eux', () => {
    const stats = computeStats(
      base,
      from({ stat: 'hp', type: 'percent', value: 10 }, { stat: 'hp', type: 'percent', value: 20 }),
    );
    expect(stats.hp.percent).toBe(30);
    expect(stats.hp.total).toBe(130);
  });

  it('applique les limites (vie ≥ 1, critique ≤ 100, autres ≥ 0)', () => {
    const stats = computeStats(
      base,
      from(
        { stat: 'hp', type: 'flat', value: -500 },
        { stat: 'crit', type: 'flat', value: 80 },
        { stat: 'defense', type: 'flat', value: -50 },
      ),
    );
    expect(stats.hp.total).toBe(1);
    expect(stats.crit.total).toBe(100);
    expect(stats.defense.total).toBe(0);
  });

  it('garde la trace de chaque contribution', () => {
    const stats = computeStats(base, from({ stat: 'mana', type: 'flat', value: 5 }));
    expect(stats.mana.contributions).toHaveLength(1);
    expect(stats.mana.contributions[0].sourceName).toBe('Source 0');
    expect(stats.hp.contributions).toHaveLength(0);
  });
});
