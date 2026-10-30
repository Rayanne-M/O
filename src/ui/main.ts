// Interface : elle lit les choix du joueur, demande au moteur de calculer le build,
// puis affiche le résultat. Aucune règle de jeu n'est écrite ici.
import './style.css';
import { STAT_LABELS, gameData, tagLabels } from '../data';
import { maxBlessings, MAX_CURSES, evaluateBuild } from '../engine/build';
import { EQUIPMENT_SLOTS, STAT_KEYS, type Build, type EquipmentSlot, type Modifier, type Source } from '../engine/types';

const SLOT_LABELS: Record<EquipmentSlot, string> = { weapon: 'Arme', armor: 'Armure', trinket: 'Bijou' };

const build: Build = {
  raceId: gameData.races[0].id,
  classId: gameData.classes[0].id,
  equipment: {},
  blessingIds: [],
  curseIds: [],
};

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header><h1>Atelier de personnage</h1><p>Combine race, classe, équipement, bénédictions et malédictions pour déclencher des synergies.</p></header>
  <main>
    <section class="panel" id="choices"></section>
    <section class="panel" id="result"></section>
  </main>
`;
const choicesEl = app.querySelector<HTMLElement>('#choices')!;
const resultEl = app.querySelector<HTMLElement>('#result')!;

function render(): void {
  renderChoices();
  renderResult();
}

function renderChoices(): void {
  const curses = build.curseIds.length;
  choicesEl.innerHTML = `
    <h2>Race</h2>${radioGroup('race', gameData.races, build.raceId)}
    <h2>Classe</h2>${radioGroup('class', gameData.classes, build.classId)}
    <h2>Équipement</h2>
    ${EQUIPMENT_SLOTS.map((slot) => slotSelect(slot)).join('')}
    <h2>Bénédictions <small>${build.blessingIds.length}/${maxBlessings(curses)}</small></h2>
    <p class="hint">1 bénédiction gratuite, +1 pour chaque malédiction acceptée.</p>
    ${checkboxGroup('blessing', gameData.blessings, build.blessingIds)}
    <h2>Malédictions <small>${curses}/${MAX_CURSES}</small></h2>
    ${checkboxGroup('curse', gameData.curses, build.curseIds)}
  `;
}

function radioGroup(name: string, list: Source[], selected: string): string {
  return `<div class="options">${list
    .map(
      (s) => `<label class="option" title="${s.description}">
        <input type="radio" name="${name}" value="${s.id}" ${s.id === selected ? 'checked' : ''} />
        ${optionBody(s)}
      </label>`,
    )
    .join('')}</div>`;
}

function checkboxGroup(name: string, list: Source[], selected: string[]): string {
  return `<div class="options">${list
    .map(
      (s) => `<label class="option" title="${s.description}">
        <input type="checkbox" name="${name}" value="${s.id}" ${selected.includes(s.id) ? 'checked' : ''} />
        ${optionBody(s)}
      </label>`,
    )
    .join('')}</div>`;
}

function slotSelect(slot: EquipmentSlot): string {
  const items = gameData.equipment.filter((e) => e.slot === slot);
  const current = build.equipment[slot] ?? '';
  const options = items
    .map((e) => {
      const forbidden = e.allowedClasses && !e.allowedClasses.includes(build.classId);
      return `<option value="${e.id}" ${e.id === current ? 'selected' : ''} ${forbidden ? 'disabled' : ''}>
        ${e.name} — ${e.modifiers.map(formatModifier).join(', ')} ${tagChips(e.tags, true)}
      </option>`;
    })
    .join('');
  return `<label class="slot">${SLOT_LABELS[slot]}
    <select data-slot="${slot}"><option value="">— aucun —</option>${options}</select>
  </label>`;
}

function optionBody(s: Source): string {
  return `<span class="option-body">
    <strong>${s.name}</strong>
    <span class="mods">${s.modifiers.map(formatModifier).join(', ')}</span>
    <span class="tags">${tagChips(s.tags)}</span>
  </span>`;
}

function tagChips(tags: string[], plain = false): string {
  if (plain) return tags.length ? `[${tags.map((t) => tagLabels[t] ?? t).join(', ')}]` : '';
  return tags.map((t) => `<span class="tag">${tagLabels[t] ?? t}</span>`).join('');
}

function formatModifier(m: Modifier): string {
  const sign = m.value >= 0 ? '+' : '';
  return m.type === 'flat' ? `${sign}${m.value} ${STAT_LABELS[m.stat]}` : `${sign}${m.value} % ${STAT_LABELS[m.stat]}`;
}

function renderResult(): void {
  const result = evaluateBuild(build, gameData);
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
        return `<tr title="${details.join('\n')}">
          <th>${STAT_LABELS[key]}</th>
          <td class="total">${d.total}</td>
          <td class="calc">${formatCalc(d.base, d.flat, d.percent)}</td>
        </tr>`;
      }).join('')}
    </table>
    <p class="hint">Survole une stat pour voir d’où vient chaque point.</p>
    <h2>Tags du build</h2>
    <div class="tags">${[...result.tagCounts]
      .sort((a, b) => b[1] - a[1])
      .map(([tag, n]) => `<span class="tag">${tagLabels[tag] ?? tag} ×${n}</span>`)
      .join('')}</div>
    <h2>Synergies actives (${result.activeSynergies.length})</h2>
    ${result.activeSynergies.length ? result.activeSynergies.map(({ synergy }) => synergyCard(synergy.name, synergy.description, synergy.modifiers, [], true)).join('') : '<p class="hint">Aucune pour l’instant.</p>'}
    <h2>Presque ! (${near.length})</h2>
    ${near.length ? near.map(({ synergy, missing }) => synergyCard(synergy.name, synergy.description, synergy.modifiers, missing, false)).join('') : '<p class="hint">Aucune synergie à un élément près.</p>'}
    <details>
      <summary>Toutes les synergies</summary>
      ${inactive.filter((s) => s.gap > 1).map(({ synergy, missing }) => synergyCard(synergy.name, synergy.description, synergy.modifiers, missing, false)).join('')}
    </details>
  `;
}

function synergyCard(name: string, description: string, mods: Modifier[], missing: string[], active: boolean): string {
  return `<div class="synergy ${active ? 'active' : ''}">
    <strong>${name}</strong> <span class="mods">${mods.map(formatModifier).join(', ')}</span>
    <p>${description}</p>
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
  const input = event.target as HTMLInputElement | HTMLSelectElement;
  if (input instanceof HTMLSelectElement) {
    const slot = input.dataset.slot as EquipmentSlot;
    if (input.value) build.equipment[slot] = input.value;
    else delete build.equipment[slot];
  } else if (input.name === 'race') {
    build.raceId = input.value;
  } else if (input.name === 'class') {
    build.classId = input.value;
    // Retire les objets que la nouvelle classe ne peut pas porter.
    for (const slot of EQUIPMENT_SLOTS) {
      const item = gameData.equipment.find((e) => e.id === build.equipment[slot]);
      if (item?.allowedClasses && !item.allowedClasses.includes(build.classId)) delete build.equipment[slot];
    }
  } else if (input.name === 'blessing' || input.name === 'curse') {
    const list = input.name === 'blessing' ? build.blessingIds : build.curseIds;
    const checked = (input as HTMLInputElement).checked;
    if (checked) list.push(input.value);
    else list.splice(list.indexOf(input.value), 1);
  }
  render();
});

render();
