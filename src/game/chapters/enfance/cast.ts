// Les personnages de l'enfance : nom, allure et portrait viennent du registre rpg/data/personnages.json.
import * as A from 'virtual:rpg-art';
import type { Look } from '../../engine/actors';
import type { Speaker } from '../../engine/game';
import { state } from '../../engine/state';
import registre from '../../../../rpg/data/personnages.json';

const P = A.NPC_PAL as Record<string, Record<string, string>>;

/** Un personnage du registre rpg/data/personnages.json (le même que celui des cartes et du scénario). */
interface Personnage { nom: string; sprite?: string; portrait?: string; enfant?: boolean; cheveux?: number; tenue?: Look['outfit']; palette?: string }
export const PERSONNAGES = registre.personnages as Record<string, Personnage>;

const paletteOf = (p: Personnage) =>
  p.palette === 'PAL' ? A.PAL : p.palette === 'CHILD_PAL' ? A.CHILD_PAL : (P[p.palette ?? ''] ?? (p.enfant ? A.CHILD_PAL : A.PAL));

/** L'allure de chaque personnage, tirée du registre : char = gabarit de la planche (chars.js), pal = couleurs de secours. */
export const LOOKS: Record<string, Look> = Object.fromEntries(
  Object.entries(PERSONNAGES)
    .filter(([, p]) => p.sprite)
    .map(([id, p]) => [id, { char: p.sprite, child: !!p.enfant, hair: p.cheveux ?? 0.3, outfit: p.tenue, pal: paletteOf(p) }]),
);

/** Le héros : sa coiffure change chez le barbier, le pacte et les offrandes teintent ses couleurs. */
export function heroLook(): Look {
  return {
    char: state.hair >= 0.7 ? 'heros_long' : state.hair >= 0.4 ? 'heros_pointes' : 'heros_court',
    child: true,
    hair: state.hair,
    pal: A.CHILD_PAL,
    bless: Math.min(1, (state.counts.beni ?? 0) / 100),
    curse: Math.min(1, (state.counts.maudit ?? 0) / 100),
  };
}

/** Portrait de la planche (portraits.js) ; l'expression vient de la réplique : say('elio:triste', …). */
const portrait = (who: string): Speaker['portrait'] => (ctx, t, talking, expr) =>
  A.drawPortrait(ctx, who, t, { expr: expr ?? 'neutre', open: talking ? 0.55 + 0.45 * Math.abs(Math.sin(t / 70)) : 0 });

/** Qui parle : nom, allure et portrait viennent du registre ; seuls le narrateur, le héros et l'Esprit ont un réglage à part. */
export const SPEAKERS: Record<string, Speaker> = {
  narr: { name: '', portrait: null },
  ...Object.fromEntries(
    Object.entries(PERSONNAGES).map(([id, p]) => [id, { name: p.nom, look: LOOKS[id], ...(p.portrait ? { portrait: portrait(p.portrait) } : {}) }]),
  ),
  heros: { name: PERSONNAGES.heros?.nom ?? 'Toi', get look() { return heroLook(); }, portrait: portrait('heros') },
  // l'Esprit parle par le visage d'Élio : portrait animé de la planche
  esprit: { name: PERSONNAGES.esprit?.nom ?? '???', portrait: (ctx, t, talking) => A.talkPortrait(ctx, t, talking ? 0.55 + 0.45 * Math.abs(Math.sin(t / 70)) : 0.05) },
};

/** Un habitant posé sur une carte (champ npcs) : son allure, d'après le registre. Les bêtes restent à la carte. */
export function npcLook(id: string, look?: string): Look | undefined {
  return LOOKS[look ?? id];
}
