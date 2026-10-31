import type { BuildResult } from './build';
import {
  STAT_KEYS,
  type BattleData,
  type Element,
  type Monster,
  type Passive,
  type PassiveEffect,
  type Skill,
  type StatKey,
  type Stats,
  type Tag,
} from './types';

// Le moteur de combat. Il ne dessine rien : il tient l'état du combat, décide qui joue,
// applique les compétences et les passifs, et raconte ce qui se passe sous forme d'événements.
// Le même moteur sert au combat d'entraînement de l'atelier, à la page de combat et au jeu.
//
// Ordre des tours : chaque combattant a une « heure » de prochaine action. Il agit, puis
// avance de TIME_SCALE / vitesse. Deux fois plus rapide = deux fois plus de tours.
// Aucun hasard : la jauge de critique et les règles fixes rendent tout prévisible.

/** Avance après une action : TIME_SCALE / vitesse. */
export const TIME_SCALE = 1000;
/** Règles de la brûlure : chaque charge dure 3 tours de celui qui brûle et inflige 15 % de la stat d'attaque du lanceur. */
export const BURN = { duration: 3, ratio: 0.15 };
/** Bonus de base d'un coup critique (+50 %). */
export const BASE_CRIT_DAMAGE = 50;
/** Une créature dont le héros a peur lui fait +25 % de dégâts. */
export const FEAR_DAMAGE = 25;
/** Se protéger : dégâts reçus réduits de moitié jusqu'au prochain tour. */
export const GUARD_REDUCTION = 50;

export type Side = 'hero' | 'enemy';

export interface BurnStack {
  turns: number;
  /** Dégâts par tour de cette charge (déjà multipliés par les bonus du lanceur). */
  tick: number;
  sourceId: string;
}

export interface Buff {
  stat: StatKey;
  percent: number;
  turns: number;
  name: string;
}

export interface Combatant {
  id: string;
  name: string;
  side: Side;
  /** Stats de départ, déjà calculées (build ou monstre). */
  stats: Stats;
  hp: number;
  mana: number;
  attack: { stat: StatKey; element: Element };
  skills: string[];
  passives: Passive[];
  tags: Tag[];
  /** Ce dont il a peur (comparé aux tags des ennemis). */
  fears: Tag[];
  resist: Partial<Record<Element, number>>;
  /** Niveaux entre 0 et 1 qui modulent certains passifs (cheveux...). */
  levels: Record<string, number>;
  ai?: Monster['ai'];
  /** Heure de la prochaine action. */
  time: number;
  turnsTaken: number;
  critMeter: number;
  burns: BurnStack[];
  buffs: Buff[];
  guarding: boolean;
  /** Esquives restantes, par passif. */
  evades: Record<string, number>;
  usedOnce: string[];
  /** Tours restants entravé, coupé (repousse bloquée), étourdi. */
  bound: number;
  wounded: number;
  stunned: number;
  /** Une attaque en préparation, interrompue s'il perd assez de vie d'ici son prochain tour. */
  charging: { skill: string; breakAt: number; taken: number } | null;
}

export type BattleEvent =
  | { kind: 'turn'; actor: string; text: string }
  | { kind: 'skill'; actor: string; skill: string; text: string }
  | {
      kind: 'damage';
      source: string;
      target: string;
      amount: number;
      element: Element;
      /** hit : coup ; crit : coup critique ; burn : brûlure ; explosion ; extra : coup en plus d'un passif. */
      hit: 'hit' | 'crit' | 'burn' | 'explosion' | 'extra';
      text: string;
    }
  | { kind: 'heal'; target: string; amount: number; text: string }
  | { kind: 'status'; target: string; text: string }
  | { kind: 'evade'; target: string; text: string }
  | { kind: 'ko'; target: string; text: string }
  | { kind: 'end'; outcome: Outcome; text: string };

export type Outcome = 'ongoing' | 'win' | 'lose' | 'fled' | 'enemyFled';

export class Battle {
  readonly fighters: Combatant[];
  outcome: Outcome = 'ongoing';
  readonly log: BattleEvent[] = [];
  private readonly skills: Map<string, Skill>;

  constructor(heroes: Combatant[], enemies: Combatant[], data: Pick<BattleData, 'skills'>) {
    this.fighters = [...heroes, ...enemies];
    this.skills = new Map(data.skills.map((s) => [s.id, s]));
    for (const f of this.fighters) f.time = TIME_SCALE / speedOf(f);
  }

  skill(id: string): Skill {
    const s = this.skills.get(id);
    if (!s) throw new Error(`Compétence inconnue : ${id}`);
    return s;
  }

  alive(side?: Side): Combatant[] {
    return this.fighters.filter((f) => f.hp > 0 && (!side || f.side === side));
  }

  get(id: string): Combatant {
    const f = this.fighters.find((x) => x.id === id);
    if (!f) throw new Error(`Combattant inconnu : ${id}`);
    return f;
  }

  /** Celui qui joue maintenant : la plus petite heure ; à égalité, l'ordre de la liste (héros d'abord). */
  current(): Combatant {
    return this.alive().reduce((a, b) => (b.time < a.time ? b : a));
  }

  /** Les n prochains tours, pour la frise : on avance des copies des heures sans rien jouer. */
  preview(n: number): Combatant[] {
    const times = new Map(this.alive().map((f) => [f.id, f.time]));
    const order: Combatant[] = [];
    for (let i = 0; i < n && times.size; i++) {
      let best: Combatant | null = null;
      for (const f of this.alive()) if (!best || times.get(f.id)! < times.get(best.id)!) best = f;
      order.push(best!);
      times.set(best!.id, times.get(best!.id)! + TIME_SCALE / speedOf(best!));
    }
    return order;
  }

  /** Les compétences que ce combattant peut lancer maintenant : assez de mana, pas déjà utilisée (once), et whileBound s'il est entravé. */
  usable(f: Combatant): Skill[] {
    return f.skills
      .map((id) => this.skill(id))
      .filter((s) => (s.cost ?? 0) <= f.mana && !(s.once && f.usedOnce.includes(`skill:${s.id}`)) && (!f.bound || s.whileBound));
  }

  /**
   * Un tour qui se joue tout seul : étourdi (il passe), ou attaque préparée (elle part).
   * À appeler avant de demander une action ; renvoie null si le combattant choisit lui-même.
   */
  autoTurn(): BattleEvent[] | null {
    if (this.outcome !== 'ongoing') return null;
    const actor = this.current();
    if (actor.stunned > 0) {
      const start = this.log.length;
      actor.stunned--;
      actor.charging = null;
      this.emit({ kind: 'status', target: actor.id, text: `${actor.name} est étourdi et perd son tour.` });
      this.endTurn(actor);
      return this.log.slice(start);
    }
    if (actor.charging) {
      const skill = actor.charging.skill;
      actor.charging = null;
      return this.act(skill, undefined, true);
    }
    return null;
  }

  /** Le combattant qui doit jouer lance une compétence. Renvoie les événements de ce tour. */
  act(skillId: string, targetId?: string, forced = false): BattleEvent[] {
    if (this.outcome !== 'ongoing') return [];
    const start = this.log.length;
    const actor = this.current();
    const skill = this.skill(skillId);
    if (!forced) {
      if (!actor.skills.includes(skillId)) throw new Error(`${actor.name} ne connaît pas ${skill.name}`);
      if (!this.usable(actor).includes(skill)) throw new Error(`${actor.name} ne peut pas lancer ${skill.name} maintenant`);
    }
    if (skill.once) actor.usedOnce.push(`skill:${skill.id}`);

    actor.guarding = false;
    actor.mana -= skill.cost ?? 0;
    const foes = this.alive(actor.side === 'hero' ? 'enemy' : 'hero');
    const target = skill.target === 'self' ? actor : (foes.find((f) => f.id === targetId) ?? foes[0]);
    this.emit({ kind: 'skill', actor: actor.id, skill: skill.id, text: `${actor.name} : ${skill.name}` });

    for (const effect of skill.effects) {
      if (this.outcome !== 'ongoing') break;
      switch (effect.type) {
        case 'damage':
          for (let i = 0; i < (effect.hits ?? 1) && target.hp > 0; i++)
            this.strike(actor, target, effect.percent * (1 + tagBonus(effect.vsTags, target) / 100), effect.element);
          break;
        case 'heal': {
          const amount = Math.min(target.stats.hp - target.hp, Math.round((target.stats.hp * effect.percent) / 100));
          target.hp += amount;
          this.emit({ kind: 'heal', target: target.id, amount, text: `${target.name} récupère ${amount} PV` });
          break;
        }
        case 'burn':
          this.addBurns(actor, target, effect.stacks);
          break;
        case 'buff':
          target.buffs.push({ stat: effect.stat, percent: effect.percent, turns: effect.turns, name: skill.name });
          this.emit({ kind: 'status', target: target.id, text: `${target.name} : ${effect.percent > 0 ? '+' : ''}${effect.percent} % ${effect.stat} (${effect.turns} tours)` });
          break;
        case 'guard': {
          actor.guarding = true;
          const gain = Math.min(actor.stats.mana - actor.mana, Math.round((actor.stats.mana * effect.manaPercent) / 100));
          actor.mana += gain;
          this.emit({ kind: 'status', target: actor.id, text: `${actor.name} se protège${gain ? ` et récupère ${gain} mana` : ''}` });
          break;
        }
        case 'flee':
          this.finish(actor.side === 'hero' ? 'fled' : 'enemyFled', `${actor.name} s'enfuit !`);
          break;
        case 'bind':
          if (target.hp > 0) {
            target.bound = Math.max(target.bound, effect.turns);
            this.emit({ kind: 'status', target: target.id, text: `${target.name} est entravé !` });
          }
          break;
        case 'free':
          if (actor.bound) {
            actor.bound = 0;
            this.emit({ kind: 'status', target: actor.id, text: `${actor.name} se libère.` });
          }
          break;
        case 'wound':
          if (target.hp > 0 && effectsOf(target, 'regen').length) {
            target.wounded = Math.max(target.wounded, effect.turns);
            this.emit({ kind: 'status', target: target.id, text: `Coupé net : ça ne repoussera pas tout de suite.` });
          }
          break;
        case 'stun':
          if (target.hp > 0) {
            target.stunned = Math.max(target.stunned, effect.turns);
            target.charging = null;
            this.emit({ kind: 'status', target: target.id, text: `${target.name} hésite…` });
          }
          break;
        case 'charge':
          actor.charging = { skill: effect.skill, breakAt: Math.round((actor.stats.hp * effect.breakPercent) / 100), taken: 0 };
          this.emit({ kind: 'status', target: actor.id, text: `${actor.name} prépare : ${this.skill(effect.skill).name} !` });
          break;
      }
    }

    // Les coups en plus des passifs (cheveux vivants...), après chaque action offensive.
    if (skill.target === 'enemy' && this.outcome === 'ongoing') {
      for (const e of effectsOf(actor, 'extraStrike')) {
        const scale = e.scaleWith ? (actor.levels[e.scaleWith] ?? 0) : 1;
        const t = this.alive(actor.side === 'hero' ? 'enemy' : 'hero').find((f) => f.id === target.id) ?? this.alive(actor.side === 'hero' ? 'enemy' : 'hero')[0];
        if (scale > 0 && t) this.strike(actor, t, e.percent * scale, e.element, e.name);
      }
    }

    this.endTurn(actor);
    return this.log.slice(start);
  }

  /** Fait jouer un monstre selon ses règles. */
  playAi(): BattleEvent[] {
    const auto = this.autoTurn();
    if (auto) return auto;
    const actor = this.current();
    return this.act(chooseAiSkill(actor, (id) => this.skill(id), this.usable(actor)));
  }

  /** Un coup : dégâts, critique, résistance, peur, esquive, puis brûlures et explosion. */
  private strike(actor: Combatant, target: Combatant, percent: number, forced?: Element, extraName?: string) {
    const element = forced ?? elementOf(actor);
    const evade = Object.entries(target.evades).find(([, n]) => n > 0);
    if (evade) {
      target.evades[evade[0]]--;
      this.emit({ kind: 'evade', target: target.id, text: `${target.name} esquive (${evade[0]})` });
      return;
    }
    const matches = (e: { element?: Element }) => !e.element || e.element === element;
    const power = statOf(actor, actor.attack.stat);
    const bonus = sum(effectsOf(actor, 'damageBonus').filter(matches).map((e) => e.percent));
    const pierce = Math.min(100, sum(effectsOf(actor, 'pierce').filter(matches).map((e) => e.percent)));
    const defense = statOf(target, 'defense') * (1 - pierce / 100);
    let damage = Math.max(1, ((power * percent) / 100) * (1 + bonus / 100) - defense);

    let crit = false;
    if (!extraName) {
      actor.critMeter += statOf(actor, 'crit');
      if (actor.critMeter >= 100) {
        actor.critMeter -= 100;
        crit = true;
        damage *= 1 + (BASE_CRIT_DAMAGE + sum(effectsOf(actor, 'critDamage').map((e) => e.percent))) / 100;
      }
    }
    damage *= this.received(actor, target, element);
    this.hurt(actor, target, damage, element, extraName ? 'extra' : crit ? 'crit' : 'hit', extraName ?? (crit ? 'Coup critique' : 'Coup'));
    if (target.hp <= 0 || extraName) return;

    const stacks = sum(effectsOf(actor, 'applyBurn').filter(matches).map((e) => e.stacks));
    if (stacks) this.addBurns(actor, target, stacks);
  }

  /** Multiplicateur des dégâts reçus : résistance, peur, protection. */
  private received(actor: Combatant, target: Combatant, element: Element): number {
    let mult = 1 - (target.resist[element] ?? 0) / 100;
    if (actor.tags.some((t) => target.fears.includes(t))) {
      const guard = sum(effectsOf(target, 'fearGuard').map((e) => e.percent));
      mult *= 1 + (FEAR_DAMAGE - guard) / 100;
    }
    if (target.guarding) mult *= 1 - GUARD_REDUCTION / 100;
    return Math.max(0, mult);
  }

  private addBurns(actor: Combatant, target: Combatant, stacks: number) {
    const tick = statOf(actor, actor.attack.stat) * BURN.ratio * (1 + sum(effectsOf(actor, 'burnBonus').map((e) => e.percent)) / 100);
    for (let i = 0; i < stacks; i++) target.burns.push({ turns: BURN.duration, tick, sourceId: actor.id });

    const detonates = effectsOf(actor, 'detonate');
    if (!detonates.length || target.burns.length < Math.min(...detonates.map((e) => e.threshold))) return;
    const left = sum(target.burns.map((b) => b.turns * b.tick));
    const n = target.burns.length;
    target.burns = [];
    const damage = (left * sum(detonates.map((e) => e.percent))) / 100;
    this.hurt(actor, target, damage * this.received(actor, target, 'fire'), 'fire', 'explosion', `Explosion de ${n} brûlures`);
    const again = sum(effectsOf(actor, 'afterDetonate').map((e) => e.burnStacks));
    if (target.hp > 0) for (let i = 0; i < again; i++) target.burns.push({ turns: BURN.duration, tick, sourceId: actor.id });
  }

  private hurt(source: Combatant, target: Combatant, raw: number, element: Element, hit: 'hit' | 'crit' | 'burn' | 'explosion' | 'extra', label: string) {
    const amount = Math.round(raw);
    target.hp = Math.max(0, target.hp - amount);
    this.emit({ kind: 'damage', source: source.id, target: target.id, amount, element, hit, text: `${label} : ${amount}` });
    if (target.charging && target.hp > 0) {
      target.charging.taken += amount;
      if (target.charging.taken >= target.charging.breakAt) {
        target.charging = null;
        target.stunned = 1;
        this.emit({ kind: 'status', target: target.id, text: `${target.name} est interrompu !` });
      }
    }
    if (target.hp === 0) {
      this.emit({ kind: 'ko', target: target.id, text: `${target.name} tombe.` });
      if (!this.alive('enemy').length) this.finish('win', 'Victoire !');
      else if (!this.alive('hero').length) this.finish('lose', 'Défaite…');
    }
  }

  /** Fin du tour de l'acteur : ses brûlures font effet, ses bonus s'usent, il avance dans le temps. */
  private endTurn(actor: Combatant) {
    actor.turnsTaken++;
    if (actor.burns.length && this.outcome === 'ongoing') {
      // Les charges d'un même lanceur sont additionnées puis arrondies ensemble.
      for (const sourceId of new Set(actor.burns.map((b) => b.sourceId))) {
        const own = actor.burns.filter((b) => b.sourceId === sourceId);
        const source = this.get(sourceId);
        const damage = sum(own.map((b) => b.tick)) * this.received(source, { ...actor, guarding: false }, 'fire');
        if (actor.hp > 0) this.hurt(source, actor, damage, 'fire', 'burn', `Brûlure ×${own.length}`);
      }
      actor.burns = actor.burns.map((b) => ({ ...b, turns: b.turns - 1 })).filter((b) => b.turns > 0);
    }
    // La repousse, sauf si on vient de le couper.
    const regen = sum(effectsOf(actor, 'regen').map((e) => e.percent));
    if (regen && actor.hp > 0 && this.outcome === 'ongoing') {
      if (actor.wounded) this.emit({ kind: 'status', target: actor.id, text: `Les coupures empêchent ${actor.name} de repousser.` });
      else {
        const amount = Math.min(actor.stats.hp - actor.hp, Math.round((actor.stats.hp * regen) / 100));
        if (amount > 0) {
          actor.hp += amount;
          this.emit({ kind: 'heal', target: actor.id, amount, text: `${actor.name} repousse : +${amount} PV` });
        }
      }
    }
    actor.wounded = Math.max(0, actor.wounded - 1);
    actor.bound = Math.max(0, actor.bound - 1);
    actor.buffs = actor.buffs.map((b) => ({ ...b, turns: b.turns - 1 })).filter((b) => b.turns > 0);
    actor.time += TIME_SCALE / speedOf(actor);
  }

  private finish(outcome: Outcome, text: string) {
    if (this.outcome !== 'ongoing') return;
    this.outcome = outcome;
    this.emit({ kind: 'end', outcome, text });
  }

  private emit(e: BattleEvent) {
    this.log.push(e);
  }
}

// ---------- Fabriquer des combattants ----------

/** Ce que le jeu sait du héros en plus de son build. */
export interface HeroContext {
  id?: string;
  name?: string;
  /** Niveaux entre 0 et 1, ex. { hair: 0.8 } pour des cheveux longs. */
  levels?: Record<string, number>;
  /** Tags des créatures dont il a peur, ex. ['spider']. */
  fears?: Tag[];
}

/**
 * Les actions de base, connues de tous. Ce sont des règles plus que du contenu, d'où leur place ici ;
 * src/data/skills.ts les reprend avec les autres compétences.
 */
export const BASIC_SKILLS: Skill[] = [
  { id: 'attack', name: 'Attaque', description: 'Une attaque normale.', target: 'enemy', effects: [{ type: 'damage', percent: 100 }] },
  {
    id: 'guard',
    name: 'Se protéger',
    description: 'Dégâts reçus réduits de moitié jusqu’au prochain tour, et +20 % de mana.',
    target: 'self',
    effects: [{ type: 'guard', manaPercent: 20 }],
  },
  { id: 'flee', name: 'Fuir', description: 'Quitter le combat.', target: 'self', effects: [{ type: 'flee' }] },
  { id: 'wait', name: 'Attendre', description: 'Ne rien faire.', target: 'self', effects: [], whileBound: true },
  {
    id: 'struggle',
    name: 'Se débattre',
    description: 'Se libérer quand on est entravé.',
    target: 'self',
    effects: [{ type: 'free' }],
    whileBound: true,
  },
];

/** Compétences connues de tous les héros. */
export const COMMON_SKILLS = ['attack', 'guard', 'struggle', 'flee'];

/** Un héros à partir de son build : stats, passifs, compétences. */
export function heroFromBuild(result: BuildResult, ctx: HeroContext = {}): Combatant {
  const stats = Object.fromEntries(STAT_KEYS.map((k) => [k, result.stats[k].total])) as Stats;
  const passives = result.passives.map((g) => g.passive);
  return makeCombatant({
    id: ctx.id ?? 'hero',
    name: ctx.name ?? 'Héros',
    side: 'hero',
    stats,
    attack: result.attack ?? { stat: 'strength', element: 'physical' },
    skills: [...COMMON_SKILLS, ...result.skills.filter((s) => !COMMON_SKILLS.includes(s))],
    passives,
    tags: [],
    fears: ctx.fears ?? [],
    resist: {},
    levels: ctx.levels ?? {},
  });
}

/**
 * Un monstre à partir de sa fiche. Plusieurs exemplaires : passer un id différent.
 * power : points de puissance, multipliés par sa croissance (growth). Ex. la force de la légende.
 */
export function monsterCombatant(m: Monster, allPassives: Passive[] = [], id = m.id, power = 0): Combatant {
  const stats = { ...m.stats };
  for (const [k, v] of Object.entries(m.growth ?? {})) stats[k as StatKey] += Math.round(v * Math.max(0, power));
  return makeCombatant({
    id,
    name: m.name,
    side: 'enemy',
    stats,
    attack: m.attack,
    skills: m.skills,
    passives: (m.passives ?? []).map((p) => {
      const found = allPassives.find((x) => x.id === p);
      if (!found) throw new Error(`Passif inconnu : ${p}`);
      return found;
    }),
    tags: m.tags,
    fears: [],
    resist: m.resist ?? {},
    levels: {},
    ai: m.ai,
  });
}

type CombatantBase = Pick<
  Combatant,
  'id' | 'name' | 'side' | 'stats' | 'attack' | 'skills' | 'passives' | 'tags' | 'fears' | 'resist' | 'levels' | 'ai'
>;

export function makeCombatant(base: CombatantBase): Combatant {
  const evades: Record<string, number> = {};
  for (const p of base.passives) for (const e of p.effects) if (e.type === 'evade') evades[e.name] = (evades[e.name] ?? 0) + e.charges;
  return {
    ...base,
    hp: base.stats.hp,
    mana: base.stats.mana,
    time: 0,
    turnsTaken: 0,
    critMeter: 0,
    burns: [],
    buffs: [],
    guarding: false,
    evades,
    usedOnce: [],
    bound: 0,
    wounded: 0,
    stunned: 0,
    charging: null,
  };
}

// ---------- Outils ----------

/** La première règle de l'IA dont la condition est remplie (et la mana suffisante). */
export function chooseAiSkill(actor: Combatant, skillOf: (id: string) => Skill, usable?: Skill[]): string {
  const turn = actor.turnsTaken + 1;
  for (const [i, rule] of (actor.ai ?? []).entries()) {
    const key = `ai${i}`;
    if (rule.hpBelow !== undefined && actor.hp / actor.stats.hp >= rule.hpBelow) continue;
    if (rule.every !== undefined && turn % rule.every !== 0) continue;
    if (rule.once && actor.usedOnce.includes(key)) continue;
    if ((skillOf(rule.skill).cost ?? 0) > actor.mana) continue;
    if (usable && !usable.some((s) => s.id === rule.skill)) continue;
    if (rule.once) actor.usedOnce.push(key);
    return rule.skill;
  }
  return usable?.[0]?.id ?? actor.skills[0];
}

export function effectsOf<T extends PassiveEffect['type']>(f: Combatant, type: T) {
  return f.passives.flatMap((p) => p.effects).filter((e): e is Extract<PassiveEffect, { type: T }> => e.type === type);
}

/** L'élément des attaques : celui de la classe, sauf si un passif le change (le dernier obtenu l'emporte). */
export function elementOf(f: Combatant): Element {
  return effectsOf(f, 'convert').at(-1)?.element ?? f.attack.element;
}

/** Une stat avec les bonus temporaires. */
export function statOf(f: Combatant, stat: StatKey): number {
  const pct = sum(f.buffs.filter((b) => b.stat === stat).map((b) => b.percent));
  return f.stats[stat] * (1 + pct / 100);
}

export function speedOf(f: Combatant): number {
  return Math.max(1, statOf(f, 'speed'));
}

function tagBonus(bonus: Record<Tag, number> | undefined, target: Combatant): number {
  return sum(Object.entries(bonus ?? {}).filter(([t]) => target.tags.includes(t)).map(([, v]) => v));
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
