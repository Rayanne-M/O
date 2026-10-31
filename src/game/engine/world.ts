// Les cartes du jeu : lues directement dans rpg/data/maps/ (la source unique, aussi utilisée par la page des cartes).
// Une carte = un fichier JSON au format commun ; drawAnyMap de la planche des cartes les dessine toutes.
import * as A from 'virtual:rpg-art';
import { loadMap, type GameMap, type MapFile, type MapObject, type MapPainter, type MapShape, type Rect } from './maps';

const files = import.meta.glob('../../../rpg/data/maps/*.json', { eager: true, import: 'default' }) as Record<string, MapFile & { maps?: unknown }>;

export interface WorldIndex {
  start: { map: string; at: string };
  maps: Record<string, { name: string; chapter: string; kind: string; file: string }>;
}
export const worldIndex = Object.entries(files).find(([k]) => k.endsWith('/index.json'))![1] as unknown as WorldIndex;

const paint: MapPainter = (ctx, map, t, o) =>
  A.drawAnyMap(ctx, map.file, t, { night: o.night, actors: o.actors, state: o.state, day: o.day, moment: o.moment, flags: o.flags, animals: o.animals });

// La forme au sol, telle que la planche des cartes la définit (objFootPx, la rivière, les hauts-fonds et les ponts).
const T = 16;
const toRect = (b: number[] | null): Rect | null => (b ? { x: b[0], y: b[1], w: b[2], h: b[3] } : null);
const ROOM_FLAT = new Set(['tapis', 'cheveux_sol', 'trappe']);
const OUT_FLAT = new Set(['pont', 'trainee']);
/**
 * Dans une pièce, un meuble bloque exactement là où il est dessiné : on le dessine une fois hors écran et on garde
 * ses pixels opaques (la charrette ne bloque pas le vide entre ses brancards). foot dans la carte (en tuiles,
 * relatif à l'objet) l'emporte. L'emprise rectangulaire (pour le tri) est la boîte de ces pixels.
 */
interface Drawn { box: Rect; data: Uint8Array }
const drawn = new Map<string, Drawn | null>();
function drawnOf(o: MapObject): Drawn | null {
  if (Array.isArray(o.foot)) return null;
  const key = `${o.type}|${o.w}|${o.h}|${o.rot ?? 0}|${o.flip ? 1 : 0}`;
  if (!drawn.has(key)) drawn.set(key, opaque(o, o.w * T, o.h * T));
  return drawn.get(key)!;
}
function opaque(o: MapObject, w: number, h: number): Drawn | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = Math.ceil(w);
  c.height = Math.ceil(h);
  const g = c.getContext('2d')!;
  try {
    A.drawFurni(g, { ...o, px: 0, py: 0, pw: w, ph: h }, 0, false, undefined);
  } catch {
    return null;
  }
  const px = g.getImageData(0, 0, c.width, c.height).data, data = new Uint8Array(c.width * c.height);
  let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  for (let y = 0; y < c.height; y++)
    for (let x = 0; x < c.width; x++)
      if (px[(y * c.width + x) * 4 + 3] > 128) {
        data[y * c.width + x] = 1;
        x0 = Math.min(x0, x), x1 = Math.max(x1, x), y0 = Math.min(y0, y), y1 = Math.max(y1, y);
      }
  return x1 < 0 ? null : { box: { x: x0, y: y0, w: x1 + 1 - x0, h: y1 + 1 - y0 }, data };
}
function roomFoot(o: MapObject): Rect | null {
  const x = o.x * T, y = o.y * T, f = Array.isArray(o.foot) ? (o.foot as number[]) : undefined;
  if (f) return { x: x + f[0] * T, y: y + f[1] * T, w: f[2] * T, h: f[3] * T };
  const d = drawnOf(o);
  return d ? { x: x + d.box.x, y: y + d.box.y, w: d.box.w, h: d.box.h } : { x, y, w: o.w * T, h: o.h * T };
}

const crossings = new WeakMap<MapFile, Rect[]>();
const shape: MapShape = {
  foot: (file, o) => (file.kind === 'piece' ? roomFoot(o) : toRect(A.objFootPx(file, o))),
  water(file, x, y) {
    const ter = file.terrain as { river?: unknown; shallows?: Rect[] } | undefined;
    if (!ter?.river) return false;
    const [d, s] = A.riverAtPx(ter.river, x, y);
    if (d >= A.riverHalfPx(ter.river, s)) return false;
    if (!crossings.has(file))
      crossings.set(file, [...(ter.shallows ?? []), ...file.objects.filter((o: MapObject) => A.XTYPES[o.type]?.bridge)]);
    return !crossings.get(file)!.some((r) => x / T >= r.x && x / T < r.x + r.w && y / T >= r.y && y / T < r.y + r.h);
  },
  pixels(file, o) {
    if (file.kind !== 'piece') return null;
    const d = drawnOf(o);
    return d ? { x: o.x * T, y: o.y * T, w: Math.ceil(o.w * T), data: d.data } : null;
  },
  flat: (file, o) =>
    file.kind === 'piece' ? A.WALL_TYPES.has(o.type) || !!o.above || ROOM_FLAT.has(o.type) : OUT_FLAT.has(o.type) || !!o.flat,
};

/** Toutes les cartes d'un chapitre (ou toutes, sans chapitre). */
export function worldMaps(chapter?: string): Record<string, GameMap> {
  const out: Record<string, GameMap> = {};
  for (const [id, entry] of Object.entries(worldIndex.maps)) {
    if (chapter && entry.chapter !== chapter) continue;
    const file = Object.entries(files).find(([k]) => k.endsWith(`/${entry.file}`))?.[1];
    // une copie : le chapitre peut modifier ses cartes (ouvrir l'eau, ajouter un objet) sans toucher aux données
    if (file) out[id] = loadMap(JSON.parse(JSON.stringify(file)) as MapFile, paint, shape);
  }
  return out;
}
