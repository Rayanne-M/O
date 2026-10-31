# Catalogue des assets visuels

Tous les sprites, décors, animations et artworks pixel art du jeu, rangés par chapitre, avec le moment où chacun sert. Ce fichier est la référence commune : chaque fil qui crée ou utilise un asset met à jour sa ligne.

Mis à jour le 31 octobre 2026. Source du chapitre Enfance : le doc [Scénario de l'enfance](https://claude.ai/artifact/YSwNfBWsKdC37qiBTEsRUz), version réécrite (œufs et araignée, cache-cache, salon, rivière, rêve, puits).

## Comment lire ce fichier

**Statut**
- **Fait** : l'asset existe et peut être repris tel quel.
- **À adapter** : une base existe, mais il faut la modifier pour la nouvelle version du scénario.
- **À faire** : rien n'existe encore.

**Où ça existe**
- **Planche** : [direction-artistique.html](direction-artistique.html), code dans `rpg/art/src/` (voir le [README](src/README.md)).
- **Enfance** : [enfance-assets.html](enfance-assets.html) montre tous les assets de l'enfance animés (personnages, portraits, poules, objets, effets du puits, plans spéciaux). Code : `chars.js`, `portraits.js`, `poses.js`, `farm.js`, `props.js`, `closeups.js`, `cinematics.js`, `fx.js`.
- **Carte** : [carte-village.html](carte-village.html), code `map.js`, `interiors.js`, données `rpg/data/village.json` et `interiors.json`.
- **PR #2** : tranche jouable du village (`src/village/art/` : `sprites.ts`, `decor.ts`, `planche.js`).
- **PR #3** : Giorgio (chapitre Adolescence, pas dans ce catalogue pour l'instant).

**Identifiants** : `ENF-` + famille + numéro. Familles : `PER` personnages, `DEC` décors, `OBJ` objets, `ANI` animations en jeu, `PLAN` plans spéciaux et cinématiques, `POR` portraits de dialogue, `UI` écrans et interface.

**Attention** : la carte, les intérieurs et la PR #2 ont été faits d'après l'ancienne version du scénario (fichier `rpg/scenario/enfance.json`). Les écarts avec la version réécrite sont listés à la fin.

---

# Chapitre 1 : l'Enfance

## Résumé

| Famille | Fait | À adapter | À faire |
|---|---|---|---|
| Personnages | 20 | 3 | 0 |
| Décors | 7 | 12 | 2 |
| Objets | 26 | 4 | 1 |
| Animations en jeu | 18 | 3 | 7 |
| Plans spéciaux et cinématiques | 16 | 1 | 0 |
| Portraits de dialogue | 9 | 0 | 0 |
| Écrans et interface | 5 | 2 | 1 |
| **Total** | **101** | **25** | **11** |

La base (style, héros, village, puits, horreur) est là. Ce qui manque surtout : les nouveaux décors du cache-cache et de la rivière, les variantes d'Élio, les plans serrés (panier, rêve, puits au matin) et les portraits de dialogue.

## Chronologie : quels assets à quel moment

| Jour | Moment | Scène | Lieu | Assets utilisés |
|---|---|---|---|---|
| 1 | Matin | 1. Les œufs | Cuisine, grange | DEC-02, DEC-06, PER-01, PER-05, PER-14, OBJ-01 à OBJ-06, ANI-01, ANI-02, ANI-03, PLAN-01 |
| 1 | Midi | 2. Le cache-cache | Dehors seulement, dans tout le village (« pas le droit de se cacher à l'intérieur ! ») : Basile dans un buisson, Margot dans le chêne, Élio sur la margelle | DEC-01, DEC-03, DEC-09, DEC-10, DEC-11, DEC-12, DEC-08, PER-02 à PER-04, PER-07, PER-12, PER-13, OBJ-20 à OBJ-23, ANI-04 à ANI-07, UI-02 |
| 1 | Fin d'après-midi | 3. La légende | Puits | DEC-14, PER-02 à PER-04, PLAN-02 |
| 1 | Veillée | 4. La comptine | Salle commune | DEC-05, PER-05, PER-07, OBJ-07, ANI-08 |
| 1 | Soir | 5. Le gardien de la maison | Cuisine | DEC-06, OBJ-08, OBJ-09, ANI-09 |
| 1 | Nuit | Dodo | Chambre | DEC-07, OBJ-10, ANI-10, UI-03 |
| 2 | Matin | 6. Le salon | Salon de Fauvel | DEC-13, PER-05, PER-08, PER-15, OBJ-11 à OBJ-16, ANI-11, ANI-12, PLAN-03 |
| 2 | Matin | 7. La balade | Salon, rue | DEC-13, DEC-01, OBJ-11 à OBJ-16, ANI-13, ANI-14 |
| 2 | Fin de matinée | 8. Aubin | Devant le salon | DEC-01, PER-06, OBJ-17 |
| 2 | Après-midi | 9. La rivière | Rivière (baignade) | DEC-15, PER-01b, PER-02 à PER-04b, PER-16, OBJ-18, ANI-15, ANI-16 |
| 2 | Soir et nuit | Dodo | Chambre | DEC-07, ANI-10, ANI-17, UI-03 |
| 3 | Matin | 10. La tête rasée | Place | DEC-03, PER-04c, OBJ-19, ANI-18 |
| 3 | Après-midi | 11. La peur de Basile | Lavoir | DEC-04, PER-03 |
| 3 | Fin d'après-midi | 12. « À demain » | Village | PER-04c, OBJ-19 |
| 3 | Soir | Dodo | Chambre | DEC-07, UI-03 |
| 3 | Nuit | Le rêve | Plans serrés | PLAN-04, UI-04 |
| 3 | Nuit | Le réveil | Chambre de nuit | DEC-07, PLAN-05, ANI-19 |
| 3 | Nuit | Devant la maison d'Élio | Moulin de nuit | DEC-16, DEC-17, PER-06b, OBJ-24 à OBJ-27, ANI-20 |
| 3 | Nuit | Le puits | Puits de nuit | DEC-14, ANI-21, PLAN-06, PLAN-07, POR-09, ANI-22 à ANI-25, UI-05 |
| 4 | Aube | Voie de jour | Village, puits | PER-06c, PLAN-08, PLAN-09 |
| 4 | Matin | Les fins | Selon la fin | PLAN-10, PLAN-11, PER-01c |
| 4 | Jour | L'enterrement | Cimetière | DEC-18, PLAN-12, OBJ-28 |
| Tout l'acte | | Retour du build | Chambre | OBJ-29 (dessins au mur) |

---

## Personnages (sprites de carte, 8 directions, repos et marche)

| Id | Asset | Utilisé quand | Statut | Où ça existe, ce qui manque |
|---|---|---|---|---|
| PER-01 | Héros enfant, cheveux longs (début du jeu) | Tout l'acte | Fait | `chars.js` : `CHARS.heros_long`, 8 directions, repos, marche, course. |
| PER-01a | Héros enfant, cheveux courts ou pointes coupées | Jour 2 matin, après le salon | Fait | `chars.js` : `heros_pointes` et `heros_court`. |
| PER-01b | Héros en baignade : eau jusqu'à la taille | Jour 2, rivière | Fait | `poses.js` : `drawCharWading` (8 directions, éclaboussures). |
| PER-01c | Héros maudit : reflet noir dans les cheveux (pacte, Maudit +15) | Fin pacte, matin du jour 4, puis tout le jeu | À adapter | `drawHairTransfer` (`fx.js`) et `drawPactMorning` (mèches noires). Reste une palette noire pour le sprite. |
| PER-01d | Héros avec une tache sur la paume | Jour 1, s'il écrase l'araignée, jusqu'au soir | Fait | `poses.js` : `drawCharMark(…, "tache_paume")`. |
| PER-02 | Margot | Jours 1, 2, 3 | Fait | Carte (`map.js`, palette `margot`) et PR #2. Palette sur le corps enfant commun. |
| PER-03 | Basile | Jours 1, 2, 3 | Fait | Carte (`basile`) et PR #2. |
| PER-04 | Élio, longues tresses blondes | Jours 1 et 2 | Fait | Carte (`FRIEND_PAL`) et PR #2. |
| PER-04b | Élio sur la rive, chemise sur le dos, genoux dans les bras ; puis torse nu dans l'eau | Jour 2, rivière | Fait | `poses.js` : pose `assis_genoux` ; baignade avec `drawCharWading`. |
| PER-04c | Élio, tête rasée de travers sous une capuche | Jour 3 | Fait | `chars.js` : `elio_rase`, `elio_capuche` ; portraits avec les entailles. |
| PER-02b, 03b | Margot et Basile en baignade | Jour 2, rivière | Fait | `drawCharWading` avec `CHARS.margot`, `CHARS.basile`. |
| PER-05 | La mère | Jours 1 à 4 | Fait | Carte (`mere`) et PR #2. |
| PER-06 | Aubin, avec un rasoir à la main | Jour 2, fin de matinée | À adapter | Carte (`aubin`). Ajouter le rasoir. |
| PER-06b | Aubin endormi sur la table, bouteille couchée | Nuit 3, vu par la fenêtre de la cuisine | Fait | `poses.js` : pose `affale` ; `FURNI.bouteilles` `{ couchee }`. |
| PER-06c | Aubin qui tambourine, puis à genoux contre la margelle | Aube du jour 4 | Fait | `poses.js` : poses `tambourine` et `a_genoux`. |
| PER-07 | Grand-mère Ysol | Jour 1 (cache-cache, veillée) | Fait | `chars.js` : `CHARS.ysol` ; portrait `ysol`. |
| PER-08 | Maître Fauvel | Jour 2 | Fait | Carte (`fauvel`). |
| PER-12 | Mère de Basile qui coud, petits frères | Jour 1, cache-cache (fausse piste) | À adapter | `CHARS.mere_basile` et les petits (`enfant1` à `enfant3`). Pose assise qui coud à faire. |
| PER-13 | Autres enfants du village | Jour 1 (place), jour 2 (rivière) | Fait | `chars.js` : `enfant1` à `enfant3`. |
| PER-14 | Poules : cinq, dont la grosse rousse et la blanche | Jour 1, grange | Fait | `farm.js` : `drawHen` (5 robes, états idle, walk, pushed, pinch, fly, nest) et `henMotion`. |
| PER-15 | Client endormi sous une serviette chaude | Jour 2, salon | Fait | `poses.js` : pose `assis_serviette` ; `FURNI.serviettes`. |
| PER-16 | Hommes du village qui fouillent | Aube du jour 4 | Fait | `chars.js` : `villageois1`, `villageois2` ; `drawLantern` (`props.js`) ; plan PLAN-14. |
| PER-17 | Le chat | Nuit (chambre), maison d'Ysol | Fait | `interiors.js` (`drawChat`). Une variante qui dort pour Ysol. |

## Décors

| Id | Asset | Utilisé quand | Statut | Où ça existe, ce qui manque |
|---|---|---|---|---|
| DEC-01 | Carte du village, jour | Tout l'acte | À adapter | Carte (`map.js`, `village.json`, éditeur). Ajouter les maisons d'Ysol, de Basile et de Margot (aujourd'hui `maisonA`, `maisonB` sans nom), et le cimetière. |
| DEC-01n | Carte du village, nuit | Nuits | Fait | Carte, vue de nuit (fenêtres, bougie, chant du puits). |
| DEC-02 | Grange, rez-de-chaussée | Jour 1 matin | À adapter | `farm.js` : `FURNI.charrette`, `tonneau_eau`, `nid`, `sabot_mur`, `fourche`. La pièce reste à monter dans le fil des cartes. |
| DEC-02b | Grange, fenil | Jour 1 matin | À faire | Petite pièce du haut, foin. |
| DEC-03 | Place, fontaine et grand chêne | Jours 1 et 3 | À adapter | Carte (place et tilleul) ; fontaine dans la PR #2. Le scénario dit maintenant « grand chêne » : renommer ou redessiner l'arbre, avec Margot perchée. |
| DEC-04 | Lavoir et haie | Jour 1 (cache-cache), jour 3, nuit 3 | Fait | Carte (`washhouse`) et PR #2 (`decor.ts`). |
| DEC-05 | Maison du héros, salle commune | Veillée, matins | Fait | `interiors.json` (`maison_salle`, cheminée, fauteuil, bol). Ajouter le rouet d'Ysol (OBJ-07) et le coffre à linge. |
| DEC-06 | Maison du héros, cuisine | Jour 1 (œufs, gardien), soirs | À faire | Le scénario sépare cuisine et salle commune ; aujourd'hui tout est dans `maison_salle`. Poêle, tresses d'ail, panier à œufs. |
| DEC-07 | Chambre du héros, jour et nuit | Chaque soir, nuits | Fait | `interiors.json` (`maison_chambre`), éclairage de nuit, bougie. Ajouter les dessins au mur (OBJ-29), le coffre à jouets, les sabots. |
| DEC-08 | Moulin, salle de la meule | Jour 1 (cache-cache, Aubin chasse le héros) | Fait | `interiors.json` (`moulin`), meule et engrenage animés. |
| DEC-09 | Maison de Grand-mère Ysol, une grande pièce | Jour 1, cache-cache | À adapter | Objets prêts dans `props.js` / `farm.js` ; la pièce reste à monter dans le fil des cartes. |
| DEC-10 | Maison de Basile, cuisine bruyante | Jour 1, cache-cache | À adapter | Objets prêts dans `props.js` / `farm.js` ; la pièce reste à monter dans le fil des cartes. |
| DEC-11 | Maison de Margot, extérieur | Jours 1 et 2, en passant | À adapter | `drawMargotCrate` (`props.js`) ; à poser sur la carte dans le fil des cartes. |
| DEC-12 | Moulin, cuisine | Jour 1 (cache-cache), nuit 3 par la fenêtre | À adapter | Objets prêts dans `props.js` / `farm.js` ; la pièce reste à monter dans le fil des cartes. |
| DEC-13 | Salon de Fauvel, boutique et arrière-boutique | Jour 2 matin | À adapter | Objets prêts dans `props.js` / `farm.js` ; la pièce reste à monter dans le fil des cartes. |
| DEC-14 | Le vieux puits, jour et nuit | Jour 1 soir, nuit 3, aube 4 | Fait | Planche (`spirit.js`, `drawWell` : cheveux qui débordent, manivelle, seau) et PR #2 (`drawWellImage`, version jour). |
| DEC-15 | Rivière, zone de baignade et rive | Jour 2 après-midi | À adapter | Carte (rivière, pont) et planche (`nature.js`, eau animée). Il faut un coin peu profond où l'on entre dans l'eau, et une rive où Élio s'assoit. |
| DEC-16 | Moulin de nuit, roue arrêtée | Nuit 3 | À adapter | Carte (`mill`, `millWheel` animée). Ajouter l'état « roue immobile ». |
| DEC-17 | Chambre d'Élio vue de la fenêtre | Nuit 3 | À adapter | Objets prêts dans `props.js` / `farm.js` ; la pièce reste à monter dans le fil des cartes. |
| DEC-18 | Cimetière du village | Enterrement, jour 4 | À adapter | `drawGrave` (`props.js`) ; le lieu reste à ajouter dans le fil des cartes. |
| DEC-19 | Lisière de la forêt | Fond de carte, aube 4 (fouilles) | Fait | Carte (lisière). |

## Objets

| Id | Objet | Utilisé quand | Statut | Où ça existe, ce qui manque |
|---|---|---|---|---|
| OBJ-01 | Panier à œufs (vide, 4 œufs, 5 œufs) | Jour 1 matin | À adapter | `interiors.js` (`panier`). Ajouter les œufs visibles. |
| OBJ-02 | Œuf (au sol, caché, cassé) | Jour 1 matin | Fait | `farm.js` : `drawSmallEgg` (ok, cassé), `FURNI.nid` `{ egg }`. |
| OBJ-03 | Charrette avec roue | Jour 1, grange | Fait | `FURNI.charrette`. |
| OBJ-04 | Tonneau d'eau | Jour 1, grange | Fait | `FURNI.tonneau`. |
| OBJ-05 | Vieux sabot accroché au mur | Jour 1, grange | Fait | `FURNI.sabot_mur` `{ egg }`. |
| OBJ-06 | Poutre de la grange | Jour 1 | Fait | `FURNI.poutre`. |
| OBJ-07 | Rouet d'Ysol | Veillée jour 1, maison d'Ysol | Fait | `FURNI.rouet` `{ spin }`. |
| OBJ-08 | Bol de lait (plein, bu, retourné) et quignon de pain | Jour 1 soir, matin du jour 2 | Fait | `FURNI.bol_gardien` `{ etat: plein, bu, retourne ; pain }`, `FURNI.pain`. |
| OBJ-09 | Sabots du héros (normaux, cirés, un seul) et seau à cendres | Matin du jour 2 | Fait | `FURNI.sabots` `{ etat: normaux, cires, un }`, `FURNI.seau_cendres` `{ sabot }`. |
| OBJ-10 | Bougie (allumée, soufflée, qui refuse de s'allumer) | Chaque soir | À adapter | `FURNI.bougie` et lumière de nuit. Ajouter l'état « refuse de s'allumer » (soir 2, si le lait a été bu). |
| OBJ-11 | Grands ciseaux du barbier (sur l'étagère, en main, en inventaire) | Jour 2, puis puits | À adapter | Icône `drawIcon(…, "ciseaux")`. Reste le sprite sur l'étagère. |
| OBJ-12 | Grand fauteuil de barbier | Jour 2 | Fait | `FURNI.fauteuil_barbier`. |
| OBJ-13 | Miroir piqué | Jour 2 | Fait | `FURNI.miroir`. |
| OBJ-14 | Portrait du prince Élu orné de fleurs séchées | Jour 2 (salon), nuit 3 (image pieuse chez Élio) | Fait | `FURNI.portrait_prince` (`{ small }` pour la chambre d'Élio). |
| OBJ-15 | Flacons de lotion, rasoirs, pierre à affûter, serviettes chaudes | Jour 2 | Fait | `FURNI.flacons`, `rasoirs`, `serviettes`. |
| OBJ-16 | Canari en cage, balai, mèches au sol | Jour 2 | Fait | `FURNI.canari` `{ sing }`, `balai` `{ tas }` ; mèches : `FURNI.cheveux_sol`. |
| OBJ-17 | Rasoir d'Aubin | Jour 2 | À faire | En main d'Aubin. |
| OBJ-18 | Balle | Jour 2, rivière | Fait | `drawBall(ctx, x, y, z, { water })`. |
| OBJ-19 | Ruban bleu à moitié brûlé (en main, en inventaire, sur un rebord, dans le lit) | Jour 3, nuit 3, enterrement | Fait | Icône `ruban`, gros plan PLAN-03b, chute dans le puits `drawFallingRibbon`. |
| OBJ-20 | Table à longue nappe (cachette de Basile) | Jour 1, cache-cache | Fait | `FURNI.table_nappe` (le cache-cache est désormais dehors : elle reste un décor). |
| OBJ-21 | Herbes séchées, pot de miel, cahier de comptines | Jour 1, chez Ysol | Fait | `FURNI.herbes`, `pot_miel`, `cahier`. |
| OBJ-22 | Tresse de paille au-dessus des portes | Partout, tout l'acte | Fait | `FURNI.tresse_paille`. |
| OBJ-23 | Glands qui tombent | Jour 1, sous le chêne | Fait | `drawOak(…, { glands })`. |
| OBJ-24 | Fenêtre d'Élio ouverte, rideau qui bat | Nuit 3 | Fait | `FURNI.fenetre_ouverte`, `FURNI.lit_vide`. |
| OBJ-25 | Longs cheveux noirs mouillés (rebord, traînée au sol jusqu'au lavoir) | Nuit 3 | Fait | `drawWetHairTrail(ctx, points, t)`. |
| OBJ-26 | Restes des tresses dans le poêle | Nuit 3 | Fait | `FURNI.poele_tresses`. |
| OBJ-27 | Bouteille couchée | Nuit 3 | Fait | `FURNI.bouteilles` `{ couchee }`. |
| OBJ-28 | Cercueil (fermé, avec corps ou vide) | Enterrement | Fait | `FURNI.cercueil` `{ ouvert, contenu, fleurs }`. |
| OBJ-29 | Dessins au charbon sur le mur de la chambre | Tout l'acte | Fait | `FURNI.dessins_mur` `{ guerrier, mage, voleur }` de 0 à 5. |
| OBJ-30 | Bâton (arme de fortune) | Puits, combat | À adapter | Icône `baton`. Reste le sprite en main. |
| OBJ-31 | Coffre à jouets : épée de bois, étoile en papier, masque de chiffon | Chambre | Fait | `FURNI.coffre_jouets`. |

## Animations en jeu

| Id | Animation | Utilisé quand | Statut | Où ça existe, ce qui manque |
|---|---|---|---|---|
| ANI-01 | Poule poussée : elle se déplace, caquette, revient à sa place | Jour 1, grange | Fait | `drawHen` état `pushed` + `henMotion`. |
| ANI-02 | Grosse rousse qui pince, le héros recule | Jour 1, grange | Fait | `drawHen` état `pinch`. |
| ANI-03 | Deux poules qui s'envolent de la charrette | Jour 1, grange | Fait | `drawHen` état `fly`. |
| ANI-04 | Margot qui grimpe (vue en trichant) | Jour 1, décompte | Fait | `drawCountdown(…, { peek_t })` : une seconde, Margot grimpe au chêne. |
| ANI-05 | Amis trouvés qui suivent le héros en courant | Jour 1, cache-cache | À adapter | Marche des PNJ dans la PR #2. Ajouter la course et le suivi. |
| ANI-06 | Ysol qui regarde la table, pieds de Basile qui gigotent | Jour 1, chez Ysol | Fait | Remplacé : cache-cache dehors seulement. `drawHideBush(…, { pieds })` (Basile), `drawOak(…, { margot })`. |
| ANI-07 | Aubin qui chasse le héros du moulin | Jour 1, cache-cache | À faire | Geste du bras, héros repoussé dehors. |
| ANI-08 | Feu de cheminée, fauteuil qui se balance | Veillée | Fait | `interiors.js` (cheminée, fauteuil). |
| ANI-09 | Mère qui pose le bol près du poêle | Jour 1 soir | À faire | |
| ANI-10 | Souffler la bougie, fondu de la nuit | Chaque soir | Fait | Carte et PR #2 (`candleStool`). |
| ANI-11 | Clochette de la porte qui sonne | Jour 2, entrée au salon | Fait | `FURNI.clochette` `{ ring }`. |
| ANI-12 | Respiration du client endormi, canari qui chante quand on approche | Jour 2, salon | Fait | `FURNI.canari` `{ sing }`, pose `assis_serviette` qui respire. |
| ANI-13 | Prendre les ciseaux pendant que Fauvel tourne le dos | Jour 2, balade | À faire | Fauvel de dos, puis main qui saisit. |
| ANI-14 | Héros qui éternue (flacon), qui balaie les mèches en tas | Jour 2, balade | À adapter | `FURNI.balai` `{ tas }`. Reste l'éternuement. |
| ANI-15 | Marche dans l'eau avec éclaboussures | Jour 2, rivière | Fait | `drawCharWading(…, { moving, splash })`. |
| ANI-16 | Lancer de balle, Basile qui la rate, Margot qui s'enfuit à la nage | Jour 2, rivière | À faire | |
| ANI-17 | Porte qui claque au loin, du côté du moulin | Soir 2 | À faire | Plutôt un son et une lumière qui s'éteint au moulin. |
| ANI-18 | Élio qui ouvre la main sur le ruban | Jour 3 matin | Fait | Gros plan PLAN-03b (`drawRibbonHand`). |
| ANI-19 | Héros qui enjambe le rebord et saute dans le jardin | Nuit 3 | À faire | |
| ANI-20 | Héros qui frappe au carreau ; Aubin qui murmure sans se réveiller | Nuit 3 | À faire | |
| ANI-21 | Cheveux qui débordent du puits et rampent comme des racines | Nuit 3 | Fait | Planche (`spirit.js`, `s.spill`). |
| ANI-22 | Ruban qui tombe dans le puits, l'Esprit qui recule | Nuit 3, menu Parler | Fait | `fx.js` : `drawFallingRibbon(ctx, wx, wy, t, from, s)`. |
| ANI-23 | Combat : couper 3 mèches, l'Esprit saisit le héros | Nuit 3, Combattre | Fait | `fx.js` : `drawWellLocks`, `drawHitFx` (ciseaux, bâton), `drawFallingLock`, `drawHairGrab`. |
| ANI-24 | Pacte : les cheveux quittent le puits et entrent dans ceux du héros | Nuit 3, Pacte | Fait | `fx.js` : `drawHairTransfer`. |
| ANI-25 | Fuite : course jusqu'à la fenêtre | Nuit 3, Fuir | À adapter | Marche existante, en version course. |
| ANI-26 | Chant du puits (notes violettes) | Nuits | Fait | Carte, vue de nuit. |
| ANI-27 | Roue du moulin, eau, oiseaux, papillons, feuilles | Journées | Fait | `map.js`, `nature.js`. |
| ANI-28 | Araignée qui descend de la poutre | Grange (décor) | Fait | `FURNI.araignee`. |

## Plans spéciaux et cinématiques

| Id | Plan | Utilisé quand | Statut | Où ça existe, ce qui manque |
|---|---|---|---|---|
| PLAN-01 | Gros plan du panier : la main tient l'anse, cinq œufs dans la paille, l'araignée sort d'un œuf et glisse sur la main | Jour 1, fin de la scène des œufs | Fait | `closeups.js` : `drawBasketCloseup(ctx, t, { suite, suite_t })`. |
| PLAN-02 | Vue au fond du puits, de jour : eau noire, reflet du héros, une goutte, le reflet tremble | Jour 1, après la légende | Fait | `drawWellLook(ctx, t, { fond: "reflet" })`. |
| PLAN-03 | La coupe : mèches qui tombent sur le carrelage, le héros se regarde dans le miroir | Jour 2 matin | Fait | `cinematics.js` : `drawHaircut(ctx, t, { coupe })`. |
| PLAN-03b | Main d'Élio ouverte sur le ruban à moitié brûlé | Jour 3 matin | Fait | `drawRibbonHand(ctx, t)`. |
| PLAN-04 | Le rêve : la mini cinématique des cheveux qui emportent Élio, en plans très serrés | Nuit 3 | Fait | `drawDream(ctx, t)`, puis `drawWakeText`. |
| PLAN-05 | Réveil : héros assis dans le lit, bougie éteinte, fenêtre entrouverte, lune sur le rebord | Nuit 3 | Fait | `drawWakeUp(ctx, t, { coupe })`. |
| PLAN-06 | Regard au fond du puits, de nuit : la tête d'Élio prise dans les cheveux | Nuit 3 | Fait | `renderHorror(ctx, p, variante, { rase })` : tête rasée par défaut, comme dans le scénario réécrit. |
| PLAN-06b | Même plan, version atténuée (assombrie) | Nuit 3, si l'option est cochée | Fait | `renderHorror(…, { doux: true })` : assombri, rouge éteint. |
| PLAN-07 | L'Esprit fait parler le visage d'Élio comme une marionnette | Nuit 3 | Fait | Planche (« L'esprit parle à travers lui », `talkPortrait`). |
| PLAN-08 | Puits au matin : corps d'Élio sans cheveux | Aube 4 (selon la fin) | Fait | `drawWellLook(…, { fond: "corps", doux })`. |
| PLAN-09 | Puits au matin : seulement de l'eau rouge | Aube 4 (selon la fin) | Fait | `drawWellLook(…, { fond: "eau_rouge" })`. |
| PLAN-10 | Fin pacte : la mère trouve les cheveux plus longs d'un doigt | Matin 4 | Fait | `drawPactMorning(ctx, t, { coupe })`. |
| PLAN-11 | Fin défaite : héros dans l'eau, Aubin le repêche à l'aube | Matin 4 | Fait | `drawWellRescue(ctx, t)`. |
| PLAN-12 | L'enterrement : cercueil, Aubin sobre, ruban donné ou gardé | Fin de l'acte | Fait | `drawFuneral(ctx, t, { vide, ruban })`. |
| PLAN-13 | Fins nuit : l'Esprit qui chante et s'en va (apaisement), qui fuit blessé (victoire), qui se relâche (incrédulité) | Nuit 3 | Fait | `drawNightEnding(ctx, t, { fin: chante, fuit, relache })`. |
| PLAN-14 | Vue des fouilles au village, à l'aube (Aubin, hommes, lanternes) | Aube 4 | Fait | `drawDawnSearch(ctx, t)`. |
| PLAN-15 | Tableau récapitulatif de fin d'acte | Fin de l'acte | À adapter | La PR #2 a un écran récapitulatif. |

## Portraits de dialogue

Le scénario repose sur beaucoup de dialogue. Aujourd'hui seul l'Esprit a un portrait animé. Format proposé : 64 × 64, comme Giorgio dans la PR #3, avec une bouche qui suit le texte.

| Id | Portrait | Expressions utiles | Statut |
|---|---|---|---|
| POR-01 | Le héros | neutre, inquiet, en sueur (réveil) | Fait (`portraits.js`) |
| POR-02 | Élio | neutre, triste, tête rasée sous capuche, en colère | Fait (`portraits.js`) |
| POR-03 | Margot | moqueuse, sérieuse | Fait (`portraits.js`) |
| POR-04 | Basile | bavard, terrifié | Fait (`portraits.js`) |
| POR-05 | La mère | tendre, autoritaire | Fait (`portraits.js`) |
| POR-06 | Aubin | ivre, menaçant, effondré | Fait (`portraits.js`) |
| POR-07 | Grand-mère Ysol | qui chante | Fait (`portraits.js`) |
| POR-08 | Maître Fauvel | bavard | Fait (`portraits.js`) |
| POR-09 | L'Esprit par le visage d'Élio (« ??? ») | parle | Fait (Planche, `talkPortrait`) |

## Écrans et interface

| Id | Écran | Utilisé quand | Statut | Où ça existe, ce qui manque |
|---|---|---|---|---|
| UI-01 | Boîte de dialogue, texte qui s'écrit | Tout l'acte | Fait | Planche et PR #2. |
| UI-02 | Décompte du cache-cache : écran sombre, « 10… 9… » mot par mot, œil qui s'ouvre une seconde | Jour 1 midi | Fait | `drawCountdown(ctx, t, { peek_t })`. |
| UI-03 | Fondu de la nuit, transition jour suivant | Chaque nuit | À adapter | PR #2. |
| UI-04 | « Vous vous réveillez en sueur. » sur fond noir | Nuit 3 | Fait | `drawWakeText(ctx, t, { text })`. |
| UI-05 | Menu du puits : Parler, Combattre, Pacte, Fuir | Nuit 3 | À adapter | PR #2 a Parler, Combattre, Fuir. Ajouter Pacte comme entrée visible et les répliques conditionnelles. |
| UI-06 | Icônes d'inventaire : ciseaux, ruban, bâton | Jours 2 et 3, puits | Fait | `drawIcon(ctx, id, x, y)` : ciseaux, ruban, baton, oeuf, pain. |
| UI-07 | Indicateur d'objet interactif (aucun pour la fenêtre) | Tout l'acte | Fait | `fx.js` : `drawInteractHint(ctx, x, y, t)`. |
| UI-08 | Écran titre avec l'option « atténuer les images choquantes » | Démarrage | À faire | |

---

## Écarts entre l'existant et le scénario réécrit

La carte, les intérieurs et la PR #2 suivent l'ancienne version. À corriger en priorité quand on reprend ces fichiers :

1. **Œufs** : 6 œufs et une araignée qui descend de la poutre → 5 œufs cachés sous les poules, puis l'araignée en gros plan sur la main.
2. **Midi du jour 1** : le jeu des brigands → le cache-cache dans tout le village (maisons d'Ysol, de Basile, de Margot, cuisine du moulin).
3. **Gardien de la maison** : optionnel au soir 2 → scène fixe au soir 1, avec des conséquences visibles le lendemain.
4. **Barbier** : ciseaux sur le comptoir → sur l'étagère du fond ; ajouter le portrait du prince, le canari, le client.
5. **Rivière** : simple dialogue → baignade, balle, Élio sur la rive.
6. **Jour 3** : indices (ruban dans la cendre, cheveux dans la haie, traces) → le ruban vient d'Élio lui-même ; la cinématique du lavoir devient le rêve.
7. **Nuit 3** : Élio vivant sur la margelle → Élio déjà mort, la tête au fond du puits ; ajout de la visite du moulin de nuit.
8. **Arbre de la place** : tilleul → grand chêne.

## Ordre de fabrication proposé

Le scénario conseille de commencer la tranche jouable par la maison du héros, la grange, le salon et le moulin. Dans cet ordre :

1. Vraies vues du héros enfant en 8 directions, avec les deux coupes (PER-01, PER-01a).
2. Grange complète et gros plan du panier (DEC-02, OBJ-01 à 05, ANI-01 à 03, PLAN-01).
3. Cuisine du héros et objets du gardien (DEC-06, OBJ-08 à 10).
4. Salon de Fauvel complet et la coupe (DEC-13, OBJ-11 à 16, PLAN-03).
5. Variantes d'Élio et portraits de dialogue (PER-04b, PER-04c, POR-01 à 08).
6. Nuit 3 : moulin de nuit, rêve, puits au matin (DEC-16, DEC-17, PLAN-04, PLAN-05, PLAN-08, PLAN-09).
7. Ensuite le cache-cache (maisons d'Ysol, de Basile, de Margot), la baignade et l'enterrement.

---

# Chapitre 2 : l'Adolescence

À remplir. Déjà fait : Giorgio, gardien du pied de l'arc-en-ciel (PR #3 ; `rpg/bestiaire/giorgio-*.png`) : sprites 8 directions, portrait 64 × 64, voyage sur l'arc-en-ciel, chaudron.
