import { describe, expect, it } from 'vitest';
import { evaluateBuild } from '../engine/build';
import { simulateCombat } from '../engine/combat';
import { STAT_KEYS, type Build } from '../engine/types';
import { battleData, gameData } from './index';
import { STAT_DESCRIPTIONS } from './stats';

const { classes, blessings, curses, synergies, passives, tagLabels } = gameData;
const sources = [...classes, ...blessings, ...curses, ...(gameData.equipment ?? [])];

// Ces tests vérifient que le contenu est cohérent. Ils attrapent les fautes de frappe
// quand on ajoute une classe, un passif ou une synergie.
describe('contenu du jeu', () => {
  it('a des identifiants uniques', () => {
    const ids = [...sources, ...synergies].map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const passiveIds = passives.map((p) => p.id);
    expect(new Set(passiveIds).size).toBe(passiveIds.length);
  });

  it('a un nom affiché pour chaque tag utilisé', () => {
    const used = new Set([
      ...sources.flatMap((s) => s.tags),
      ...passives.flatMap((p) => p.tags ?? []),
      ...synergies.flatMap((s) => Object.keys(s.requires.tags ?? {})),
    ]);
    expect([...used].filter((tag) => !(tag in tagLabels))).toEqual([]);
  });

  it('a des synergies qui pointent vers du contenu existant', () => {
    const ids = new Set(sources.map((s) => s.id));
    for (const synergy of synergies) {
      for (const id of synergy.requires.class ?? []) expect(classes.map((c) => c.id)).toContain(id);
      for (const id of synergy.requires.ids ?? []) expect(ids.has(id), `${synergy.id} → ${id}`).toBe(true);
    }
  });

  it('a des références de passifs valides', () => {
    const ids = passives.map((p) => p.id);
    const refs = [
      ...sources.flatMap((s) => s.passives ?? []),
      ...synergies.flatMap((s) => [...(s.passives ?? []), ...(s.requires.passives ?? [])]),
    ];
    expect(refs.filter((id) => !ids.includes(id))).toEqual([]);
  });

  it('a des compétences et des monstres qui pointent vers du contenu existant', () => {
    const skillIds = battleData.skills.map((s) => s.id);
    expect(new Set(skillIds).size).toBe(skillIds.length);
    const refs = [...sources, ...synergies].flatMap((s) => s.skills ?? []);
    expect(refs.filter((id) => !skillIds.includes(id))).toEqual([]);
    const passiveIds = passives.map((p) => p.id);
    for (const m of battleData.monsters) {
      for (const id of [...m.skills, ...m.ai.map((r) => r.skill)]) expect(skillIds, `${m.id} → ${id}`).toContain(id);
      for (const id of m.passives ?? []) expect(passiveIds, `${m.id} → ${id}`).toContain(id);
      for (const tag of m.tags) expect(tagLabels[tag], `${m.id} → tag ${tag}`).toBeTruthy();
      expect(m.ai.length, `${m.id} doit avoir au moins une règle d’IA`).toBeGreaterThan(0);
    }
  });

  it('n’utilise que des stats connues, toutes décrites', () => {
    for (const s of [...sources, ...synergies]) {
      for (const m of s.modifiers) expect(STAT_KEYS).toContain(m.stat);
    }
    for (const key of STAT_KEYS) expect(STAT_DESCRIPTIONS[key]).toBeTruthy();
  });
});

const build = (overrides: Partial<Build>): Build => ({
  classId: 'mage',
  blessingIds: [],
  curseIds: [],
  traitIds: [],
  ...overrides,
});

const run = (b: Build) => {
  const result = evaluateBuild(b, gameData);
  expect(result.errors).toEqual([]);
  return result;
};
const activeIds = (b: Build) => run(b).activeSynergies.map((s) => s.synergy.id);
const passiveIds = (b: Build) => run(b).passives.map((g) => g.passive.id);

describe('styles de combat', () => {
  const fireMage = (overrides: Partial<Build> = {}) => build({ traitIds: ['flame'], blessingIds: ['sun_blessing'], ...overrides });

  it('Mage de feu : Flamme + Bénédiction solaire activent Pyromancien', () => {
    expect(activeIds(fireMage())).toContain('pyromancer');
    expect(passiveIds(fireMage())).toContain('ignite');
  });

  it('Style Brûlure : Âme consumée débloque Bûcher', () => {
    expect(passiveIds(fireMage({ curseIds: ['consumed_soul'] }))).toContain('blaze');
  });

  it('Style Explosion : Combustion débloque Artificier', () => {
    expect(passiveIds(fireMage({ traitIds: ['flame', 'combustion'] }))).toContain('chain_reaction');
  });

  it('Style Plasma : Flamme + Surcharge arcanique débloquent Tisseur de plasma', () => {
    expect(passiveIds(fireMage({ traitIds: ['flame', 'arcane_surge'] }))).toContain('plasma');
  });

  it('Éclipse : 3 Ombre et 3 Sacré', () => {
    const eclipse = build({
      classId: 'rogue',
      blessingIds: ['sun_blessing', 'war_god_blessing'],
      curseIds: ['shadow_mark'],
      traitIds: ['shadow_veil', 'holy_light'],
    });
    expect(activeIds(eclipse)).toEqual(expect.arrayContaining(['eclipse', 'shadow_blade']));
  });

  it('chaque style de feu fait plus de dégâts que le mage de feu de base', () => {
    const base = simulateCombat(run(fireMage()))!.total;
    const styles = [
      fireMage({ curseIds: ['consumed_soul'] }),
      fireMage({ traitIds: ['flame', 'combustion'] }),
      fireMage({ traitIds: ['flame', 'arcane_surge'] }),
    ];
    for (const s of styles) expect(simulateCombat(run(s))!.total).toBeGreaterThan(base);
  });
});
