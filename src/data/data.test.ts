import { describe, expect, it } from 'vitest';
import { evaluateBuild } from '../engine/build';
import { simulateCombat } from '../engine/combat';
import { STAT_KEYS, type Build } from '../engine/types';
import { gameData } from './index';

const { races, classes, equipment, blessings, curses, synergies, tagLabels } = gameData;
const sources = [...races, ...classes, ...equipment, ...blessings, ...curses];

// Ces tests vérifient que le contenu est cohérent. Ils attrapent les fautes de frappe
// quand on ajoute une race, un objet ou une synergie.
describe('contenu du jeu', () => {
  it('a des identifiants uniques', () => {
    const ids = [...sources, ...synergies].map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('a un nom affiché pour chaque tag utilisé', () => {
    const used = new Set([...sources.flatMap((s) => s.tags), ...synergies.flatMap((s) => Object.keys(s.requires.tags ?? {}))]);
    const missing = [...used].filter((tag) => !(tag in tagLabels));
    expect(missing).toEqual([]);
  });

  it('a des synergies qui pointent vers du contenu existant', () => {
    const ids = new Set(sources.map((s) => s.id));
    for (const synergy of synergies) {
      for (const id of synergy.requires.race ?? []) expect(races.map((r) => r.id)).toContain(id);
      for (const id of synergy.requires.class ?? []) expect(classes.map((c) => c.id)).toContain(id);
      for (const id of synergy.requires.ids ?? []) expect(ids.has(id), `${synergy.id} → ${id}`).toBe(true);
    }
  });

  it('a des objets réservés à des classes existantes', () => {
    for (const item of equipment) {
      for (const id of item.allowedClasses ?? []) expect(classes.map((c) => c.id)).toContain(id);
    }
  });

  it('n’utilise que des stats connues', () => {
    for (const s of [...sources, ...synergies]) {
      for (const m of s.modifiers) expect(STAT_KEYS).toContain(m.stat);
    }
  });
});

// Quelques builds d'exemple qui doivent activer leurs synergies.
describe('builds d’exemple', () => {
  const active = (build: Build) => {
    const result = evaluateBuild(build, gameData);
    expect(result.errors).toEqual([]);
    return result.activeSynergies.map((s) => s.synergy.id);
  };

  it('Mage elfe de feu : Pyromancien + Arcaniste', () => {
    const ids = active({
      raceId: 'elf',
      classId: 'mage',
      equipment: { weapon: 'ember_staff', armor: 'arcane_robe', trinket: 'ember_ring' },
      blessingIds: [],
      curseIds: [],
    });
    expect(ids).toContain('pyromancer');
    expect(ids).toContain('arcanist');
  });

  it('Guerrier orc maudit par le sang : Frénésie sanguinaire', () => {
    const ids = active({
      raceId: 'orc',
      classId: 'warrior',
      equipment: { weapon: 'greatsword', armor: 'plate_armor' },
      blessingIds: ['war_god_blessing', 'sun_blessing'],
      curseIds: ['blood_curse'],
    });
    expect(ids).toEqual(expect.arrayContaining(['blood_frenzy', 'bulwark', 'paladin']));
  });

  it('Roublard marqué par l’ombre : Lame de l’ombre', () => {
    const ids = active({
      raceId: 'human',
      classId: 'rogue',
      equipment: { weapon: 'twin_daggers' },
      blessingIds: [],
      curseIds: ['shadow_mark'],
    });
    expect(ids).toContain('shadow_blade');
  });
});

describe('passifs et styles de combat', () => {
  const fireMage = (trinket: string, curseIds: string[] = [], raceId = 'human') =>
    evaluateBuild(
      { raceId, classId: 'mage', equipment: { weapon: 'ember_staff', armor: 'arcane_robe', trinket }, blessingIds: [], curseIds },
      gameData,
    );
  const passiveIds = (r: ReturnType<typeof evaluateBuild>) => r.passives.map((g) => g.passive.id);

  it('a des passifs aux identifiants uniques et tous référencés correctement', () => {
    const ids = gameData.passives.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const refs = [
      ...sources.flatMap((s) => s.passives ?? []),
      ...synergies.flatMap((s) => [...(s.passives ?? []), ...(s.requires.passives ?? [])]),
    ];
    expect(refs.filter((id) => !ids.includes(id))).toEqual([]);
  });

  it('Style Brûlure : Âme consumée débloque Bûcher', () => {
    const r = fireMage('ember_ring', ['consumed_soul']);
    expect(passiveIds(r)).toEqual(expect.arrayContaining(['flame', 'ignite', 'inner_fire', 'blaze']));
  });

  it('Style Explosion : Cœur d’ignition débloque Artificier', () => {
    const r = fireMage('ignition_core');
    expect(passiveIds(r)).toEqual(expect.arrayContaining(['ignite', 'combustion', 'chain_reaction']));
  });

  it('Style Plasma : un elfe mage avec bâton et robe atteint 4 Arcane', () => {
    const r = fireMage('ember_ring', [], 'elf');
    expect(passiveIds(r)).toContain('plasma');
  });

  it('Éclipse : 3 Ombre et 3 Sacré', () => {
    const r = evaluateBuild(
      {
        raceId: 'human',
        classId: 'rogue',
        equipment: { weapon: 'twin_daggers', trinket: 'holy_pendant' },
        blessingIds: ['sun_blessing', 'war_god_blessing'],
        curseIds: ['shadow_mark'],
      },
      gameData,
    );
    expect(r.errors).toEqual([]);
    expect(r.activeSynergies.map((s) => s.synergy.id)).toContain('eclipse');
  });

  it('chaque style de feu fait plus de dégâts que le mage de feu de base', () => {
    const base = simulateCombat(fireMage('oak_charm'))!.total;
    for (const r of [fireMage('ember_ring', ['consumed_soul']), fireMage('ignition_core'), fireMage('ember_ring', [], 'elf')]) {
      expect(simulateCombat(r)!.total).toBeGreaterThan(base);
    }
  });
});
