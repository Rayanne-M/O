import { describe, expect, it } from 'vitest';
import { active, auditMap, blocked, entersExit, flagsOk, loadMap, nearestFree, sortLine, type MapFile } from './maps';

// Toutes les cartes du jeu, telles que le jeu les charge : chaque nouvelle carte est vérifiée sans rien ajouter ici.
const files = Object.fromEntries(
  Object.entries(import.meta.glob('../data/maps/*.json', { eager: true, import: 'default' })).map(([k, v]) => [k.split('/').pop()!, v]),
);
const index = files['index.json'] as { start: { map: string; at: string }; maps: Record<string, { file: string }> };
// une copie, comme le jeu
const maps = Object.fromEntries(
  Object.entries(index.maps).map(([id, e]) => [id, loadMap(JSON.parse(JSON.stringify(files[e.file])) as MapFile, () => {})]),
);

// Défauts connus des cartes, signalés au fil des cartes : à retirer d'ici quand ils sont corrigés.
const KNOWN: Record<string, string[]> = {
};

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
    it('chaque sortie se passe en avançant vers elle depuis une case libre', () => {
      for (const e of m.exits) {
        let ok = false;
        for (let y = e.px.y - 24; y <= e.px.y + e.px.h + 24 && !ok; y++)
          for (let x = e.px.x - 24; x <= e.px.x + e.px.w + 24 && !ok; x++)
            if (!blocked(m, x, y)) ok = [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dy]) => entersExit(x, y, dx, dy, e.px));
        expect(ok, e.id).toBe(true);
      }
    });
    it('depuis les arrivées, on atteint chaque sortie et chaque objet à examiner', () => {
      expect(auditMap(m)).toEqual({ exits: [], objects: KNOWN[id] ?? [] });
    });
    it('on ne naît jamais dans un mur (au pire, une case à côté)', () => {
      for (const [s, p] of Object.entries(m.spawns)) {
        const q = nearestFree(m, p.x, p.y);
        expect(blocked(m, q.x, q.y), s).toBe(false);
      }
    });
  });
});

describe('les portes', () => {
  const door = { x: 100, y: 50, w: 12, h: 10 };
  it('il faut être au bout et avancer vers elle', () => {
    expect(entersExit(106, 65, 0, -1, door)).toBe(true);
    expect(entersExit(106, 80, 0, -1, door)).toBe(false); // trop loin
    expect(entersExit(106, 65, 0, 1, door)).toBe(false); // dos à la porte
    expect(entersExit(94, 65, 0, -1, door)).toBe(false); // à côté
    expect(entersExit(106, 64, 1, 0, door)).toBe(false); // la longe
    expect(entersExit(106, 68, 0, -1, door)).toBe(true); // pas besoin d'être collé
    expect(entersExit(99, 65, 0, -1, door)).toBe(true); // un peu de côté
    expect(entersExit(98, 65, 0, -1, door)).toBe(false); // trop de côté
  });
});

describe('le tri devant / derrière', () => {
  const bed = { x: 0, w: 35, top: 30, bottom: 77 };
  it('à côté du lit, on passe devant', () => expect(sortLine(41, 60, [bed])).toBeGreaterThan(77));
  it('au-dessus du lit, on passe derrière', () => expect(sortLine(20, 25, [bed])).toBeLessThan(77));
  it('en dessous, devant', () => expect(sortLine(20, 90, [bed])).toBeGreaterThan(77));
  it('jamais devant une armoire qu\'on a devant soi', () => {
    const chest = { x: 36, w: 20, top: 66, bottom: 74 };
    expect(sortLine(41, 60, [bed, chest])).toBeLessThan(74);
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
