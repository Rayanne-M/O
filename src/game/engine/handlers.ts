// Les réactions d'un chapitre, rangées par cible : « actor:mere », « object:grange/panier », « zone:place »,
// « enter:place », « exit:porte-maison ». Chaque étape de l'histoire pose les siennes et efface celles d'avant ;
// les réactions permanentes (regarder un meuble) restent d'un bout à l'autre.
import type { Game, Target } from './game';

export type Handler = (g: Game) => Promise<unknown> | unknown;

export class Handlers {
  private step = new Map<string, Handler>();
  private always = new Map<string, Handler>();

  /** Réactions de l'étape en cours (effacées par la prochaine étape). */
  on(map: Record<string, Handler>) {
    for (const [k, fn] of Object.entries(map)) this.step.set(k, fn);
  }
  /** Réactions valables tout le chapitre. */
  always_(map: Record<string, Handler>) {
    for (const [k, fn] of Object.entries(map)) this.always.set(k, fn);
  }
  clear() {
    this.step.clear();
  }
  off(key: string) {
    this.step.delete(key);
  }

  find(key: string) {
    return this.step.get(key) ?? this.always.get(key);
  }

  /** Clés essayées pour une cible, de la plus précise à la plus générale. */
  static keys(t: Target) {
    if (t.kind === 'actor') return [`actor:${t.id}`];
    // une sortie peut aussi être prise par « toutes les sorties de cette carte » : exit:village/*
    return [`${t.kind}:${t.map}/${t.id}`, `${t.kind}:${t.id}`, ...(t.kind === 'exit' ? [`exit:${t.map}/*`] : [])];
  }

  /** La première réaction qui convient à une cible, ou rien. */
  match(t: Target) {
    for (const k of Handlers.keys(t)) {
      const fn = this.find(k);
      if (fn) return fn;
    }
    return undefined;
  }

  /** Plusieurs cibles à la fois : une réaction de l'étape passe avant une réaction permanente, quelle que soit la cible. */
  /** Une réaction existe-t-elle pour l'une de ces cibles ? */
  has(targets: Target[]) {
    return targets.some((t) => Handlers.keys(t).some((k) => this.step.has(k) || this.always.has(k)));
  }

  async interactAll(g: Game, targets: Target[]) {
    for (const pool of [this.step, this.always])
      for (const t of targets)
        for (const k of Handlers.keys(t)) {
          const fn = pool.get(k);
          if (fn) {
            await fn(g);
            return true;
          }
        }
    return false;
  }

  async interact(g: Game, t: Target) {
    for (const k of Handlers.keys(t)) {
      const fn = this.find(k);
      if (fn) {
        await fn(g);
        return true;
      }
    }
    return false;
  }
}
