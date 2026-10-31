import { gameData } from '../../data';
import type { HeroContext } from '../../engine/battle';
import type { Build, GameData } from '../../engine/types';
import type { Gauge, State } from './state';

// Le pont entre l'histoire et le combat : ce que l'enfance a laissé sur le héros devient un build.
// - la jauge la plus haute donne la classe (Guerrier, Mage, Voleur) ;
// - un trait de l'histoire qui porte le nom d'un passif devient ce passif (« Cheveux vivants ») ;
// - un objet de l'histoire qui existe comme équipement est porté (« ciseaux », « baton », « ruban »),
//   un seul par emplacement ;
// - les peurs (« a peur ») rendent les créatures du même tag plus fortes ;
// - la longueur des cheveux règle la force du pacte capillaire.
// Ajouter un passif ou un objet avec le même nom ou identifiant que dans l'histoire suffit à le relier.

const CLASS_OF: Record<Gauge, string> = { guerrier: 'warrior', mage: 'mage', voleur: 'rogue' };

export function heroFromState(state: State, data: GameData = gameData): { build: Build; ctx: HeroContext } {
  const gauges = Object.entries(state.gauges) as [Gauge, number][];
  const [best] = gauges.reduce((a, b) => (b[1] > a[1] ? b : a));

  const names = new Map(data.passives.map((p) => [p.name.toLowerCase(), p.id]));
  const traitIds = state.traits.flatMap((t) => names.get(t.toLowerCase()) ?? []);

  const slots = new Set<string>();
  const equipmentIds: string[] = [];
  for (const id of state.items) {
    const item = data.equipment?.find((e) => e.id === id);
    if (!item || slots.has(item.slot)) continue;
    slots.add(item.slot);
    equipmentIds.push(id);
  }

  return {
    build: { classId: CLASS_OF[best], blessingIds: [], curseIds: [], traitIds, equipmentIds },
    ctx: {
      name: 'Héros',
      levels: { hair: state.hair },
      fears: Object.entries(state.fears).filter(([, level]) => level === 'peur').map(([subject]) => subject),
    },
  };
}
