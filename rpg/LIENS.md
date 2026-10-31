# Comment tout est relié

Tout le contenu du jeu vit dans **un seul dossier : `rpg/`**. Le jeu, la page des cartes et les planches ne gardent
aucune copie : ils relisent ces fichiers. Changer un fichier ici change donc tout ce qui l'utilise.

```
rpg/
  art/src/               le dessin : sprites (chars.js), portraits, décors, cinématiques
  data/maps/             les cartes (index.json les liste)
  data/personnages.json  le registre des personnages
  scenario/              le scénario
  art/*.html             les planches, refaites automatiquement (ne pas modifier à la main)
```

## Les identifiants

Chaque chose a un identifiant court, sans espace ni accent : `margot`, `village`, `puits`, `s3_legende`.
Partout ailleurs, on cite cet identifiant au lieu de recopier la chose. Par exemple, Margot est décrite une seule fois
dans `personnages.json` :

```json
"margot": { "nom": "Margot", "sprite": "margot", "portrait": "margot", "enfant": true }
```

- la carte du village la pose avec `{ "id": "margot", "x": 18, "y": 14 }` ;
- le scénario la fait parler avec `{ "qui": "margot", "texte": "…" }` ;
- l'histoire du jeu écrit `g.say('margot', '…')`.

Si on change son nom, son sprite ou son portrait dans le registre, les dialogues du jeu, la page des cartes et
les planches suivent tous.

## Ce qui suit quoi

| Je change… | Ce qui suit tout seul |
|---|---|
| un sprite (`art/src/chars.js`) | le jeu et la page des cartes (les habitants y sont dessinés avec le même sprite) |
| un portrait (`art/src/portraits.js`) | les dialogues du jeu, la planche des assets |
| un personnage (`data/personnages.json`) | nom dans les dialogues, allure dans le jeu et sur les cartes |
| une carte (`data/maps/*.json`) | le jeu et la page des cartes |
| un décor (`art/src/exterior.js`, `interiors.js`…) | le jeu, la page des cartes, les planches |

## La vérification des liens

Un identifiant cité mais introuvable (un objet renommé sur la carte que l'histoire cherche encore, un personnage
sans sprite…) est une **référence cassée**. Elle est signalée :

- dans le terminal de `npm run dev`, dès qu'on enregistre un fichier de `rpg/` (et dans le navigateur s'il y a une erreur) ;
- par `npm test` et donc à chaque PR (la CI échoue tant qu'un lien est cassé) ;
- par `npm run verifier`, qui affiche le rapport complet.

Ce qui est vérifié :

- **personnages** : le sprite existe dans `chars.js`, le portrait dans `portraits.js`, la palette dans `exterior.js` ;
- **cartes** : chaque sortie mène à une carte et à un point d'arrivée qui existent, chaque habitant est dans le registre,
  chaque scène est posée sur un lieu de la carte, les objets n'ont pas d'id en double ;
- **scénario** : chaque `qui` et chaque `pnj` est dans le registre ; une scène qui indique `carte` et `zone` pointe vers un vrai lieu ;
- **histoire du jeu** (`src/game/chapters/`) : chaque `'object:carte/id'`, `'zone:…'`, `'exit:…'`, chaque `goto`/`put`
  vers un point d'une carte, et chaque personnage qui parle existe.

Les **avertissements** ne cassent rien mais méritent un œil : par exemple une scène posée sur une carte que le
scénario ne connaît pas encore.

## Les commandes

```bash
npm run dev       # le jeu, qui se recharge dès qu'un fichier de rpg/ change ; les planches sont refaites au passage
npm run rpg       # vérifie les liens et refait les planches (cartes.html, direction-artistique.html, enfance-assets.html)
npm run verifier  # le rapport complet des liens, avertissements compris
npm test          # tous les tests, vérification des liens comprise
```

## Ajouter…

- **un personnage** : une entrée dans `personnages.json` (et son sprite dans `CHAR_SPECS` de `chars.js`, son portrait
  dans `PORTRAITS` de `portraits.js` s'il parle). Il peut aussitôt être posé sur une carte et parler dans le jeu.
- **une planche** : une entrée dans `PAGES` de `scripts/rpg/contenu.mjs` (titre, fichiers de dessin, corps HTML).
- **une vérification** : une règle dans `scripts/rpg/verifier.mjs`.
