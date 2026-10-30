import type { Tag } from '../engine/types';

/** Nom affiché de chaque tag. Tout tag utilisé dans les données doit être listé ici. */
export const tagLabels: Record<Tag, string> = {
  mage: 'Mage',
  warrior: 'Guerrier',
  rogue: 'Roublard',
  arcane: 'Arcane',
  fire: 'Feu',
  shadow: 'Ombre',
  holy: 'Sacré',
  nature: 'Nature',
  blood: 'Sang',
  martial: 'Martial',
};
