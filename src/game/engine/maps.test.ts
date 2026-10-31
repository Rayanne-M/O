import { describe, expect, it } from 'vitest';
import { active, blocked, flagsOk, loadMap, nearestFree, type MapFile } from './maps';

// Toutes les cartes du jeu, telles que le jeu les charge : chaque nouvelle carte est vérifiée sans rien ajouter ici.
const files = Object.fromEntries(
  Object.entries(import.meta.glob('../data/maps/*.json', { eager: true, import: 'default' })).map(([k, v]) => [k.split('/').pop()!, v]),
);
const index = files['index.json'] as { start: { map: string; at: string }; maps: Record<string, { file: string }> };
// une copie, comme le jeu
const maps = Object.fromEntries(
  Object.entries(index.maps).map(([id, e]) => [id, loadMap(JSON.parse(JSON.stringify(files[e.file])) as MapFile, () => {})]),
);

describe('les cartes', () => {
  it('chaque fichier du dossier est dans l\'index', () => {
    expect(Object.keys(files).filter((f) => f !== 'index.json').sort()).toEqual(Object.values(index.maps).map((e) => e.file).sort());
  });

  it('le départ existe', () => {
    expect(maps[index.start.map]?.spawns[index.start.at]).toBeDefined();
  });

  describe.each(Object.keys(maps))('%s', (id) => {
    const m = maps[id];
    it('chaque sortie mène à une arrivée qui existe', () => {
      for (const e of m.exits) expect(maps[e.to]?.spawns[e.at], `${e.id} → ${e.to}/${e.at}`).toBeDefined();
    });
    it('on ne naît jamais dans un mur (au pire, une case à côté)', () => {
      for (const [s, p] of Object.entries(m.spawns)) {
        const q = nearestFree(m, p.x, p.y);
        expect(blocked(m, q.x, q.y), s).toBe(false);
      }
    });
  });
});

describe('les conditions', () => {
  const flags = new Set(['a_ruban']);
  const flag = (f: string) => flags.has(f);
  it('lit et, ou, non', () => {
    expect(flagsOk('a_ruban', flag)).toBe(true);
    expect(flagsOk('!a_ruban', flag)).toBe(false);
    expect(flagsOk('a_ruban && pain_pose', flag)).toBe(false);
    expect(flagsOk('pain_pose || a_ruban', flag)).toBe(true);
  });
  it('filtre par jour, moment et nuit', () => {
    const now = { day: 2, moment: 'matin', night: false };
    expect(active(undefined, now, flag)).toBe(true);
    expect(active({ day: [1, 2], moment: ['matin', 'midi'] }, now, flag)).toBe(true);
    expect(active({ day: 3 }, now, flag)).toBe(false);
    expect(active({ night: true }, now, flag)).toBe(false);
    expect(active({ if: '!a_ruban' }, now, flag)).toBe(false);
  });
});
