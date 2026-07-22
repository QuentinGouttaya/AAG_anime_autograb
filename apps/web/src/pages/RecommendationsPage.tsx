// Front → API → Barycentre de tags (cosinus) → Résultat affiché.
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getRecommendations } from '../api/recommendations';
import { getFavorites } from '../api/favorites';

const SEASONS = [
  { key: 'WINTER', label: 'Hiver' },
  { key: 'SPRING', label: 'Printemps' },
  { key: 'SUMMER', label: 'Été' },
  { key: 'FALL', label: 'Automne' },
];

function currentSeason(): string {
  const m = new Date().getMonth() + 1;
  if (m <= 3) return 'WINTER';
  if (m <= 6) return 'SPRING';
  if (m <= 9) return 'SUMMER';
  return 'FALL';
}

export function RecommendationsPage() {
  const [season, setSeason] = useState(currentSeason());
  const [year, setYear] = useState(new Date().getFullYear());
  const favoritesCount = getFavorites().length;

  const { data: recommendations = [], isLoading, isError } = useQuery({
    queryKey: ['recommendations', season, year, favoritesCount],
    queryFn: () => getRecommendations(season, year),
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-9">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Recommandations</h1>
        <p className="mt-1 text-sm text-slate-400">
          {favoritesCount > 0
            ? `Classement par proximité cosinus avec les combinaisons de tags de tes ${favoritesCount} favori(s).`
            : 'Aucun favori : ajoute des ♥ depuis la recherche pour personnaliser le classement.'}
        </p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-white/10 bg-surface">
          {SEASONS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSeason(s.key)}
              className={`px-3 py-1.5 text-sm transition-colors ${season === s.key ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <input
          type="number"
          className="w-24 rounded-lg border border-white/10 bg-surface px-3 py-1.5 text-sm text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-accent"
          value={year}
          min={1990}
          onChange={(e) => setYear(Number(e.target.value))}
        />
      </div>

      {isLoading && <p className="py-14 text-center text-slate-400">Calcul des recommandations…</p>}
      {isError && <p className="py-14 text-center text-red-400">Erreur lors du chargement.</p>}

      {!isLoading && !isError && (
        <div className="flex flex-col gap-2">
          {recommendations.map((rec, index) => (
            <article
              key={rec.anilistId}
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-surface px-4 py-3"
            >
              <span className="w-8 shrink-0 text-right font-mono text-lg text-slate-500">{index + 1}</span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{rec.title ?? `AniList #${rec.anilistId}`}</p>
                <p className="truncate font-mono text-xs text-slate-400">{rec.episodes} ép. · #{rec.anilistId}</p>
                {rec.tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {rec.tags.slice(0, 5).map((tag) => (
                      <span key={tag} className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-slate-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="shrink-0 text-right">
                <p className="font-mono text-sm text-accent">{((rec.score ?? 0) * 100).toFixed(1)}%</p>
                <p className="text-xs text-slate-500">similarité</p>
              </div>
            </article>
          ))}
          {recommendations.length === 0 && (
            <p className="py-14 text-center text-slate-400">Aucune recommandation pour cette saison.</p>
          )}
        </div>
      )}
    </main>
  );
}
