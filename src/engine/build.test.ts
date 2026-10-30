import { describe, expect, it } from 'vitest';
import { evaluateBuild, maxBlessings } from './build';
import type { Build, GameData } from './types';

// Petit jeu de données inventé pour tester le moteur sans dépendre du vrai contenu.
const data: GameData = {
  baseStats: { hp: 50, mana: 0, strength: 5, agility: 5, intelligence: 5, defense: 0, crit: 0, speed: 10 },
  classes: [
    {
      id: 'c',
      name: 'Classe',
      description: '',
      tags: ['fire'],
      modifiers: [{ stat: 'hp', type: 'flat', value: 10 }],
      attack: { stat: 'strength', element: 'physical' },
    },
    { id: 'c2', name: 'Autre classe', description: '', tags: [], modifiers: [], attack: { stat: 'strength', element: 'physical' } },
  ],
  blessings: [
    { id: 'b1', name: 'B1', description: '', tags: ['fire'], modifiers: [{ stat: 'strength', type: 'flat', value: 5 }] },
    { id: 'b2', name: 'B2', description: '', tags: [], modifiers: [] },
  ],
  curses: [{ id: 'k1', name: 'K1', description: '', tags: ['fire'], modifiers: [], passives: ['p1'] }],
  synergies: [
    {
      id: 'burn',
      name: 'Brûlure',
      description: '',
      requires: { class: ['c'], tags: { fire: 3 } },
      modifiers: [{ stat: 'strength', type: 'percent', value: 100 }],
      passives: ['p2'],
    },
    {
      id: 'chain',
      name: 'Chaîne',
      description: '',
      requires: { passives: ['p1', 'p2'] },
      modifiers: [],
      passives: ['p3'],
    },
  ],
  passives: [
    { id: 'p1', name: 'P1', description: '', effects: [] },
    { id: 'p2', name: 'P2', description: '', effects: [] },
    { id: 'p3', name: 'P3', description: '', effects: [] },
    { id: 'spark', name: 'Étincelle', description: '', effects: [], tags: ['fire'] },
  ],
  tagLabels: { fire: 'Feu' },
};

const build = (overrides: Partial<Build> = {}): Build => ({
  classId: 'c',
  blessingIds: [],
  curseIds: [],
  traitIds: [],
  ...overrides,
});

describe('evaluateBuild', () => {
  it('additionne les modificateurs de toutes les sources', () => {
    const result = evaluateBuild(build({ blessingIds: ['b1'] }), data);
    expect(result.stats.hp.total).toBe(60);
    expect(result.stats.strength.total).toBe(10);
    expect(result.errors).toEqual([]);
  });

  it('compte les tags de chaque élément', () => {
    const result = evaluateBuild(build({ blessingIds: ['b1'] }), data);
    expect(result.tagCounts.get('fire')).toBe(2);
  });

  it('active une synergie quand toutes ses conditions sont remplies et applique son bonus', () => {
    const result = evaluateBuild(build({ blessingIds: ['b1'], curseIds: ['k1'] }), data);
    expect(result.activeSynergies.map((s) => s.synergy.id)).toContain('burn');
    // (5 + 5) × 2 = 20
    expect(result.stats.strength.total).toBe(20);
  });

  it('indique ce qui manque pour une synergie inactive', () => {
    const result = evaluateBuild(build({ blessingIds: ['b1'] }), data);
    const burn = result.synergies.find((s) => s.synergy.id === 'burn')!;
    expect(burn.active).toBe(false);
    expect(burn.missing).toEqual(['Feu : 2/3']);
    expect(burn.gap).toBe(1);
  });

  it('rassemble les passifs des éléments et des synergies', () => {
    const result = evaluateBuild(build({ blessingIds: ['b1'], curseIds: ['k1'] }), data);
    expect(result.passives.map((g) => [g.passive.id, g.sourceName])).toEqual([
      ['p1', 'K1'],
      ['p2', 'Brûlure'],
      ['p3', 'Chaîne'],
    ]);
  });

  it('active une synergie qui demande un passif accordé par une autre synergie', () => {
    const withBurn = evaluateBuild(build({ blessingIds: ['b1'], curseIds: ['k1'] }), data);
    expect(withBurn.activeSynergies.map((s) => s.synergy.id)).toEqual(['burn', 'chain']);
    const without = evaluateBuild(build({ curseIds: ['k1'] }), data);
    expect(without.synergies.find((s) => s.synergy.id === 'chain')!.missing).toEqual(['Passif : P2']);
  });

  it('un trait donne son passif et compte ses tags', () => {
    const result = evaluateBuild(build({ blessingIds: ['b1'], traitIds: ['spark'] }), data);
    expect(result.passives.map((g) => [g.passive.id, g.sourceName])).toContainEqual(['spark', 'Trait']);
    expect(result.tagCounts.get('fire')).toBe(3);
    expect(result.activeSynergies.map((s) => s.synergy.id)).toContain('burn');
  });

  it('un trait peut remplir une condition de passif', () => {
    const result = evaluateBuild(build({ classId: 'c2', traitIds: ['p1', 'p2'] }), data);
    expect(result.activeSynergies.map((s) => s.synergy.id)).toEqual(['chain']);
  });

  it('signale les identifiants inconnus', () => {
    expect(evaluateBuild(build({ classId: 'nope' }), data).errors).toContain('Classe inconnu(e) : nope');
    expect(evaluateBuild(build({ traitIds: ['nope'] }), data).errors).toContain('Trait inconnu : nope');
  });

  it('limite les bénédictions : 1 gratuite, +1 par malédiction', () => {
    expect(maxBlessings(0)).toBe(1);
    expect(evaluateBuild(build({ blessingIds: ['b1', 'b2'] }), data).errors).toHaveLength(1);
    expect(evaluateBuild(build({ blessingIds: ['b1', 'b2'], curseIds: ['k1'] }), data).errors).toEqual([]);
  });
});
