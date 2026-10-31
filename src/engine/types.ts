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

export type SourceKind = 'class' | 'blessing' | 'curse' | 'equipment' | 'trait' | 'synergy';

/** Tout ce qui peut faire partie d'un build et apporter des modificateurs et des tags. */
export interface Source {
  id: string;
  name: string;
  description: string;
  tags: Tag[];
  modifiers: Modifier[];
  /** Passifs accordés par cet élément (identifiants de src/data/passives.ts). */
  passives?: string[];
  /** Compétences de combat accordées (identifiants de src/data/skills.ts). */
  skills?: string[];
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
 * - extraStrike : après chacune de ses actions, un coup en plus (X % de la stat d'attaque).
 *   Avec scaleWith, la force dépend d'un niveau du héros entre 0 et 1 (ex. la longueur des cheveux).
 * - evade : esquive complètement les N premiers coups reçus pendant le combat.
 * - fearGuard : -X % de dégâts reçus des créatures dont le héros a peur.
 * - regen : à la fin de chacun de ses tours, rend X % de la vie maximum, sauf s'il est « coupé » (voir wound).
 */
export type PassiveEffect =
  | { type: 'convert'; element: Element }
  | { type: 'damageBonus'; percent: number; element?: Element }
  | { type: 'pierce'; percent: number; element?: Element }
  | { type: 'critDamage'; percent: number }
  | { type: 'applyBurn'; stacks: number; element?: Element }
  | { type: 'burnBonus'; percent: number }
  | { type: 'detonate'; threshold: number; percent: number }
  | { type: 'afterDetonate'; burnStacks: number }
  | { type: 'extraStrike'; name: string; percent: number; element?: Element; scaleWith?: string }
  | { type: 'evade'; charges: number; name: string }
  | { type: 'fearGuard'; percent: number }
  | { type: 'regen'; percent: number };

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

/** Emplacements d'équipement : un seul objet par emplacement. */
export type EquipmentSlot = 'weapon' | 'armor' | 'trinket';

/** Un objet porté. Comme le reste, il apporte stats, tags, passifs et compétences. */
export interface Equipment extends Source {
  slot: EquipmentSlot;
}
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
  skills?: string[];
}

/** Ce que le joueur choisit. Ce sont uniquement des identifiants. */
export interface Build {
  classId: string;
  blessingIds: string[];
  curseIds: string[];
  /** Passifs choisis directement, pour tester des idées avant de les attribuer à quelque chose. */
  traitIds: string[];
  /** Objets portés (un par emplacement). */
  equipmentIds?: string[];
}

/** Tout le contenu du jeu, regroupé. */
export interface GameData {
  baseStats: Stats;
  classes: CharacterClass[];
  blessings: Blessing[];
  curses: Curse[];
  synergies: Synergy[];
  passives: Passive[];
  equipment?: Equipment[];
  /** Nom affiché de chaque tag. */
  tagLabels: Record<Tag, string>;
}

// ---------- Combat ----------

/**
 * Un effet de compétence.
 * - damage : X % de la stat d'attaque (100 = une attaque normale). Sans élément, celui de l'attaque
 *   du lanceur (donc après Flamme, Châtiment...). hits : nombre de coups.
 *   vsTags : +X % de dégâts contre les cibles qui portent ce tag (ex. { cheveux: 100 }).
 * - heal : rend X % de la vie maximum.
 * - burn : pose des charges de brûlure.
 * - buff : +X % (ou -X %) à une stat de la cible pendant N de ses tours (la cible est soi-même si target vaut 'self').
 * - guard : réduit de moitié les dégâts reçus jusqu'au prochain tour, et rend X % du mana.
 * - flee : quitter le combat.
 * - bind : la cible est entravée pendant N de ses tours : elle ne peut lancer que les compétences « whileBound ».
 * - free : le lanceur se libère de ses entraves.
 * - wound : la cible est « coupée » pendant N de ses tours : sa repousse (regen) ne marche plus.
 * - stun : la cible perd ses N prochains tours.
 * - charge : le lanceur se prépare ; à son prochain tour il lance `skill`. S'il perd breakPercent % de sa vie
 *   maximum d'ici là, il est interrompu et perd ce tour.
 */
export type SkillEffect =
  | { type: 'damage'; percent: number; element?: Element; hits?: number; vsTags?: Record<Tag, number> }
  | { type: 'heal'; percent: number }
  | { type: 'burn'; stacks: number }
  | { type: 'buff'; stat: StatKey; percent: number; turns: number }
  | { type: 'guard'; manaPercent: number }
  | { type: 'flee' }
  | { type: 'bind'; turns: number }
  | { type: 'free' }
  | { type: 'wound'; turns: number }
  | { type: 'stun'; turns: number }
  | { type: 'charge'; skill: string; breakPercent: number };

export interface Skill {
  id: string;
  name: string;
  description: string;
  /** Coût en mana. */
  cost?: number;
  /** Qui est visé : un ennemi au choix, ou soi-même. */
  target: 'enemy' | 'self';
  effects: SkillEffect[];
  /** Utilisable même entravé (se débattre, couper ses liens...). */
  whileBound?: boolean;
  /** Une seule fois par combat. */
  once?: boolean;
}

/**
 * Comportement d'un monstre : la première règle dont la condition est remplie est jouée.
 * - hpBelow : vie restante sous ce ratio (0,3 = 30 %).
 * - every : un tour sur N (every: 3 → tours 3, 6, 9...).
 * - once : une seule fois par combat.
 */
export interface AiRule {
  skill: string;
  hpBelow?: number;
  every?: number;
  once?: boolean;
}

export interface Monster {
  id: string;
  name: string;
  description: string;
  /** Tags du monstre : « cheveux », « araignée »... Les peurs du héros s'y comparent. */
  tags: Tag[];
  stats: Stats;
  attack: { stat: StatKey; element: Element };
  /** Résistance par élément, en % : 50 = moitié moins de dégâts, -50 = moitié plus (faiblesse). */
  resist?: Partial<Record<Element, number>>;
  skills: string[];
  ai: AiRule[];
  passives?: string[];
  /**
   * Croissance : stats ajoutées pour chaque point de puissance donné au combat
   * (ex. la force de la légende de l'Esprit du puits). { hp: 8, strength: 1 } = +8 PV et +1 Force par point.
   */
  growth?: Partial<Stats>;
}

/** Le contenu des combats : compétences et monstres. */
export interface BattleData {
  skills: Skill[];
  monsters: Monster[];
}
