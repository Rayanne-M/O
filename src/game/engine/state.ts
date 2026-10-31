// Ce que les choix du joueur laissent sur le héros. Commun à tous les chapitres.

export type Gauge = 'guerrier' | 'mage' | 'voleur';
export type FearLevel = 'aime' | 'neutre' | 'peur';

export const GAUGE_NAMES: Record<Gauge, string> = { guerrier: 'Guerrier', mage: 'Mage', voleur: 'Voleur' };
export const FEAR_LEVELS: Record<FearLevel, string> = { aime: 'aime', neutre: 'indifférent', peur: 'a peur' };

/** Effets d'un choix : un nombre s'ajoute, un texte remplace, vrai lève un drapeau. Clés spéciales : trait, objet, perd, cheveux, peurs.<sujet>. */
export type Effects = Record<string, number | string | boolean>;

export interface State {
  day: number;
  /** Moment de la journée (matin, midi, après-midi, soir, veillée, nuit). */
  moment: string;
  gauges: Record<Gauge, number>;
  /** Compteurs : legende, rancoeur, peur, maudit, beni… (cachés au joueur). */
  counts: Record<string, number>;
  fears: Record<string, FearLevel>;
  /** Longueur des cheveux du héros, de 0 (ras) à 1 (très longs). */
  hair: number;
  traits: string[];
  items: string[];
  flags: Set<string>;
  /** Assombrir les images choquantes. */
  soften: boolean;
}

export function newState(soften = false, counts: Record<string, number> = {}): State {
  return {
    day: 1,
    moment: 'matin',
    gauges: { guerrier: 0, mage: 0, voleur: 0 },
    counts: { maudit: 0, beni: 0, ...counts },
    fears: {},
    hair: 0.8,
    traits: [],
    items: [],
    flags: new Set(),
    soften,
  };
}

export let state = newState();
export function setState(s: State) {
  state = s;
}

export const count = (name: string) => state.counts[name] ?? 0;
export const has = (flag: string) => state.flags.has(flag);
export const hasItem = (item: string) => state.items.includes(item);

export function applyEffects(effects: Effects = {}) {
  for (const [key, value] of Object.entries(effects)) {
    if (key === 'trait') {
      if (!state.traits.includes(String(value))) state.traits.push(String(value));
    } else if (key === 'objet') {
      if (!state.items.includes(String(value))) state.items.push(String(value));
    } else if (key === 'perd') state.items = state.items.filter((i) => i !== value);
    else if (key === 'cheveux') state.hair = Number(value);
    else if (key.startsWith('peurs.')) state.fears[key.slice(6)] = value as FearLevel;
    else if (key in state.gauges) state.gauges[key as Gauge] = Math.max(0, state.gauges[key as Gauge] + Number(value));
    else if (typeof value === 'number') state.counts[key] = count(key) + value;
    else if (value === true) state.flags.add(key);
    else if (value === false) state.flags.delete(key);
  }
}
