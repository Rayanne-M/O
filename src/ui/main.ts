// Interface : elle lit les choix, demande au moteur de calculer le build,
// puis affiche le résultat. Aucune règle de jeu n'est écrite ici.
// L'atelier sert au développement et à l'équilibrage : tout est accessible librement.
import './style.css';
import { STAT_DESCRIPTIONS, STAT_LABELS, gameData, tagLabels } from '../data';
import { maxBlessings, MAX_CURSES, evaluateBuild, type BuildResult } from '../engine/build';
import { DEFAULT_COMBAT, simulateCombat, type DamageKind } from '../engine/combat';
import { STAT_KEYS, type Build, type Element, type Modifier, type Source, type Synergy } from '../engine/types';

const ELEMENT_LABELS: Record<Element, string> = {
  physical: 'physique',
  arcane: 'arcane',
  fire: 'feu',
  shadow: 'ombre',
  holy: 'sacré',
};
const DAMAGE_LABELS: Record<DamageKind, string> = {
  hit: 'Coups',
  crit: 'Critiques',
  burn: 'Brûlures',
  explosion: 'Explosions',
};

const emptyBuild = (): Build => ({
  classId: gameData.classes[0].id,
  blessingIds: [],
  curseIds: [],
  traitIds: [],
});

let build = emptyBuild();

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header>
    <h1>Atelier de personnage</h1>
    <p>Outil de développement et d’équilibrage : combine classe, bénédictions, malédictions et traits, puis compare les résultats.</p>
  </header>
  <main>
    <section class="panel" id="choices"></section>
    <section class="panel" id="result"></section>
  </main>
`;
const choicesEl = app.querySelector<HTMLElement>('#choices')!;
const resultEl = app.querySelector<HTMLElement>('#result')!;

function render(): void {
  const result = evaluateBuild(build, gameData);
  renderChoices(result);
  renderResult(result);
}

function renderChoices(result: BuildResult): void {
  const curses = build.curseIds.length;
  // Passifs déjà obtenus autrement que par un trait (classe, malédiction, synergie...).
  const grantedElsewhere = new Map(
    result.passives.filter((g) => g.sourceName !== 'Trait').map((g) => [g.passive.id, g.sourceName]),
  );
  choicesEl.innerHTML = `
    <div class="panel-head">
      <h2>Classe</h2>
      <button type="button" id="reset">Réinitialiser</button>
    </div>
    ${radioGroup('class', gameData.classes, build.classId)}
    <h2>Bénédictions <small>${build.blessingIds.length}/${maxBlessings(curses)}</small></h2>
    <p class="hint">1 bénédiction gratuite, +1 pour chaque malédiction acceptée.</p>
    ${checkboxGroup('blessing', gameData.blessings, build.blessingIds)}
    <h2>Malédictions <small>${curses}/${MAX_CURSES}</small></h2>
    ${checkboxGroup('curse', gameData.curses, build.curseIds)}
    <h2>Traits <small>${build.traitIds.length}/${gameData.passives.length}</small></h2>
    <p class="hint">Tous les passifs du jeu, à cocher librement pour tester une idée avant de l’attribuer à une classe, une compétence, une bénédiction ou une malédiction.</p>
    <div class="options">${gameData.passives
      .map((p) => {
        const via = grantedElsewhere.get(p.id);
        return `<label class="option" for="trait-${p.id}">
          <input type="checkbox" id="trait-${p.id}" name="trait" value="${p.id}" ${build.traitIds.includes(p.id) ? 'checked' : ''} />
          <span class="option-body">
            <strong>✦ ${p.name}</strong>
            <span class="tags">${tagChips(p.tags ?? [])}</span>
            ${via ? `<span class="granted">déjà obtenu via ${via}</span>` : ''}
            <span class="desc">${p.description}</span>
          </span>
        </label>`;
      })
      .join('')}</div>
  `;
}

function radioGroup(name: string, list: Source[], selected: string): string {
  return `<div class="options">${list
    .map(
      (s) => `<label class="option" for="${name}-${s.id}" title="${s.description}">
        <input type="radio" id="${name}-${s.id}" name="${name}" value="${s.id}" ${s.id === selected ? 'checked' : ''} />
        ${optionBody(s)}
      </label>`,
    )
    .join('')}</div>`;
}

function checkboxGroup(name: string, list: Source[], selected: string[]): string {
  return `<div class="options">${list
    .map(
      (s) => `<label class="option" for="${name}-${s.id}" title="${s.description}">
        <input type="checkbox" id="${name}-${s.id}" name="${name}" value="${s.id}" ${selected.includes(s.id) ? 'checked' : ''} />
        ${optionBody(s)}
      </label>`,
    )
    .join('')}</div>`;
}

function optionBody(s: Source): string {
  return `<span class="option-body">
    <strong>${s.name}</strong>
    <span class="mods">${s.modifiers.map(formatModifier).join(', ')}</span>
    <span class="tags">${tagChips(s.tags)}</span>
    ${(s.passives ?? []).map((id) => `<span class="passive-chip">✦ ${passiveName(id)}</span>`).join('')}
  </span>`;
}

function passiveName(id: string): string {
  return gameData.passives.find((p) => p.id === id)?.name ?? id;
}

function tagChips(tags: string[]): string {
  return tags.map((t) => `<span class="tag">${tagLabels[t] ?? t}</span>`).join('');
}

function formatModifier(m: Modifier): string {
  const sign = m.value >= 0 ? '+' : '';
  return m.type === 'flat' ? `${sign}${m.value} ${STAT_LABELS[m.stat]}` : `${sign}${m.value} % ${STAT_LABELS[m.stat]}`;
}

function renderResult(result: BuildResult): void {
  const inactive = result.synergies.filter((s) => !s.active).sort((a, b) => a.gap - b.gap);
  // « Presque » : il suffit d'ajouter ou de changer un seul élément.
  const near = inactive.filter((s) => s.gap === 1);

  resultEl.innerHTML = `
    ${result.errors.length ? `<div class="errors">${result.errors.map((e) => `<p>⚠️ ${e}</p>`).join('')}</div>` : ''}
    <h2>Statistiques</h2>
    <table class="stats">
      ${STAT_KEYS.map((key) => {
        const d = result.stats[key];
        const details = [`Base : ${d.base}`, ...d.contributions.map((c) => `${c.sourceName} : ${formatModifier(c.modifier)}`)];
        return `<tr>
          <th><span class="stat-name" tabindex="0" data-tip="${STAT_DESCRIPTIONS[key]}">${STAT_LABELS[key]}</span></th>
          <td class="total" title="${details.join('\n')}">${d.total}</td>
          <td class="calc" title="${details.join('\n')}">${formatCalc(d.base, d.flat, d.percent)}</td>
        </tr>`;
      }).join('')}
    </table>
    <p class="hint">Survole le nom d’une stat pour savoir à quoi elle sert, et sa valeur pour voir d’où vient chaque point.</p>
    <h2>Tags du build</h2>
    <div class="tags">${[...result.tagCounts]
      .sort((a, b) => b[1] - a[1])
      .map(([tag, n]) => `<span class="tag">${tagLabels[tag] ?? tag} ×${n}</span>`)
      .join('')}</div>
    <h2>Synergies actives (${result.activeSynergies.length})</h2>
    ${result.activeSynergies.length ? result.activeSynergies.map(({ synergy }) => synergyCard(synergy, [], true)).join('') : '<p class="hint">Aucune pour l’instant.</p>'}
    <h2>Presque ! (${near.length})</h2>
    ${near.length ? near.map(({ synergy, missing }) => synergyCard(synergy, missing, false)).join('') : '<p class="hint">Aucune synergie à un élément près.</p>'}
    <details>
      <summary>Toutes les synergies</summary>
      ${inactive.filter((s) => s.gap > 1).map(({ synergy, missing }) => synergyCard(synergy, missing, false)).join('')}
    </details>
    <h2>Passifs (${result.passives.length})</h2>
    ${result.passives.length ? result.passives.map(({ passive, sourceName }) => `<div class="passive"><strong>✦ ${passive.name}</strong> <span class="mods">via ${sourceName}</span><p>${passive.description}</p></div>`).join('') : '<p class="hint">Aucun passif. Coche un trait, ou active une synergie qui en donne.</p>'}
    ${combatSection(result)}
  `;
}

function combatSection(result: BuildResult): string {
  const combat = simulateCombat(result);
  if (!combat) return '';
  const kinds = (Object.keys(DAMAGE_LABELS) as DamageKind[]).filter((k) => combat.byKind[k] > 0);
  const turns = Array.from({ length: DEFAULT_COMBAT.turns }, (_, i) => i + 1);
  return `
    <h2>Combat d’entraînement</h2>
    <p class="hint">${DEFAULT_COMBAT.turns} tours contre un mannequin (défense ${DEFAULT_COMBAT.targetDefense}). Attaques de ${ELEMENT_LABELS[combat.element]}.</p>
    <p class="damage-total">${combat.total} <small>dégâts</small></p>
    <div class="damage-bars">
      ${kinds
        .map((k) => {
          const share = Math.round((combat.byKind[k] / combat.total) * 100);
          return `<div class="bar-row"><span>${DAMAGE_LABELS[k]}</span>
            <span class="bar"><span class="fill ${k}" style="width:${share}%"></span></span>
            <span class="num">${combat.byKind[k]}</span></div>`;
        })
        .join('')}
    </div>
    <details>
      <summary>Déroulé tour par tour</summary>
      <ol class="combat-log">
        ${turns.map((t) => `<li>${combat.events.filter((e) => e.turn === t).map((e) => e.text).join(' · ')}</li>`).join('')}
      </ol>
    </details>`;
}

function synergyCard(synergy: Synergy, missing: string[], active: boolean): string {
  const effects = [...synergy.modifiers.map(formatModifier), ...(synergy.passives ?? []).map((id) => `✦ ${passiveName(id)}`)];
  return `<div class="synergy ${active ? 'active' : ''}">
    <strong>${synergy.name}</strong> <span class="mods">${effects.join(', ')}</span>
    <p>${synergy.description}</p>
    ${missing.length ? `<p class="missing">Il manque : ${missing.join(' · ')}</p>` : ''}
  </div>`;
}

// Montre le calcul : (base + bonus fixes) × pourcentage.
function formatCalc(base: number, flat: number, percent: number): string {
  const sum = flat === 0 ? `${base}` : `${base} ${flat > 0 ? '+' : '−'} ${Math.abs(flat)}`;
  if (!percent) return sum;
  return `${flat === 0 ? sum : `(${sum})`} × ${100 + percent} %`;
}

// Un seul écouteur pour tous les champs : on met à jour le build puis on réaffiche.
choicesEl.addEventListener('change', (event) => {
  const input = event.target as HTMLInputElement;
  if (input.name === 'class') {
    build.classId = input.value;
  } else {
    const lists: Record<string, string[]> = { blessing: build.blessingIds, curse: build.curseIds, trait: build.traitIds };
    const list = lists[input.name];
    if (!list) return;
    if (input.checked) list.push(input.value);
    else list.splice(list.indexOf(input.value), 1);
  }
  render();
});

choicesEl.addEventListener('click', (event) => {
  if ((event.target as HTMLElement).id !== 'reset') return;
  build = emptyBuild();
  render();
});

render();
