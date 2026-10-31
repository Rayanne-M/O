// Les personnages : leurs images dans les 8 directions, leur marche, et leur dessin sur la carte.
import * as A from 'virtual:rpg-art';
import { DIRS, type Dir } from './maps';

type Rows = string[];
type Palette = Record<string, string>;

/** Ce qui décrit l'allure d'un personnage. */
export interface Look {
  /** Un personnage du gabarit de la planche (CHARS de chars.js) : ses 8 directions et ses poses. */
  char?: string;
  child: boolean;
  /** Longueur des cheveux, de 0 à 1 (vue de face). */
  hair: number;
  outfit?: 'tunique' | 'mage' | 'guerrier' | 'voleur';
  pal: Palette;
  /** Béni et maudit, de 0 à 1 : la palette glisse vers le doré ou le violet. */
  bless?: number;
  curse?: number;
}

/**
 * En attendant les vraies vues enfant, on tire l'enfant des 8 vues adultes de la planche :
 * même tête (rangées 0 à 15), corps raccourci en sautant des rangées.
 */
const CHILD_BODY = [16, 17, 19, 21, 23, 24, 26];
const CHILD_LEGS = [29, 30, 31, 32, 33];
export function childFrom(rows: Rows): Rows {
  const keep = [...rows.slice(0, 16), ...CHILD_BODY.map((y) => rows[y]), ...CHILD_LEGS.map((y) => rows[y])];
  return keep.map((r, y) => (y >= 16 ? r.replace(/[bm]/g, 'c') : r));
}

interface Frames { idle: Rows; walk: Rows[]; back: Rows | null }
const cache = new Map<string, Record<Dir, Frames>>();

export function framesOf(look: Look): Record<Dir, Frames> {
  const key = `${look.child}|${look.hair.toFixed(2)}|${look.outfit ?? 'tunique'}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const front = A.makeHero({ child: look.child, hair: look.hair, outfit: look.outfit ?? 'tunique', pact: false, combat: false });
  const out = {} as Record<Dir, Frames>;
  for (const d of DIRS) {
    if (d === 'S') out[d] = { idle: front.rows, walk: A.walkFrames(front.rows, front.cut), back: front.back };
    else {
      const conv = look.child ? childFrom : (r: Rows) => r;
      out[d] = { idle: conv(A.idleRows(d)), walk: (A.dirFrames(d) as Rows[]).map(conv), back: null };
    }
  }
  cache.set(key, out);
  return out;
}

export function paletteOf(look: Look): Palette {
  if (!look.bless && !look.curse) return look.pal;
  const shifted = A.heroPalette({ child: look.child, outfit: look.outfit ?? 'tunique', bless: look.bless ?? 0, curse: look.curse ?? 0, pact: false });
  // on garde les couleurs propres au personnage, mêlées à la teinte bénie ou maudite
  const out: Palette = {};
  for (const k of Object.keys(look.pal)) out[k] = shifted[k] ? A.mix(look.pal[k], shifted[k], 0.5) : look.pal[k];
  return out;
}

/** Béni ou maudit : on mêle les couleurs du personnage à la teinte dorée ou violette du labo d'apparence. */
function paletteShift(look: Look, base: Palette): Palette {
  if (!look.bless && !look.curse) return {};
  const shifted = A.heroPalette({ child: true, outfit: 'tunique', bless: look.bless ?? 0, curse: look.curse ?? 0, pact: (look.curse ?? 0) > 0 });
  const out: Palette = {};
  for (const k of ['h', 'H', 'j', 'c', 'C', 'l']) if (shifted[k]) out[k] = A.mix(base[k] ?? A.PAL[k], shifted[k], 0.45);
  return out;
}

export interface Actor {
  id: string;
  /** La carte où il se trouve. */
  map: string;
  x: number;
  y: number;
  dir: Dir;
  /** Un personnage dessiné avec les sprites, ou n'importe quoi d'autre (poule, objet) dessiné par draw. */
  look?: Look;
  draw?: (ctx: CanvasRenderingContext2D, a: Actor, t: number) => void;
  visible: boolean;
  /** Marche en cours (pour l'animation). */
  moving: boolean;
  /** Bloque le passage du héros. */
  solid: boolean;
  /** Dans l'eau jusqu'à la taille. */
  wading?: boolean;
  /** Assis (au bord de l'eau, sur un fauteuil). */
  sitting?: boolean;
  /** Une pose spéciale du gabarit (poses.js) : assis_genoux, a_genoux, affale, assis_serviette, tambourine, bras_ouverts, allonge… */
  pose?: string;
  /** Une marque posée sur le sprite (poses.js) : tache_paume… */
  mark?: string;
  /** Petit saut vertical (grimper, sursauter), en pixels. */
  hop?: number;
  /** Un personnage qui en suit un autre (cache-cache). */
  follows?: Actor;
  speed: number;
  /** Détail ajouté par-dessus (tache sur la main, capuche…) : pixels relatifs au coin du sprite. */
  marks?: [number, number, string][];
}

export function makeActor(id: string, map: string, x: number, y: number, init: Partial<Actor> = {}): Actor {
  return { id, map, x, y, dir: 'S', visible: true, moving: false, solid: true, speed: 48, ...init };
}

const VEC: Record<Dir, [number, number]> = { N: [0, -1], NE: [1, -1], E: [1, 0], SE: [1, 1], S: [0, 1], SW: [-1, 1], W: [-1, 0], NW: [-1, -1] };
export const vec = (d: Dir) => VEC[d];
export const dirOf = (dx: number, dy: number): Dir =>
  (((dy < -0.38 ? 'N' : dy > 0.38 ? 'S' : '') + (dx > 0.38 ? 'E' : dx < -0.38 ? 'W' : '')) || 'S') as Dir;

/** Dessine un personnage, pieds en (x, y). */
export function drawActor(ctx: CanvasRenderingContext2D, a: Actor, t: number) {
  if (!a.visible) return;
  if (a.draw) return a.draw(ctx, a, t);
  if (!a.look) return;
  const ch = a.look.char ? A.CHARS[a.look.char] : null;
  if (ch) return drawChar(ctx, a, ch, t);
  const f = framesOf(a.look)[a.dir];
  const rows: Rows = a.moving ? f.walk[Math.floor(t / 130) % 4] : f.idle;
  const pal = paletteOf(a.look);
  const x0 = Math.round(a.x) - 12;
  let y0 = Math.round(a.y) - rows.length - Math.round(a.hop ?? 0);
  if (a.sitting) y0 += 6;
  // ombre au sol
  if (!a.wading) {
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#1a2a2a';
    ctx.fillRect(Math.round(a.x) - 8, Math.round(a.y) - 2, 16, 3);
    ctx.globalAlpha = 1;
  }
  ctx.save();
  if (a.wading || a.sitting) {
    // dans l'eau, on ne voit que le haut ; assis, les jambes sont repliées sous lui
    const cut = a.wading ? Math.round(rows.length * 0.62) : rows.length - 6;
    ctx.beginPath();
    ctx.rect(x0 - 4, y0 - 8, 32, cut + 8);
    ctx.clip();
  }
  if (f.back) A.drawSprite(ctx, f.back.length > rows.length ? f.back.slice(f.back.length - rows.length) : f.back, pal, x0, y0);
  A.drawSprite(ctx, rows, pal, x0, y0);
  for (const [mx, my, col] of a.marks ?? []) {
    ctx.fillStyle = col;
    ctx.fillRect(x0 + mx, y0 + my, 1, 1);
  }
  ctx.restore();
  if (a.wading) {
    // la ligne de l'eau, qui ondule, et des éclaboussures quand il marche
    const wy = y0 + Math.round(rows.length * 0.62);
    ctx.fillStyle = '#d4f0fa';
    for (let k = -2; k < 26; k += 2) ctx.fillRect(x0 + k, wy + (Math.floor(t / 200 + k) % 2), 2, 1);
    if (a.moving) {
      ctx.fillStyle = '#f4fbff';
      const s = Math.floor(t / 90) % 3;
      ctx.fillRect(x0 - 2 - s, wy - 2 - s, 1, 1);
      ctx.fillRect(x0 + 25 + s, wy - 3 - s, 1, 1);
      ctx.fillRect(x0 + 12, wy - 4 - s, 1, 1);
    }
  }
}

/** Un personnage du gabarit : marche, poses, eau jusqu'à la taille, tout vient de la planche. */
function drawChar(ctx: CanvasRenderingContext2D, a: Actor, ch: { H: number; spec: { pal?: Palette } }, t: number) {
  const pal = paletteShift(a.look!, ch.spec.pal ?? {});
  const x = Math.round(a.x) - 12, y = Math.round(a.y) - ch.H - Math.round(a.hop ?? 0);
  if (a.wading) return A.drawCharWading(ctx, ch, x, y, { dir: a.dir, t, moving: a.moving, pal });
  const pose = a.pose ?? (a.sitting ? 'assis_genoux' : null);
  if (pose) return A.drawCharPose(ctx, ch, x, y, pose, { t, pal });
  A.drawChar(ctx, ch, x, y, { dir: a.dir, pose: a.moving ? 'walk' : 'idle', t, pal });
  if (a.mark) A.drawCharMark(ctx, ch, x, y, { dir: a.dir, pose: a.moving ? 'walk' : 'idle', t }, a.mark);
}

/** Une poule de la planche, qui picore. */
export const drawHen = (ctx: CanvasRenderingContext2D, a: Actor, t: number) => A.drawPoule(ctx, Math.round(a.x) - 6, Math.round(a.y) - 9 - Math.round(a.hop ?? 0), t, a.id.length);
