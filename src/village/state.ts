// Ce que l'enfance a laissé sur le héros. Remis à zéro à chaque nouvelle partie.
// Les noms suivent le scénario de l'enfance (rpg/scenario/enfance.json).

export type Gauge = 'guerrier' | 'mage' | 'voleur';
export type FearLevel = 'aime' | 'neutre' | 'peur';

export const GAUGE_NAMES: Record<Gauge, string> = { guerrier: 'Guerrier', mage: 'Mage', voleur: 'Voleur' };
export const FEAR_NAMES: Record<string, string> = { aime: 'aime', neutre: 'indifférent', peur: 'a peur' };
export const FEAR_SUBJECTS: Record<string, string> = { araignees: 'Araignées', noir: 'Le noir', cheveux: 'Cheveux', eau: 'Eau' };

export const LAST_DAY = 3;

/** Une valeur d'effet, comme dans le scénario : un nombre s'ajoute, un texte remplace, vrai lève un drapeau. */
export type Effects = Record<string, number | string | boolean>;

export interface State {
  day: number;
  /** Jauges d'affinité de classe : elles montent par les choix, jamais par la répétition. */
  gauges: Record<Gauge, number>;
  /** Compteurs cachés : legende, rancoeur, peur, maudit, beni, compte_coeur_fidele, compte_rancunier… */
  counts: Record<string, number>;
  fears: Record<string, FearLevel>;
  hair: 'court' | 'mi-long' | 'long';
  traits: string[];
  /** Faits retenus pour plus tard (a_ruban, dit_nimporte_quoi…). */
  flags: Set<string>;
  /** Nuits passées bougie allumée, et nuits où le héros est sorti bougie soufflée (pour la peur du noir). */
  candleNights: number;
  darkOutings: number;
  /** Montrer les images gore du puits. */
  gore: boolean;
}

export function newState(gore = true): State {
  return {
    day: 1,
    gauges: { guerrier: 0, mage: 0, voleur: 0 },
    counts: { legende: 1, rancoeur: 2, peur: 0, maudit: 0, beni: 0 },
    fears: {},
    hair: 'mi-long',
    traits: [],
    flags: new Set(),
    candleNights: 0,
    darkOutings: 0,
    gore,
  };
}

export let state = newState();

export function resetState() {
  state = newState(state.gore);
}

export const count = (name: string) => state.counts[name] ?? 0;
export const has = (flag: string) => state.flags.has(flag);

export function applyEffects(effects: Effects = {}) {
  for (const [key, value] of Object.entries(effects)) {
    if (key === 'trait') {
      if (!state.traits.includes(String(value))) state.traits.push(String(value));
    } else if (key === 'cheveux') state.hair = value as State['hair'];
    else if (key.startsWith('peurs.')) state.fears[key.slice(6)] = value as FearLevel;
    else if (key in state.gauges) state.gauges[key as Gauge] += Number(value);
    else if (typeof value === 'number') state.counts[key] = count(key) + value;
    else if (value === true) state.flags.add(key);
  }
}

/** Force de l'Esprit = légende + rancoeur + peur. */
export const spiritForce = () => count('legende') + count('rancoeur') + count('peur');

/** Calculs de fin d'enfance : traits à seuil et peur du noir. */
export function settleChildhood() {
  if (count('compte_coeur_fidele') >= 2) applyEffects({ trait: 'Coeur fidèle' });
  if (count('compte_rancunier') >= 2) applyEffects({ trait: 'Rancunier' });
  if (!state.fears.noir) state.fears.noir = state.candleNights >= 2 ? 'peur' : state.darkOutings >= 2 ? 'aime' : 'neutre';
}
