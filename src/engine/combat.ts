import { BASIC_SKILLS, Battle, elementOf, heroFromBuild, makeCombatant, BURN, BASE_CRIT_DAMAGE } from './battle';
import type { BuildResult } from './build';
import type { Element } from './types';

// Combat d'entraînement : le personnage frappe un mannequin pendant quelques tours.
// Il passe par le vrai moteur de combat (battle.ts) : ce que mesure l'atelier est exactement
// ce qui se passera en jeu. Le mannequin ne riposte pas et joue à la même vitesse que le héros.

export { BURN, BASE_CRIT_DAMAGE };

export interface CombatOptions {
  turns: number;
  /** Défense du mannequin : retirée des dégâts de chaque coup. */
  targetDefense: number;
}

export const DEFAULT_COMBAT: CombatOptions = { turns: 10, targetDefense: 5 };

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

  const hero = heroFromBuild(result);
  const dummy = makeCombatant({
    id: 'dummy',
    name: 'Mannequin',
    side: 'enemy',
    stats: { ...hero.stats, hp: 1e9, defense: options.targetDefense },
    attack: { stat: 'strength', element: 'physical' },
    skills: ['wait'],
    passives: [],
    tags: [],
    fears: [],
    resist: {},
    levels: {},
  });
  const battle = new Battle([hero], [dummy], { skills: BASIC_SKILLS });

  const events: CombatEvent[] = [];
  for (let turn = 1; turn <= options.turns; turn++) {
    // Un tour d'entraînement = l'attaque du héros, puis le tour du mannequin (où ses brûlures font effet).
    const happened = [...battle.act('attack', 'dummy'), ...battle.act('wait')];
    for (const e of happened) {
      if (e.kind !== 'damage') continue;
      // Les coups en plus (cheveux...) comptent comme des coups.
      const kind: DamageKind = e.hit === 'extra' ? 'hit' : e.hit;
      events.push({ turn, kind, damage: e.amount, text: e.text });
    }
  }

  const byKind: Record<DamageKind, number> = { hit: 0, crit: 0, burn: 0, explosion: 0 };
  for (const e of events) byKind[e.kind] += e.damage;
  return { element: elementOf(hero), total: events.reduce((a, e) => a + e.damage, 0), byKind, events };
}
