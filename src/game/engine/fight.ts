import { battleData, gameData } from '../../data';
import { Battle, heroFromBuild, monsterCombatant, type Outcome } from '../../engine/battle';
import { evaluateBuild } from '../../engine/build';
import { runBattle, type ScreenOptions } from '../../combat/screen';
import type { Game } from './game';
import { heroFromState } from './hero-build';
import { state } from './state';

// Lancer un combat depuis l'histoire : le héros tel que l'histoire l'a fait (objets, traits, peurs, cheveux)
// contre un monstre des données, sur l'écran de combat commun. Rend l'issue : win, lose, fled, enemyFled.

export interface FightOptions extends Pick<ScreenOptions, 'intro' | 'tip' | 'endings'> {
  /** Puissance du monstre (multipliée par sa croissance), ex. la force de la légende. */
  power?: number;
  /** Faux : pas de bouton Fuir. */
  canFlee?: boolean;
  /** Vrai pendant l'enfance : classe Enfant. */
  child?: boolean;
}

export async function fight(g: Game, monsterId: string, o: FightOptions = {}): Promise<Outcome> {
  const monster = battleData.monsters.find((m) => m.id === monsterId);
  if (!monster) throw new Error(`Monstre inconnu : ${monsterId}`);
  const { build, ctx } = heroFromState(state, { child: o.child ?? true });
  const hero = heroFromBuild(evaluateBuild(build, gameData), { ...ctx, name: 'Toi' });
  if (o.canFlee === false) hero.skills = hero.skills.filter((s) => s !== 'flee');
  const foe = monsterCombatant(monster, gameData.passives, monster.id, o.power ?? 0);
  const battle = new Battle([hero], [foe], battleData);
  const look = { build, hair: state.hair, child: o.child ?? true, pact: state.traits.includes('Cheveux vivants') && state.hair >= 0.1 };
  return g.cut(() => runBattle(document.getElementById('stage')!, { battle, look, intro: o.intro, tip: o.tip, endings: o.endings }).done);
}
