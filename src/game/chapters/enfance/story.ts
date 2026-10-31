// L'enfance, scène par scène, d'après le doc « Scénario de l'enfance » (version réécrite),
// jouée sur les cartes de rpg/data/maps/. Chaque journée est une suite d'étapes : on pose les personnages,
// on dit au joueur quoi faire, puis on lui rend la main jusqu'à ce que l'étape soit finie (g.until).
// Les réactions aux objets, aux personnages, aux zones et aux sorties sont posées par étape dans H.
// Positions en tuiles (at), comme dans les cartes.
import * as A from '../../art/shared.js';
import type { Game } from '../../engine/game';
import { Handlers } from '../../engine/handlers';
import { openArea, type Dir, type Drawable, type MapObject } from '../../engine/maps';
import type { Actor } from '../../engine/actors';
import { applyEffects, count, has, hasItem, state } from '../../engine/state';
import { ui } from '../../engine/ui';
import { LOOKS, heroLook } from './cast';
import * as P from './plans';

export const H = new Handlers();

/** Réactions d'une étape à l'arrivée sur une carte, et décor qu'elle ajoute (balle, bâton…). */
export const hooks: { arrived: ((map: string) => void) | null; decor: ((map: string, t: number) => Drawable[]) | null } = { arrived: null, decor: null };

// ---------- Petits outils ----------

const T = 16;
/** Un point en tuiles, comme dans les cartes. */
const at = (x: number, y: number, dir: Dir = 'S') => ({ x: x * T, y: y * T, dir });

const MOMENT_LABEL: Record<string, string> = { aube: 'Aube', matin: 'Matin', 'fin de matinée': 'Fin de matinée', midi: 'Midi', 'après-midi': 'Après-midi', "fin d'après-midi": "Fin d'après-midi", soir: 'Soir', veillée: 'Veillée', nuit: 'Nuit' };
export function hud(objective: string) {
  ui.setHud(state.day > 3 ? 'Le lendemain' : `Jour ${state.day} · ${MOMENT_LABEL[state.moment] ?? state.moment}`, objective);
}
const flag = (f: string) => applyEffects({ [f]: true });
/** Force de l'Esprit au puits : légende + rancoeur + peur, moins le ruban jeté. */
export const force = () => count('legende') + count('rancoeur') + count('peur') - (has('ruban_jete') ? 2 : 0);
const NO_INSIDE = 'Pas le droit de se cacher à l\'intérieur, on a dit ! Que dehors, dans le village.';

/** Un objet d'une carte, tel que la carte le décrit. */
const obj = (g: Game, map: string, id: string) => g.maps[map].file.objects.find((o) => o.id === id) as MapObject | undefined;

/** Les personnages ont la tête de leur rôle du moment. */
function looks(g: Game) {
  g.hero.look = heroLook();
  const alias: Record<string, string> = { enfant_a: 'enfant1', enfant_b: 'enfant2', enfant_c: 'enfant3' };
  for (const id of ['mere', 'margot', 'basile', 'fauvel', 'aubin', 'ysol', 'enfant_a', 'enfant_b', 'enfant_c', 'villageois1', 'mere_basile'])
    g.actor(id, { look: LOOKS[alias[id] ?? id] });
  g.actor('elio', { look: LOOKS[state.day >= 3 ? 'elio_capuche' : 'elio'] });
}

function clearCast(g: Game) {
  for (const a of g.cast.values()) if (a !== g.hero) Object.assign(a, { map: '', follows: undefined, sitting: false, wading: false, hop: 0, pose: undefined, visible: true });
  g.hero.pose = undefined;
}

/** Une étape : on efface les réactions et le décor de la précédente. */
function step(g: Game, day: number, moment: string, night = false) {
  H.clear();
  hooks.arrived = null;
  hooks.decor = null;
  g.setTime(day, moment, night);
  hud('');
}

/** Joue une cinématique de la planche jusqu'au bout (sans la retirer). */
async function play(g: Game, [draw, len]: P.Cine) {
  g.showPlan(draw);
  await g.wait(len);
}
const cut = () => (state.hair >= 0.4 ? 'pointes' : 'court');

/** Change de carte avec un fondu. */
async function cutTo(g: Game, map: string, where: string | { x: number; y: number; dir?: Dir }, ms = 350) {
  await g.fade(1, ms);
  g.goto(map, where);
  await g.fade(0, ms);
}

/** Matin : le héros se réveille dans sa chambre. */
async function wakeUp(g: Game, day: number) {
  step(g, day, 'matin');
  clearCast(g);
  looks(g);
  candle.lit = true;
  g.goto('maison_chambre', 'lit');
  g.showPlan(P.noirPlan);
  await g.fade(0, 1);
  await ui.banner(`Jour ${day}`, 1500);
  g.showPlan(null);
}

// ---------- Le soir : la chambre, la bougie, la fenêtre ----------

const candle = { lit: true };
const BACK_IN = 'Tu grimpes au rebord et tu te glisses dans ta chambre.';

/** Au lit : la bougie à souffler ou non, la fenêtre (secrète) pour sortir, le lit pour finir la journée. */
async function bedtime(g: Game) {
  step(g, state.day, 'nuit', true);
  clearCast(g);
  candle.lit = true;
  g.goto('maison_chambre', 'lit');
  await g.fade(0, 400);
  hud('Aller se coucher');
  const refused = state.day === 2 && has('a_bu_le_lait');
  if (refused) candle.lit = false;
  let slept = false, outside = false;
  H.on({
    'object:maison_chambre/bougie': async () => {
      if (refused) return g.say('narr', 'La bougie refuse de s\'allumer. La mèche est mouillée, on dirait.');
      const k = await g.choose('narr', candle.lit ? 'La bougie brûle.' : 'La bougie est éteinte.', [candle.lit ? 'La souffler' : 'La rallumer', 'La laisser']);
      if (k === 0) candle.lit = !candle.lit;
    },
    'object:maison_chambre/lit': async () => {
      if ((await g.choose('narr', 'Te coucher ?', ['Dormir', 'Pas encore'])) !== 0) return;
      // la peur du noir se joue sur les soirs où la bougie a pu brûler
      if (!refused) applyEffects(candle.lit ? { bougie_allumee: 1, bougie_possible: 1 } : { bougie_soufflee: 1, bougie_possible: 1 });
      slept = true;
    },
    'exit:maison_chambre/vers_salle': () => g.say('narr', 'Maman a fermé la porte à clé, comme tous les soirs.'),
    // la fenêtre s'ouvre, et rien ne le signale
    'exit:maison_chambre/fenetre': () => {
      if (!has('sorti_fenetre_une_fois')) applyEffects({ voleur: 1, sorti_fenetre_une_fois: true });
      if (!outside) applyEffects({ sorties_nuit: 1 });
      outside = true;
      return true;
    },
    'zone:village/fenetre_heros': async () => {
      await g.say('narr', BACK_IN);
      await cutTo(g, 'maison_chambre', 'depuis_fenetre');
    },
    'exit:village/*': () => g.say('narr', 'Tout est fermé, la nuit.'),
    'enter:village/puits': () => g.say('narr', 'Le puits chante, tout bas. Tu n\'oses pas t\'approcher plus.'),
  });
  await g.until(() => slept);
}

// ---------- Réactions permanentes : regarder les choses ----------

export function setupAlways(g: Game) {
  H.always_({
    'object:coffre': () => g.say('narr', 'Ton coffre à jouets : une épée de bois, une étoile en papier, un masque de chiffon.'),
    'object:maison_chambre/dessins': () => g.say('narr', drawingsText()),
    'object:maison_chambre/fenetre_chambre': () => g.say('narr', g.night ? 'La lune éclaire le rebord.' : 'Le village, au soleil.'),
    'object:maison_chambre/lit': () => g.say('narr', 'Ton lit. Ce n\'est pas l\'heure.'),
    'object:maison_chambre/bougie': () => g.say('narr', 'Ta bougie, sur le tabouret.'),
    'object:maison_cuisine/poele': () => g.say('narr', 'Le feu craque. Ça sent la soupe aux poireaux.'),
    'object:maison_cuisine/tresse_ail': () => g.say('narr', 'Des tresses d\'ail. Et au-dessus de la porte, une petite tresse de paille, contre la Rancunière.'),
    'object:maison_cuisine/etagere': () => g.say('narr', 'Les pots de maman. Il ne faut pas y toucher.'),
    'object:maison_cuisine/sabots': () => g.say('narr', 'Tes sabots.'),
    'object:maison_salle/cheminee': () => g.say('narr', 'La cheminée de la salle.'),
    'object:maison_salle/fenetre': () => g.say('narr', 'Dehors, la place et le grand chêne.'),
    'object:grange/outils': () => g.say('narr', 'Le râteau et la serpe de papa. Il est parti à la foire.'),
    'object:grange/echelle': () => g.say('narr', 'L\'échelle du fenil.'),
    'object:grange/foin': () => g.say('narr', 'Du foin qui pique.'),
    'object:barbier/miroir': () => g.say('narr', 'Un miroir piqué de taches.'),
    'object:barbier/portrait': () => g.say('fauvel', 'Le prince Élu ! Je l\'ai coiffé en rêve, figure-toi.'),
    'object:barbier/canari': () => g.say('narr', 'Le canari chante dès que tu t\'approches.'),
    'object:moulin_meule/meule': () => g.say('narr', 'La grande meule. Elle ne tourne plus beaucoup.'),
    'object:village/puits': () => g.say('narr', g.night ? 'Le puits chante, tout bas.' : 'Le vieux puits. De l\'eau noire, très loin.'),
    'object:village/chene': () => g.say('narr', 'Le grand chêne de la place. Ses branches sont épaisses comme des bras.'),
    'object:village/fontaine': () => g.say('narr', 'L\'eau de la fontaine est glacée.'),
    'object:village/caisse_margot': () => g.say('narr', 'Une caisse, juste sous la fenêtre de Margot. Sur le mur, des traces de pas.'),
    'object:village/table_ysol': () => g.say('narr', 'Grand-mère Ysol mange dehors l\'été, sous une longue nappe.'),
    'object:village/trainee': () => g.say('narr', 'De longs cheveux mouillés. Ils mènent au puits.'),
    'exit:village/porte_maison_basile': () => g.say('narr', 'Chez Basile, ça crie, ça rit, ça pleure : ses petits frères.'),
  });
}

function drawingsText() {
  const { guerrier, mage, voleur } = state.gauges;
  const part = (n: number, a: string, b: string, c: string) => (n >= 3 ? c : n >= 1 ? b : a);
  return `Tes dessins au charbon sur le mur. ${part(guerrier, 'Un chevalier tout maigre', 'Un chevalier avec son épée', 'Un chevalier, son épée et son bouclier')}, ${part(mage, 'un sorcier', 'un sorcier et son chapeau', 'un sorcier, son chapeau et son bâton')}, ${part(voleur, 'un brigand', 'un brigand masqué', 'un brigand masqué et sa cape')}.`;
}

// ---------- Préparation des cartes ----------

/** Ce que le scénario ajoute aux cartes : la balle de la rivière est à nous (on la lance), le bâton de la nuit 3. */
export function dressMaps(g: Game) {
  const v = g.maps.village;
  v.file.objects = v.file.objects.filter((o) => o.id !== 'balle');
  v.objects = v.objects.filter((o) => o.id !== 'balle');
  v.zones.baton = { x: 20.6 * T, y: 12.6 * T, w: 1.6 * T, h: 1.2 * T };
}

/** Ce que l'histoire change au dessin des cartes : état des objets par id, bêtes dessinées ou non. */
export function mapOptions(_g: Game, map: string): { state?: Record<string, unknown>; animals?: boolean } {
  if (map === 'grange') {
    const st: Record<string, unknown> = {};
    for (const id of eggs.shown) st[id] = { shown: true };
    return { state: st, animals: !(state.day === 1 && state.moment === 'matin') };
  }
  if (map === 'maison_chambre') return { state: { bougie: { blown: !candle.lit }, dessins: { ...state.gauges } } };
  if (map === 'barbier') return { state: { canari: { sing: true }, clochette: { ring: shopBell.at ? performance.now() - shopBell.at : null } } };
  return {};
}
export const shopBell = { at: 0 };

// ---------- Jour 1, scène 1 : les œufs ----------

/** Les œufs trouvés (objets cachés de la grange) et celui qu'on montre pendant la réplique. */
export const eggs = { found: new Set<string>(), shown: new Set<string>() };

interface Hen { kind: string; state: string; since: number; face: number; seed: number }
function hen(g: Game, id: string, x: number, y: number, kind: string, init: Partial<Actor> = {}): Actor {
  const h: Hen = { kind, state: 'idle', since: 0, face: 1, seed: id.length * 7 };
  // les poules ne bloquent pas : elles sautent partout, elles ne doivent jamais enfermer le héros
  return g.put(id, 'grange', at(x, y), {
    solid: false,
    ...init,
    draw: (ctx, a, t) => A.drawHen(ctx, Math.round(a.x), Math.round(a.y - (a.hop ?? 0)), t, { kind: h.kind, face: h.face, state: h.state, st: t - h.since, seed: h.seed }),
    ...({ hen: h } as object),
  });
}
const henOf = (a: Actor) => (a as Actor & { hen: Hen }).hen;

/** Une poule réagit : elle saute de côté en battant des ailes, pince, ou s'envole. */
async function push(g: Game, id: string, how: 'pushed' | 'pinch' | 'fly', face = 1) {
  const a = g.actor(id), h = henOf(a);
  h.state = how;
  h.face = face;
  h.since = g.time.now;
  await g.wait(how === 'fly' ? 1250 : how === 'pinch' ? 650 : 1150);
  const m = A.henMotion(how, 99999, face);
  if (how !== 'pinch') {
    a.x += m.dx;
    a.y += Math.max(0, m.dy);
  }
  h.state = how === 'pinch' ? 'nest' : 'idle';
}

async function foundEgg(g: Game, spot: string, text: string) {
  eggs.shown.add(spot);
  await g.say('narr', `${text} (${eggs.found.size + 1}/5)`);
  eggs.shown.delete(spot);
  eggs.found.add(spot);
  hud(`Trouver les œufs dans la grange (${eggs.found.size}/5)`);
}

async function day1Eggs(g: Game) {
  await wakeUp(g, 1);
  hud('Descendre voir maman, dans la cuisine');
  g.put('mere', 'maison_cuisine', at(6.8, 3.4));
  let asked = false;
  const ask = async () => {
    if (asked) return g.say('mere', 'Cinq œufs. Et attention à la grosse rousse.');
    asked = true;
    await g.lines([
      ['mere', 'Ah, te voilà. Va me chercher les œufs. Cinq, pas un de moins.'],
      ['mere', 'Et attention à la grosse rousse, elle pince.'],
    ]);
    hud('Trouver les œufs dans la grange (0/5)');
  };
  hooks.arrived = (map) => {
    if (map === 'maison_cuisine' && !asked) void g.cut(ask);
  };
  // la grange : cinq poules, cinq cachettes
  hen(g, 'rousse', 5.9, 2.3, 'rousse');
  henOf(g.actor('rousse')).state = 'nest';
  hen(g, 'blanche', 9.9, 5.2, 'blanche');
  hen(g, 'noire', 1.6, 4.4, 'noire');
  hen(g, 'grise', 8.2, 6.4, 'grise', { hop: 7 });
  hen(g, 'tachetee', 9.3, 6.3, 'tachetee', { hop: 7 });
  let pinched = false;
  const later = () => g.say('narr', 'Il faudrait d\'abord savoir ce que veut maman.');
  const spot = (id: string) => eggs.found.has(id);
  const lookUp = async () => {
    if (spot('oeuf_sabot') || !asked) return g.say('narr', 'Un vieux sabot accroché au mur.');
    await foundEgg(g, 'oeuf_sabot', 'Tu lèves les yeux. Dans le vieux sabot accroché au mur : un œuf !');
  };
  H.on({
    'actor:mere': ask,
    'actor:rousse': async () => {
      if (spot('oeuf_rousse')) return g.say('narr', 'La grosse rousse te regarde de travers.');
      if (!asked) return later();
      if (!pinched) {
        pinched = true;
        await push(g, 'rousse', 'pinch', -1);
        g.face('hero', 'N');
        return g.say('heros', 'Aïe ! Elle pince !');
      }
      await push(g, 'rousse', 'pushed', -1);
      await foundEgg(g, 'oeuf_rousse', 'La grosse rousse saute de son nid en criant. Dessous : un œuf tout chaud.');
    },
    'actor:blanche': async () => {
      if (spot('oeuf_foin')) return g.say('narr', 'Cot cot.');
      if (!asked) return later();
      await push(g, 'blanche', 'pushed', g.hero.x < g.actor('blanche').x ? 1 : -1);
      await foundEgg(g, 'oeuf_foin', 'Elle grattait le foin, au pied de l\'échelle. Dessous : un œuf.');
    },
    'actor:noire': async () => {
      if (spot('oeuf_tonneau')) return g.say('narr', 'Cot.');
      if (!asked) return later();
      await push(g, 'noire', 'pushed', 1);
      await foundEgg(g, 'oeuf_tonneau', 'La poule noire file. Elle couvait derrière le tonneau d\'eau.');
    },
    'object:grange/tonneau_eau': () => g.say('narr', spot('oeuf_tonneau') ? 'Le tonneau d\'eau.' : 'Le tonneau d\'eau. La poule noire garde le coin, derrière.'),
    'object:grange/charrette': async () => {
      if (spot('oeuf_charrette')) return g.say('narr', 'La vieille charrette.');
      if (!asked) return g.say('narr', 'Deux poules perchées sur la charrette.');
      await flyOff(g);
    },
    'actor:grise': async () => (spot('oeuf_charrette') ? g.say('narr', 'Cot cot cot.') : asked ? flyOff(g) : later()),
    'actor:tachetee': async () => (spot('oeuf_charrette') ? g.say('narr', 'Cot cot cot.') : asked ? flyOff(g) : later()),
    'zone:grange/oeuf_sabot': lookUp,
    'object:grange/sabot_mur': lookUp,
    'object:grange/panier': () => g.say('narr', 'Le panier à œufs.'),
    'exit:grange/vers_fenil': () => g.say('narr', 'Maman dit qu\'il ne faut pas monter seul au fenil.'),
  });
  await g.until(() => eggs.found.size >= 5);
  await basketCloseup(g);
  hud('Rapporter les œufs à maman');
  H.clear();
  hooks.arrived = null;
  let given = false;
  H.on({
    'actor:mere': async () => {
      if (has('oeuf_casse')) await g.say('mere', 'Quatre ? Bon. On fera une omelette plus petite.');
      else await g.say('mere', 'Cinq. Tu vois quand tu veux. File, ils t\'attendent sur la place.');
      given = true;
    },
  });
  await g.until(() => given);
}

async function flyOff(g: Game) {
  await g.say('narr', 'Tu grimpes sur la roue de la charrette…');
  await Promise.all([push(g, 'grise', 'fly', -1), push(g, 'tachetee', 'fly', 1)]);
  g.actor('grise', { hop: 0, y: 7.7 * T });
  g.actor('tachetee', { hop: 0, y: 7.8 * T });
  await foundEgg(g, 'oeuf_charrette', 'Deux poules s\'envolent en criant. Dans la paille de la charrette : un œuf.');
}

/** Le gros plan du panier : l'araignée sort de sous un œuf (PLAN-01). */
async function basketCloseup(g: Game) {
  await g.cut(async () => {
    let suite: string | null = null, at0 = 0, now = 0;
    g.showPlan((c, t) => {
      now = t;
      A.drawBasketCloseup(c, t, { suite, suite_t: t - at0 });
    });
    await g.wait(2600);
    const k = await g.choose('narr', 'Une araignée sort de sous un œuf. Elle monte sur le bord du panier… et glisse sur ta main.', [
      { label: 'L\'écraser de l\'autre main', effects: { guerrier: 1, 'peurs.araignees': 'neutre', tache: true } },
      { label: 'Crier et secouer la main', effects: { 'peurs.araignees': 'peur', oeuf_casse: true } },
      { label: 'La laisser marcher sur tes doigts, puis la reposer sur une poutre', effects: { 'peurs.araignees': 'aime' } },
    ]);
    suite = ['ecraser', 'secouer', 'reposer'][k];
    at0 = now;
    await g.wait(2300);
    g.showPlan(null);
    // la tache de l'araignée écrasée reste sur la paume jusqu'au soir
    if (k === 0) g.hero.mark = 'tache_paume';
    if (k === 1) await g.say('narr', 'Un œuf saute du panier et s\'écrase par terre.');
  });
}

// ---------- Jour 1, scène 2 : le cache-cache ----------

/** Où se cachent les amis : Basile dans le buisson près de chez Ysol, Margot dans le chêne, Élio sur la margelle du puits. */
const HIDE = { basile: at(13.5, 18.7), margot: at(15.6, 11.6), elio: at(25.1, 16.6) };
const hideout = { margot: false, acorns: 0 };

async function day1HideAndSeek(g: Game) {
  step(g, 1, 'midi');
  clearCast(g);
  looks(g);
  g.populate('village', ['mere', 'aubin', 'fauvel']);
  hud('Rejoindre la bande sur la place');
  let started = false, done = false;
  const start = async () => {
    if (started) return;
    started = true;
    await g.cut(async () => {
      await g.lines([
        ['margot', 'Cache-cache. C\'est toi qui cherches, t\'es arrivé en dernier.'],
        ['basile', 'Pas dans la forêt, hein. Ni près du puits.'],
        ['elio', 'Moi je vais où je veux.'],
        ['margot', 'Et pas le droit de se cacher à l\'intérieur ! Que dehors, dans le village.'],
      ]);
      await countdown(g);
    });
    done = true;
  };
  H.on({ 'enter:village/place': start, 'actor:margot': start, 'actor:basile': start, 'actor:elio': start });
  await g.until(() => done);
  // la recherche
  const found = new Set<string>();
  hud('Trouver Basile, Margot et Élio (0/3)');
  const find = async (id: 'basile' | 'margot' | 'elio', lines: [string, string][]) => {
    if (found.has(id)) return;
    found.add(id);
    const a = g.actor(id, { visible: true, hop: 0, sitting: false, pose: undefined });
    if (id === 'margot') {
      // elle saute du chêne
      hideout.margot = false;
      Object.assign(a, { x: g.hero.x + 12, y: g.hero.y });
      for (let k = 30; k >= 0; k -= 3) {
        a.hop = k;
        await g.wait(25);
      }
    }
    // ses sabots ne dépassent plus du buisson
    if (id === 'basile') {
      flag('basile_trouve');
      Object.assign(a, { x: g.hero.x + 14, y: g.hero.y });
    }
    g.face(id, 'hero');
    await g.lines(lines);
    a.follows = g.hero;
    hud(`Trouver Basile, Margot et Élio (${found.size}/3)`);
  };
  const basile = () => find('basile', [['basile', 'C\'est pas juste, elle m\'a dénoncé avec les yeux !']]);
  const elio = () => find('elio', [
    ['elio', 'Je me cachais pas. J\'aime bien ici. C\'est calme.'],
    ['elio', 'Chez moi c\'est pas calme.'],
  ]);
  const margot = () => find('margot', [['margot', 'La reine des brigands se laisse attraper, c\'est différent.']]);
  H.on({
    'actor:ysol': async () => {
      if (found.has('basile')) return g.say('ysol', 'Allez, filez, les enfants.');
      await g.say('ysol', 'Je n\'ai vu personne, mon cœur.');
      await g.say('narr', 'Elle regarde le buisson, à côté de chez elle. Très fort.');
    },
    'zone:village/cachette_basile': basile,
    'object:village/buisson6': () => (found.has('basile') ? g.say('narr', 'Un buisson.') : basile()),
    // des glands tombent quand on passe sous le chêne
    'enter:village/chene': () => {
      if (!found.has('margot')) hideout.acorns = g.time.now + 2600;
    },
    'zone:village/chene': () => (found.has('margot') ? g.say('narr', 'Le grand chêne de la place.') : margot()),
    'object:village/chene': () => (found.has('margot') ? g.say('narr', 'Le grand chêne de la place.') : margot()),
    'actor:elio': elio,
    'zone:village/puits': () => (found.has('elio') ? g.say('narr', 'Le vieux puits.') : elio()),
    'object:village/puits': () => (found.has('elio') ? g.say('narr', 'Le vieux puits.') : elio()),
    // fausses pistes
    'enter:village/devant_basile': async () => {
      if (found.has('basile') || has('vu_mere_basile')) return;
      flag('vu_mere_basile');
      await g.cut(async () => {
        g.put('mere_basile', 'village', at(19.9, 21.2, 'N'));
        g.face('mere_basile', 'hero');
        await g.say('mere_basile', 'Basile ? On joue pas dans ma maison. Dehors !');
        g.remove('mere_basile');
      });
    },
    'enter:village/moulin_dehors': async () => {
      if (has('vu_aubin_midi')) return;
      flag('vu_aubin_midi');
      await g.cut(async () => {
        g.put('aubin', 'village', at(24.4, 8.4));
        g.face('aubin', 'hero');
        await g.say('aubin', 'Dehors ! On joue pas devant mon moulin.');
        await g.walk('hero', g.hero.x, g.hero.y + 22, 90);
        g.remove('aubin');
      });
    },
    'exit:village/*': () => g.say('heros', NO_INSIDE),
  });
  await g.until(() => found.size >= 3);
  hud('Aller au puits avec la bande');
  await g.until(() => g.inZone('puits'));
  await day1Legend(g);
}

/** Le décompte (UI-02), yeux fermés : action ouvre un œil, une seule fois (voleur +1), et on voit Margot grimper. */
async function countdown(g: Game) {
  g.put('hero', 'village', at(15.6, 12.9, 'N'));
  let now = 0, peekAt = -1;
  ui.listen((k) => {
    if (k === 'action' && peekAt < 0) {
      peekAt = now;
      applyEffects({ voleur: 1, triche: true });
    }
  });
  // les amis filent se cacher pendant que le héros compte
  g.actor('elio', { ...HIDE.elio, pose: 'assis_genoux' });
  g.actor('basile', { ...HIDE.basile, visible: false });
  g.actor('margot', { visible: false, ...HIDE.margot });
  hideout.margot = true;
  g.put('ysol', 'village', at(11.9, 21.0, 'E'));
  await play(g, countdownCine());
  ui.listen(null);
  g.showPlan(null);

  function countdownCine(): P.Cine {
    const [draw, len] = P.countdownCine((t) => (peekAt >= 0 ? t - peekAt : undefined));
    return [(c, t) => {
      now = t;
      draw(c, t);
    }, len];
  }
}

// ---------- Jour 1, scène 3 : la légende du puits ----------

async function day1Legend(g: Game) {
  step(g, 1, "fin d'après-midi");
  hud('');
  for (const id of ['margot', 'basile', 'elio']) g.actor(id, { follows: undefined, pose: undefined });
  await g.cut(async () => {
    await g.fade(1, 300);
    g.put('elio', 'village', HIDE.elio, { pose: 'assis_genoux' });
    g.put('margot', 'village', at(23.7, 17.4, 'NE'));
    g.put('basile', 'village', at(26.6, 17.6, 'NW'));
    g.put('hero', 'village', at(25.1, 18.0, 'N'));
    await g.fade(0, 300);
    await g.lines([
      ['narr', 'Basile pâlit en voyant le puits. Puis il ne peut pas s\'empêcher de raconter.'],
      ['basile', 'Il y a cent ans, une fille du village avait des cheveux si longs qu\'ils traînaient par terre.'],
      ['basile', 'Sa sœur, jalouse, les lui a coupés pendant qu\'elle dormait. La fille n\'a jamais pardonné.'],
      ['basile', 'Elle s\'est jetée dans le puits avec sa rancune. Depuis, ses cheveux repoussent au fond.'],
      ['basile', 'Et quand un enfant garde une rancune trop longtemps… elle remonte la boire.'],
      ['margot', 'Ma mère dit que c\'est pour qu\'on arrête de bouder.'],
      ['elio', 'Moi je trouve qu\'elle avait raison, la fille.'],
    ]);
    await g.choose('heros', 'Et toi ?', [
      { label: '« J\'y crois. J\'ai déjà entendu chanter là-dedans. »', effects: { mage: 1, legende: 1, legende_moi: true } },
      { label: '« N\'importe quoi. C\'est un trou avec de l\'eau. »', effects: { dit_nimporte_quoi: true } },
      { label: '« Tu la racontes mal. Écoute. »', effects: { voleur: 1, legende: 2, legende_moi: true, trait: 'Conteur' } },
    ]);
    if (has('dit_nimporte_quoi')) await g.say('basile', 'Dis pas ça près du puits !');
    else if (state.traits.includes('Conteur')) await g.lines([
      ['heros', 'Elle ne remonte pas boire. Elle remonte en rampant, et ses cheveux t\'entrent dans le nez…'],
      ['basile', 'Arrête !'],
    ]);
    if ((await g.choose('narr', 'Les autres reculent. Le puits est là, tout près.', ['Se pencher au-dessus', 'Rester en arrière'])) === 0) {
      g.showPlan(P.puitsJourPlan);
      await g.wait(2600);
      await g.say('narr', 'De l\'eau noire, très loin. Ton reflet. Une goutte tombe, le reflet tremble. C\'est tout.');
      g.showPlan(null);
    }
  });
}

// ---------- Jour 1, scènes 4 et 5 : la comptine, le gardien ----------

async function day1Evening(g: Game) {
  step(g, 1, 'veillée', true);
  clearCast(g);
  g.hero.mark = undefined;
  await g.fade(1, 500);
  g.goto('maison_salle', at(6, 6.4, 'N'));
  g.populate('maison_salle');
  g.put('mere', 'maison_salle', at(7.5, 4.6, 'W'));
  await g.fade(0, 500);
  await g.cut(async () => {
    await g.lines([
      ['narr', 'Grand-mère Ysol est venue filer au coin du feu.'],
      ['ysol', '♪ Quand le jour avalera la nuit, naîtra l\'enfant des deux lumières… ♪'],
      ['heros', 'C\'est qui, l\'enfant des deux lumières ?'],
      ['ysol', 'Le prince, mon cœur. L\'Élu est déjà né, à la capitale. Les prêtres l\'ont dit.'],
      ['mere', 'Tu es né la même nuit que lui, d\'ailleurs. Le ciel était tout noir. Tu ne pleurais même pas.'],
      ['ysol', 'Beaucoup d\'enfants sont nés cette nuit-là.'],
    ]);
  });
  // le gardien de la maison, dans la cuisine
  step(g, 1, 'soir', true);
  clearCast(g);
  await g.fade(1, 400);
  g.goto('maison_cuisine', at(3.2, 2.9, 'W'));
  g.put('mere', 'maison_cuisine', at(5.6, 3.0, 'W'));
  await g.fade(0, 400);
  await g.cut(async () => {
    await g.lines([
      ['narr', 'Avant d\'aller au lit, maman pose un bol de lait près du poêle et te tend un quignon de pain.'],
      ['mere', 'Pose ça à côté du lait. C\'est pour le gardien de la maison. Il veille sur nous tant qu\'on le nourrit.'],
      ['heros', 'Tu l\'as déjà vu ?'],
      ['mere', 'Personne ne le voit. Mais le lait est toujours bu.'],
    ]);
    g.face('mere', 'E');
    await g.choose('narr', 'Maman te tourne le dos.', [
      { label: 'Poser le pain à côté du lait', effects: { mage: 1, beni: 5, pain_pose: true } },
      { label: 'Manger le pain en cachette', effects: { pain_mange: true } },
      { label: 'Boire le lait', effects: { a_bu_le_lait: true } },
    ]);
    await g.say('mere', 'Au lit, maintenant.');
    await g.fade(1, 400);
  });
  await bedtime(g);
  await g.fade(1, 900);
}

// ---------- Jour 2 : le barbier et la rivière ----------

async function day2(g: Game) {
  await wakeUp(g, 2);
  g.put('mere', 'maison_cuisine', at(6.8, 3.4));
  hud('Descendre à la cuisine');
  let ready = false;
  hooks.arrived = (map) => {
    if (map !== 'maison_cuisine' || ready) return;
    ready = true;
    void g.cut(async () => {
      if (has('pain_pose')) await g.say('narr', 'Devant la porte, tes sabots sont cirés. Le quignon de pain a disparu.');
      if (has('pain_mange')) await g.say('narr', 'Il te manque un sabot. Tu le retrouves dans le seau à cendres.');
      if (has('a_bu_le_lait')) await g.say('narr', 'Le bol du gardien est retourné.');
      if (!has('pain_pose') && !has('pain_mange') && !has('a_bu_le_lait')) await g.say('narr', 'Le bol du gardien est vide.');
      await g.say('mere', 'Regarde-toi, on dirait un buisson. Viens, on va chez Maître Fauvel.');
      g.remove('mere');
      hud('Aller chez le barbier (la maison au toit bleu)');
    });
  };
  let inShop = false;
  const toShop = (map: string) => {
    if (map === 'barbier') {
      inShop = true;
      shopBell.at = performance.now();
    }
  };
  await g.until(() => ready && g.map.id !== 'maison_cuisine');
  // le salon : maman y est déjà
  g.put('mere', 'barbier', at(2.2, 6.6, 'E'));
  g.put('fauvel', 'barbier', at(5.6, 3.8, 'S'));
  hooks.arrived = toShop;
  H.on({
    'exit:village/porte_barbier': () => true,
    'exit:village/*': () => g.say('narr', 'Maman t\'attend chez Maître Fauvel, la maison au toit bleu.'),
  });
  await g.until(() => inShop);
  H.clear();
  hooks.arrived = null;
  await g.cut(async () => {
    await g.say('narr', 'Ding ! La clochette de la porte sonne. Un client dort sous une serviette chaude.');
    await g.say('fauvel', 'Assieds-toi là, jeune homme. Alors, on fait comment ?');
    await g.walk('hero', 4 * T, 4.6 * T, 60);
    g.put('hero', 'barbier', at(4, 3.5, 'S'), { pose: 'assis_genoux' });
    g.put('fauvel', 'barbier', at(5.4, 3.6, 'W'));
    const k = await g.choose('heros', 'Dans le grand fauteuil…', [
      { label: '« Court. Comme un soldat. »', effects: { cheveux: 0.15 } },
      { label: '« Juste les pointes. »', effects: { cheveux: 0.55 } },
    ]);
    await play(g, P.haircutCine(k === 0 ? 'court' : 'pointes'));
    g.hero.look = heroLook();
    await g.say('narr', k === 0 ? 'Dans le miroir, un petit soldat te regarde.' : 'Dans le miroir, presque le même, en mieux peigné.');
    g.showPlan(null);
    g.put('hero', 'barbier', at(4, 4.8, 'S'), { pose: undefined });
    // Fauvel bavarde avec maman, le dos tourné à l'étagère
    g.put('fauvel', 'barbier', at(3.6, 6.6, 'W'));
    await g.lines([
      ['fauvel', 'Vous avez vu le meunier ? Il boit depuis que sa femme est partie. Le petit traîne dehors jusqu\'à la nuit.'],
      ['mere', 'Ce n\'est pas nos affaires, Fauvel.'],
      ['fauvel', 'Tout est mes affaires, je suis barbier.'],
    ]);
  });
  hud('Te promener pendant que les grands parlent');
  H.on({
    'object:barbier/ciseaux': async () => {
      if (hasItem('ciseaux')) return g.say('narr', 'L\'étagère du fond.');
      const k = await g.choose('narr', 'Les grands ciseaux de Maître Fauvel, sur l\'étagère du fond. Il te tourne le dos.', ['Les prendre', 'Ne pas y toucher']);
      if (k === 0) {
        applyEffects({ voleur: 1, trait: 'Doigts légers', objet: 'ciseaux', ciseaux_pris: true });
        await g.say('narr', 'Tu glisses les ciseaux sous ta chemise. Personne n\'a rien vu.');
      }
    },
    'object:barbier/flacons': async () => {
      await g.say('narr', 'Des flacons de lotion. Tu en sens un…');
      await g.say('heros', 'Atchoum !');
    },
    'object:barbier/cheveux_sol': () => g.say('narr', 'Avec le balai, tu pousses les mèches coupées en petit tas. Tes cheveux d\'avant.'),
    'object:barbier/balai': () => g.say('narr', 'Avec le balai, tu pousses les mèches coupées en petit tas. Tes cheveux d\'avant.'),
    'object:barbier/client': () => g.say('narr', 'Il ronfle sous sa serviette.'),
    'actor:fauvel': () => g.say('fauvel', '… et je lui ai dit, moi, à la Germaine…'),
    'actor:mere': () => g.say('mere', 'Va prendre l\'air, on a bientôt fini.'),
  });
  let out = false;
  hooks.arrived = (map) => {
    if (map === 'village') out = true;
  };
  await g.until(() => out);
  // devant le salon : Aubin et son rasoir
  step(g, 2, 'fin de matinée');
  await g.cut(async () => {
    g.put('aubin', 'village', at(21, 9.6, 'W'));
    await g.walk('aubin', g.hero.x + 20, g.hero.y + 4, 40);
    g.face('aubin', 'hero');
    g.face('hero', 'aubin');
    await g.lines([
      ['narr', 'Aubin arrive, un rasoir à la main. Il vient le faire affûter.'],
      ['aubin', 'C\'est toi, le copain du gamin. Tu lui diras de rentrer tôt. Ce soir, je lui rase la tête.'],
      ['aubin', 'Plus de tresses sous mon toit. Il ressemble trop à sa mère avec ça.'],
    ]);
    const k = await g.choose('heros', '', [
      { label: '« Laissez-le tranquille ! »', effects: { guerrier: 2, rancoeur: -1, insolent: true } },
      { label: '« Tout le monde dit que ses tresses lui vont bien. Même Maître Fauvel. »', effects: { voleur: 1, rancoeur: -1 } },
      { label: 'Ne rien dire', effects: { rancoeur: 1 } },
    ]);
    if (k === 0) await g.say('aubin', 'Toi, on t\'a mal élevé.');
    if (k === 1) await g.say('aubin', 'Tout le monde, hein ?');
    await g.walk('aubin', 17.6 * T, 7.6 * T, 50);
    g.remove('aubin');
  });
  await day2River(g);
}

/** La balle de la rivière, quand elle vole. */
const ball = { x: 0, y: 0, h: 0, visible: false };
async function throwBall(g: Game, to: Actor) {
  const x0 = g.hero.x, y0 = g.hero.y;
  ball.visible = true;
  for (let k = 0; k <= 20; k++) {
    const u = k / 20;
    ball.x = x0 + (to.x - x0) * u;
    ball.y = y0 + (to.y - y0) * u;
    ball.h = 12 + Math.sin(u * Math.PI) * 26;
    await g.wait(25);
  }
  ball.visible = false;
}

/** Ouvre (ou referme) l'eau d'une zone de la carte, pour s'y baigner. */
const closeWater = new Map<string, () => void>();
function openWater(g: Game, map: string, zone: string, open: boolean) {
  closeWater.get(map)?.();
  closeWater.delete(map);
  if (open) closeWater.set(map, openArea(g.maps[map], g.maps[map].zones[zone]));
}

async function day2River(g: Game) {
  step(g, 2, 'après-midi');
  hud('Rejoindre la bande à la rivière (près du pont)');
  openWater(g, 'village', 'riviere_baignade', true);
  g.populate('village', ['mere', 'fauvel', 'aubin', 'ysol']);
  g.put('margot', 'village', at(27.5, 15.3, 'W'), { wading: true });
  g.put('basile', 'village', at(27.9, 16.1, 'W'), { wading: true });
  for (const id of ['enfant_a', 'enfant_b']) g.actor(id, { wading: true });
  g.actor('elio', { ...at(29.5, 17.3, 'W'), pose: 'assis_genoux' });
  let throws = 0, talked = false, hinted = false;
  const catcher = async (id: string) => {
    if (!g.hero.wading) return g.say(id === 'basile' ? 'basile' : 'margot', 'Viens dans l\'eau, elle est bonne !');
    const a = g.actor(id);
    await throwBall(g, a);
    throws++;
    if (id === 'basile') await g.say('narr', 'Basile la rate. Encore. Plouf.');
    else if (id === 'margot') await g.say('margot', 'À moi ! Personne ne l\'aura !');
    else await g.say('narr', 'On te la renvoie en éclaboussant tout le monde.');
    if (throws >= 2 && !hinted) {
      hinted = true;
      // l'indice de la fenêtre
      g.face('margot', 'hero');
      await g.lines([
        ['margot', 'Ma mère ferme la porte à clé la nuit, rapport à la Rancunière.'],
        ['margot', 'Moi je sors souvent par ma fenêtre la nuit. Elle n\'en sait rien.'],
        ['margot', 'Attrape !'],
      ]);
    }
  };
  H.on({
    'actor:margot': () => catcher('margot'),
    'actor:basile': () => catcher('basile'),
    'actor:enfant_a': () => catcher('enfant_a'),
    'actor:enfant_b': () => catcher('enfant_b'),
    'actor:elio': async () => {
      if (talked) return g.say('elio', 'Je vais rester encore un peu ici.');
      await elioOnBank(g);
      talked = true;
      hud('Rentrer dîner à la maison');
    },
    'exit:village/*': (gg) => (talked ? true : gg.say('narr', 'La bande t\'attend à la rivière.')),
  });
  hooks.decor = (map) => (map === 'village' && ball.visible ? [{ y: ball.y + 1, draw: (c) => A.drawBall(c, ball.x, ball.y, ball.h, { water: true }) }] : []);
  // dans l'eau jusqu'à la taille
  const tick = setInterval(() => {
    g.hero.wading = g.hero.map === 'village' && g.inZone('riviere_baignade');
  }, 100);
  let home = false;
  hooks.arrived = (map) => {
    if (map === 'maison_cuisine' && talked) home = true;
  };
  await g.until(() => home);
  clearInterval(tick);
  g.hero.wading = false;
  openWater(g, 'village', 'riviere_baignade', false);
  step(g, 2, 'soir', true);
  clearCast(g);
  g.put('mere', 'maison_cuisine', at(5.6, 3.0, 'W'));
  g.goto('maison_cuisine', at(3.2, 2.9, 'E'));
  await g.cut(() => g.lines([
    ['mere', 'Mange ta soupe. Et ne parle pas la bouche pleine.'],
    ['narr', 'Le dîner, la bougie, le lit.'],
  ]));
  await g.fade(1, 400);
  await bedtime(g);
  await g.cut(async () => {
    await g.fade(1, 600);
    g.showPlan(P.noirPlan);
    await g.fade(0, 1);
    await g.say('narr', 'Allongé, tu entends au loin une porte claquer, du côté du moulin. Puis plus rien.');
    await g.fade(1, 1);
    g.showPlan(null);
  });
}

async function elioOnBank(g: Game) {
  await g.cut(async () => {
    g.face('hero', 'elio');
    const asked = new Set<number>();
    const Q: [string, [string, string][]][] = [
      ['« Tu viens pas ? »', [['elio', 'J\'ai pas envie qu\'on voie mes bras.']]],
      ['« Elle est où, ta mère ? »', [
        ['elio', 'Partie, l\'hiver dernier. À la capitale, prier l\'Élu. Elle disait qu\'il pouvait guérir papa de la boisson.'],
        ['elio', 'Papa, lui, dit qu\'elle est partie avec un marchand de draps. Je sais pas qui croire.'],
      ]],
      ['« Et ton père ? »', [
        ['elio', 'Avant, il chantait en tournant la meule. Maintenant il parle à maman quand elle est pas là.'],
        ['elio', 'Et ce soir il va me raser. Il dit que je lui ressemble trop.'],
        ['elio', 'C\'est elle qui m\'a fait les tresses. C\'est tout ce qu\'il me reste d\'elle.'],
      ]],
    ];
    await g.say('narr', 'Élio reste seul sur la rive, sa chemise sur le dos, les genoux dans les bras.');
    while (asked.size < Q.length) {
      const left = Q.map((q, i) => ({ label: q[0], i })).filter((q) => !asked.has(q.i));
      const k = await g.choose('heros', 'Tu t\'assois à côté de lui.', left.map((q) => q.label));
      asked.add(left[k].i);
      await g.lines(Q[left[k].i][1]);
    }
    const k = await g.choose('heros', '', [
      { label: '« Tes cheveux repousseront. Et ta mère reviendra peut-être. »', effects: { rancoeur: -1, compte_coeur_fidele: 1 } },
      { label: '« Il mérite que quelqu\'un le punisse. »', effects: { rancoeur: 1, compte_rancunier: 1 } },
      { label: '« Viens dans l\'eau. On s\'en fiche de tes bras. »', effects: { rancoeur: -1 } },
    ]);
    if (k === 1) await g.say('elio', 'Ouais. Quelqu\'un.');
    if (k === 0) await g.say('elio', '… Peut-être.');
    if (k === 2) {
      await g.say('narr', 'Élio hésite. Puis il enlève sa chemise et court dans l\'eau en criant.');
      g.actor('elio', { pose: undefined });
      await g.walk('elio', 27.6 * T, 14.6 * T, 60);
      g.actor('elio', { wading: true });
      await g.say('elio', 'Lance-moi la balle !');
    }
  });
}

// ---------- Jour 3 : la tête rasée ----------

async function day3(g: Game) {
  await wakeUp(g, 3);
  g.put('mere', 'maison_cuisine', at(6.8, 3.4));
  g.populate('village', ['mere', 'fauvel', 'aubin']);
  hud('Retrouver la bande sur la place');
  let met = false, done = false;
  const meet = async () => {
    if (met) return;
    met = true;
    await g.cut(async () => {
      g.face('elio', 'hero');
      await g.lines([
        ['narr', 'Élio arrive avec une capuche. Margot ne fait pas de blague, pour une fois.'],
        ['elio_capuche', 'Il l\'a fait hier soir.'],
      ]);
      g.actor('elio', { look: LOOKS.elio_rase });
      await g.lines([
        ['narr', 'Il baisse sa capuche. Son crâne est rasé de travers, avec des entailles.'],
        ['elio_rase', 'Il a jeté les tresses dans le poêle. J\'ai juste sauvé ça.'],
      ]);
      await play(g, P.ribbonCine);
      await g.say('narr', 'Il ouvre la main : un ruban bleu, à moitié brûlé.');
      g.showPlan(null);
      await g.say('elio_rase', 'Je le déteste. Je voudrais qu\'il disparaisse.');
      const k = await g.choose('heros', '', [
        { label: '« Tes cheveux vont repousser. Je reste avec toi toute la journée. »', effects: { rancoeur: -1, compte_coeur_fidele: 1 } },
        { label: '« Moi aussi je le déteste. Il mérite pire. »', effects: { rancoeur: 1, compte_rancunier: 1 } },
        'Ne rien dire, lui donner un coup d\'épaule',
      ]);
      if (k === 2) await g.say('elio_rase', '… Merci.');
      g.actor('elio', { look: LOOKS.elio_capuche });
      if (hasItem('ciseaux')) {
        g.put('fauvel', 'village', at(17.6, 8.4));
        await g.walk('fauvel', g.hero.x - 30, g.hero.y - 20, 90);
        await g.say('fauvel', 'Au voleur ! Mes grands ciseaux ! Qui a vu mes ciseaux ?');
        await g.walk('fauvel', 17.6 * T, 8.4 * T, 90);
        g.remove('fauvel');
        g.face('margot', 'hero');
        await g.say('narr', 'Margot te regarde. Elle sourit, et se tait.');
      }
    });
    done = true;
  };
  H.on({
    'actor:mere': () => g.say('mere', 'Va jouer. Et sois gentil avec le petit Élio.'),
    'enter:village/place': meet,
    'actor:elio': meet,
    'actor:margot': meet,
    'actor:basile': meet,
  });
  await g.until(() => done);
  // après-midi : la peur de Basile, au lavoir
  step(g, 3, 'après-midi');
  await g.fade(1, 300);
  g.put('basile', 'village', at(22.6, 18.6, 'W'));
  g.put('margot', 'village', at(19.6, 18.8, 'E'));
  g.put('elio', 'village', at(20.2, 13.4, 'S'));
  g.goto('village', at(21.6, 18.8, 'E'));
  await g.fade(0, 300);
  await g.cut(async () => {
    await g.lines([
      ['narr', 'L\'après-midi, au lavoir. Basile n\'arrive plus à regarder Élio.'],
      ['basile', 'Il a de la rancune plein le ventre. La Rancunière va venir. Faut prévenir les autres.'],
    ]);
    const k = await g.choose('heros', '', [
      { label: 'Aider Basile à prévenir tous les enfants du village', effects: { legende: 1, mage: 1, legende_moi: true } },
      '« Tais-toi, il va t\'entendre. »',
    ]);
    if (k === 0) await g.say('narr', 'Avant le soir, tous les enfants du village parlent de la Rancunière.');
  });
  // fin d'après-midi : « à demain »
  step(g, 3, "fin d'après-midi");
  await g.cut(async () => {
    await g.say('narr', 'Élio rentre plus tôt que les autres. Il s\'arrête, revient, et te tend le ruban.');
    await g.walk('elio', g.hero.x - 18, g.hero.y, 50);
    g.face('elio', 'hero');
    g.face('hero', 'elio');
    await g.say('elio_capuche', 'Garde-le, toi. Chez moi, il le brûlerait.');
    await g.choose('heros', '', [
      { label: 'Prendre le ruban', effects: { objet: 'ruban', a_ruban: true } },
      { label: '« Garde-le. C\'est à ta mère. »', effects: { ruban_refuse: true } },
    ]);
    await g.say('elio_capuche', 'À demain.');
    await g.walk('elio', 24.4 * T, 9 * T, 50);
    g.remove('elio');
  });
  hud('Rentrer à la maison');
  let home = false;
  hooks.arrived = (map) => {
    if (map === 'maison_cuisine') home = true;
  };
  await g.until(() => home);
  step(g, 3, 'soir', true);
  clearCast(g);
  g.put('mere', 'maison_cuisine', at(5.6, 3.0, 'W'));
  g.goto('maison_cuisine', at(3.2, 2.9, 'E'));
  await g.cut(() => g.say('narr', 'Tu dînes en silence. Maman ferme la porte à clé, comme tous les soirs.'));
  await g.fade(1, 400);
  await bedtime(g);
  await g.fade(1, 900);
}

// ---------- Nuit 3 : le rêve et la fenêtre ----------

async function night3(g: Game): Promise<'fenetre' | 'lit'> {
  step(g, 3, 'nuit', true);
  clearCast(g);
  ui.setHud('', '');
  g.showPlan(P.revePlan);
  await g.fade(0, 1);
  await g.wait(P.REVE_LEN);
  g.showPlan(P.reveilPlan('Vous vous réveillez en sueur.'));
  await g.wait(3200);
  await play(g, P.wakeCine(cut()));
  candle.lit = false;
  g.goto('maison_chambre', 'lit');
  g.showPlan(null);
  // aucune bulle, aucune icône : le joueur va vers la fenêtre ou vers le lit
  let choice: 'fenetre' | 'lit' | null = null;
  H.on({
    'object:maison_chambre/fenetre_chambre': () => {
      choice = 'fenetre';
    },
    'exit:maison_chambre/fenetre': () => {
      choice = 'fenetre';
    },
    'object:maison_chambre/lit': () => {
      choice = 'lit';
    },
    'object:maison_chambre/bougie': () => g.say('narr', 'La bougie est éteinte. Elle ne se rallume pas.'),
    'exit:maison_chambre/vers_salle': () => g.say('narr', 'La porte est fermée à clé.'),
  });
  await g.until(() => choice !== null);
  return choice!;
}

/** Dehors, la nuit 3 : le moulin, la traînée de cheveux, le puits. */
async function night3Outside(g: Game) {
  if (!has('sorti_fenetre_une_fois')) applyEffects({ voleur: 1, sorti_fenetre_une_fois: true });
  applyEffects({ sorties_nuit: 1, sorti_nuit3: true });
  await g.cut(async () => {
    await cutTo(g, 'village', 'fenetre_heros', 400);
    await g.say('narr', 'Tu enjambes le rebord et sautes dans le jardin. L\'herbe est froide.');
  });
  ui.setHud('Nuit', '');
  H.on({
    'zone:village/fenetre_elio': async () => {
      await g.say('narr', 'La fenêtre d\'Élio est grande ouverte. Le rideau bat. Dedans, le lit est vide, le drap traîné jusqu\'au sol.');
      await g.say('narr', 'Sur le rebord, de longs cheveux noirs, mouillés. Élio n\'en a plus.');
      if (has('ruban_refuse') && !hasItem('ruban')) {
        if ((await g.choose('narr', 'Le ruban bleu est tombé sur le rebord.', ['Le prendre', 'Le laisser'])) === 0) applyEffects({ objet: 'ruban', a_ruban: true });
      }
    },
    'zone:village/fenetre_cuisine_moulin': async () => {
      await g.say('narr', 'Par la fenêtre de la cuisine : Aubin, endormi sur la table, une bouteille couchée à côté de lui. Dans le poêle, les restes des tresses.');
      if ((await g.choose('narr', '', ['Frapper au carreau', 'Ne pas le réveiller'])) === 0) await g.say('aubin', '… Lise… reviens…');
    },
    'zone:village/baton': async () => {
      if (hasItem('baton')) return;
      applyEffects({ objet: 'baton' });
      await g.say('narr', 'Tu ramasses un bâton.');
    },
    'zone:village/fenetre_heros': async () => {
      if ((await g.choose('narr', 'Ta fenêtre.', ['Rentrer te coucher', 'Rester dehors'])) !== 0) return;
      await g.say('narr', BACK_IN);
      flag('rentre_nuit3');
    },
    'exit:village/*': () => g.say('narr', 'Tout est fermé, la nuit.'),
  });
  hooks.decor = (map) => (map === 'village' && !hasItem('baton') ? [{ y: 13.6 * T, draw: (c) => A.drawIcon(c, 'baton', 20.8 * T, 12.7 * T) }] : []);
  await g.until(() => g.inZone('puits') || has('rentre_nuit3'));
}

// ---------- Le puits ----------

export type Ending = 'incredulite' | 'apaisement' | 'victoire' | 'pacte' | 'defaite' | 'fuite' | 'rendormi';
export const ENDINGS: Record<Ending, { name: string; body: boolean }> = {
  incredulite: { name: 'Incrédulité', body: true },
  apaisement: { name: 'Apaisement', body: true },
  victoire: { name: 'Victoire', body: true },
  pacte: { name: 'Pacte', body: true },
  defaite: { name: 'Défaite', body: false },
  fuite: { name: 'Fuite', body: false },
  rendormi: { name: 'Rendormi', body: false },
};

/** La peur du noir se décide la nuit 3 : bougie allumée au moins 2 soirs, ou soufflée et sorti au moins 2 nuits. */
function settleDark() {
  if (state.fears.noir) return;
  if (count('bougie_allumee') >= 2) state.fears.noir = 'peur';
  else if (count('bougie_soufflee') >= 2 && count('sorties_nuit') >= 2) state.fears.noir = 'aime';
  else state.fears.noir = 'neutre';
}

async function well(g: Game): Promise<Ending> {
  settleDark();
  if (state.fears.noir === 'peur') applyEffects({ peur: 1 });
  return g.cut(async () => {
    g.put('hero', 'village', at(25.1, 17.2, 'N'));
    await g.say('narr', 'Les cheveux débordent du puits et rampent dans l\'herbe comme des racines. La manivelle est immobile.');
    await g.choose('heros', '', [
      { label: 'Reculer en criant', effects: { peur: 1, 'peurs.cheveux': 'peur', cri: true } },
      'Rester planté là, les poings serrés',
      'Appeler Élio',
    ]);
    await g.say('narr', 'Tu te penches, comme au premier jour. D\'abord, tout est noir.');
    g.showPlan(P.horreurPlan(state.soften));
    await g.wait(7200);
    await g.say('narr', 'Puis tes yeux s\'habituent. Les parois. Et ce qui t\'attend en bas.');
    await g.lines([
      ['esprit', 'Tu es venu le chercher ?'],
      ['esprit', 'Il avait si peur… C\'était délicieux.'],
      ['esprit', 'Approche. Laisse-moi goûter la tienne.'],
    ]);
    if (state.traits.includes('Conteur')) await g.say('esprit', 'Tu me racontes si bien. Hier, grâce à toi, j\'ai grandi d\'un pied.');
    if (has('dit_nimporte_quoi')) await g.say('esprit', 'Toi, tu ne crois pas en moi. Pourtant tu es venu jusqu\'ici.');
    if (count('compte_rancunier') > 0) await g.say('esprit', 'Merci de l\'avoir nourri pour moi.');
    // le menu du puits : on y revient tant qu'on n'a pas conclu
    for (;;) {
      const k = await g.choose('narr', 'Que fais-tu ?', ['Parler', 'Combattre', 'Pacte', 'Fuir']);
      if (k === 0) {
        const end = await talk(g);
        if (end) return end;
      } else if (k === 1) return fight(g);
      else if (k === 2) {
        const end = await pact(g);
        if (end) return end;
      } else {
        g.showPlan(null);
        await g.say('narr', 'Tu cours. Tu cours jusqu\'à ta fenêtre et tu te glisses sous le drap, le cœur qui cogne.');
        return 'fuite';
      }
    }
  });
}

async function talk(g: Game): Promise<Ending | null> {
  const k = await g.choose('heros', '', [
    { label: 'Laisser tomber le ruban dans le puits', if: () => hasItem('ruban') },
    '« Pourquoi lui ? »',
    '« Je ne crois pas en toi. »',
    '« Je connais ton histoire. Ta sœur t\'a coupé les cheveux. »',
    '« Qu\'est-ce que tu veux ? »',
    'Rien',
  ]);
  if (k === 0) {
    applyEffects({ perd: 'ruban', ruban_jete: true, a_ruban: false });
    await g.say('narr', 'Le ruban tombe en tournoyant. Les cheveux reculent.');
    await g.say('esprit', 'Un ruban… ma sœur en avait un.');
  } else if (k === 1) {
    await g.say('esprit', 'Ce n\'est pas lui que je voulais. Sa rancune était petite, comme lui.');
    await g.say('esprit', 'Toi… quand tu crois quelque chose, ça pèse. Je l\'ai senti à ta naissance.');
  } else if (k === 2) {
    if (has('dit_nimporte_quoi') && !has('legende_moi') && !has('cri')) {
      await g.say('narr', 'Les cheveux se relâchent. Quelque chose, en bas, faiblit.');
      await g.say('esprit', 'Un seul incroyant ne me tue pas. Mais ta voix pèse lourd.');
      await g.say('narr', 'L\'Esprit quitte le puits.');
      applyEffects({ trait: 'Incrédule' });
      return 'incredulite';
    }
    await g.say('esprit', 'Tu y croyais hier. Je t\'ai entendu.');
  } else if (k === 3) {
    await g.say('heros', 'Tu peux la laisser partir, ta rancune.');
    if (force() <= 4) {
      await g.say('narr', 'Et l\'Esprit chante. Pour la première fois, avec des paroles. Il lâche Élio, et s\'en va.');
      applyEffects({ mage: 2, trait: 'Chuchoteur d\'esprits' });
      return 'apaisement';
    }
    await g.say('esprit', 'Ma rancune, c\'est tout ce qu\'il me reste. Comme lui, avec ses tresses.');
  } else if (k === 4) return pact(g);
  return null;
}

async function pact(g: Game): Promise<Ending | null> {
  await g.lines([
    ['esprit', 'Ou bien… prête-moi tes cheveux.'],
    ['esprit', 'Je quitte ce trou et je viens avec toi. Tu seras plus fort que tous les autres enfants.'],
    ['esprit', 'Mais ne les coupe jamais. Chaque mèche coupée, c\'est moi que tu coupes.'],
  ]);
  if (state.hair < 0.4) await g.say('esprit', 'Courts ? Ils pousseront. J\'ai le temps.');
  if ((await g.choose('heros', '', ['Accepter', 'Refuser'])) !== 0) return null;
  applyEffects({ trait: 'Cheveux vivants', maudit: 15, mage: 1 });
  g.showPlan(null);
  await g.say('narr', 'Les cheveux lâchent Élio et remontent vers toi. Ils entrent dans les tiens, froids, puis plus rien.');
  g.hero.look = heroLook();
  return 'pacte';
}

/** Combattre (ANI-23) : trois mèches sortent du puits. Ciseaux : un coup par mèche ; bâton : trois. Deux saisies, c'est perdu. */
async function fight(g: Game): Promise<Ending> {
  g.showPlan(null);
  const weapon = hasItem('ciseaux') ? 'ciseaux' : 'baton';
  if (weapon === 'baton' && !hasItem('baton')) {
    applyEffects({ objet: 'baton' });
    await g.say('narr', 'Tu ramasses un bâton près de la margelle.');
  }
  const limit = weapon === 'ciseaux' ? 6 : 3, win = force() <= limit;
  const well = obj(g, 'village', 'puits')!, wx = well.x * T + 4, wy = well.y * T + 10;
  const hp: number[] = [0, 1, 2].map(() => (weapon === 'ciseaux' ? 1 : 3));
  const fx = { hit: { i: -1, at: -1e9 }, grab: { at: -1e9, k: 0 } };
  hooks.decor = (map, t) => (map !== 'village' ? [] : [{
    y: wy + 30,
    draw: (c) => {
      A.drawWellLocks(c, wx, wy, t, { hp, hit: { i: fx.hit.i, t: t - fx.hit.at } });
      if (t - fx.hit.at < 250) A.drawHitFx(c, wx + 18 + [-9, 0, 9][fx.hit.i], wy + 4, t - fx.hit.at, weapon);
      if (t - fx.grab.at < 1400) A.drawHairGrab(c, wx + 18, wy + 22, g.hero.x, g.hero.y - 2, t - fx.grab.at, fx.grab.k);
    },
  }]);
  await g.say('narr', `Tu brandis ${weapon === 'ciseaux' ? 'les ciseaux du barbier' : 'ton bâton'}. Appuie sur action pour frapper les mèches.`);
  let grabs = 0;
  while (hp.some((h) => h > 0) && grabs < 2) {
    const i = hp.findIndex((h) => h > 0);
    await ui.waitAction();
    hp[i]--;
    fx.hit = { i, at: g.time.now };
    await g.wait(300);
    if (hp[i] > 0) continue;
    ui.caption(`Une mèche tombe. (${hp.filter((h) => h === 0).length}/3)`);
    // l'Esprit saisit le héros par la cheville : toujours s'il est trop fort, une fois pour rien s'il est presque trop fort
    const left = hp.filter((h) => h > 0).length;
    if (left > 0 && !win) {
      grabs++;
      fx.grab = { at: g.time.now, k: grabs };
      ui.caption(grabs === 1 ? 'Des cheveux t\'attrapent la cheville !' : 'Ils te tirent vers le puits !');
      await g.wait(1400);
    } else if (left === 1 && force() >= limit - 1) {
      fx.grab = { at: g.time.now, k: 1 };
      ui.caption('Des cheveux t\'attrapent la cheville… tu te dégages !');
      await g.wait(1400);
    }
  }
  ui.caption('');
  hooks.decor = null;
  if (hp.every((h) => h === 0)) {
    await g.say('narr', 'La troisième mèche tombe. Un cri monte du puits. L\'Esprit, blessé, s\'enfuit.');
    applyEffects({ guerrier: 2, trait: 'Petit brave' });
    return 'victoire';
  }
  await g.say('narr', 'Les cheveux t\'entraînent. L\'eau, glacée. Puis plus rien.');
  applyEffects({ 'peurs.eau': 'peur', guerrier: 1 });
  return 'defaite';
}

// ---------- L'aube : les fins ----------

async function dawn(g: Game, end: Ending) {
  step(g, 4, 'aube');
  clearCast(g);
  g.showPlan(null);
  await g.fade(1, 600);
  if (end === 'defaite') {
    await g.fade(0, 1);
    await play(g, P.rescueCine);
    await g.lines([
      ['narr', 'Des bras te tirent hors de l\'eau. Il fait jour.'],
      ['aubin', 'Respire, petit. Respire. Je cherchais le mien… c\'est toi que j\'ai trouvé.'],
    ]);
    g.showPlan(null);
    await g.fade(1, 1);
  } else {
    g.goto('maison_chambre', 'lit');
    g.put('mere', 'maison_chambre', at(4, 3.6, 'W'));
    await g.fade(0, 600);
    await g.cut(async () => {
      if (end === 'pacte') {
        await play(g, P.pactMorningCine(cut()));
        await g.say('mere', 'Tes cheveux… ils ont poussé d\'un doigt en une nuit ?');
        g.showPlan(null);
      }
      await g.say('narr', 'À l\'aube, Aubin tambourine aux portes.');
      await g.say('aubin', 'Le gamin a disparu !');
    });
    await g.fade(1, 400);
  }
  // tout le monde au puits
  g.remove('mere');
  g.goto('village', at(25.1, 17.6, 'N'));
  g.put('basile', 'village', at(23.8, 17.4, 'NE'));
  g.put('margot', 'village', at(26.4, 17.8, 'NW'));
  g.put('aubin', 'village', at(24.2, 16.8, 'N'), { pose: 'a_genoux' });
  g.put('villageois1', 'village', at(22.6, 18.4, 'E'));
  g.put('mere', 'village', at(27.4, 18.6, 'W'));
  await g.fade(0, 400);
  await g.cut(async () => {
    if (end === 'fuite' || end === 'rendormi') {
      g.showPlan(P.dawnSearchCine[0]);
      await g.say('narr', 'Les hommes fouillent la forêt. Basile, terrifié, entraîne la bande vers le puits. C\'est toi qui te penches le premier.');
    }
    else await g.say('narr', 'L\'Esprit est parti. Plus un cheveu au bord du puits.');
    g.showPlan(P.puitsMatinPlan(ENDINGS[end].body, state.soften));
    await g.wait(2400);
    await g.say('narr', ENDINGS[end].body ? 'Au fond, le corps d\'Élio, sans un cheveu.' : 'Au fond, il n\'y a que de l\'eau rouge.');
    g.showPlan(null);
    await g.lines([
      ['aubin', 'Non… non…'],
      ['basile', 'C\'est elle. Je vous l\'avais dit.'],
    ]);
  });
}

/** L'enterrement, au cimetière. */
async function burial(g: Game, end: Ending) {
  step(g, 4, 'matin');
  clearCast(g);
  await g.fade(1, 600);
  g.goto('cimetiere', at(11.2, 13.4, 'N'));
  g.populate('cimetiere');
  g.actor('aubin', { pose: 'a_genoux' });
  await g.fade(0, 600);
  let ribbon: 'garde' | 'donne' | 'aucun' = 'aucun';
  await g.cut(async () => {
    await g.lines([
      ['narr', ENDINGS[end].body ? 'On enterre Élio un matin de pluie fine.' : 'On enterre un cercueil vide, un matin de pluie fine.'],
      ['narr', 'Aubin est sobre, pour la première fois.'],
    ]);
    if (hasItem('ruban')) {
      const k = await g.choose('heros', 'Tu as encore le ruban bleu.', ['Le donner à Aubin : « C\'est à elle. »', 'Le garder en souvenir']);
      ribbon = k === 0 ? 'donne' : 'garde';
      if (k === 0) {
        applyEffects({ perd: 'ruban', a_ruban: false });
        await g.say('aubin', '… Merci, petit.');
      }
    }
    await play(g, P.funeralCine(!ENDINGS[end].body, ribbon === 'aucun' ? undefined : ribbon));
    g.showPlan(null);
  });
}

// ---------- L'acte entier ----------

/** Joue l'enfance à partir d'un jour (et de la nuit 3 si night). Renvoie la fin obtenue. */
export async function playAct(g: Game, from: { day: number; night: boolean; scene?: string }) {
  dressMaps(g);
  setupAlways(g);
  if (from.day <= 1 && !from.night) {
    // ?scene=cache-cache : commencer au cache-cache (pour essayer une scène sans rejouer ce qui précède)
    if (from.scene !== 'cache-cache') await day1Eggs(g);
    await day1HideAndSeek(g);
    await day1Evening(g);
  }
  if (from.scene === 'riviere') {
    // ?jour=2&scene=riviere : commencer à la baignade
    clearCast(g);
    looks(g);
    g.goto('village', 'porte_barbier');
    await day2River(g);
  } else if (from.day <= 2 && !(from.day === 2 && from.night)) await day2(g);
  if (from.day <= 3 && !(from.day === 3 && from.night)) await day3(g);
  const way = await night3(g);
  let end: Ending = 'rendormi';
  if (way === 'fenetre') {
    await night3Outside(g);
    if (!has('rentre_nuit3')) end = await well(g);
    const fin = ({ apaisement: 'chante', victoire: 'fuit', incredulite: 'relache' } as const)[end as 'apaisement'];
    if (fin) {
      await g.cut(() => play(g, P.nightEndCine(fin)));
      g.showPlan(null);
    }
  }
  if (end === 'rendormi') await g.say('narr', 'Tu te recouches. Tu te retournes longtemps. Puis le sommeil t\'emporte.');
  settleDark();
  await dawn(g, end);
  await burial(g, end);
  return end;
}

// ---------- Le décor du scénario sur les cartes ----------

/** Margot dans le chêne, les glands, et le décor de l'étape. */
export function storyDecor(g: Game, map: string, t: number): Drawable[] {
  const out: Drawable[] = [...(hooks.decor?.(map, t) ?? [])];
  if (map !== 'village') return out;
  const oak = obj(g, 'village', 'chene');
  if (oak && (hideout.margot || hideout.acorns > g.time.now)) {
    const fx = (oak.x + oak.w / 2) * T, fy = (oak.y + oak.h) * T;
    out.push({
      y: fy + 1,
      draw: (c) => {
        if (hideout.margot) margotInTree(c, fx, fy, t);
        if (hideout.acorns > g.time.now) acorns(c, fx, fy, t);
      },
    });
  }
  return out;
}

/** Margot perchée dans les branches : on ne voit que sa tête entre les feuilles. */
function margotInTree(c: CanvasRenderingContext2D, fx: number, fy: number, t: number) {
  const ch = A.CHARS.margot, swing = Math.round(Math.sin(t / 700));
  A.drawSprite(c, A.charFrame(ch, 'S', 'idle', 0).slice(0, 18), { ...A.PAL, ...A.CH_PAL, ...ch.spec.pal }, Math.round(fx + 4 + swing), Math.round(fy - 64));
  A.cuEll(c, Math.round(fx + 16), Math.round(fy - 46), 9, 6, '#3e7a3e');
  A.fill(c, '#5a9a4a', Math.round(fx + 12), Math.round(fy - 50), 6, 2);
}

function acorns(c: CanvasRenderingContext2D, fx: number, fy: number, t: number) {
  for (let i = 0; i < 4; i++) {
    const u = (t / 1100 + i * 0.27) % 1;
    if (u > 0.85) continue;
    const x = Math.round(fx - 14 + i * 9), y = Math.round(fy - 44 + u * 44);
    A.fill(c, '#6a4428', x, y, 2, 2);
    A.fill(c, '#9a6a38', x, y + 2, 2, 1);
  }
}
