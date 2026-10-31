import { describe, expect, it } from 'vitest';
import { heroFromState } from './hero-build';
import { newState } from './state';

describe('heroFromState', () => {
  it('relie la jauge, les traits, les objets, les peurs et les cheveux au combat', () => {
    const s = newState();
    s.gauges = { guerrier: 1, mage: 3, voleur: 2 };
    s.traits = ['Cheveux vivants', 'Conteur'];
    s.items = ['ciseaux', 'baton', 'ruban'];
    s.fears = { araignees: 'peur', eau: 'aime' };
    s.hair = 0.6;
    const { build, ctx } = heroFromState(s);
    expect(build.classId).toBe('mage');
    expect(build.traitIds).toEqual(['living_hair']);
    // une seule arme : les ciseaux, trouvés en premier
    expect(build.equipmentIds).toEqual(['ciseaux', 'ruban']);
    expect(ctx.fears).toEqual(['araignees']);
    expect(ctx.levels).toEqual({ hair: 0.6 });
  });
});
