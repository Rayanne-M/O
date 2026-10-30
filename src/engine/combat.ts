import type { BuildResult } from './build';
import type { Element, PassiveEffect } from './types';

// Combat d'entraînement : le personnage frappe un mannequin pendant quelques tours.
// Tout est déterministe (pas de hasard) pour pouvoir comparer deux builds honnêtement.

export interface CombatOptions {
  turns: number;
  /** Défense du mannequin : retirée des dégâts de chaque coup. */
  targetDefense: number;
}

export const DEFAULT_COMBAT: CombatOptions = { turns: 10, targetDefense: 5 };

/** Règles de la brûlure : chaque charge dure 3 tours et inflige 15 % de la stat d'attaque par tour. */
export const BURN = { duration: 3, ratio: 0.15 };

/** Bonus de base d'un coup critique (+50 %). */
export const BASE_CRIT_DAMAGE = 50;

export type DamageKind = 'hit' | 'crit' | 'burn' | 'explosion';

export interface CombatEvent {
  turn: number;
  kind: DamageKind;
  damage: number;
  text: string;
}

export interface CombatResult {
  element: Element;
  total: number;
  byKind: Record<DamageKind, number>;
  events: CombatEvent[];
}

export function simulateCombat(result: BuildResult, options: CombatOptions = DEFAULT_COMBAT): CombatResult | null {
  if (!result.attack) return null;

  const effects = result.passives.flatMap((g) => g.passive.effects);
  const of = <T extends PassiveEffect['type']>(type: T) =>
    effects.filter((e): e is Extract<PassiveEffect, { type: T }> => e.type === type);
  // Un effet sans élément s'applique à tous ; sinon seulement à l'élément de l'attaque.
  const matches = (e: { element?: Element }) => !e.element || e.element === element;
  const total = (values: number[]) => values.reduce((a, b) => a + b, 0);

  // Si plusieurs passifs changent l'élément, le dernier obtenu l'emporte.
  const element = of('convert').at(-1)?.element ?? result.attack.element;
  const power = result.stats[result.attack.stat].total;
  const damageBonus = total(of('damageBonus').filter(matches).map((e) => e.percent));
  const pierce = Math.min(100, total(of('pierce').filter(matches).map((e) => e.percent)));
  const critDamage = BASE_CRIT_DAMAGE + total(of('critDamage').map((e) => e.percent));
  const burnPerHit = total(of('applyBurn').filter(matches).map((e) => e.stacks));
  const burnTick = power * BURN.ratio * (1 + total(of('burnBonus').map((e) => e.percent)) / 100);
  const detonates = of('detonate');
  const detonateAt = detonates.length ? Math.min(...detonates.map((e) => e.threshold)) : Infinity;
  const detonatePercent = total(detonates.map((e) => e.percent));
  const afterDetonate = total(of('afterDetonate').map((e) => e.burnStacks));

  const defense = options.targetDefense * (1 - pierce / 100);
  const crit = result.stats.crit.total;
  const events: CombatEvent[] = [];
  const log = (turn: number, kind: DamageKind, damage: number, text: string) => {
    const rounded = Math.round(damage);
    events.push({ turn, kind, damage: rounded, text: `${text} : ${rounded}` });
  };

  // Chaque charge de brûlure est représentée par le nombre de tours qu'il lui reste.
  let burns: number[] = [];
  // La jauge de critique se remplit de "crit" % à chaque coup ; à 100, le coup est critique.
  let critMeter = 0;

  for (let turn = 1; turn <= options.turns; turn++) {
    let hit = Math.max(1, power * (1 + damageBonus / 100) - defense);
    critMeter += crit;
    const isCrit = critMeter >= 100;
    if (isCrit) {
      critMeter -= 100;
      hit *= 1 + critDamage / 100;
    }
    log(turn, isCrit ? 'crit' : 'hit', hit, isCrit ? 'Coup critique' : 'Coup');

    for (let i = 0; i < burnPerHit; i++) burns.push(BURN.duration);

    if (burns.length >= detonateAt) {
      const remaining = total(burns) * burnTick;
      log(turn, 'explosion', (remaining * detonatePercent) / 100, `Explosion de ${burns.length} brûlures`);
      burns = [];
      for (let i = 0; i < afterDetonate; i++) burns.push(BURN.duration);
    }

    if (burns.length) {
      log(turn, 'burn', burns.length * burnTick, `Brûlure ×${burns.length}`);
      burns = burns.map((t) => t - 1).filter((t) => t > 0);
    }
  }

  const byKind: Record<DamageKind, number> = { hit: 0, crit: 0, burn: 0, explosion: 0 };
  for (const e of events) byKind[e.kind] += e.damage;
  return { element, total: total(events.map((e) => e.damage)), byKind, events };
}
