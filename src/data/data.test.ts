import { describe, expect, it } from 'vitest';
import { evaluateBuild } from '../engine/build';
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
