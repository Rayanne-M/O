// L'interface en HTML par-dessus le jeu : boîte de dialogue, choix, sous-titres, écrans titre et de fin.
// Le texte reste net à toutes les tailles, alors que le jeu est dessiné en 384 × 216.

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const ACTION = new Set([' ', 'enter', 'e']);
const UP = new Set(['arrowup', 'z', 'w']);
const DOWN = new Set(['arrowdown', 's']);
const CHAR_MS = 28;
const CHOICE_DELAY_MS = 300;

type Listener = (key: string) => void;

/** Les touches déjà prises par l'interface (boîte de dialogue, choix…). */
const handled = new WeakSet<KeyboardEvent>();
export const uiHandled = (e: KeyboardEvent) => handled.has(e);

class Ui {
  /** Vrai tant qu'une boîte, un choix ou un écran attend le joueur : le héros ne bouge pas. */
  busy = false;
  /** Vrai pendant que le texte s'écrit (sert à animer la bouche du portrait). */
  typing = false;
  /** Dernière lettre écrite. */
  lastChar = ' ';
  private listener: Listener | null = null;
  private portraitDraw: ((ctx: CanvasRenderingContext2D, t: number) => void) | null = null;

  constructor() {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (!this.listener) return;
      if (ACTION.has(k) || UP.has(k) || DOWN.has(k)) e.preventDefault();
      // le jeu ne doit pas traiter une seconde fois une touche que l'interface a prise
      handled.add(e);
      if (!e.repeat) this.listener(k);
    });
    $('dialog').addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('li')) return;
      this.listener?.(' ');
    });
    const loop = (t: number) => {
      if (this.portraitDraw) this.portraitDraw($<HTMLCanvasElement>('portrait').getContext('2d')!, t);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /** Touche d'action envoyée par les boutons tactiles. */
  press(key: string) {
    this.listener?.(key);
  }

  /** Le bandeau du haut : le moment de la journée, et ce qu'il faut faire. */
  setHud(when: string, objective: string) {
    $('hud-when').textContent = when;
    $('hud-goal').textContent = objective;
    $('hud').hidden = !when;
  }

  /** Une réplique. Se termine quand le joueur appuie sur action. */
  say(speaker: string, text: string): Promise<void> {
    return new Promise((resolve) => {
      this.busy = true;
      this.open(speaker);
      const p = $('text');
      $('choices').replaceChildren();
      let shown = 0;
      this.typing = true;
      const timer = window.setInterval(() => {
        shown++;
        p.textContent = text.slice(0, shown);
        this.lastChar = text[shown - 1] ?? ' ';
        if (shown >= text.length) done();
      }, CHAR_MS);
      const done = () => {
        window.clearInterval(timer);
        p.textContent = text;
        this.typing = false;
        $('dialog').classList.add('ready');
      };
      this.listener = (k) => {
        if (!ACTION.has(k)) return;
        if (this.typing) return done();
        this.close();
        resolve();
      };
    });
  }

  /** Une question et ses réponses. Renvoie l'indice de la réponse choisie. */
  choose(speaker: string, question: string, options: string[]): Promise<number> {
    return new Promise((resolve) => {
      this.busy = true;
      this.open(speaker);
      $('text').textContent = question;
      $('dialog').classList.add('choosing');
      let sel = 0;
      const items = options.map((label, i) => {
        const li = document.createElement('li');
        li.textContent = label;
        li.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          pick(i);
        });
        return li;
      });
      $('choices').replaceChildren(...items);
      const render = () => items.forEach((li, i) => li.classList.toggle('sel', i === sel));
      const pick = (i: number) => {
        this.close();
        resolve(i);
      };
      render();
      // un appui trop rapide (en faisant défiler le texte) ne doit pas choisir à la place du joueur
      const shownAt = performance.now();
      this.listener = (k) => {
        if (ACTION.has(k) && performance.now() - shownAt < CHOICE_DELAY_MS) return;
        if (UP.has(k)) sel = (sel + options.length - 1) % options.length;
        else if (DOWN.has(k)) sel = (sel + 1) % options.length;
        else if (ACTION.has(k)) return pick(sel);
        render();
      };
    });
  }

  /** Portrait animé à gauche de la boîte (null pour l'enlever). */
  setPortrait(draw: ((ctx: CanvasRenderingContext2D, t: number) => void) | null) {
    this.portraitDraw = draw;
    $('dialog').classList.toggle('with-portrait', !!draw);
  }

  /** Sous-titre de cinématique, sans attendre le joueur. */
  caption(text: string) {
    const el = $('caption');
    el.textContent = text;
    el.hidden = !text;
  }

  /** Attend un appui sur action (ou un toucher), sans boîte. */
  waitAction(): Promise<void> {
    return new Promise((resolve) => {
      this.busy = true;
      this.listener = (k) => {
        if (!ACTION.has(k)) return;
        this.listener = null;
        this.busy = false;
        resolve();
      };
    });
  }

  /** Écoute les touches pendant une séquence (décompte, combat) ; null pour arrêter. */
  listen(fn: ((key: string) => void) | null) {
    this.listener = fn ? (k) => fn(ACTION.has(k) ? 'action' : k) : null;
  }

  /** Grand titre au centre, par exemple « Jour 2 ». */
  async banner(text: string, ms = 1800) {
    const el = $('banner');
    el.textContent = text;
    el.hidden = false;
    await wait(ms);
    el.hidden = true;
  }

  /** Écran plein (titre ou fin). Les boutons renvoient leur indice. */
  screen(html: string, buttons: string[]): Promise<number> {
    return new Promise((resolve) => {
      this.busy = true;
      const el = $('screen');
      el.innerHTML = html;
      const row = document.createElement('div');
      row.className = 'buttons';
      buttons.forEach((label, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.addEventListener('click', () => {
          el.hidden = true;
          this.listener = null;
          this.busy = false;
          resolve(i);
        });
        row.append(b);
      });
      el.append(row);
      el.hidden = false;
      (row.firstElementChild as HTMLButtonElement | null)?.focus();
      this.listener = null;
    });
  }

  /** Écran titre : un titre, une phrase, des boutons. */
  title(title: string, subtitle: string, buttons: string[]) {
    return this.screen(`<h1>${esc(title)}</h1><p>${esc(subtitle)}</p>`, buttons);
  }

  /** Écran de fin : un bilan ligne par ligne, puis rejouer. */
  async summary(s: { title: string; lines: string[] }) {
    await this.screen(`<h1>${esc(s.title)}</h1><ul class="summary">${s.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`, ['Rejouer']);
  }

  private open(speaker: string) {
    const d = $('dialog');
    d.hidden = false;
    d.classList.remove('ready', 'choosing');
    $('speaker').textContent = speaker;
    $('speaker').hidden = !speaker;
    $('text').textContent = '';
  }

  private close() {
    $('dialog').hidden = true;
    this.listener = null;
    this.busy = false;
    this.typing = false;
  }
}

const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);

export const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

export const ui = new Ui();
