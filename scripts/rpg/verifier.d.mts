export interface Probleme { ou: string; quoi: string }
export function verifier(): { erreurs: Probleme[]; avertissements: Probleme[] };
export function rapport(r: { erreurs: Probleme[]; avertissements: Probleme[] }, o?: { details?: boolean }): string;
