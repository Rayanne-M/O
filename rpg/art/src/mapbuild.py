css=open('style.css').read()
head='<title>Carte du village</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;700&family=Atkinson+Hyperlegible:wght@400;700&display=swap">\n'
mcss='<style>\n'+open('map.css').read()+'</style>\n'
files=['sprites.js','scene.js','herolab.js','dirs.js','nature.js','spirit.js','village-data.js','interiors-data.js','interiors.js','map.js','room-ui.js','editor.js','mapmain.js']
js='\n'.join(open(f).read() for f in files)
open('/mnt/project-files/rpg/art/carte-village.html','w').write(head+css+'\n'+mcss+open('mapbody.html').read()+'\n<script>\n'+js+'\n</script>\n')
