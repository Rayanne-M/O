// L'écran de combat, réutilisable : la page de combat et le jeu l'ouvrent de la même façon.
// Il affiche un combat du moteur (src/engine/battle.ts), fait jouer les monstres, propose les actions
// du héros (souris, toucher, ou clavier : flèches + Entrée / Espace / E), puis rend l'issue.
// Aucune règle ici : tout vient du moteur et des données.
import './screen.css';
import type { Battle, BattleEvent, Combatant, Outcome } from '../engine/battle';
import type { Element } from '../engine/types';
import { drawScene, FOE_AT, H, HERO_AT, W, type Fx, type HeroLook } from './sprites';

export const ELEMENT_LABELS: Record<Element, string> = { physical: 'physique', arcane: 'arcane', fire: 'feu', shadow: 'ombre', holy: 'sacré' };

export interface ScreenOptions {
  battle: Battle;
  look: HeroLook;
  /** Phrases dites avant le premier tour (tutoriel, mise en scène). */
  intro?: string[];
  /** Un conseil à afficher au début de chaque tour du héros (tutoriel). */
  tip?: (battle: Battle) => string | undefined;
  /** Chaque événement, pour un journal externe. */
  onEvent?: (e: BattleEvent, battle: Battle) => void;
  /** Textes de fin, par issue. */
  endings?: Partial<Record<Outcome, string>>;
  /** Bouton de fin (« Continuer » par défaut). */
  endLabel?: string;
}

/** Ouvre l'écran dans host et le ferme à la fin du combat. Renvoie l'issue. */
export function runBattle(host: HTMLElement, o: ScreenOptions): { done: Promise<Outcome>; close: () => void } {
  const { battle } = o;
  const hero = battle.alive('hero')[0];
  const foe = battle.alive('enemy')[0];
  const root = document.createElement('div');
  root.className = 'bt-screen';
  root.innerHTML = `
    <canvas width="${W}" height="${H}" aria-label="Le combat : ${hero.name} contre ${foe.name}"></canvas>
    <div class="bt-card bt-hero"></div>
    <ol class="bt-timeline" aria-label="Ordre des prochains tours"></ol>
    <div class="bt-card bt-foe"></div>
    <div class="bt-pops"></div>
    <div class="bt-bottom">
      <p class="bt-caption" aria-live="polite"></p>
      <div class="bt-menu"></div>
    </div>
    <div class="bt-banner" hidden></div>`;
  host.append(root);
  const q = <T extends HTMLElement>(sel: string) => root.querySelector(sel) as T;
  const ctx = q<HTMLCanvasElement>('canvas').getContext('2d')!;
  const fx: Fx = { hitAt: {}, lungeAt: {} };
  let closed = false;
  let pick: ((id: string) => void) | null = null;

  const frame = (t: number) => {
    if (closed) return;
    drawScene(ctx, t, hero, foe, o.look, fx);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  // Clavier : on capture avant le jeu, seulement quand un choix est attendu.
  const onKey = (e: KeyboardEvent) => {
    if (closed || !q('.bt-menu').childElementCount) return;
    const buttons = [...root.querySelectorAll<HTMLButtonElement>('.bt-menu button:not([disabled])')];
    if (!buttons.length) return;
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const move = { ArrowRight: 1, ArrowDown: 1, KeyD: 1, KeyS: 1, ArrowLeft: -1, ArrowUp: -1, KeyA: -1, KeyQ: -1, KeyW: -1, KeyZ: -1 }[e.code];
    if (move) buttons[(Math.max(0, i) + move + buttons.length) % buttons.length].focus();
    else if (['Enter', 'Space', 'KeyE'].includes(e.code)) (buttons[i] ?? buttons[0]).click();
    else return;
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  window.addEventListener('keydown', onKey, true);

  q('.bt-menu').addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (el && !el.disabled && pick) pick(el.dataset.id!);
  });

  const choice = (buttons: { id: string; html: string; disabled?: boolean; title?: string; cls?: string }[]) =>
    new Promise<string>((resolve) => {
      q('.bt-menu').innerHTML = buttons
        .map((b) => `<button type="button" data-id="${b.id}" class="${b.cls ?? ''}" ${b.disabled ? 'disabled' : ''} title="${b.title ?? ''}">${b.html}</button>`)
        .join('');
      q<HTMLButtonElement>('.bt-menu button:not([disabled])')?.focus({ preventScroll: true });
      pick = (id) => {
        pick = null;
        q('.bt-menu').innerHTML = '';
        resolve(id);
      };
    });

  const caption = (text: string) => (q('.bt-caption').textContent = text);

  const hud = () => {
    q('.bt-timeline').innerHTML = battle.outcome !== 'ongoing' ? '' : battle
      .preview(6)
      .map((f, i) => `<li class="${f.side} ${i === 0 ? 'now' : ''}" title="${f.name}">${f.side === 'hero' ? 'Toi' : short(f.name)}</li>`)
      .join('');
    q('.bt-hero').innerHTML = card(hero, true);
    q('.bt-foe').innerHTML = card(foe, false);
  };

  const popup = (targetId: string, text: string, kind: string) => {
    const at = targetId === hero.id ? HERO_AT : FOE_AT;
    const el = document.createElement('span');
    el.className = `bt-pop ${kind}`;
    el.textContent = text;
    el.style.left = `${(at.x / W) * 100 + (Math.random() * 6 - 3)}%`;
    el.style.top = `${((at.y - 44) / H) * 100}%`;
    q('.bt-pops').append(el);
    setTimeout(() => el.remove(), 1100);
  };

  const play = async (events: BattleEvent[]) => {
    for (const e of events) {
      if (closed) return;
      o.onEvent?.(e, battle);
      const now = performance.now();
      if (e.kind === 'skill') {
        caption(e.text);
        if (battle.skill(e.skill).target === 'enemy') fx.lungeAt[e.actor] = now;
        await sleep(350);
      } else if (e.kind === 'damage') {
        fx.hitAt[e.target] = now;
        popup(e.target, String(e.amount), e.hit);
        caption(`${e.text}${e.hit === 'burn' ? '' : ` (${ELEMENT_LABELS[e.element]})`}`);
        hud();
        await sleep(e.hit === 'burn' ? 400 : 550);
      } else if (e.kind === 'heal') {
        popup(e.target, `+${e.amount}`, 'heal');
        caption(e.text);
        hud();
        await sleep(500);
      } else if (e.kind === 'evade') {
        popup(e.target, 'Esquive', 'evade');
        caption(e.text);
        await sleep(550);
      } else if (e.kind !== 'end') {
        caption(e.text);
        hud();
        await sleep(450);
      }
    }
  };

  const done = (async (): Promise<Outcome> => {
    hud();
    for (const line of o.intro ?? []) {
      caption(line);
      await choice([{ id: 'next', html: 'Suite ▸', cls: 'bt-next' }]);
      if (closed) return battle.outcome;
    }
    while (!closed && battle.outcome === 'ongoing') {
      hud();
      const actor = battle.current();
      if (actor.side === 'enemy') {
        caption(`${actor.name}…`);
        await sleep(600);
        await play(battle.playAi());
        continue;
      }
      caption(o.tip?.(battle) ?? 'À toi !');
      const usable = new Set(battle.usable(hero).map((s) => s.id));
      const id = await choice(
        hero.skills.map((sid) => {
          const s = battle.skill(sid);
          return {
            id: sid,
            html: `<strong>${s.name}</strong><small>${s.cost ? `${s.cost} mana` : ' '}</small>`,
            disabled: !usable.has(sid),
            title: s.description,
            cls: s.target === 'self' ? 'self' : '',
          };
        }),
      );
      if (closed) break;
      await play(battle.act(id, foe.id));
    }
    hud();
    const texts: Record<Outcome, string> = {
      ongoing: '',
      win: 'Victoire !',
      lose: 'Défaite…',
      fled: 'Tu t’enfuis.',
      enemyFled: `${foe.name} s’enfuit.`,
      ...o.endings,
    };
    q('.bt-banner').textContent = texts[battle.outcome];
    q('.bt-banner').hidden = false;
    caption('');
    if (!closed) await choice([{ id: 'end', html: o.endLabel ?? 'Continuer ▸', cls: 'bt-next' }]);
    close();
    return battle.outcome;
  })();

  function close() {
    if (closed) return;
    closed = true;
    window.removeEventListener('keydown', onKey, true);
    root.remove();
    pick?.('');
  }
  return { done, close };
}

function card(f: Combatant, showMana: boolean): string {
  const bar = (v: number, max: number, cls: string) =>
    `<span class="bt-bar ${cls}"><span style="width:${max ? Math.max(0, Math.min(100, (v / max) * 100)) : 0}%"></span></span>`;
  const status = [
    f.burns.length ? `🔥×${f.burns.length}` : '',
    f.guarding ? '🛡' : '',
    ...f.buffs.map((b) => `${b.name} ${b.turns}`),
    ...Object.entries(f.evades).filter(([, n]) => n > 0).map(([name]) => `🌈 ${name}`),
  ].filter(Boolean);
  return `<b>${f.name}</b>
    <span class="bt-row">PV ${f.hp}/${f.stats.hp}</span>${bar(f.hp, f.stats.hp, 'hp')}
    ${showMana && f.stats.mana ? `<span class="bt-row">Mana ${f.mana}/${f.stats.mana}</span>${bar(f.mana, f.stats.mana, 'mana')}` : ''}
    ${status.length ? `<span class="bt-row bt-status">${status.join(' · ')}</span>` : ''}`;
}

/** Un nom court pour la frise : « La grosse rousse » → « Rousse », « Esprit du puits » → « Esprit ». */
function short(name: string): string {
  const words = name.split(' ').filter((w) => !['la', 'le', 'les', 'l’', 'du', 'de', 'grosse', 'gros'].includes(w.toLowerCase()));
  const w = words[0] ?? name;
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
