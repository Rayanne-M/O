# RPG de build

Un RPG jouable dans le navigateur, centré sur la construction de personnage :
classe, bénédictions, malédictions et passifs se combinent pour déclencher des **synergies**.

Le projet contient deux pages :

- l'**atelier de personnage** (`index.html`) : un outil de développement et d'équilibrage
  où tout est accessible librement, pour tester des combinaisons et comparer leurs dégâts ;
- la **tranche jouable de l'enfance** (`village.html`) : le village natal en vue de dessus, trois jours
  et trois nuits, la fenêtre de la chambre et la nuit au puits. Voir [plus bas](#la-tranche-jouable-de-lenfance).

## Lancer le projet

Il faut [Node.js](https://nodejs.org) (version 20 ou plus).

```bash
npm install      # installe les dépendances (une seule fois)
npm run dev      # l'atelier sur http://localhost:5173, le village sur http://localhost:5173/village.html
npm test         # lance les tests
npm run build    # vérifie les types et prépare une version à publier dans dist/
```

## Comment le projet est organisé

```
src/
  engine/   Le moteur : les règles du jeu, sans aucun affichage.
  data/     Le contenu : classes, bénédictions, malédictions, passifs, synergies.
  ui/       L'interface : affiche les choix et le résultat calculé par le moteur.
```

Les trois parties sont séparées volontairement :

- **`engine/`** ne sait rien du contenu précis. Il sait seulement additionner des modificateurs,
  compter des tags et vérifier des conditions. C'est la partie testée en détail.
- **`data/`** est de la donnée pure. Pour ajouter du contenu, on modifie uniquement ce dossier.
- **`ui/`** ne contient aucune règle de jeu : elle demande au moteur de calculer, puis affiche.

### Le moteur, en bref

- `types.ts` : la forme de chaque chose (une `Source`, un `Modifier`, une `Synergy`, un `Build`...).
- `stats.ts` : le calcul des stats. Formule : `(base + bonus fixes) × (1 + pourcentages / 100)`.
  Chaque point garde la trace de sa provenance, pour l'afficher au survol.
- `synergy.ts` : vérifie si une synergie est active, et sinon ce qui manque.
- `build.ts` : assemble le tout à partir des choix du joueur, et vérifie les règles
  (nombre de bénédictions, identifiants inconnus...). Rassemble aussi les passifs.
- `combat.ts` : un combat d'entraînement de 10 tours contre un mannequin, sans hasard,
  pour mesurer ce que les passifs apportent vraiment.

### Les règles actuelles

- Un personnage a 1 classe (Mage, Guerrier ou Roublard).
- **1 bénédiction gratuite**, plus 1 pour chaque malédiction acceptée (3 malédictions max).
  Les malédictions sont donc un choix : un défaut contre une bénédiction de plus et parfois une synergie.
- Chaque élément porte des **tags** (Feu, Ombre, Sacré...). Une synergie s'active quand le build
  réunit assez d'éléments d'un tag, un élément précis ou des passifs précis.
- Races et objets ont été retirés pour l'instant ; les objets reviendront plus tard.

### Les passifs et les traits

Un passif change la façon de combattre, pas seulement les stats : Flamme rend les attaques de feu,
Brûlure pose des charges qui font des dégâts sur la durée, Combustion les fait exploser à 3 charges...
Les passifs viennent des classes, bénédictions, malédictions et synergies (champ `passives`),
et une synergie peut **demander des passifs** (`requires: { passives: [...] }`). C'est ce qui crée
des styles de combat.

Dans l'atelier, **tous les passifs sont aussi des traits** à cocher librement. C'est l'endroit où
noter une idée de passif (dans `src/data/passives.ts`) et la tester avant de décider qui l'accorde
dans le jeu : une classe, une compétence, une bénédiction ou une malédiction. Un passif peut avoir
des `tags`, qui comptent pour les synergies quand il est coché comme trait.

Les styles du mage de feu, par exemple (Flamme + Bénédiction solaire activent *Pyromancien*, qui donne Brûlure) :

- **Brûlure** : Brûlure + Feu intérieur (malédiction Âme consumée) → *Bûcher* : 2 charges par coup.
- **Explosion** : Brûlure + Combustion → *Artificier* : chaque explosion rallume des brûlures.
- **Plasma** : Flamme + Surcharge arcanique → *Tisseur de plasma* : le feu ignore la défense.

Et **Éclipse** demande 3 Ombre et 3 Sacré.

Les effets possibles sont listés dans `PassiveEffect` (`src/engine/types.ts`). Pour un nouveau type d'effet,
il faut l'ajouter là et lui donner une règle dans `combat.ts`.

## Ajouter du contenu

**Un passif** : ajoute une entrée dans `src/data/passives.ts`. Il apparaît aussitôt dans les traits de l'atelier.

```ts
{
  id: 'frostbite',                // identifiant unique, sans espace
  name: 'Gelure',
  description: 'Les attaques infligent +10 % de dégâts.',
  tags: ['ice'],                  // optionnel
  effects: [{ type: 'damageBonus', percent: 10 }],
},
```

Un nouveau tag (ici `ice`) doit aussi recevoir un nom dans `src/data/tags.ts`. Les tests le rappellent si on l'oublie.

**Une synergie** : ajoute une entrée dans `src/data/synergies.ts`.

```ts
{
  id: 'cryomancer',
  name: 'Cryomancien',
  description: 'Le froid obéit au mage.',
  requires: { class: ['mage'], tags: { ice: 2 } },   // conditions, toutes obligatoires
  modifiers: [pct('intelligence', 20)],             // bonus de stats
  passives: ['frostbite'],                          // passifs accordés (optionnel)
},
```

Les conditions possibles : `class`, `tags` (nombre minimum par tag), `ids` (éléments précis) et `passives`.

Lance `npm test` après chaque ajout : les tests de `src/data/data.test.ts` vérifient que le contenu est cohérent
(identifiants uniques, tags nommés, synergies et passifs qui pointent vers des éléments existants).

## La tranche jouable de l'enfance

Le village natal, dans l'esprit des RPG sur DS : écran de 384 × 216 pixels agrandi sans flou, tuiles de 16 px,
héros enfant qui marche dans les 8 directions. Affichage avec [Phaser 3](https://phaser.io), textes et menus en HTML
par-dessus pour qu'ils restent nets.

Commandes : flèches, ZQSD ou WASD pour marcher (deux touches pour les diagonales), Espace, Entrée ou E pour parler
et examiner. Sur mobile, un joystick et un bouton A apparaissent.

Pour tester un moment précis : `village.html?jour=2` commence au jour 2, `village.html?nuit=3` à la nuit 3.

```
src/village/
  art/planche.js   Le code de dessin repris tel quel de la planche de direction artistique (sprites, décor,
                   puits, cinématique, portrait de l'esprit). Ses types sont dans planche.d.ts.
  art/sprites.ts   Transforme ces dessins en images pour Phaser (héros, personnages, maisons).
  art/decor.ts     Les éléments ajoutés pour la tranche : lavoir, fontaine, rivière, bougie…
  script.ts        Tous les textes : les moments de chaque journée, les nuits, le puits et les fins.
  dialogue.ts      Joue les étapes de script.ts et applique leurs effets.
  state.ts         Ce que l'enfance laisse sur le héros : jauges, compteurs cachés, peurs, traits.
  maps.ts          Le village et la chambre : décor, obstacles, lieux des scènes.
  world.ts         La scène de jeu : déplacements, enchaînement des journées, cinématique, puits.
  ui.ts            Boîte de dialogue, choix, sous-titres, écrans titre et de fin.
```

**Changer un texte** : tout est dans `src/village/script.ts`. Une scène est une liste d'étapes
(`{ say: '…', who: 'elio' }` pour une réplique, `{ ask: '…', options: [...] }` pour un choix),
et les effets s'écrivent comme dans le scénario : `{ guerrier: 1 }`, `{ rancoeur: -1 }`,
`{ 'peurs.araignees': 'peur' }`, `{ trait: 'Conteur' }`, `{ a_ciseaux: true }`.

Ce qui reste provisoire :

- le héros enfant en 8 directions est dérivé des vues adultes de la planche (tête gardée, corps raccourci),
  en attendant de vraies vues enfant ;
- le combat contre l'Esprit est résolu sans mini-jeu : avec les ciseaux, on gagne si sa force est de 6 ou moins,
  avec un bâton, de 3 ou moins ;
- la pousse des cheveux n'est pas encore visible sur le héros.
