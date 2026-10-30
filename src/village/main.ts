// Point d'entrée de la tranche jouable : le village natal.
import Phaser from 'phaser';
import { World, VIEW_W, VIEW_H } from './world';
import './style.css';

const world = new World();

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: VIEW_W,
  height: VIEW_H,
  backgroundColor: '#000000',
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: world,
});
if (import.meta.env.DEV) Object.assign(window, { world });

// Contrôles tactiles : un joystick à gauche, le bouton A à droite.
const stick = document.getElementById('stick')!;
const knob = document.getElementById('knob')!;
let pointer: number | null = null;
const move = (e: PointerEvent) => {
  const r = stick.getBoundingClientRect();
  const x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
  const len = Math.min(1, Math.hypot(x, y)), a = Math.atan2(y, x);
  world.stick = { x: Math.cos(a) * len, y: Math.sin(a) * len };
  knob.style.transform = `translate(${world.stick.x * 50}%, ${world.stick.y * 50}%)`;
};
const release = () => {
  pointer = null;
  world.stick = { x: 0, y: 0 };
  knob.style.transform = '';
};
stick.addEventListener('pointerdown', (e) => {
  pointer = e.pointerId;
  stick.setPointerCapture(e.pointerId);
  move(e);
});
stick.addEventListener('pointermove', (e) => e.pointerId === pointer && move(e));
stick.addEventListener('pointerup', release);
stick.addEventListener('pointercancel', release);
document.getElementById('btn-a')!.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  world.action();
});
