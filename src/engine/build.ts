import { computeStats, type Contribution, type StatBreakdown } from './stats';
import { evaluateSynergy, type SynergyContext, type SynergyStatus } from './synergy';
import {
  EQUIPMENT_SLOTS,
  type Build,
  type Equipment,
  type GameData,
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
  /** Problèmes qui rendent le build invalide (objet interdit, trop de bénédictions...). */
  errors: string[];
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
  add(data.classes, build.classId, 'class', 'Classe');

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
  };
  const labels = { nameOf: nameLookup(data), tagOf: (tag: Tag) => data.tagLabels[tag] ?? tag };
  const synergies = data.synergies.map((s) => evaluateSynergy(s, ctx, labels));
  const activeSynergies = synergies.filter((s) => s.active);

  const contributions: Contribution[] = [
    ...sources.flatMap(({ source, kind }) => toContributions(source, kind)),
    ...activeSynergies.flatMap(({ synergy }) => toContributions(synergy, 'synergy')),
  ];

  return {
    stats: computeStats(data.baseStats, contributions),
    tagCounts,
    synergies,
    activeSynergies,
    errors,
  };
}

function toContributions(source: Pick<Source, 'id' | 'name' | 'modifiers'>, kind: SourceKind): Contribution[] {
  return source.modifiers.map((modifier) => ({ sourceId: source.id, sourceName: source.name, kind, modifier }));
}

function nameLookup(data: GameData): (id: string) => string {
  const all: Source[] = [...data.races, ...data.classes, ...data.equipment, ...data.blessings, ...data.curses];
  const names = new Map(all.map((s) => [s.id, s.name]));
  return (id) => names.get(id) ?? id;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
