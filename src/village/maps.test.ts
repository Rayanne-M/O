import { describe, expect, it } from 'vitest';
import { BEDROOM, VILLAGE, type MapDef, type Rect } from './maps';

// Les mêmes règles que world.ts : les pieds du héros (10×4) ne touchent aucun obstacle,
// et le bouton A vise un point à 10 px devant lui.
const VEC = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
const inRect = (x: number, y: number, r: Rect) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const free = (m: MapDef, x: number, y: number) => !m.solids.some((r) => overlap({ x: x - 5, y: y - 4, w: 10, h: 4 }, r));

/** Toutes les positions où le héros peut marcher, en partant d'une entrée de la carte. */
function walkable(m: MapDef, from: { x: number; y: number }) {
  const seen = new Set<number>();
  const key = (x: number, y: number) => y * 10000 + x;
  const todo = [[from.x, from.y]];
  seen.add(key(from.x, from.y));
  while (todo.length) {
    const [x, y] = todo.pop()!;
    for (const [dx, dy] of VEC.slice(0, 8).filter((_, i) => i % 2 === 0)) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx > m.w || ny > m.h || seen.has(key(nx, ny)) || !free(m, nx, ny)) continue;
      seen.add(key(nx, ny));
      todo.push([nx, ny]);
    }
  }
  return [...seen].map((k) => [k % 10000, Math.floor(k / 10000)]);
}

describe.each([['la chambre', BEDROOM], ['le village', VILLAGE]] as const)('%s', (_, m) => {
  const cells = walkable(m, Object.values(m.spawns)[0]);
  it.each(Object.keys(m.spots))('on peut utiliser « %s » avec A', (name) => {
    const spot = m.spots[name];
    const ok = cells.some(([x, y]) => VEC.some(([vx, vy]) => inRect(x + vx * 10, y - 3 + vy * 10, spot)));
    expect(ok).toBe(true);
  });
  it.each(Object.keys(m.spawns))('on peut marcher depuis l’entrée « %s »', (name) => {
    const s = m.spawns[name];
    expect(cells.some(([x, y]) => x === s.x && y === s.y)).toBe(true);
  });
});

// Une porte s'ouvre en lui faisant face, pas seulement en la longeant.
describe('les portes', () => {
  const facing = (m: MapDef, spot: string, [vx, vy]: number[]) => {
    const cells = walkable(m, Object.values(m.spawns)[0]);
    return cells.some(([x, y]) => inRect(x + vx * 10, y - 3 + vy * 10, m.spots[spot]));
  };
  it('la porte de la chambre, en regardant vers le bas', () => expect(facing(BEDROOM, 'door', [0, 1])).toBe(true));
  it.each(Object.keys(VILLAGE.spots).filter((s) => s.startsWith('door-')))('%s, en regardant vers le haut', (s) =>
    expect(facing(VILLAGE, s, [0, -1])).toBe(true));
});
