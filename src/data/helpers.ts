import type { Modifier, StatKey } from '../engine/types';

/** Bonus fixe : flat('strength', 5) donne +5 force. */
export const flat = (stat: StatKey, value: number): Modifier => ({ stat, type: 'flat', value });

/** Bonus en pourcentage : pct('hp', 10) donne +10 % de vie. */
export const pct = (stat: StatKey, value: number): Modifier => ({ stat, type: 'percent', value });
