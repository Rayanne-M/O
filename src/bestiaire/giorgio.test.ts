import { describe, expect, it } from 'vitest';
import type { Dir } from '../village/art/planche.js';
import { GIORGIO_PAL, giorgioFrames, portraitRows, PORTRAIT } from './giorgio';

const DIRS: Dir[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const letters = (rows: string[]) => new Set(rows.join('').replace(/\./g, ''));

describe('Giorgio', () => {
  it('a un repos et 4 images de marche de 24 × 34 dans chaque direction', () => {
    for (const d of DIRS) {
      const frames = giorgioFrames(d);
      expect(frames).toHaveLength(5);
      for (const f of frames) {
        expect(f).toHaveLength(34);
        for (const r of f) expect(r).toHaveLength(24);
      }
    }
  });

  it('n’utilise que des couleurs de sa palette', () => {
    for (const d of DIRS) for (const f of giorgioFrames(d)) for (const k of letters(f)) expect(GIORGIO_PAL, `${d} : ${k}`).toHaveProperty(k);
    for (const k of letters(portraitRows('affame', 1))) expect({ ...GIORGIO_PAL, v: '' }, k).toHaveProperty(k);
  });

  it('a un portrait de 64 × 64', () => {
    const p = portraitRows('neutre');
    expect(p).toHaveLength(PORTRAIT);
    for (const r of p) expect(r).toHaveLength(PORTRAIT);
  });
});
