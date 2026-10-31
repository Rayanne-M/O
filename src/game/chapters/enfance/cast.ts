// Les personnages de l'enfance : leur allure (palettes de la carte du village) et leur nom.
import * as A from '../../art/shared.js';
import type { Look } from '../../engine/actors';
import type { Speaker } from '../../engine/game';
import { state } from '../../engine/state';

const P = A.NPC_PAL as Record<string, Record<string, string>>;

// char : le gabarit de personnage de la planche (chars.js) ; hair et pal servent aux images de remplacement
export const LOOKS: Record<string, Look> = {
  elio: { char: 'elio', child: true, hair: 0.9, pal: P.elio },
  elio_rase: { char: 'elio_rase', child: true, hair: 0, pal: P.elio },
  elio_capuche: { char: 'elio_capuche', child: true, hair: 0, pal: P.elio },
  margot: { char: 'margot', child: true, hair: 0.75, pal: P.margot },
  basile: { char: 'basile', child: true, hair: 0.15, pal: P.basile },
  mere: { char: 'mere', child: false, hair: 0.45, outfit: 'mage', pal: P.mere },
  fauvel: { char: 'fauvel', child: false, hair: 0.2, pal: P.fauvel },
  aubin: { char: 'aubin', child: false, hair: 1, pal: P.aubin },
  ysol: { char: 'ysol', child: false, hair: 0.3, pal: A.PAL },
  enfant1: { char: 'enfant1', child: true, hair: 0.3, pal: A.CHILD_PAL },
  enfant2: { char: 'enfant2', child: true, hair: 0.55, pal: A.CHILD_PAL },
  enfant3: { char: 'enfant3', child: true, hair: 0.3, pal: A.CHILD_PAL },
  mere_basile: { char: 'mere_basile', child: false, hair: 0.4, pal: A.PAL },
  villageois1: { char: 'villageois1', child: false, hair: 0.3, pal: A.PAL },
  villageois2: { char: 'villageois2', child: false, hair: 0.3, pal: A.PAL },
};

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

export const SPEAKERS: Record<string, Speaker> = {
  narr: { name: '', portrait: null },
  heros: { name: 'Toi', get look() { return heroLook(); }, portrait: portrait('heros') },
  mere: { name: 'Mère', look: LOOKS.mere, portrait: portrait('mere') },
  elio: { name: 'Élio', look: LOOKS.elio, portrait: portrait('elio') },
  elio_rase: { name: 'Élio', look: LOOKS.elio_rase, portrait: portrait('elio_rase') },
  elio_capuche: { name: 'Élio', look: LOOKS.elio_capuche, portrait: portrait('elio_capuche') },
  margot: { name: 'Margot', look: LOOKS.margot, portrait: portrait('margot') },
  basile: { name: 'Basile', look: LOOKS.basile, portrait: portrait('basile') },
  fauvel: { name: 'Maître Fauvel', look: LOOKS.fauvel, portrait: portrait('fauvel') },
  aubin: { name: 'Aubin', look: LOOKS.aubin, portrait: portrait('aubin') },
  ysol: { name: 'Grand-mère Ysol', look: LOOKS.ysol, portrait: portrait('ysol') },
  enfant1: { name: 'Un enfant', look: LOOKS.enfant1 },
  enfant2: { name: 'Une enfant', look: LOOKS.enfant2 },
  enfant3: { name: 'Un petit', look: LOOKS.enfant3 },
  villageois1: { name: 'Un homme', look: LOOKS.villageois1 },
  mere_basile: { name: 'La mère de Basile', look: LOOKS.mere_basile },
  // l'Esprit parle par le visage d'Élio : portrait animé de la planche
  esprit: { name: '???', portrait: (ctx, t, talking) => A.talkPortrait(ctx, t, talking ? 0.55 + 0.45 * Math.abs(Math.sin(t / 70)) : 0.05) },
};

/** Les ids des personnages dans les cartes (champ npcs), vers leur allure ici. Les bêtes restent à la carte. */
const NPC_ALIAS: Record<string, string> = { enfant_a: 'enfant1', enfant_b: 'enfant2', enfant_c: 'enfant3' };
export function npcLook(id: string, look?: string): Look | undefined {
  return LOOKS[look ?? NPC_ALIAS[id] ?? id];
}
