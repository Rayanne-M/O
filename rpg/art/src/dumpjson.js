const fs = require('fs'), vm = require('vm'); const ctx = {}; vm.createContext(ctx);
const src = ['village-data.js', 'interiors-data.js'].map(f => fs.readFileSync(__dirname + '/' + f, 'utf8')).join('\n') + '\n;({ RIVER, PATHS, PLACE, BUILD, PLACES, DOORS, INTERIORS })';
const d = vm.runInContext(src, ctx);
const coll = r => { const g = Array.from({ length: r.h }, (_, y) => Array.from({ length: r.w }, () => y < 2 ? 1 : 0)); r.objects.filter(o => o.solid).forEach(o => { for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) if (g[y]) g[y][x] = 1; }); return g.map(r => r.join('')); };
Object.values(d.INTERIORS.rooms).forEach(r => r.collision = coll(r));
fs.writeFileSync('/mnt/project-files/rpg/data/interiors.json', JSON.stringify(d.INTERIORS, null, 1));
fs.writeFileSync('/mnt/project-files/rpg/data/village.json', JSON.stringify({ size: [560, 360], river: d.RIVER, paths: d.PATHS, place: d.PLACE, buildings: d.BUILD, doors: d.DOORS, places: d.PLACES }, null, 1));
console.log('ok', Object.keys(d.INTERIORS.rooms));
