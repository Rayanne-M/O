// Types de base du moteur de build.
// Tout le contenu du jeu (races, classes, équipements, bénédictions, malédictions)
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

/** Une étiquette (tag) décrit un thème : "fire", "shadow", "heavy"... Les synergies comptent les tags. */
export type Tag = string;

export type SourceKind = 'race' | 'class' | 'equipment' | 'blessing' | 'curse' | 'synergy';

/** Tout ce qui peut faire partie d'un build et apporter des modificateurs et des tags. */
export interface Source {
  id: string;
  name: string;
  description: string;
  tags: Tag[];
  modifiers: Modifier[];
}

export type Race = Source;
export type CharacterClass = Source;
export type Blessing = Source;
export type Curse = Source;

export const EQUIPMENT_SLOTS = ['weapon', 'armor', 'trinket'] as const;
export type EquipmentSlot = (typeof EQUIPMENT_SLOTS)[number];

export interface Equipment extends Source {
  slot: EquipmentSlot;
  /** Si présent, seules ces classes peuvent porter l'objet. */
  allowedClasses?: string[];
}

/**
 * Conditions d'une synergie. Toutes les conditions présentes doivent être remplies.
 * - race / class : le personnage doit avoir l'une des races / classes listées.
 * - tags : nombre minimum d'éléments du build portant chaque tag (ex. { fire: 2 }).
 * - ids : éléments précis qui doivent être dans le build (objet, bénédiction, malédiction...).
 */
export interface SynergyCondition {
  race?: string[];
  class?: string[];
  tags?: Record<Tag, number>;
  ids?: string[];
}

export interface Synergy {
  id: string;
  name: string;
  description: string;
  requires: SynergyCondition;
  modifiers: Modifier[];
}

/** Ce que le joueur choisit. Ce sont uniquement des identifiants. */
export interface Build {
  raceId: string;
  classId: string;
  equipment: Partial<Record<EquipmentSlot, string>>;
  blessingIds: string[];
  curseIds: string[];
}

/** Tout le contenu du jeu, regroupé. */
export interface GameData {
  baseStats: Stats;
  races: Race[];
  classes: CharacterClass[];
  equipment: Equipment[];
  blessings: Blessing[];
  curses: Curse[];
  synergies: Synergy[];
  /** Nom affiché de chaque tag. */
  tagLabels: Record<Tag, string>;
}
