// Favoris stockés en localStorage côté client (pas de système utilisateur) ;
// envoyés dans la requête de recommandation en query param.
const KEY = 'aag:favorites';

export function getFavorites(): number[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((n) => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(anilistId: number): number[] {
  const current = new Set(getFavorites());
  if (current.has(anilistId)) current.delete(anilistId);
  else current.add(anilistId);
  const next = [...current];
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
