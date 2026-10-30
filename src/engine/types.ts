// Types de base du moteur de build.
// Tout le contenu du jeu (classes, bénédictions, malédictions, passifs, synergies)
// est décrit avec ces types, dans le dossier src/data.

/** Les statistiques d'un personnage. */
export const STAT_KEYS = [
  'hp',
  'mana',
  'strength',
  'agility',
  'intelligence',
  'defense',
  'crit',
  'speed',
] as const;

export type StatKey = (typeof STAT_KEYS)[number];

export type Stats = Record<StatKey, number>;

/**
 * Un modificateur change une stat.
 * - "flat" ajoute une valeur fixe (ex. +5 force).
 * - "percent" augmente le total en pourcentage (ex. +10 % de vie).
 */
export interface Modifier {
  stat: StatKey;
  type: 'flat' | 'percent';
  value: number;
}

/** Une étiquette (tag) décrit un thème : "fire", "shadow", "holy"... Les synergies comptent les tags. */
export type Tag = string;

export type SourceKind = 'class' | 'blessing' | 'curse' | 'trait' | 'synergy';

/** Tout ce qui peut faire partie d'un build et apporter des modificateurs et des tags. */
export interface Source {
  id: string;
  name: string;
  description: string;
  tags: Tag[];
  modifiers: Modifier[];
  /** Passifs accordés par cet élément (identifiants de src/data/passives.ts). */
  passives?: string[];
}

/** Élément d'une attaque. */
export type Element = 'physical' | 'arcane' | 'fire' | 'shadow' | 'holy';

/**
 * Un effet de passif. Le combat d'entraînement (combat.ts) sait appliquer chacun d'eux.
 * - convert : les attaques changent d'élément.
 * - damageBonus : +X % de dégâts (seulement pour un élément si précisé).
 * - pierce : ignore X % de la défense de la cible.
 * - critDamage : +X % de dégâts sur les coups critiques.
 * - applyBurn : chaque coup pose des charges de brûlure.
 * - burnBonus : +X % de dégâts de brûlure.
 * - detonate : à N charges de brûlure, elles explosent d'un coup (X % des dégâts qu'il leur restait).
 * - afterDetonate : après une explosion, pose de nouvelles charges de brûlure.
 */
export type PassiveEffect =
  | { type: 'convert'; element: Element }
  | { type: 'damageBonus'; percent: number; element?: Element }
  | { type: 'pierce'; percent: number; element?: Element }
  | { type: 'critDamage'; percent: number }
  | { type: 'applyBurn'; stacks: number; element?: Element }
  | { type: 'burnBonus'; percent: number }
  | { type: 'detonate'; threshold: number; percent: number }
  | { type: 'afterDetonate'; burnStacks: number };

/**
 * Un passif : un effet de jeu qui change la façon de combattre, et pas seulement les stats.
 * Dans l'atelier, chaque passif peut aussi être choisi directement comme « trait ».
 */
export interface Passive {
  id: string;
  name: string;
  description: string;
  effects: PassiveEffect[];
  /** Tags comptés pour les synergies quand le passif est choisi comme trait. */
  tags?: Tag[];
}

export interface CharacterClass extends Source {
  /** L'attaque de base : la stat qui fait les dégâts et son élément. */
  attack: { stat: StatKey; element: Element };
}

export type Blessing = Source;
export type Curse = Source;

/**
 * Conditions d'une synergie. Toutes les conditions présentes doivent être remplies.
 * - class : le personnage doit avoir l'une des classes listées.
 * - tags : nombre minimum d'éléments du build portant chaque tag (ex. { fire: 2 }).
 * - ids : éléments précis qui doivent être dans le build (bénédiction, malédiction...).
 * - passives : passifs que le build doit déjà posséder (ils peuvent venir d'autres synergies).
 */
export interface SynergyCondition {
  class?: string[];
  tags?: Record<Tag, number>;
  ids?: string[];
  passives?: string[];
}

export interface Synergy {
  id: string;
  name: string;
  description: string;
  requires: SynergyCondition;
  modifiers: Modifier[];
  passives?: string[];
}

/** Ce que le joueur choisit. Ce sont uniquement des identifiants. */
export interface Build {
  classId: string;
  blessingIds: string[];
  curseIds: string[];
  /** Passifs choisis directement, pour tester des idées avant de les attribuer à quelque chose. */
  traitIds: string[];
}

/** Tout le contenu du jeu, regroupé. */
export interface GameData {
  baseStats: Stats;
  classes: CharacterClass[];
  blessings: Blessing[];
  curses: Curse[];
  synergies: Synergy[];
  passives: Passive[];
  /** Nom affiché de chaque tag. */
  tagLabels: Record<Tag, string>;
}
