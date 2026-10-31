import { describe, expect, it } from 'vitest';
import type { BuildResult } from './build';
import { simulateCombat } from './combat';
import { computeStats } from './stats';
import type { Passive, PassiveEffect, Stats } from './types';

const stats = (overrides: Partial<Stats> = {}) =>
  computeStats({ hp: 50, mana: 0, strength: 20, agility: 0, intelligence: 20, defense: 0, crit: 0, speed: 10, ...overrides }, []);

// Construit un faux résultat de build avec seulement ce dont le combat a besoin.
const fighter = (effects: PassiveEffect[], statOverrides: Partial<Stats> = {}): BuildResult => {
  const passive: Passive = { id: 'test', name: 'Test', description: '', effects };
  return {
    stats: stats(statOverrides),
    tagCounts: new Map(),
    synergies: [],
    activeSynergies: [],
    passives: [{ passive, sourceName: 'Test' }],
    skills: [],
    attack: { stat: 'intelligence', element: 'arcane' },
    errors: [],
  };
};

const run = (effects: PassiveEffect[], statOverrides: Partial<Stats> = {}, turns = 3) =>
  simulateCombat(fighter(effects, statOverrides), { turns, targetDefense: 10 })!;

describe('simulateCombat', () => {
  it('retire la défense de la cible à chaque coup', () => {
    const r = run([]);
    expect(r.events.map((e) => e.damage)).toEqual([10, 10, 10]);
    expect(r.total).toBe(30);
  });

  it('fait un coup critique quand la jauge atteint 100 %', () => {
    const r = run([], { crit: 50 }, 4);
    expect(r.events.map((e) => e.kind)).toEqual(['hit', 'crit', 'hit', 'crit']);
    // (20 − 10) × 1,5
    expect(r.events[1].damage).toBe(15);
  });

  it('change l’élément et ignore la défense', () => {
    const r = run([{ type: 'convert', element: 'fire' }, { type: 'pierce', percent: 100, element: 'fire' }]);
    expect(r.element).toBe('fire');
    expect(r.events[0].damage).toBe(20);
  });

  it('n’applique pas un bonus réservé à un autre élément', () => {
    const r = run([{ type: 'damageBonus', percent: 100, element: 'fire' }]);
    expect(r.events[0].damage).toBe(10);
  });

  it('accumule les brûlures, qui durent 3 tours', () => {
    const r = run([{ type: 'applyBurn', stacks: 1 }], {}, 4);
    // Une charge = 15 % de 20 = 3 par tour. Au tour 4, la première charge est terminée.
    expect(r.events.filter((e) => e.kind === 'burn').map((e) => e.damage)).toEqual([3, 6, 9, 9]);
  });

  it('fait exploser les brûlures au seuil puis en repose avec la réaction en chaîne', () => {
    const r = run(
      [
        { type: 'applyBurn', stacks: 1 },
        { type: 'detonate', threshold: 3, percent: 100 },
        { type: 'afterDetonate', burnStacks: 2 },
      ],
      {},
      3,
    );
    const explosion = r.events.find((e) => e.kind === 'explosion')!;
    expect(explosion.turn).toBe(3);
    // Charges restantes au tour 3 : 1 + 2 + 3 tours = 6 tics de 3.
    expect(explosion.damage).toBe(18);
    expect(r.events.at(-1)!.text).toBe('Brûlure ×2 : 6');
  });
});
