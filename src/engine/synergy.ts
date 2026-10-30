import type { Synergy, Tag } from './types';

/** Ce que le moteur sait du build quand il vérifie les synergies. */
export interface SynergyContext {
  raceId: string;
  classId: string;
  /** Tous les identifiants présents dans le build (race, classe, objets, bénédictions, malédictions). */
  ids: Set<string>;
  /** Pour chaque tag, le nombre d'éléments du build qui le portent. */
  tagCounts: Map<Tag, number>;
}

export interface SynergyStatus {
  synergy: Synergy;
  active: boolean;
  /** Conditions non remplies, en texte lisible. Vide si la synergie est active. */
  missing: string[];
  /** Nombre d'éléments à ajouter ou changer pour l'activer (0 si active). */
  gap: number;
}

/** Noms lisibles, pour écrire les conditions manquantes. */
export interface Labels {
  nameOf: (id: string) => string;
  tagOf: (tag: Tag) => string;
}

export function evaluateSynergy(synergy: Synergy, ctx: SynergyContext, { nameOf, tagOf }: Labels): SynergyStatus {
  const { race, class: classes, tags, ids } = synergy.requires;
  const missing: string[] = [];
  let gap = 0;

  if (race && !race.includes(ctx.raceId)) {
    missing.push(`Race : ${race.map(nameOf).join(' ou ')}`);
    gap += 1;
  }
  if (classes && !classes.includes(ctx.classId)) {
    missing.push(`Classe : ${classes.map(nameOf).join(' ou ')}`);
    gap += 1;
  }
  for (const [tag, needed] of Object.entries(tags ?? {})) {
    const have = ctx.tagCounts.get(tag) ?? 0;
    if (have < needed) {
      missing.push(`${tagOf(tag)} : ${have}/${needed}`);
      gap += needed - have;
    }
  }
  for (const id of ids ?? []) {
    if (!ctx.ids.has(id)) {
      missing.push(`Requiert : ${nameOf(id)}`);
      gap += 1;
    }
  }

  return { synergy, active: missing.length === 0, missing, gap };
}
