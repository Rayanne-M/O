// Les cartes du jeu : rpg/data/maps/ (copiées dans src/game/data/maps par scripts/import-art.mjs).
// Une carte = un fichier JSON au format commun ; drawAnyMap de la planche des cartes les dessine toutes.
import * as A from '../art/shared.js';
import { loadMap, type GameMap, type MapFile, type MapObject, type MapPainter, type MapShape, type Rect } from './maps';

const files = import.meta.glob('../data/maps/*.json', { eager: true, import: 'default' }) as Record<string, MapFile & { maps?: unknown }>;

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
const crossings = new WeakMap<MapFile, Rect[]>();
const shape: MapShape = {
  foot: (file, o) => toRect(A.objFootPx(file, o)),
  water(file, x, y) {
    const ter = file.terrain as { river?: unknown; shallows?: Rect[] } | undefined;
    if (!ter?.river) return false;
    const [d, s] = A.riverAtPx(ter.river, x, y);
    if (d >= A.riverHalfPx(ter.river, s)) return false;
    if (!crossings.has(file))
      crossings.set(file, [...(ter.shallows ?? []), ...file.objects.filter((o: MapObject) => A.XTYPES[o.type]?.bridge)]);
    return !crossings.get(file)!.some((r) => x / T >= r.x && x / T < r.x + r.w && y / T >= r.y && y / T < r.y + r.h);
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
