# Produit rpg/art/cartes.html : toutes les cartes de rpg/data/maps, la visite et l'éditeur, en une seule page.
# Usage : python3 cartesbuild.py [chemin de sortie]   (lancé depuis ce dossier)
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__))
data = os.path.join(here, '..', '..', 'data', 'maps')
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, '..', 'cartes.html')
rd = lambda f: open(os.path.join(here, f), encoding='utf-8').read()
index = json.load(open(os.path.join(data, 'index.json'), encoding='utf-8'))
maps = {k: json.load(open(os.path.join(data, v['file']), encoding='utf-8')) for k, v in index['maps'].items()}
head = '<title>Cartes du jeu</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;700&family=Atkinson+Hyperlegible:wght@400;700&display=swap">\n'
files = ['sprites.js', 'scene.js', 'herolab.js', 'dirs.js', 'nature.js', 'spirit.js', 'world.js', 'interiors.js', 'exterior.js', 'viewer.js', 'editor.js']
js = 'const WORLD_INDEX = ' + json.dumps(index, ensure_ascii=False) + ';\nconst WORLD_DATA = ' + json.dumps(maps, ensure_ascii=False, separators=(',', ':')) + ';\n'
js += '\n'.join(rd(f) for f in files) + '\n' + rd('cartesmain.js')
open(out, 'w', encoding='utf-8').write(head + rd('style.css') + '\n<style>\n' + rd('map.css') + '</style>\n' + rd('cartes-body.html') + '\n<script>\n' + js + '\n</script>\n')
print('ok', out, len(maps), 'cartes')
