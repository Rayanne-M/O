// Tout le contenu tient ensemble : cartes, personnages, dessins, scénario et code des chapitres se citent sans erreur.
// Le détail des liens vérifiés est dans scripts/rpg/verifier.mjs ; « npm run verifier » affiche le rapport complet.
import { describe, expect, it } from 'vitest';
import { verifier, rapport } from '../../../scripts/rpg/verifier.mjs';

describe('liens du contenu (rpg/)', () => {
  it('aucune référence cassée', () => {
    const r = verifier();
    expect(r.erreurs, rapport(r, { details: false })).toEqual([]);
  });
});
