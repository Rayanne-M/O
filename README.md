# RPG de build

Un RPG jouable dans le navigateur, centré sur la construction de personnage :
race, classe, équipement, bénédictions et malédictions se combinent pour déclencher des **synergies**.

## Lancer le projet

Il faut [Node.js](https://nodejs.org) (version 20 ou plus).

```bash
npm install      # installe les dépendances (une seule fois)
npm run dev      # lance le jeu sur http://localhost:5173
npm test         # lance les tests
npm run build    # vérifie les types et prépare une version à publier dans dist/
```

## Comment le projet est organisé

```
src/
  engine/   Le moteur : les règles du jeu, sans aucun affichage.
  data/     Le contenu : races, classes, objets, bénédictions, malédictions, synergies.
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
  (objet réservé à une classe, nombre de bénédictions...). Rassemble aussi les passifs.
- `combat.ts` : un combat d'entraînement de 10 tours contre un mannequin, sans hasard,
  pour mesurer ce que les passifs apportent vraiment.

### Les règles actuelles

- Un personnage a 1 race, 1 classe, et jusqu'à 3 objets (arme, armure, bijou).
- **1 bénédiction gratuite**, plus 1 pour chaque malédiction acceptée (3 malédictions max).
  Les malédictions sont donc un choix : un défaut contre une bénédiction de plus et parfois une synergie.
- Chaque élément porte des **tags** (Feu, Ombre, Sacré, Lourd...). Une synergie s'active quand
  le build réunit assez d'éléments d'un tag, ou une combinaison précise (ex. Nain + Espadon).

### Les passifs

Un passif change la façon de combattre, pas seulement les stats : Flamme rend les attaques de feu,
Brûlure pose des charges qui font des dégâts sur la durée, Combustion les fait exploser à 3 charges...
Les passifs viennent des objets, des malédictions et des synergies (champ `passives`),
et une synergie peut **demander des passifs** (`requires: { passives: [...] }`). C'est ce qui crée
des styles de combat. Par exemple pour le mage de feu :

- **Brûlure** : Brûlure + Feu intérieur (malédiction Âme consumée) → *Bûcher* : 2 charges par coup.
- **Explosion** : Brûlure + Combustion (Cœur d'ignition) → *Artificier* : chaque explosion rallume des brûlures.
- **Plasma** : Flamme + 4 Arcane → *Tisseur de plasma* : le feu ignore la défense.

Les effets possibles sont listés dans `PassiveEffect` (`src/engine/types.ts`). Pour un nouveau type d'effet,
il faut l'ajouter là et lui donner une règle dans `combat.ts`.

## Ajouter du contenu

**Un objet** : ajoute une entrée dans `src/data/equipment.ts`.

```ts
{
  id: 'frost_staff',              // identifiant unique, sans espace
  slot: 'weapon',                 // 'weapon', 'armor' ou 'trinket'
  name: 'Bâton de givre',
  description: 'Glacial au toucher.',
  tags: ['ice', 'arcane'],
  modifiers: [flat('intelligence', 4), pct('mana', 10)],  // +4 intelligence, +10 % mana
  allowedClasses: ['mage'],       // optionnel
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
  modifiers: [pct('intelligence', 20)],
},
```

Les conditions possibles : `race`, `class`, `tags` (nombre minimum par tag) et `ids` (éléments précis).

Lance `npm test` après chaque ajout : les tests de `src/data/data.test.ts` vérifient que le contenu est cohérent
(identifiants uniques, tags nommés, synergies qui pointent vers des éléments existants).
