import { describe, expect, it } from 'vitest';
import { active, auditMap, blocked, entersExit, flagsOk, loadMap, nearestFree, sortLine, type MapFile } from './maps';

// Toutes les cartes du jeu, telles que le jeu les charge : chaque nouvelle carte est vérifiée sans rien ajouter ici.
const files = Object.fromEntries(
  Object.entries(import.meta.glob('../../../rpg/data/maps/*.json', { eager: true, import: 'default' })).map(([k, v]) => [k.split('/').pop()!, v]),
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
  // une porte dans un mur horizontal : le mur bloque tout ce qui est au-dessus de y = 60
  const door = { x: 100, y: 50, w: 12, h: 10 };
  const wall = (_x: number, y: number) => y - 4 < 60;
  it('il faut buter contre le mur à l\'endroit de la porte, en avançant vers elle', () => {
    expect(entersExit(106, 64, 0, -1, door, wall)).toBe(true);
    expect(entersExit(106, 66, 0, -1, door, wall)).toBe(false); // pas encore contre le mur
    expect(entersExit(106, 64, 0, 1, door, wall)).toBe(false); // dos à la porte
    expect(entersExit(94, 64, 0, -1, door, wall)).toBe(false); // à côté
    expect(entersExit(99, 64, 0, -1, door, wall)).toBe(true); // un peu de côté, mais sur la porte
    expect(entersExit(106, 64, 1, 0, door, wall)).toBe(false); // la longe
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
