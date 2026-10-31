import * as A from '../game/art/shared.js';
import type { Combatant } from '../engine/battle';
import type { Build } from '../engine/types';

// Le dessin de l'écran de combat. Il ne décide rien : il lit l'état des combattants.
// Le héros reprend la planche du jeu (makeHero / drawHero) : sa tenue suit la classe,
// ses couleurs suivent bénédictions et malédictions, ses cheveux flottent s'il a le pacte capillaire.

export const W = 192;
export const H = 108;
/** Où se tiennent le héros et l'ennemi (pieds). */
export const HERO_AT = { x: 46, y: 92 };
export const FOE_AT = { x: 138, y: 92 };

const OUTFIT_OF: Record<string, string> = { mage: 'mage', warrior: 'guerrier', rogue: 'voleur' };

export interface HeroLook {
  build: Build;
  hair: number;
  pact: boolean;
}

interface HeroSprite {
  o: Record<string, unknown>;
  rows: string[];
  idle: string[][];
  back: string[] | null;
  len: number;
}

let heroCache: { key: string; sprite: HeroSprite } | null = null;

function heroSprite(look: HeroLook): HeroSprite {
  const key = JSON.stringify(look);
  if (heroCache?.key === key) return heroCache.sprite;
  const o = {
    child: false,
    hair: look.hair,
    outfit: OUTFIT_OF[look.build.classId] ?? 'tunique',
    pact: look.pact,
    combat: true,
    bless: Math.min(1, look.build.blessingIds.length * 0.3),
    curse: Math.min(1, look.build.curseIds.length * 0.3),
  };
  const h = A.makeHero(o);
  const sprite = { o, rows: h.rows, idle: [h.rows, A.bobUpper(h.rows, h.cut)], back: h.back, len: h.len };
  heroCache = { key, sprite };
  return sprite;
}

export interface Fx {
  /** Qui tremble (touché) et depuis quand. */
  hitAt: Record<string, number>;
  /** Qui avance (attaque) et depuis quand. */
  lungeAt: Record<string, number>;
}

export function drawScene(ctx: CanvasRenderingContext2D, t: number, hero: Combatant, foe: Combatant, look: HeroLook, fx: Fx) {
  const night = foe.tags.includes('cheveux') || foe.tags.includes('esprit');
  drawBackground(ctx, t, night);

  // ennemi
  const fs = shake(fx.hitAt[foe.id], t) + lunge(fx.lungeAt[foe.id], t, -1);
  ctx.save();
  ctx.translate(fs, 0);
  // un ennemi vaincu s'efface ; le puits, lui, reste (seules ses mèches tombent)
  const gone = foe.hp <= 0 ? Math.min(1, (t - (fx.hitAt[foe.id] ?? 0)) / 600) : 0;
  ctx.globalAlpha = foe.id === 'well_spirit' ? 1 : 1 - gone;
  if (ctx.globalAlpha > 0) drawFoe(ctx, t, foe, fx);
  ctx.globalAlpha = 1;
  ctx.restore();

  // héros
  const sp = heroSprite(look);
  const hs = shake(fx.hitAt[hero.id], t) + lunge(fx.lungeAt[hero.id], t, 1);
  const frame = sp.idle[Math.floor(t / 500) % 2];
  const x0 = Math.round(HERO_AT.x - 12 + hs);
  const y0 = HERO_AT.y - frame.length;
  shadow(ctx, HERO_AT.x, HERO_AT.y, 9);
  if (hero.hp <= 0) ctx.globalAlpha = 0.45;
  A.drawHero(ctx, sp.o, frame, x0, y0, t, sp.back, sp.len);
  ctx.globalAlpha = 1;
  if (hero.guarding) {
    ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t / 150);
    ctx.fillStyle = '#9ad0ff';
    for (let y = y0 - 2; y < HERO_AT.y; y += 2) ctx.fillRect(x0 + 25, y, 1, 1);
    ctx.globalAlpha = 1;
  }
  drawBurns(ctx, t, hero, HERO_AT.x, y0);
}

function drawBackground(ctx: CanvasRenderingContext2D, t: number, night: boolean) {
  if (night) {
    A.nightGround(ctx, W, H);
    ctx.fillStyle = '#0e1626';
    ctx.fillRect(0, 0, W, 34);
    ctx.fillStyle = '#e8eef8';
    for (const [x, y] of [[12, 6], [40, 14], [70, 4], [104, 10], [150, 6], [176, 18], [124, 22]]) if ((t / 700 + x) % 5 > 0.6) ctx.fillRect(x, y, 1, 1);
    A.ell(ctx, 96, 9, 4, 4, '#f4ecd0');
    A.ell(ctx, 98, 8, 3, 4, '#0e1626');
  } else {
    ctx.fillStyle = '#9cd4f0';
    ctx.fillRect(0, 0, W, 40);
    ctx.fillStyle = '#5aa86a';
    ctx.fillRect(0, 34, W, H - 34);
    ctx.fillStyle = '#6cbf7c';
    for (let y = 40; y < H; y += 7) for (let x = (y * 3) % 11; x < W; x += 13) ctx.fillRect(x, y, 2, 1);
    ctx.fillStyle = '#3f8a52';
    ctx.fillRect(0, 34, W, 2);
    ctx.fillStyle = '#ffffff';
    const cx = (t / 120) % (W + 40);
    ctx.fillRect(Math.round(cx) - 30, 10, 18, 3);
    ctx.fillRect(Math.round(cx) - 26, 8, 10, 2);
  }
}

function drawFoe(ctx: CanvasRenderingContext2D, t: number, foe: Combatant, fx: Fx) {
  const { x, y } = FOE_AT;
  const ratio = foe.hp / foe.stats.hp;
  switch (foe.id.split('#')[0]) {
    case 'well_spirit': {
      const wx = x - 18, wy = y - 44;
      A.drawWell(ctx, wx, wy, t, { spill: 0.3 + 0.5 * ratio, swing: 1 });
      // trois mèches : une tombe à chaque tiers de vie perdu
      const locks = [0, 1, 2].map((i) => (ratio > i / 3 ? 1 : 0));
      const since = t - (fx.hitAt[foe.id] ?? -1e9);
      A.drawWellLocks(ctx, wx, wy, t, { hp: locks, hit: { i: Math.max(0, locks.lastIndexOf(1)), t: since } });
      if (since < 250) A.drawHitFx(ctx, wx + 18, wy + 6, since, 'ciseaux');
      break;
    }
    case 'giant_spider':
      drawSpider(ctx, t, x, y);
      break;
    case 'giorgio':
      drawGiorgio(ctx, t, x, y, Object.values(foe.evades).some((n) => n > 0));
      break;
    default:
      drawDummy(ctx, x, y);
  }
  drawBurns(ctx, t, foe, x, y - 40);
}

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number) {
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#000';
  ctx.fillRect(x - rx, y - 1, rx * 2, 2);
  ctx.globalAlpha = 1;
}

function drawSpider(ctx: CanvasRenderingContext2D, t: number, x: number, y: number) {
  shadow(ctx, x, y, 16);
  const bob = Math.round(Math.sin(t / 120));
  for (let i = 0; i < 4; i++)
    for (const side of [-1, 1]) {
      const step = Math.round(Math.sin(t / 90 + i * 1.6) * 1.5);
      const kx = x + side * (8 + i * 2), ky = y - 14 + i * 2 + bob;
      ctx.fillStyle = '#1a1414';
      for (let k = 0; k < 7; k++) ctx.fillRect(x + side * (3 + k), y - 10 + i * 2 - Math.round(k * 0.6) + bob, 1, 1);
      for (let k = 0; k < 8; k++) ctx.fillRect(kx + side * Math.round(k * 0.4) + step, ky + k, 1, 1);
    }
  A.ell(ctx, x + 6, y - 12 + bob, 8, 6, '#2a2020');
  A.ell(ctx, x + 6, y - 13 + bob, 6, 4, '#3a2c2a');
  A.ell(ctx, x - 4, y - 10 + bob, 5, 4, '#1e1818');
  ctx.fillStyle = '#e04040';
  for (const [ex, ey] of [[-7, -11], [-5, -12], [-7, -9], [-4, -10]]) ctx.fillRect(x + ex, y + ey + bob, 1, 1);
  ctx.fillStyle = '#8a3a3a';
  ctx.fillRect(x + 4, y - 15 + bob, 4, 1);
  ctx.fillRect(x + 6, y - 16 + bob, 1, 3);
}

function drawGiorgio(ctx: CanvasRenderingContext2D, t: number, x: number, y: number, rainbow: boolean) {
  if (rainbow) {
    const cols = ['#e05050', '#f0a040', '#f0e050', '#60c060', '#5090e0', '#9060c0'];
    cols.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.55;
      const r = 26 - i * 2;
      for (let a = 0; a <= Math.PI; a += 0.04) ctx.fillRect(Math.round(x + 6 + Math.cos(a) * r), Math.round(y - 2 - Math.sin(a) * r * 0.9), 2, 1);
    });
    ctx.globalAlpha = 1;
  }
  shadow(ctx, x, y, 9);
  const bob = Math.floor(t / 400) % 2;
  // corps simple : pantalon vert, pull beige, crâne dégarni et barbe noire
  const px = (c: string, dx: number, dy: number, w: number, h: number) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + dx, y + dy, w, h);
  };
  px('#18110f', -6, -10, 5, 10); px('#18110f', 1, -10, 5, 10);
  px('#3e6a4a', -5, -10, 4, 9); px('#3e6a4a', 2, -10, 4, 9);
  px('#2a1c14', -6, -1, 5, 1); px('#2a1c14', 1, -1, 5, 1);
  px('#18110f', -8, -23 - bob, 16, 14);
  px('#d4ba90', -7, -22 - bob, 14, 12);
  px('#ad926c', 3, -22 - bob, 4, 12);
  px('#e0ad88', -9, -19 - bob, 2, 6); px('#e0ad88', 7, -19 - bob, 2, 6);
  px('#18110f', -6, -36 - bob, 12, 14);
  px('#e0ad88', -5, -35 - bob, 10, 12);
  px('#f4d0b0', -3, -34 - bob, 3, 2);
  px('#2a201c', -5, -28 - bob, 10, 5);
  px('#2a201c', -6, -32 - bob, 1, 5); px('#2a201c', 5, -32 - bob, 1, 5);
  px('#e0ad88', -3, -28 - bob, 6, 1);
  px('#24160f', -3, -31 - bob, 1, 1); px('#24160f', 2, -31 - bob, 1, 1);
  px('#b4685c', -1, -27 - bob, 2, 1);
  // une pièce d'or qui tourne dans la main
  const spin = Math.abs(Math.sin(t / 200));
  ctx.fillStyle = '#f2c64a';
  ctx.fillRect(x + 9, y - 18 - bob, Math.max(1, Math.round(spin * 3)), 3);
}

function drawDummy(ctx: CanvasRenderingContext2D, x: number, y: number) {
  shadow(ctx, x, y, 8);
  ctx.fillStyle = '#5a3a20';
  ctx.fillRect(x - 1, y - 30, 3, 30);
  ctx.fillRect(x - 10, y - 24, 21, 3);
  A.ell(ctx, x, y - 18, 7, 7, '#c8a050');
  A.ell(ctx, x, y - 33, 5, 5, '#d8b868');
  ctx.fillStyle = '#7a5a2a';
  ctx.fillRect(x - 2, y - 34, 1, 1);
  ctx.fillRect(x + 2, y - 34, 1, 1);
  ctx.fillStyle = '#a03030';
  for (let r = 5; r > 0; r -= 2) {
    ctx.fillRect(x - r, y - 18, r * 2 + 1, 1);
    ctx.fillRect(x, y - 18 - r, 1, r * 2 + 1);
  }
}

/** Les charges de brûlure : de petites flammes au-dessus de la tête. */
function drawBurns(ctx: CanvasRenderingContext2D, t: number, f: Combatant, x: number, top: number) {
  f.burns.forEach((_, i) => {
    const fx = x - 6 + i * 4, fy = top - 4 + Math.round(Math.sin(t / 90 + i) * 1);
    ctx.fillStyle = '#e8843c';
    ctx.fillRect(fx, fy, 2, 3);
    ctx.fillStyle = '#f2c14e';
    ctx.fillRect(fx, fy + 1, 1, 2);
  });
}

function shake(at: number | undefined, t: number): number {
  if (at === undefined || t - at > 300) return 0;
  return Math.round(Math.sin((t - at) / 25) * 2);
}

function lunge(at: number | undefined, t: number, dir: number): number {
  if (at === undefined || t - at > 300) return 0;
  return Math.round(Math.sin(((t - at) / 300) * Math.PI) * 8 * dir);
}
