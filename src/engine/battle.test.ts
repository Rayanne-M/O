import { describe, expect, it } from 'vitest';
import { BASIC_SKILLS, Battle, makeCombatant, type Combatant } from './battle';
import type { Passive, PassiveEffect, Skill, Stats } from './types';

const stats = (o: Partial<Stats> = {}): Stats => ({
  hp: 100, mana: 20, strength: 10, agility: 0, intelligence: 0, defense: 0, crit: 0, speed: 10, ...o,
});
const passive = (effects: PassiveEffect[]): Passive => ({ id: 'p', name: 'P', description: '', effects });

const skills: Skill[] = [
  ...BASIC_SKILLS,
  { id: 'big', name: 'Gros coup', description: '', cost: 5, target: 'enemy', effects: [{ type: 'damage', percent: 200 }] },
  { id: 'snip', name: 'Couper', description: '', target: 'enemy', effects: [{ type: 'damage', percent: 100, vsTags: { cheveux: 100 } }] },
  { id: 'heal', name: 'Soin', description: '', target: 'self', effects: [{ type: 'heal', percent: 50 }] },
];

function fighter(o: Partial<Combatant> & { id: string; side: 'hero' | 'enemy' }): Combatant {
  return makeCombatant({
    name: o.id,
    stats: stats(),
    attack: { stat: 'strength', element: 'physical' },
    skills: ['attack', 'guard', 'flee', 'wait', 'big', 'snip', 'heal'],
    passives: [],
    tags: [],
    fears: [],
    resist: {},
    levels: {},
    ...o,
  });
}

describe('Battle', () => {
  it('fait jouer deux fois plus souvent un combattant deux fois plus rapide', () => {
    const b = new Battle([fighter({ id: 'h', side: 'hero', stats: stats({ speed: 20 }) })], [fighter({ id: 'm', side: 'enemy' })], { skills });
    expect(b.preview(6).map((f) => f.id)).toEqual(['h', 'h', 'm', 'h', 'h', 'm']);
    expect(b.current().id).toBe('h');
  });

  it('retire la défense, applique résistances et faiblesses', () => {
    const b = new Battle(
      [fighter({ id: 'h', side: 'hero' })],
      [fighter({ id: 'm', side: 'enemy', stats: stats({ defense: 2 }), resist: { physical: 50 } })],
      { skills },
    );
    const [, hit] = b.act('attack', 'm');
    expect(hit).toMatchObject({ kind: 'damage', amount: 4 }); // (10 − 2) × 50 %
  });

  it('dépense le mana et refuse une compétence trop chère', () => {
    const b = new Battle([fighter({ id: 'h', side: 'hero', stats: stats({ mana: 6 }) })], [fighter({ id: 'm', side: 'enemy' })], { skills });
    b.act('big', 'm');
    expect(b.get('h').mana).toBe(1);
    expect(b.usable(b.get('h')).map((s) => s.id)).not.toContain('big');
  });

  it('frappe plus fort les cibles qui portent le bon tag', () => {
    const b = new Battle([fighter({ id: 'h', side: 'hero' })], [fighter({ id: 'm', side: 'enemy', tags: ['cheveux'] })], { skills });
    expect(b.act('snip', 'm')[1]).toMatchObject({ amount: 20 });
  });

  it('donne un coup en plus selon la longueur des cheveux, et rien une fois rasés', () => {
    const hair = passive([{ type: 'extraStrike', name: 'Coup de cheveux', percent: 60, scaleWith: 'hair' }]);
    const long = new Battle([fighter({ id: 'h', side: 'hero', passives: [hair], levels: { hair: 1 } })], [fighter({ id: 'm', side: 'enemy' })], { skills });
    expect(long.act('attack', 'm').filter((e) => e.kind === 'damage').map((e) => e.kind === 'damage' && e.amount)).toEqual([10, 6]);
    const shaved = new Battle([fighter({ id: 'h', side: 'hero', passives: [hair], levels: { hair: 0 } })], [fighter({ id: 'm', side: 'enemy' })], { skills });
    expect(shaved.act('attack', 'm').filter((e) => e.kind === 'damage')).toHaveLength(1);
  });

  it('esquive le premier coup seulement', () => {
    const b = new Battle(
      [fighter({ id: 'h', side: 'hero' })],
      [fighter({ id: 'm', side: 'enemy', passives: [passive([{ type: 'evade', charges: 1, name: 'Arc-en-ciel' }])] })],
      { skills },
    );
    expect(b.act('attack', 'm').some((e) => e.kind === 'evade')).toBe(true);
    b.act('wait');
    expect(b.act('attack', 'm').some((e) => e.kind === 'damage')).toBe(true);
  });

  it('fait plus mal au héros quand il a peur, moins avec Prudent', () => {
    const run = (passives: Passive[]) => {
      const b = new Battle(
        [fighter({ id: 'h', side: 'hero', fears: ['araignees'], passives })],
        [fighter({ id: 'm', side: 'enemy', tags: ['araignees'] })],
        { skills },
      );
      b.act('wait');
      return b.act('attack', 'h').find((e) => e.kind === 'damage')!;
    };
    expect(run([])).toMatchObject({ amount: 13 }); // 10 × 1,25
    expect(run([passive([{ type: 'fearGuard', percent: 25 }])])).toMatchObject({ amount: 10 });
  });

  it('se protéger divise les dégâts reçus par deux jusqu’au tour suivant', () => {
    const b = new Battle([fighter({ id: 'h', side: 'hero' })], [fighter({ id: 'm', side: 'enemy' })], { skills });
    b.act('guard');
    expect(b.act('attack', 'h').find((e) => e.kind === 'damage')).toMatchObject({ amount: 5 });
  });

  it('suit les règles de l’IA : soin sous 40 % une seule fois, puis attaque', () => {
    const m = fighter({ id: 'm', side: 'enemy', ai: [{ skill: 'heal', hpBelow: 0.4, once: true }, { skill: 'attack' }] });
    const b = new Battle([fighter({ id: 'h', side: 'hero' })], [m], { skills });
    m.hp = 30;
    b.act('wait');
    expect(b.playAi().some((e) => e.kind === 'heal')).toBe(true);
    b.act('wait');
    m.hp = 30;
    expect(b.playAi().some((e) => e.kind === 'heal')).toBe(false);
  });

  it('se termine par une victoire, une défaite ou une fuite', () => {
    const win = new Battle([fighter({ id: 'h', side: 'hero' })], [fighter({ id: 'm', side: 'enemy', stats: stats({ hp: 5 }) })], { skills });
    win.act('attack', 'm');
    expect(win.outcome).toBe('win');
    const fled = new Battle([fighter({ id: 'h', side: 'hero' })], [fighter({ id: 'm', side: 'enemy' })], { skills });
    fled.act('flee');
    expect(fled.outcome).toBe('fled');
    expect(fled.act('attack', 'm')).toEqual([]);
  });
});
