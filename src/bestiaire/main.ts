// Page du bestiaire : Giorgio, ses portraits, ses sprites et son chaudron, animés.
import { drawSprite } from '../village/art/planche.js';
import {
  GIORGIO, GIORGIO_PAL, giorgioFrames, drawPortrait, drawRainbowTravel, drawCauldron, type Desire,
} from './giorgio';
import type { Dir } from '../village/art/planche.js';
import './style.css';

const DIRS: Dir[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const ctxOf = (id: string) => {
  const c = document.getElementById(id) as HTMLCanvasElement;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  return g;
};

document.getElementById('title')!.textContent = GIORGIO.title;
drawPortrait(ctxOf('p-neutre'), 'neutre');
drawPortrait(ctxOf('p-affame'), 'affame', 0.4);

const dirs = document.getElementById('dirs')!;
const dirCtx = DIRS.map((d) => {
  const fig = document.createElement('figure');
  const c = document.createElement('canvas');
  c.width = 24;
  c.height = 34;
  c.className = 'sprite';
  fig.append(c, Object.assign(document.createElement('figcaption'), { textContent: d }));
  dirs.append(fig);
  return c.getContext('2d')!;
});

const talk = ctxOf('p-parle'), travel = ctxOf('travel');
const pots: [CanvasRenderingContext2D, Desire][] = [[ctxOf('c-pates'), 'pates'], [ctxOf('c-reflet'), 'reflet'], [ctxOf('c-or'), 'or']];
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

function frame(t: number) {
  const step = Math.floor(t / 125);
  DIRS.forEach((d, i) => {
    const g = dirCtx[i];
    g.clearRect(0, 0, 24, 34);
    const f = giorgioFrames(d);
    drawSprite(g, f[1 + (step % 4)], GIORGIO_PAL, 0, 0);
  });
  drawPortrait(talk, 'neutre', Math.abs(Math.sin(t / 110)) * (Math.floor(t / 1600) % 2 ? 0 : 1));
  drawRainbowTravel(travel, t);
  for (const [g, d] of pots) {
    g.clearRect(0, 0, 40, 44);
    drawCauldron(g, 4, 12, t, d);
  }
  if (!still) requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
