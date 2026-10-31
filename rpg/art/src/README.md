# Sources graphiques du RPG

Tout ce qui est dessiné dans les planches (direction artistique, cartes) est généré par du code, ici. Pour le jeu, on réutilise ces fichiers tels quels : il n'y a rien à redessiner ni à regénérer.

## Les cartes : `rpg/data/maps/`

Toutes les cartes du jeu, tous chapitres confondus, ont le même format : un fichier JSON par carte, et `index.json` qui les liste. Le jeu charge n'importe quelle carte sans code spécial, et l'éditeur de la page [cartes.html](../cartes.html) les modifie toutes.

**Unité** : la tuile de 16 px, partout (positions, tailles, points d'arrivée). Les fractions sont permises, au pixel près (1/16 de tuile).

`index.json` : `{ tile: 16, chapters: { enfance: "…" }, start: { map, at }, maps: { <id>: { name, chapter, kind, file } } }`.

Une carte :

| Champ | Contenu |
|---|---|
| `id`, `name`, `chapter` | Identifiant (celui du nom de fichier), nom affiché, chapitre. |
| `kind` | `"exterieur"` (dessinée par `drawMap`) ou `"piece"` (dessinée par `drawRoom`). |
| `tile`, `w`, `h` | 16, largeur et hauteur en tuiles. |
| `floor`, `wall` | Pièce seulement : sol (`FLOORS`) et mur du fond (`WALLS`). Les rangées 0 et 1 sont le mur. |
| `terrain` | Extérieur seulement : `river: { points, half, wobble }`, `paths: [[[x, y], …]]`, `plazas: [{ x, y, r }]`, `fields: [{ x, y, w, h }]`, `shallows: [{ x, y, w, h }]` (eau où l'on peut marcher : la baignade). |
| `objects` | `{ id, type, x, y, w, h, solid }` : la boîte de dessin. Facultatifs : `interact: { label, text, scene?, flag? }`, `when`, `variants`, `hidden` (pas dessiné tant qu'on ne l'a pas trouvé : les œufs), `secret` (jamais signalé en jeu), `on` (posé sur un autre objet), `above` (dessiné par-dessus tout), `light: [x, y, rayon px]`, `rot` (0, 90, 180, 270), `flip`, et les réglages propres au type (`seed` des arbres, `toit` des maisons, `pts` de la traînée…). |
| `exits` | `{ id, x, y, w, h, to, at, label }` : passage vers la carte `to`, au point d'arrivée `at`. Les sorties ne libèrent pas la collision : une sortie dans un mur se prend en butant contre le mur à cet endroit, une sortie posée au sol en marchant dessus, une sortie sur une fenêtre avec le bouton d'action. Facultatifs : `locked` (`"nuit"` ou `true`), `when`, `secret`. |
| `spawns` | `{ <id>: { x, y, dir } }` : pieds du personnage ; `dir` parmi N NE E SE S SW W NW. |
| `zones` | `{ <id>: { x, y, w, h, name?, cachette? } }` : lieux nommés du scénario (place, chêne, rive, fenêtres…). |
| `npcs` | `{ id, x, y, when?, look?, lantern? }` : habitants par défaut, pieds en (x, y). `look` choisit une autre palette (`elio_capuche`). Les bêtes (`poule`, `poule_rousse`, `poule_blanche`, `chat`, `chat_dort`) sont aussi des npcs. |
| `scenes` | `{ id, zone?, when, title, who?, line? }` : ce qui se passe ici, pour la visite et pour relier le scénario. |
| `collision` | Une chaîne par rangée, `1` = bloqué. Recalculée à chaque export (`mapCollision`) : mur du fond, emprise des objets solides, eau sauf hauts-fonds et pont ; les objets qui ont un `when` ne comptent pas. |

**Conditions** : `when = { day?: n | [n], moment?: "matin" | […], night?: bool, if?: "drapeau && !autre" }`. Absent = toujours. Moments : aube, matin, fin de matinée, midi, après-midi, fin d'après-midi, soir, veillée, nuit. `variants: [{ when, …champs }]` remplace des champs d'un objet à un moment donné (la roue arrêtée la nuit 3, le lit vide, les sabots cirés si `pain_pose`).

### Ajouter une carte

Dans la page, mode édition, calque « La carte » : « Nouvelle carte ». On pose les objets, les lieux, les sorties et les points d'arrivée, on sauvegarde, puis « Exporter en JSON » (ou on demande à Claude de relire la sauvegarde) et on écrit les fichiers dans `rpg/data/maps/`. On peut aussi écrire le JSON à la main : `blankMap(id, name, kind, w, h, chapter)` dans `world.js` donne une carte vide.

### Ajouter un type de décor

- Extérieur : une entrée dans `XTYPES` (`world.js` : nom, taille par défaut en px, emprise solide `foot`) et une fonction dans `XDRAW` (`exterior.js`) qui dessine dans la boîte.
- Pièce : une fonction dans `FURNI` (`interiors.js`), son nom et sa taille par défaut dans `FTYPES` (`editor.js`), et `WALL_TYPES` si elle est accrochée au mur.

## Code (Canvas 2D, sans dépendance)

| Fichier | Rôle |
|---|---|
| `world.js` | Le format commun, sans DOM (node le charge aussi) : `MAPS`, `whenOk`, `resolveObj` (variantes), `visibleObjects`, `XTYPES`, `mapCollision`, `mapForExport`, `blankMap`. |
| `exterior.js` | `drawMap(ctx, map, t, opts)`, `drawAnyMap`, les bâtiments et le décor (`XDRAW`), l'eau, la nuit, les palettes des habitants (`NPC_PAL`), `drawPerson`, `drawAnimal`. |
| `interiors.js` | `drawRoom(ctx, room, t, opts)` : sols (`FLOORS`), murs (`WALLS`), meubles (`FURNI`), poules, chat, éclairage de nuit. |
| `sprites.js` | Héros adulte et enfant (demi-sprites en lettres, miroir, ombrage auto), `drawSprite`, marche. |
| `scene.js` | Palette `PAL`, tuiles d'herbe, fleurs, maison `cottage()`. |
| `herolab.js` | Apparence du héros : cheveux qui poussent, tenues, béni ou maudit, auras. |
| `dirs.js` | Héros dans les 8 directions, `dirFrames(dir)`, `idleRows(dir)`. |
| `nature.js` | Décor vivant : `drawTree`, `drawBush`, `rock`, `drawTuft`, `drawReed`, oiseaux, papillons, feuilles. |
| `spirit.js` | Puits (`drawWell`), cinématique de l'Esprit capillaire. |
| `horror.js` | Vue du fond du puits, portrait parlant. |
| `viewer.js`, `editor.js`, `cartesmain.js` | La page des cartes : visite et éditeur (pas utiles en jeu). |
| `main.js`, `body.html` | La planche de direction artistique. |

`opts` de `drawMap` et `drawRoom` : `{ night, day, moment, flags, state, actors, animals, showHidden }`. `actors: [{ y, draw(ctx) }]` : le jeu fournit ses personnages, triés avec le décor par la ligne des pieds `y` en px, pour passer derrière un arbre ou une maison ; les npcs du JSON ne sont alors pas dessinés. Les bêtes restent dessinées sauf si `animals === false`. `state[id]` : état d'un objet (`{ blown }` pour la bougie, `{ shown }` pour un objet caché trouvé, les niveaux des dessins au mur).

`t` est le temps en millisecondes : toutes les animations (feu, roue, eau, bougie, linge) en dépendent. Il suffit de redessiner chaque image.

Ordre de chargement : `sprites, scene, herolab, dirs, nature, spirit, world, interiors, exterior`.

## Plans modifiés à la main

L'éditeur sauvegarde dans la base de la page, collection `maps` : un document par carte, `{ map }`, qui remplace la carte du fichier. Pour le jeu, on relit la base (ou on exporte) et on réécrit `rpg/data/maps/`.

## Planches

- `python3 build.py` produit `rpg/art/direction-artistique.html`.
- `python3 cartesbuild.py` produit `rpg/art/cartes.html`, avec toutes les cartes de `rpg/data/maps` intégrées.

Les noms des lieux et des personnages viennent du scénario de l'enfance et restent provisoires.
