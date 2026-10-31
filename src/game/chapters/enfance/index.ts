// Chapitre 1 : l'enfance. Le chapitre relie le moteur à l'histoire (story.ts) :
// écran titre, choix du jour de départ (?jour=2, ?nuit=3), réactions, décor, et le bilan de fin.
import type { Chapter, Game } from '../../engine/game';
import { worldMaps } from '../../engine/world';
import { newState, setState, state } from '../../engine/state';
import { ui } from '../../engine/ui';
import { SPEAKERS, heroLook, npcLook } from './cast';
import { ENDINGS, H, force, hooks, mapOptions, playAct, storyDecor } from './story';

/** Où commencer : ?jour=N pour un jour, ?nuit=3 pour la nuit du puits, ?scene=cache-cache. */
function startAt() {
  const q = new URLSearchParams(location.search);
  const night = q.get('nuit');
  return { day: Number(night ?? q.get('jour') ?? 1) || 1, night: night !== null, scene: q.get('scene') ?? undefined };
}

/** Ce que les jours sautés auraient laissé : un parcours moyen, pour pouvoir tester un jour seul. */
function skipTo(day: number) {
  if (day >= 2) Object.assign(state.counts, { bougie_allumee: 1, bougie_possible: 1, legende: 2 });
  if (day >= 3) state.hair = 0.55;
}

export const enfance: Chapter = {
  maps: () => worldMaps('enfance'),
  speakers: SPEAKERS,
  npcLook,
  async run(g: Game) {
    for (;;) {
      const from = startAt();
      const k = await ui.title(
        'L\'Enfance',
        'Trois jours au village, avant que tout commence.',
        ['Commencer', 'Commencer (images choquantes adoucies)'],
      );
      setState(newState(k === 1, { legende: 1, rancoeur: 2, peur: 0 }));
      skipTo(from.day);
      g.hero.look = heroLook();
      const end = await playAct(g, from);
      g.showPlan(null);
      ui.setHud('', '');
      await ui.summary(summary(ENDINGS[end].name));
    }
  },
  interact: (g, targets) => H.interactAll(g, targets),
  canInteract: (_g, targets) => H.has(targets),
  async canExit(g, e) {
    const fn = H.match({ kind: 'exit', id: e.id, map: g.map.id });
    if (fn) return (await fn(g)) === true;
    if (e.locked === true || (e.locked === 'nuit' && g.night)) {
      await g.say('narr', 'C\'est fermé.');
      return false;
    }
    return true;
  },
  enter(g, zone) {
    const fn = H.find(`enter:${g.map.id}/${zone}`) ?? H.find(`enter:${zone}`);
    if (fn) void g.cut(async () => fn(g));
  },
  arrived(_g, map) {
    hooks.arrived?.(map);
  },
  decor: (g, map, t) => storyDecor(g, map, t),
  mapOptions,
};

/** Le bilan : ce que l'enfance a laissé au héros. */
function summary(endName: string) {
  const fears: Record<string, string> = { araignees: 'les araignées', noir: 'le noir', cheveux: 'les cheveux', eau: 'l\'eau' };
  const lvl: Record<string, string> = { aime: 'aime', neutre: 'indifférent à', peur: 'a peur de' };
  return {
    title: `Fin : ${endName}`,
    lines: [
      `Guerrier ${state.gauges.guerrier} · Mage ${state.gauges.mage} · Voleur ${state.gauges.voleur}`,
      `Traits : ${state.traits.join(', ') || 'aucun'}`,
      `Objets : ${state.items.join(', ') || 'aucun'}`,
      `Peurs : ${Object.entries(state.fears).map(([k, v]) => `${lvl[v]} ${fears[k] ?? k}`).join(', ') || 'aucune'}`,
      `Cheveux : ${state.hair >= 0.7 ? 'longs' : state.hair >= 0.4 ? 'aux épaules' : 'courts'} · Béni ${state.counts.beni ?? 0} · Maudit ${state.counts.maudit ?? 0}`,
      `Force de l'Esprit au puits : ${force()}`,
    ],
  };
}
