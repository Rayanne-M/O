// L'écran de combat : un prototype jouable du système de combat.
// Toutes les règles sont dans le moteur (src/engine/battle.ts) et tout le contenu dans src/data :
// cette page ne fait que choisir, afficher et animer.
// On y arrive depuis l'atelier (« Tester ce build en combat ») avec le build dans l'adresse,
// ou on choisit un héros tout prêt.
import './style.css';
import { battleData, gameData, tagLabels } from '../data';
import { Battle, heroFromBuild, monsterCombatant, type BattleEvent, type Combatant } from '../engine/battle';
import { evaluateBuild } from '../engine/build';
import type { Build, Element } from '../engine/types';
import { drawScene, FOE_AT, H, HERO_AT, W, type Fx } from './sprites';

const ELEMENT_LABELS: Record<Element, string> = { physical: 'physique', arcane: 'arcane', fire: 'feu', shadow: 'ombre', holy: 'sacré' };

const PRESETS: { name: string; build: Build; hair: number }[] = [
  { name: 'Guerrier', build: { classId: 'warrior', blessingIds: [], curseIds: [], traitIds: [], equipmentIds: ['baton', 'chainmail'] }, hair: 0.2 },
  { name: 'Mage', build: { classId: 'mage', blessingIds: [], curseIds: [], traitIds: [], equipmentIds: [] }, hair: 0.3 },
  { name: 'Voleur', build: { classId: 'rogue', blessingIds: [], curseIds: [], traitIds: [], equipmentIds: [] }, hair: 0.3 },
  {
    name: 'Mage de feu',
    build: { classId: 'mage', blessingIds: ['sun_blessing'], curseIds: [], traitIds: [], equipmentIds: ['ember_staff'] },
    hair: 0.3,
  },
  {
    name: 'Enfant du puits',
    build: { classId: 'rogue', blessingIds: [], curseIds: [], traitIds: ['living_hair'], equipmentIds: ['ciseaux', 'ruban'] },
    hair: 0.9,
  },
];
const FEARS = ['araignees', 'cheveux', 'eau'];
const PACTS = ['living_hair', 'rainbow_belly', 'cautious'];

function buildFromHash(): Build | null {
  try {
    const raw = decodeURIComponent(location.hash.slice(1));
    if (!raw) return null;
    const b = JSON.parse(raw) as Partial<Build>;
    if (!b || typeof b.classId !== 'string') return null;
    return { classId: b.classId, blessingIds: b.blessingIds ?? [], curseIds: b.curseIds ?? [], traitIds: b.traitIds ?? [], equipmentIds: b.equipmentIds ?? [] };
  } catch {
    return null;
  }
}

const fromAtelier = buildFromHash();
const setup = {
  build: structuredClone(fromAtelier ?? PRESETS[3].build),
  hair: fromAtelier ? 0.3 : PRESETS[3].hair,
  fears: [] as string[],
  monster: 'well_spirit',
};

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header>
    <h1>Écran de combat</h1>
    <p>Prototype : le héros seul contre un monstre, tour par tour. La Vitesse décide de l’ordre ; les actions viennent de la classe, de l’équipement, des bénédictions et des synergies.</p>
    <nav><a href="index.html">← Atelier de personnage</a> · <a href="village.html">Le village</a></nav>
  </header>
  <main class="layout">
    <section class="arena">
      <div class="screen" id="screen">
        <canvas id="cv" width="${W}" height="${H}" aria-label="Le combat"></canvas>
        <ol class="timeline" id="timeline" aria-label="Ordre des prochains tours"></ol>
        <div class="card hero-card" id="hero-card"></div>
        <div class="card foe-card" id="foe-card"></div>
        <div id="popups"></div>
        <div class="banner" id="banner" hidden></div>
      </div>
      <div class="menu" id="menu" aria-live="polite"></div>
      <ol class="log" id="log" aria-live="polite"></ol>
    </section>
    <aside class="setup" id="setup"></aside>
  </main>
`;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('cv');
const ctx = canvas.getContext('2d')!;

let battle: Battle;
let hero: Combatant;
let foe: Combatant;
let busy = false;
let run = 0;
const fx: Fx = { hitAt: {}, lungeAt: {} };

// ---------- Préparation ----------

function renderSetup() {
  const result = evaluateBuild(setup.build, gameData);
  const nameOf = (id: string) =>
    [...gameData.classes, ...gameData.blessings, ...gameData.curses, ...(gameData.equipment ?? []), ...gameData.passives].find((s) => s.id === id)?.name ?? id;
  const b = setup.build;
  $('setup').innerHTML = `
    <h2>Adversaire</h2>
    <div class="choices">${battleData.monsters
      .map(
        (m) => `<label class="choice" title="${m.description}"><input type="radio" name="monster" value="${m.id}" ${m.id === setup.monster ? 'checked' : ''}/>
        <span><strong>${m.name}</strong><small>${m.tags.map((t) => tagLabels[t] ?? t).join(' · ') || '—'}${weakText(m.resist)}</small></span></label>`,
      )
      .join('')}</div>
    <h2>Héros</h2>
    <div class="presets">${PRESETS.map((p, i) => `<button type="button" data-preset="${i}">${p.name}</button>`).join('')}</div>
    ${fromAtelier ? '<p class="hint">Build reçu de l’atelier. Les boutons ci-dessus le remplacent.</p>' : ''}
    <p class="build-line"><strong>${nameOf(b.classId)}</strong>${[...b.blessingIds, ...b.curseIds, ...(b.equipmentIds ?? [])].map((id) => ` · ${nameOf(id)}`).join('')}</p>
    ${result.errors.length ? `<p class="error">⚠️ ${result.errors.join(' ')}</p>` : ''}
    <p class="hint">${result.activeSynergies.length ? `Synergies : ${result.activeSynergies.map((s) => s.synergy.name).join(', ')}. ` : ''}Passifs : ${result.passives.map((p) => p.passive.name).join(', ') || 'aucun'}.</p>
    <h3>Pactes et traits</h3>
    <div class="choices">${PACTS.map((id) => {
      const p = gameData.passives.find((x) => x.id === id)!;
      return `<label class="choice" title="${p.description}"><input type="checkbox" name="pact" value="${id}" ${b.traitIds.includes(id) ? 'checked' : ''}/><span><strong>${p.name}</strong></span></label>`;
    }).join('')}</div>
    <label class="slider">Longueur des cheveux : <b>${hairLabel(setup.hair)}</b>
      <input type="range" id="hair" min="0" max="100" value="${Math.round(setup.hair * 100)}"/></label>
    <h3>Peurs de l’enfance</h3>
    <div class="choices">${FEARS.map((f) => `<label class="choice"><input type="checkbox" name="fear" value="${f}" ${setup.fears.includes(f) ? 'checked' : ''}/><span>${tagLabels[f]}</span></label>`).join('')}</div>
    <p class="hint">Une créature dont on a peur fait +25 % de dégâts. Prudent en retire 25.</p>
    <button type="button" class="primary" id="restart">Recommencer le combat</button>
  `;
}

function weakText(resist: Partial<Record<Element, number>> = {}): string {
  const weak = Object.entries(resist).filter(([, v]) => v! < 0).map(([e]) => ELEMENT_LABELS[e as Element]);
  const strong = Object.entries(resist).filter(([, v]) => v! > 0).map(([e]) => ELEMENT_LABELS[e as Element]);
  return `${weak.length ? ` · faible : ${weak.join(', ')}` : ''}${strong.length ? ` · résiste : ${strong.join(', ')}` : ''}`;
}

function hairLabel(h: number): string {
  return h < 0.1 ? 'rasés (le pacte dort)' : h < 0.4 ? 'courts' : h < 0.75 ? 'longs' : 'très longs';
}

$('setup').addEventListener('change', (e) => {
  const input = e.target as HTMLInputElement;
  if (input.name === 'monster') setup.monster = input.value;
  else if (input.name === 'pact') toggle(setup.build.traitIds, input.value, input.checked);
  else if (input.name === 'fear') toggle(setup.fears, input.value, input.checked);
  else if (input.id === 'hair') setup.hair = Number(input.value) / 100;
  else return;
  renderSetup();
  start();
});
$('setup').addEventListener('input', (e) => {
  const input = e.target as HTMLInputElement;
  if (input.id !== 'hair') return;
  setup.hair = Number(input.value) / 100;
  input.parentElement!.querySelector('b')!.textContent = hairLabel(setup.hair);
});
$('setup').addEventListener('click', (e) => {
  const el = e.target as HTMLElement;
  const preset = el.closest<HTMLElement>('[data-preset]');
  if (preset) {
    const p = PRESETS[Number(preset.dataset.preset)];
    setup.build = structuredClone(p.build);
    setup.hair = p.hair;
    renderSetup();
    start();
  } else if (el.id === 'restart') start();
});

function toggle(list: string[], value: string, on: boolean) {
  const i = list.indexOf(value);
  if (on && i < 0) list.push(value);
  if (!on && i >= 0) list.splice(i, 1);
}

// ---------- Combat ----------

function start() {
  run++;
  busy = false;
  const result = evaluateBuild(setup.build, gameData);
  hero = heroFromBuild(result, { name: 'Héros', levels: { hair: setup.hair }, fears: setup.fears });
  const monster = battleData.monsters.find((m) => m.id === setup.monster)!;
  foe = monsterCombatant(monster, gameData.passives);
  battle = new Battle([hero], [foe], battleData);
  $('log').innerHTML = '';
  $('banner').hidden = true;
  addLog(`${foe.name} apparaît ! ${monster.description}`, 'info');
  void loop(run);
}

async function loop(token: number) {
  while (token === run && battle.outcome === 'ongoing') {
    renderHud();
    const actor = battle.current();
    if (actor.side === 'hero') {
      renderMenu();
      return;
    }
    $('menu').innerHTML = `<p class="waiting">${actor.name} réfléchit…</p>`;
    await sleep(650);
    if (token !== run) return;
    await play(battle.playAi(), token);
  }
  if (token === run) finish();
}

async function choose(skillId: string) {
  if (busy || battle.outcome !== 'ongoing' || battle.current().side !== 'hero') return;
  busy = true;
  const token = run;
  $('menu').innerHTML = '';
  await play(battle.act(skillId, foe.id), token);
  busy = false;
  if (token === run) void loop(token);
}

/** Joue les événements un par un : animation, chiffre qui s'envole, ligne du journal. */
async function play(events: BattleEvent[], token: number) {
  for (const e of events) {
    if (token !== run) return;
    const now = performance.now();
    switch (e.kind) {
      case 'skill':
        addLog(e.text, battle.get(e.actor).side);
        if (battle.skill(e.skill).target === 'enemy') fx.lungeAt[e.actor] = now;
        await sleep(200);
        break;
      case 'damage':
        fx.hitAt[e.target] = now;
        popup(e.target, String(e.amount), e.hit);
        addLog(`${e.text}${e.hit === 'burn' ? '' : ` (${ELEMENT_LABELS[e.element]})`} → ${battle.get(e.target).name}`, e.hit);
        renderHud();
        await sleep(e.hit === 'burn' ? 350 : 450);
        break;
      case 'heal':
        popup(e.target, `+${e.amount}`, 'heal');
        addLog(e.text, 'heal');
        renderHud();
        await sleep(400);
        break;
      case 'evade':
        popup(e.target, 'Esquive', 'evade');
        addLog(e.text, 'evade');
        await sleep(450);
        break;
      default:
        addLog(e.text, e.kind === 'end' ? 'end' : 'info');
        renderHud();
        await sleep(250);
    }
  }
}

function finish() {
  renderHud();
  $('timeline').innerHTML = '';
  const text: Record<string, string> = {
    win: 'Victoire !',
    lose: 'Défaite…',
    fled: 'Tu t’es enfui.',
    enemyFled: `${foe.name} s’est enfui.`,
  };
  $('banner').textContent = text[battle.outcome] ?? '';
  $('banner').hidden = false;
  $('menu').innerHTML = `<button type="button" class="primary" data-restart>Recommencer</button>`;
}

// ---------- Affichage ----------

function renderMenu() {
  const usable = new Set(battle.usable(hero).map((s) => s.id));
  $('menu').innerHTML = hero.skills
    .map((id) => {
      const s = battle.skill(id);
      const ok = usable.has(id);
      return `<button type="button" class="skill ${s.target === 'self' ? 'self' : ''}" data-skill="${id}" ${ok ? '' : 'disabled'} title="${s.description}">
        <strong>${s.name}</strong><small>${s.cost ? `${s.cost} mana` : 'gratuit'}</small></button>`;
    })
    .join('');
  $<HTMLButtonElement>('menu').querySelector<HTMLButtonElement>('button:not([disabled])')?.focus({ preventScroll: true });
}

$('menu').addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('button');
  if (!el) return;
  if (el.dataset.restart !== undefined) start();
  else if (el.dataset.skill) void choose(el.dataset.skill);
});

function renderHud() {
  $('timeline').innerHTML = battle
    .preview(8)
    .map((f, i) => `<li class="${f.side} ${i === 0 ? 'now' : ''}">${f.side === 'hero' ? 'Toi' : f.name}</li>`)
    .join('');
  $('hero-card').innerHTML = card(hero, true);
  $('foe-card').innerHTML = card(foe, false);
}

function card(f: Combatant, showMana: boolean): string {
  const bar = (v: number, max: number, cls: string) =>
    `<span class="bar ${cls}"><span style="width:${max ? Math.max(0, (v / max) * 100) : 0}%"></span></span>`;
  const status = [
    f.burns.length ? `🔥×${f.burns.length}` : '',
    f.guarding ? '🛡' : '',
    ...f.buffs.map((b) => `${b.name} ${b.turns}`),
    ...Object.entries(f.evades).filter(([, n]) => n > 0).map(([name]) => `🌈 ${name}`),
  ].filter(Boolean);
  return `<b>${f.name}</b>
    <span class="row">PV ${f.hp}/${f.stats.hp}</span>${bar(f.hp, f.stats.hp, 'hp')}
    ${showMana ? `<span class="row">Mana ${f.mana}/${f.stats.mana}</span>${bar(f.mana, f.stats.mana, 'mana')}` : ''}
    ${status.length ? `<span class="row status">${status.join(' · ')}</span>` : ''}`;
}

function popup(targetId: string, text: string, kind: string) {
  const at = targetId === hero.id ? HERO_AT : FOE_AT;
  const el = document.createElement('span');
  el.className = `pop ${kind}`;
  el.textContent = text;
  el.style.left = `${(at.x / W) * 100 + (Math.random() * 6 - 3)}%`;
  el.style.top = `${((at.y - 40) / H) * 100}%`;
  $('popups').append(el);
  setTimeout(() => el.remove(), 1100);
}

function addLog(text: string, kind: string) {
  const li = document.createElement('li');
  li.className = kind;
  li.textContent = text;
  $('log').prepend(li);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function frame(t: number) {
  if (hero && foe) {
    const look = { build: setup.build, hair: setup.hair, pact: hero.passives.some((p) => p.id === 'living_hair') && setup.hair >= 0.1 };
    drawScene(ctx, t, hero, foe, look, fx);
  }
  requestAnimationFrame(frame);
}

renderSetup();
start();
requestAnimationFrame(frame);
