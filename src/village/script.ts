// Tous les textes de la tranche jouable, d'après le scénario de l'enfance
// (doc : https://claude.ai/artifact/YSwNfBWsKdC37qiBTEsRUz, données : rpg/scenario/enfance.json).
// Les noms sont provisoires. Pour changer une réplique, il suffit de modifier ce fichier.
//
// Une scène est une liste d'étapes :
//   { say: 'texte', who: 'elio' }              une réplique
//   { ask: 'question', options: [...] }        un choix ; chaque option peut avoir des effets et une suite
//   if: () => …                                 l'étape ou l'option n'apparaît que si la condition est vraie
// Les effets s'écrivent comme dans le scénario : { guerrier: 1 }, { rancoeur: -1 }, { 'peurs.araignees': 'peur' },
// { trait: 'Conteur' }, { a_ciseaux: true }, { cheveux: 'court' }.
import { count, has, state, type Effects } from './state';

export type Speaker = 'hero' | 'narrator' | 'mere' | 'elio' | 'margot' | 'basile' | 'ysol' | 'fauvel' | 'aubin' | 'esprit';
export type NpcId = 'mere' | 'elio' | 'margot' | 'basile' | 'fauvel' | 'aubin';
/** Les lieux du village (voir maps.ts). « maison » : la porte de la maison du héros. */
export type PlaceId = 'grange' | 'place' | 'puits' | 'barbier' | 'riviere' | 'moulin' | 'maison';

export type Cond = () => boolean;
export interface Option { label: string; if?: Cond; effects?: Effects; then?: Step[] }
export type Step =
  | { say: string; who?: Speaker; if?: Cond; effects?: Effects }
  | { ask: string; who?: Speaker; if?: Cond; options: Option[] };

/** Un moment de la journée. Il se joue quand le héros arrive au lieu, ou parle à l'un de ses personnages. */
export interface Scene {
  id: string;
  moment: string;
  /** Ce que le héros doit faire, affiché en haut de l'écran. */
  objective: string;
  at: PlaceId;
  npcs: NpcId[];
  steps: Step[];
  /** Personnages ailleurs dans le village pendant ce moment, qu'on peut aller voir. */
  extras?: { id: NpcId; at: PlaceId; first: Step[]; again: Step[] }[];
  /** Objets à examiner pendant ce moment. */
  clues?: { spot: string; steps: Step[] }[];
  /** La scène se termine par la cinématique du puits. */
  cinematic?: boolean;
  /** La scène ne se joue qu'en parlant à l'un de ses personnages (pas en arrivant sur le lieu). */
  talkOnly?: boolean;
}

export const NAMES: Record<Speaker, string> = {
  hero: 'Toi', narrator: '', mere: 'Maman', elio: 'Élio', margot: 'Margot', basile: 'Basile',
  ysol: 'Ysol', fauvel: 'Fauvel le barbier', aubin: 'Aubin', esprit: '???',
};

const N = 'narrator' as const;

export const DAYS: Record<number, Scene[]> = {
  1: [
    {
      id: 's1_grange', moment: 'Matin', objective: 'Aller chercher les œufs à la grange.', at: 'grange', npcs: ['mere'],
      steps: [
        { say: 'Six œufs, pas cinq. Et tu ne traînes pas, Élio t\'attend déjà sur la place.', who: 'mere' },
        { say: 'Une grosse araignée descend de la poutre et se pose sur le panier.', who: N },
        {
          ask: 'Que fais-tu ?', who: N,
          options: [
            { label: 'La laisser grimper sur ta main', effects: { 'peurs.araignees': 'aime' } },
            { label: 'La chasser d\'une pichenette', effects: { 'peurs.araignees': 'neutre' } },
            { label: 'Crier et lâcher le panier', effects: { 'peurs.araignees': 'peur' }, then: [{ say: 'Deux œufs se cassent. Ta mère soupire.', who: N }] },
          ],
        },
      ],
    },
    {
      id: 's2_place', moment: 'Midi', objective: 'Rejoindre Élio sur la place.', at: 'place', npcs: ['margot', 'elio', 'basile'],
      steps: [
        {
          ask: 'Moi je suis la reine des brigands, c\'est décidé. Toi, tu prends quoi ?', who: 'margot',
          options: [
            { label: 'Chevalier. Je protège Élio.', effects: { guerrier: 1 } },
            { label: 'Sorcier. Je vous transforme tous en crapauds.', effects: { mage: 1 } },
            { label: 'Brigand. Je vole la couronne de Margot.', effects: { voleur: 1 } },
          ],
        },
        { say: 'T\'as quoi, là ?', who: 'basile' },
        { say: 'Je suis tombé du grenier.', who: 'elio' },
        { say: '(tout bas) Il tombe beaucoup, ces temps-ci.', who: 'margot' },
      ],
    },
    {
      id: 's3_legende', moment: 'Soir', objective: 'Les enfants t\'attendent au vieux puits, derrière le lavoir.', at: 'puits', npcs: ['basile', 'margot', 'elio'],
      steps: [
        { say: 'Il y a cent ans, une fille du village avait des cheveux si longs qu\'ils traînaient par terre.', who: 'basile' },
        { say: 'Sa sœur, jalouse, les lui a coupés pendant qu\'elle dormait. La fille n\'a jamais pardonné.', who: 'basile' },
        { say: 'Elle s\'est jetée dans le puits avec sa rancune. Depuis, ses cheveux repoussent au fond.', who: 'basile' },
        { say: 'Et quand un enfant garde une rancune trop longtemps… elle remonte la boire.', who: 'basile' },
        { say: 'Ma mère dit que c\'est pour qu\'on arrête de bouder.', who: 'margot' },
        { say: '(il regarde le fond du puits) Moi je trouve qu\'elle avait raison, la fille.', who: 'elio' },
        {
          ask: 'Et toi ?', who: N,
          options: [
            { label: 'J\'y crois. J\'ai déjà entendu chanter là-dedans.', effects: { mage: 1, legende: 1, a_monte_legende_soi_meme: true } },
            { label: 'N\'importe quoi. C\'est un trou avec de l\'eau.', effects: { dit_nimporte_quoi: true } },
            { label: 'Tu la racontes mal. Écoute.', effects: { voleur: 1, legende: 2, trait: 'Conteur', a_monte_legende_soi_meme: true } },
          ],
        },
      ],
    },
    {
      id: 's4_comptine', moment: 'Veillée', objective: 'Rentrer à la maison pour la veillée.', at: 'maison', npcs: [],
      steps: [
        { say: '(elle chante) Quand le jour avalera la nuit, naîtra l\'enfant des deux lumières…', who: 'ysol' },
        { say: 'C\'est qui, l\'enfant des deux lumières ?', who: 'hero' },
        { say: 'Le prince, mon cœur. L\'Élu est déjà né, à la capitale. Les prêtres l\'ont dit.', who: 'ysol' },
        { say: 'Tu es né la même nuit que lui, d\'ailleurs. Le ciel était tout noir. Tu ne pleurais même pas.', who: 'mere' },
        { say: 'Beaucoup d\'enfants sont nés cette nuit-là. Au lit.', who: 'ysol' },
      ],
    },
  ],
  2: [
    {
      id: 's5_barbier', moment: 'Matin', objective: 'Aller chez le barbier avec ta mère.', at: 'barbier', npcs: ['mere', 'fauvel'],
      steps: [
        { say: 'Regarde-toi, on dirait un buisson. On coupe.', who: 'mere' },
        {
          ask: 'Alors, jeune homme, on fait comment ?', who: 'fauvel',
          options: [
            { label: 'Court. Comme un soldat.', effects: { cheveux: 'court' } },
            { label: 'Juste un peu, derrière.', effects: { cheveux: 'mi-long' } },
            { label: 'Sauter de la chaise et filer par la porte', effects: { cheveux: 'long', voleur: 1 }, then: [{ say: 'Ta mère sera fâchée jusqu\'au soir.', who: N }] },
          ],
        },
        {
          ask: 'Sur le comptoir, les ciseaux du barbier brillent. Personne ne regarde.', who: N,
          options: [
            { label: 'Les glisser dans ta poche', effects: { voleur: 1, trait: 'Doigts légers', a_ciseaux: true } },
            { label: 'Les laisser', effects: {} },
          ],
        },
      ],
    },
    {
      id: 's6_aubin', moment: 'Fin de matinée', objective: 'Sortir de chez le barbier.', at: 'barbier', npcs: ['aubin', 'elio'],
      steps: [
        { say: 'Tu vas me couper ça. Je ne veux plus voir ces tresses sous mon toit.', who: 'aubin' },
        { say: 'C\'est maman qui les a faites !', who: 'elio' },
        { say: 'Ta mère est partie. Les tresses aussi.', who: 'aubin' },
        {
          ask: 'Que dis-tu ?', who: N,
          options: [
            { label: 'Laissez-le !', effects: { guerrier: 2, rancoeur: -1, compte_coeur_fidele: 1 }, then: [{ say: 'Les adultes te trouvent bien insolent.', who: N }] },
            { label: 'C\'est moi qui lui ai dit de les garder. Pour notre jeu.', effects: { voleur: 1, rancoeur: -1, compte_coeur_fidele: 1 } },
            { label: '(ne rien dire)', effects: { rancoeur: 1 } },
          ],
        },
        { say: 'Demain matin, c\'est moi qui les coupe.', who: 'aubin' },
      ],
    },
    {
      id: 's7_riviere', moment: 'Après-midi', objective: 'Aller jouer à la rivière.', at: 'riviere', npcs: ['basile', 'margot'],
      steps: [
        { say: 'Ma mère ferme la porte à clé la nuit. Rapport à la Rancunière.', who: 'basile' },
        { say: 'La mienne aussi. Moi je sors souvent par ma fenêtre la nuit. Elle n\'en sait rien.', who: 'margot' },
        { say: 'T\'es folle.', who: 'basile' },
        { say: 'Je suis la reine des brigands.', who: 'margot' },
      ],
    },
    { id: 'retour_2', moment: 'Soir', objective: 'Rentrer à la maison.', at: 'maison', npcs: [], steps: [] },
  ],
  3: [
    {
      id: 's9_tete_tondue', moment: 'Matin', objective: 'Retrouver Élio sur la place.', at: 'place', npcs: ['elio', 'margot'],
      steps: [
        { say: 'Il l\'a fait à l\'aube. Avec son couteau. Il a jeté les tresses dans le poêle.', who: 'elio' },
        {
          ask: 'Je le déteste. Je voudrais qu\'il disparaisse.', who: 'elio',
          options: [
            { label: 'Tes cheveux vont repousser. Viens dormir chez nous ce soir.', effects: { rancoeur: -1, compte_coeur_fidele: 1 } },
            { label: 'Moi aussi je le déteste. Il mérite pire.', effects: { rancoeur: 1, compte_rancunier: 1 } },
            { label: '(lui donner un coup d\'épaule)', effects: {} },
          ],
        },
        { say: 'Fauvel passe en criant au voleur. Margot te regarde, sourit, et se tait.', who: N, if: () => has('a_ciseaux') },
      ],
    },
    {
      id: 's10_disparition', moment: 'Après-midi', objective: 'Élio a disparu. Le chercher dans le village.', at: 'place', npcs: ['basile'], talkOnly: true,
      steps: [
        { say: 'C\'est la Rancunière. Il avait de la rancune plein le ventre, tout le monde l\'a vu.', who: 'basile' },
        {
          ask: 'Que fais-tu ?', who: N,
          options: [
            { label: 'C\'est la Rancunière, il faut aller au puits !', then: [{ say: 'Les adultes rient. Les enfants et leurs histoires…', who: N }] },
            { label: 'Aider Basile à prévenir tous les enfants', effects: { legende: 1, mage: 1, a_monte_legende_soi_meme: true } },
            { label: 'Garder ça pour soi' },
          ],
        },
      ],
      extras: [
        {
          id: 'aubin', at: 'moulin',
          first: [{ say: 'Il a fugué. Comme sa mère. Il reviendra quand il aura faim.', who: 'aubin' }],
          again: [{ say: 'Je n\'aurais pas dû… Va-t\'en.', who: 'aubin' }],
        },
      ],
      clues: [
        {
          spot: 'cendre',
          steps: [{ say: 'Dans la cendre devant le moulin, un ruban à moitié brûlé. Celui des tresses d\'Élio.', who: N, effects: { a_ruban: true } }],
        },
      ],
    },
    {
      id: 's11_soir', moment: 'Soir', objective: 'Rentrer à la maison.', at: 'maison', npcs: [], cinematic: true,
      steps: [{ say: 'Les hommes le chercheront demain à la lanterne. Toi, tu dors.', who: 'mere' }],
    },
  ],
};

/** La cinématique du jour 3 : [moment en ms, sous-titre]. */
export const CINEMATIC: [number, string][] = [
  [0, 'Au lavoir, Élio pleure sous l\'auvent.'],
  [600, 'De longs cheveux noirs sortent du puits et rampent dans l\'herbe…'],
  [2200, 'Ils s\'enroulent à ses chevilles.'],
  [2700, 'Et le traînent jusqu\'au puits.'],
  [5600, 'Il ne crie pas.'],
];

export const HOME = {
  night: (day: number): Step[] => [
    { say: 'La nuit est tombée. La porte de la chambre est fermée à clé.', who: N },
    ...(day === 1 ? [{ say: 'Le chat entre par la fenêtre, fait le tour du lit, et ressort.', who: N }] : []),
  ],
  morning: [{ say: 'Un nouveau jour se lève.', who: N }] as Step[],
  bed: { ask: 'Se coucher ?', who: N, options: [{ label: 'Dormir' }, { label: 'Pas encore' }] } as Step,
  bedDay: [{ say: 'Ce n\'est pas l\'heure de dormir.', who: N }] as Step[],
  /** La fenêtre n'est jamais signalée : seul l'indice de Margot en parle. */
  window: { ask: 'La fenêtre n\'est pas fermée.', who: N, options: [{ label: 'Sortir par la fenêtre' }, { label: 'Rester dans la chambre' }] } as Step,
  windowDay: [{ say: 'Par la fenêtre, on voit le village et les sapins.', who: N }] as Step[],
  windowBack: { ask: 'Rentrer par la fenêtre ?', who: N, options: [{ label: 'Rentrer' }, { label: 'Pas encore' }] } as Step,
  spiderOnSill: [{ say: 'Une araignée attend sur le rebord de la fenêtre. Elle te regarde. Rien d\'autre.', who: N }] as Step[],
  candleOn: { ask: 'La bougie brûle doucement.', who: N, options: [{ label: 'La souffler' }, { label: 'La laisser allumée' }] } as Step,
  candleOff: { ask: 'La bougie est éteinte.', who: N, options: [{ label: 'La rallumer' }, { label: 'La laisser éteinte' }] } as Step,
  doorLocked: [{ say: 'La porte est fermée à clé.', who: N }] as Step[],
  doorDay: [{ say: 'Pas le temps de rentrer, il y a à faire dehors.', who: N }] as Step[],
  othersAsleep: [{ say: 'Tout le monde dort.', who: N }] as Step[],
  otherDoor: [{ say: 'Personne ne répond.', who: N }] as Step[],
  chest: [{ say: 'Ton coffre à trésors : une plume de geai, un caillou rond, une épée en bois.', who: N }] as Step[],
};

/** Ce qu'on trouve dehors la nuit, par nuit et par lieu. */
export const NIGHTS: Record<number, Partial<Record<string, Step[]>>> = {
  2: {
    'window-elio': [
      { say: 'Qu\'est-ce que tu fais là ? T\'es sorti par ta fenêtre ?', who: 'elio' },
      { say: 'Il a dit demain. Je l\'entends aiguiser son couteau.', who: 'elio' },
      { say: 'Des fois, la nuit, j\'entends quelqu\'un chanter, vers le lavoir. Elle chante pour moi, je crois.', who: 'elio' },
      {
        ask: 'Que lui réponds-tu ?', who: N,
        options: [
          { label: 'N\'écoute pas. Demain je reste avec toi toute la journée.', effects: { rancoeur: -1, compte_coeur_fidele: 1 } },
          { label: 'Si elle existe, elle pourrait le punir, lui.', effects: { rancoeur: 1, legende: 1, compte_rancunier: 1, a_monte_legende_soi_meme: true } },
          { label: 'C\'est le vent dans le lavoir.' },
        ],
      },
    ],
    well: [{ say: 'Du fond du puits monte un chant faible, sans paroles.', who: N }],
  },
};
export const NIGHT_DEFAULT = {
  well: [{ say: 'Le puits est silencieux. On dirait qu\'il écoute.', who: N }] as Step[],
  wellDay: [{ say: 'Le vieux puits. Une odeur d\'eau croupie monte du fond.', who: N }] as Step[],
  windowElio: [{ say: 'La fenêtre d\'Élio est fermée.', who: N }] as Step[],
};

// ---------- Le puits, nuit 3 ----------

export const WELL = {
  arrival: [
    { say: 'Élio est debout sur la margelle, dos à toi.', who: N },
    { say: 'Des cheveux noirs sortent du puits, entrent dans son oreille, ressortent par ses yeux.', who: N },
    { say: 'Il en avait tellement, de la rancune. Elle était bonne.', who: 'esprit' },
  ] as Step[],
  /** Texte qui remplace le portrait quand les images choquantes sont masquées. */
  goreHidden: 'Le visage d\'Élio se tourne vers toi. Ce n\'est plus lui qui parle.',
  reaction: {
    ask: 'Que fais-tu ?', who: N,
    options: [
      { label: 'Reculer en criant', effects: { peur: 1, 'peurs.cheveux': 'peur', a_crie_au_puits: true } },
      { label: 'Rester planté là, les poings serrés' },
      { label: 'Appeler Élio par son nom', then: [{ say: 'La main d\'Élio tressaille.', who: N }] },
    ],
  } as Step,
  comments: [
    { say: 'Tu me racontes si bien. Hier soir, grâce à toi, j\'ai grandi d\'un pied.', who: 'esprit', if: () => state.traits.includes('Conteur') },
    { say: 'Toi, tu ne crois pas en moi. Pourtant tu es venu jusqu\'ici.', who: 'esprit', if: () => has('dit_nimporte_quoi') },
    { say: 'Merci de l\'avoir nourri pour moi.', who: 'esprit', if: () => count('compte_rancunier') >= 1 },
  ] as Step[],
  menu: { ask: 'Que fais-tu ?', options: ['Parler', 'Combattre', 'Fuir'] },
  talkMenu: 'Que lui dis-tu ?',
  ribbon: {
    label: '(tendre le ruban à Élio)', if: () => has('a_ruban') && !has('ruban_donne'),
    effects: { rancoeur: -2, ruban_donne: true }, then: [{ say: 'Les doigts d\'Élio se referment dessus.', who: N }],
  },
  disbelief: {
    label: 'Je ne crois pas en toi.',
    works: () => has('dit_nimporte_quoi') && !has('a_monte_legende_soi_meme') && !has('a_crie_au_puits'),
    fail: [{ say: 'Tu y croyais hier. Je t\'ai entendu.', who: 'esprit' }] as Step[],
  },
  story: {
    label: 'Je connais ton histoire. Ta sœur t\'a coupé les cheveux.',
    next: 'Tu peux la laisser partir, ta rancune.',
    works: () => count('rancoeur') <= 2,
    success: [{ say: 'Je veux pas devenir comme elle.', who: 'elio' }] as Step[],
    fail: [{ say: 'Elle a raison. Je le déteste.', who: 'elio' }] as Step[],
  },
  pact: {
    label: 'Qu\'est-ce que tu veux ?',
    lines: [
      { say: 'Ce n\'est pas lui que je voulais. Sa rancune est petite, comme lui.', who: 'esprit' },
      { say: 'Toi… quand tu crois quelque chose, ça pèse. Je l\'ai senti dès ta naissance.', who: 'esprit' },
      { say: 'Laisse-moi vivre dans tes cheveux, et je le lâche. Mais ne les coupe pas. Chaque mèche coupée, c\'est moi que tu coupes.', who: 'esprit' },
      { say: 'Courts ? Ils pousseront. J\'ai le temps.', who: 'esprit', if: () => state.hair === 'court' },
    ] as Step[],
    ask: 'Accepter le pacte ?',
    options: ['Accepter', 'Refuser'],
  },
  back: 'Revenir',
  /** Combat simplifié en attendant le vrai combat : couper les 3 mèches qui tiennent Élio. */
  fight: {
    intro: [{ say: 'Il faut couper les trois mèches qui tiennent Élio.', who: N }] as Step[],
    withScissors: [{ say: 'Tu sors les ciseaux du barbier. Une mèche. Deux. Trois.', who: N }] as Step[],
    withStick: [{ say: 'Tu ramasses un bâton et tu frappes les mèches, encore et encore.', who: N }] as Step[],
    grabbed: [{ say: 'Une mèche s\'enroule autour de ta cheville. Puis une autre. Le puits t\'attire.', who: N }] as Step[],
  },
  flee: [{ say: 'Tu cours jusqu\'à ta fenêtre sans te retourner, et tu te glisses sous la couverture.', who: N }] as Step[],
};

/** Les fins de la tranche (le scénario en prévoit six). */
export const ENDINGS: Record<string, { title: string; elio: string; esprit: string; matin?: string; effects: Effects }> = {
  fin_incredulite: {
    title: 'L\'incrédule', elio: 'Élio est libéré. Il ne se souvient de rien.',
    esprit: '« Un seul incroyant ne me tue pas. Mais ta voix pèse lourd. »', effects: { trait: 'Incrédule' },
  },
  fin_apaisement: {
    title: 'L\'apaisement', elio: 'Élio est libéré. Aubin le serre contre lui : « Je te les laisserai pousser. »',
    esprit: 'Le chant cesse.', effects: { mage: 2, trait: 'Chuchoteur d\'esprits' },
  },
  fin_victoire: {
    title: 'La victoire', elio: 'Élio est libéré, terrifié.',
    esprit: 'L\'Esprit est blessé. Il te garde rancune.', effects: { guerrier: 2, trait: 'Petit brave' },
  },
  fin_pacte: {
    title: 'Le pacte', elio: 'Élio est libéré.', esprit: 'L\'Esprit vit dans tes cheveux. Le puits est vide.',
    matin: 'Au matin, ta mère trouve tes cheveux plus longs d\'un doigt.', effects: { mage: 1, maudit: 15, trait: 'Cheveux vivants' },
  },
  fin_defaite: {
    title: 'La défaite', elio: 'Élio revient changé, comme vidé.', esprit: 'L\'Esprit est plus fort.',
    matin: 'Aubin te repêche dans le puits à l\'aube.', effects: { guerrier: 1, 'peurs.eau': 'peur' },
  },
  fin_lit: {
    title: 'Le lit', elio: 'Élio revient le soir du jour 4, calme et muet. Ses cheveux ont repoussé, noirs et longs, en une nuit. Il n\'a plus aucune rancune.',
    esprit: 'L\'Esprit est plus fort. Élio est devenu son messager.', effects: {},
  },
};
