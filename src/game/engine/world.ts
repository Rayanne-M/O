// Les cartes du jeu : rpg/data/maps/ (copiées dans src/game/data/maps par scripts/import-art.mjs).
// Une carte = un fichier JSON au format commun ; drawAnyMap de la planche des cartes les dessine toutes.
import * as A from '../art/shared.js';
import { loadMap, type GameMap, type MapFile, type MapPainter } from './maps';

const files = import.meta.glob('../data/maps/*.json', { eager: true, import: 'default' }) as Record<string, MapFile & { maps?: unknown }>;

export interface WorldIndex {
  start: { map: string; at: string };
  maps: Record<string, { name: string; chapter: string; kind: string; file: string }>;
}
export const worldIndex = Object.entries(files).find(([k]) => k.endsWith('/index.json'))![1] as unknown as WorldIndex;

const paint: MapPainter = (ctx, map, t, o) =>
  A.drawAnyMap(ctx, map.file, t, { night: o.night, actors: o.actors, state: o.state, day: o.day, moment: o.moment, flags: o.flags, animals: o.animals });

/** Toutes les cartes d'un chapitre (ou toutes, sans chapitre). */
export function worldMaps(chapter?: string): Record<string, GameMap> {
  const out: Record<string, GameMap> = {};
  for (const [id, entry] of Object.entries(worldIndex.maps)) {
    if (chapter && entry.chapter !== chapter) continue;
    const file = Object.entries(files).find(([k]) => k.endsWith(`/${entry.file}`))?.[1];
    // une copie : le chapitre peut modifier ses cartes (ouvrir l'eau, ajouter un objet) sans toucher aux données
    if (file) out[id] = loadMap(JSON.parse(JSON.stringify(file)) as MapFile, paint);
  }
  return out;
}
