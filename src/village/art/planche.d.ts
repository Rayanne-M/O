// Types du code de dessin repris de la planche (planche.js).

/** Un sprite : une ligne de texte par rangée de pixels, une lettre par couleur ("." = transparent). */
export type Rows = string[];
/** Lettre de sprite → couleur CSS. */
export type Palette = Record<string, string>;
export type Dir = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
type Ctx = CanvasRenderingContext2D;

export interface HeroOptions {
  child?: boolean;
  /** Longueur des cheveux, de 0 (coupés) à 1. */
  hair: number;
  outfit: 'tunique' | 'mage' | 'guerrier' | 'voleur';
  pact?: boolean;
  combat?: boolean;
}
export interface MadeHero { rows: Rows; cut: number; len: number; back: Rows | null }
export interface WellState { spill?: number; crank?: number; swing?: number }

export const PAL: Palette;
export const CHILD_PAL: Palette;
export const FRIEND_PAL: Palette;
/** Couleurs du décor de jour. */
export const T: Record<string, string>;
/** Couleurs de la nuit et du puits. */
export const N: Record<string, string>;

export function ADULT(): Rows;
export function CHILD(): Rows;
export function set(rows: Rows, pts: [number, number][], k: string): Rows;
export function bobUpper(rows: Rows, cut: number): Rows;
export function walkFrames(base: Rows, cut: number): Rows[];
export function drawSprite(ctx: Ctx, rows: Rows, pal: Palette, x0: number, y0: number): void;
export function mix(a: string, b: string, t: number): string;
export function hash(n: number): number;

/** Les 4 images de marche d'une direction (héros adulte, 24 × 34). */
export function dirFrames(dir: Dir): Rows[];
export function idleRows(dir: Dir): Rows;
export function makeHero(o: HeroOptions): MadeHero;

export function px(ctx: Ctx, c: string, x: number, y: number, w?: number, h?: number): void;
export function grassTile(ctx: Ctx, x: number, y: number): void;
export function tallGrass(ctx: Ctx, x: number, y: number): void;
export function flower(ctx: Ctx, x: number, y: number, petal: string): void;
/** Un sapin de 48 × 64. */
export function treeSprite(): HTMLCanvasElement;
/** Une maison de 72 × 64 (la cheminée dépasse de 9 px au-dessus). */
export function cottage(ctx: Ctx, x: number, y: number): void;
export function sandPath(ctx: Ctx, x: number, y: number, w: number, h: number): void;

export function nightGround(ctx: Ctx, w: number, h: number): void;
export function ell(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, col: string): void;
/** Le puits, 36 × 46, coin haut-gauche en (x, y). Le toit dépasse de 9 px au-dessus, la manivelle de 4 px à gauche. */
export function drawWell(ctx: Ctx, x: number, y: number, t: number, s: WellState): void;
export function firefly(ctx: Ctx, t: number, w: number, h: number): void;

export const CINE_LEN: number;
export const CINE_TEXT: [number, string][];
export function drawCine(ctx: Ctx, e: number, opts?: { ground?: boolean; width?: number; height?: number; friend?: { rows: Rows; pal: Palette } }): void;

export const HORROR_W: number;
export const HORROR_H: number;
/** p : de 0 (noir) à 1 (les yeux se sont habitués). */
export function renderHorror(ctx: Ctx, p: number, variant?: 1 | 2 | 3): void;
/** Portrait 64 × 64 de l'ami possédé ; open : ouverture de la bouche, de 0 à 1. */
export function talkPortrait(ctx: Ctx, t: number, open: number): void;
