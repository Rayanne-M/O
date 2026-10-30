import { computeStats, type Contribution, type StatBreakdown } from './stats';
import { evaluateSynergy, type SynergyContext, type SynergyStatus } from './synergy';
import {
  EQUIPMENT_SLOTS,
  type Build,
  type Equipment,
  type CharacterClass,
  type GameData,
  type Passive,
  type Source,
  type SourceKind,
  type Tag,
} from './types';

/** Nombre maximum de malédictions sur un personnage. */
export const MAX_CURSES = 3;

/**
 * Règle d'équilibre : chaque personnage a 1 bénédiction gratuite,
 * et chaque malédiction acceptée permet d'en prendre une de plus.
 */
export function maxBlessings(curseCount: number): number {
  return 1 + curseCount;
}

export interface BuildResult {
  stats: StatBreakdown;
  tagCounts: Map<Tag, number>;
  synergies: SynergyStatus[];
  activeSynergies: SynergyStatus[];
  /** Passifs obtenus, avec l'élément du build qui les accorde. */
  passives: PassiveGrant[];
  /** Attaque de base de la classe (absente si la classe est inconnue). */
  attack: CharacterClass['attack'] | null;
  /** Problèmes qui rendent le build invalide (objet interdit, trop de bénédictions...). */
  errors: string[];
}

export interface PassiveGrant {
  passive: Passive;
  sourceName: string;
}

interface ResolvedSource {
  source: Source;
  kind: SourceKind;
}

/** Calcule tout ce qui découle d'un build : stats, tags, synergies et erreurs. */
export function evaluateBuild(build: Build, data: GameData): BuildResult {
  const errors: string[] = [];
  const sources: ResolvedSource[] = [];

  const add = <T extends Source>(list: T[], id: string, kind: SourceKind, label: string): T | undefined => {
    const found = list.find((s) => s.id === id);
    if (found) sources.push({ source: found, kind });
    else errors.push(`${label} inconnu(e) : ${id}`);
    return found;
  };

  add(data.races, build.raceId, 'race', 'Race');
  const characterClass = add(data.classes, build.classId, 'class', 'Classe');

  for (const slot of EQUIPMENT_SLOTS) {
    const id = build.equipment[slot];
    if (!id) continue;
    const item = add<Equipment>(data.equipment, id, 'equipment', 'Équipement');
    if (!item) continue;
    if (item.slot !== slot) errors.push(`${item.name} ne va pas dans cet emplacement.`);
    if (item.allowedClasses && !item.allowedClasses.includes(build.classId)) {
      errors.push(`${item.name} ne peut pas être porté par cette classe.`);
    }
  }

  for (const id of unique(build.blessingIds)) add(data.blessings, id, 'blessing', 'Bénédiction');
  for (const id of unique(build.curseIds)) add(data.curses, id, 'curse', 'Malédiction');

  const curseCount = unique(build.curseIds).length;
  const blessingCount = unique(build.blessingIds).length;
  if (curseCount > MAX_CURSES) {
    errors.push(`Trop de malédictions : ${curseCount}/${MAX_CURSES}.`);
  }
  if (blessingCount > maxBlessings(curseCount)) {
    errors.push(
      `Trop de bénédictions : ${blessingCount}/${maxBlessings(curseCount)}. Accepte une malédiction de plus pour en gagner une.`,
    );
  }

  // Chaque élément compte une fois pour chacun de ses tags.
  const tagCounts = new Map<Tag, number>();
  for (const { source } of sources) {
    for (const tag of unique(source.tags)) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }

  const ctx: SynergyContext = {
    raceId: build.raceId,
    classId: build.classId,
    ids: new Set(sources.map((s) => s.source.id)),
    tagCounts,
    passives: new Set(sources.flatMap((s) => s.source.passives ?? [])),
  };
  const labels = { nameOf: nameLookup(data), tagOf: (tag: Tag) => data.tagLabels[tag] ?? tag };

  // Une synergie peut accorder un passif qui en active une autre.
  // On réévalue donc jusqu'à ce que plus rien ne change.
  let synergies = data.synergies.map((s) => evaluateSynergy(s, ctx, labels));
  for (;;) {
    const before = ctx.passives.size;
    for (const s of synergies) if (s.active) for (const id of s.synergy.passives ?? []) ctx.passives.add(id);
    if (ctx.passives.size === before) break;
    synergies = data.synergies.map((s) => evaluateSynergy(s, ctx, labels));
  }
  const activeSynergies = synergies.filter((s) => s.active);

  const grants = [
    ...sources.map(({ source }) => ({ name: source.name, ids: source.passives ?? [] })),
    ...activeSynergies.map(({ synergy }) => ({ name: synergy.name, ids: synergy.passives ?? [] })),
  ];
  const passives: PassiveGrant[] = [];
  for (const { name, ids } of grants) {
    for (const id of ids) {
      const passive = data.passives.find((p) => p.id === id);
      if (!passive) errors.push(`Passif inconnu : ${id}`);
      // Un même passif obtenu deux fois ne compte qu'une fois.
      else if (!passives.some((g) => g.passive.id === id)) passives.push({ passive, sourceName: name });
    }
  }

  const contributions: Contribution[] = [
    ...sources.flatMap(({ source, kind }) => toContributions(source, kind)),
    ...activeSynergies.flatMap(({ synergy }) => toContributions(synergy, 'synergy')),
  ];

  return {
    stats: computeStats(data.baseStats, contributions),
    tagCounts,
    synergies,
    activeSynergies,
    passives,
    attack: characterClass?.attack ?? null,
    errors,
  };
}

function toContributions(source: Pick<Source, 'id' | 'name' | 'modifiers'>, kind: SourceKind): Contribution[] {
  return source.modifiers.map((modifier) => ({ sourceId: source.id, sourceName: source.name, kind, modifier }));
}

function nameLookup(data: GameData): (id: string) => string {
  const all: { id: string; name: string }[] = [
    ...data.races,
    ...data.classes,
    ...data.equipment,
    ...data.blessings,
    ...data.curses,
    ...data.passives,
  ];
  const names = new Map(all.map((s) => [s.id, s.name]));
  return (id) => names.get(id) ?? id;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
