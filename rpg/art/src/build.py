css=open('style.css').read()
head='<title>Direction artistique du RPG</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;700&family=Atkinson+Hyperlegible:wght@400;700&display=swap">\n'
import os
files=['sprites.js','scene.js','herolab.js','dirs.js','nature.js']+['spirit.js','horror.js']+['main.js']
js='\n'.join(open(f).read() for f in files)
open('/mnt/project-files/rpg/art/direction-artistique.html','w').write(head+css+'\n'+open('body.html').read()+'\n<script>\n'+js+'\n</script>\n')
