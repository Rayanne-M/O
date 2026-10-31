import { describe, expect, it } from 'vitest';
import { Battle, heroFromBuild, monsterCombatant } from '../engine/battle';
import { evaluateBuild } from '../engine/build';
import { battleData, gameData } from './index';

// L'équilibre des combats de l'enfance : un enfant qui frappe avec ce qu'il a de mieux.
function fight(equipmentIds: string[], monster: string, power = 0) {
  const r = evaluateBuild({ classId: 'child', blessingIds: [], curseIds: [], traitIds: [], equipmentIds }, gameData);
  const hero = heroFromBuild(r);
  const foe = monsterCombatant(battleData.monsters.find((m) => m.id === monster)!, gameData.passives, monster, power);
  const b = new Battle([hero], [foe], battleData);
  for (let n = 0; b.outcome === 'ongoing' && n < 300; n++) {
    if (b.current().side === 'enemy') b.playAi();
    else if (!b.autoTurn()) b.act(['snip', 'stick_swing', 'attack', 'struggle'].find((s) => b.usable(hero).some((u) => u.id === s))!, foe.id);
  }
  return b.outcome;
}

describe('combats de l’enfance', () => {
  it('le tutoriel de la poule se gagne à mains nues', () => {
    expect(fight([], 'grosse_rousse')).toBe('win');
  });
  it('les ciseaux battent la Rancunière tant que sa légende reste modérée', () => {
    expect(fight(['ciseaux'], 'well_spirit_young', 3)).toBe('win');
    expect(fight(['ciseaux'], 'well_spirit_young', 8)).toBe('lose');
  });
  it('le bâton est plus dur : il ne suffit que contre une Rancunière faible', () => {
    expect(fight(['baton'], 'well_spirit_young', 2)).toBe('win');
    expect(fight(['baton'], 'well_spirit_young', 4)).toBe('lose');
  });
});
