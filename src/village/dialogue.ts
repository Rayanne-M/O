// Joue les scènes écrites dans script.ts et applique leurs effets à l'état du héros.
import { NAMES, type Speaker, type Step } from './script';
import { applyEffects } from './state';
import { ui } from './ui';

/** Joue une liste d'étapes. who : qui parle quand l'étape ne le précise pas. Renvoie le dernier choix fait (-1 sinon). */
export async function play(steps: Step[], who: Speaker = 'narrator'): Promise<number> {
  let last = -1;
  for (const step of steps) {
    if (step.if && !step.if()) continue;
    const name = NAMES[step.who ?? who];
    if ('say' in step) {
      await ui.say(name, step.say);
      applyEffects(step.effects);
      continue;
    }
    const options = step.options.filter((o) => !o.if || o.if());
    last = step.options.indexOf(options[await ui.choose(name, step.ask, options.map((o) => o.label))]);
    const opt = step.options[last];
    applyEffects(opt.effects);
    if (opt.then) await play(opt.then, who);
  }
  return last;
}
