import { describe, expect, it } from 'vitest';
import { evaluateBuild, maxBlessings } from './build';
import type { Build, GameData } from './types';

// Petit jeu de données inventé pour tester le moteur sans dépendre du vrai contenu.
const data: GameData = {
  baseStats: { hp: 50, mana: 0, strength: 5, agility: 5, intelligence: 5, defense: 0, crit: 0, speed: 10 },
  races: [{ id: 'r', name: 'Race', description: '', tags: ['fire'], modifiers: [{ stat: 'hp', type: 'flat', value: 10 }] }],
  classes: [
    { id: 'c', name: 'Classe', description: '', tags: [], modifiers: [] },
    { id: 'c2', name: 'Autre classe', description: '', tags: [], modifiers: [] },
  ],
  equipment: [
    {
      id: 'sword',
      slot: 'weapon',
      name: 'Épée',
      description: '',
      tags: ['fire', 'fire'],
      modifiers: [{ stat: 'strength', type: 'flat', value: 5 }],
      allowedClasses: ['c'],
    },
  ],
  blessings: [
    { id: 'b1', name: 'B1', description: '', tags: [], modifiers: [] },
    { id: 'b2', name: 'B2', description: '', tags: [], modifiers: [] },
  ],
  curses: [{ id: 'k1', name: 'K1', description: '', tags: ['fire'], modifiers: [] }],
  synergies: [
    {
      id: 'burn',
      name: 'Brûlure',
      description: '',
      requires: { class: ['c'], tags: { fire: 3 } },
      modifiers: [{ stat: 'strength', type: 'percent', value: 100 }],
    },
  ],
  tagLabels: { fire: 'Feu' },
};

const build = (overrides: Partial<Build> = {}): Build => ({
  raceId: 'r',
  classId: 'c',
  equipment: {},
  blessingIds: [],
  curseIds: [],
  ...overrides,
});

describe('evaluateBuild', () => {
  it('additionne les modificateurs de toutes les sources', () => {
    const result = evaluateBuild(build({ equipment: { weapon: 'sword' } }), data);
    expect(result.stats.hp.total).toBe(60);
    expect(result.stats.strength.total).toBe(10);
    expect(result.errors).toEqual([]);
  });

  it('compte chaque tag une seule fois par élément', () => {
    const result = evaluateBuild(build({ equipment: { weapon: 'sword' } }), data);
    expect(result.tagCounts.get('fire')).toBe(2);
  });

  it('active une synergie quand toutes ses conditions sont remplies et applique son bonus', () => {
    const result = evaluateBuild(build({ equipment: { weapon: 'sword' }, curseIds: ['k1'] }), data);
    expect(result.activeSynergies.map((s) => s.synergy.id)).toEqual(['burn']);
    // (5 + 5) × 2 = 20
    expect(result.stats.strength.total).toBe(20);
  });

  it('indique ce qui manque pour une synergie inactive', () => {
    const result = evaluateBuild(build({ equipment: { weapon: 'sword' } }), data);
    const burn = result.synergies.find((s) => s.synergy.id === 'burn')!;
    expect(burn.active).toBe(false);
    expect(burn.missing).toEqual(['Feu : 2/3']);
    expect(burn.gap).toBe(1);
  });

  it('refuse un objet interdit à la classe', () => {
    const result = evaluateBuild(build({ classId: 'c2', equipment: { weapon: 'sword' } }), data);
    expect(result.errors).toContain('Épée ne peut pas être porté par cette classe.');
  });

  it('refuse un objet dans le mauvais emplacement', () => {
    const result = evaluateBuild(build({ equipment: { armor: 'sword' } }), data);
    expect(result.errors).toContain('Épée ne va pas dans cet emplacement.');
  });

  it('signale les identifiants inconnus', () => {
    const result = evaluateBuild(build({ raceId: 'nope' }), data);
    expect(result.errors).toContain('Race inconnu(e) : nope');
  });

  it('limite les bénédictions : 1 gratuite, +1 par malédiction', () => {
    expect(maxBlessings(0)).toBe(1);
    expect(evaluateBuild(build({ blessingIds: ['b1', 'b2'] }), data).errors).toHaveLength(1);
    expect(evaluateBuild(build({ blessingIds: ['b1', 'b2'], curseIds: ['k1'] }), data).errors).toEqual([]);
  });
});
