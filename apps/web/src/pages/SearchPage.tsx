// Filtrage par tags 100% backend : chaque (dé)sélection relance /metadata/search
// avec ?tags=... ; aucun filter côté client (filterMetadataCandidates côté API).
import { useCallback, useMemo, useState } from 'react';
import { searchAnimes } from '../api/anime';
import { createSubscription } from '../api/subscriptions';
import { getFavorites, toggleFavorite } from '../api/favorites';
import type { PageInfo, Serie } from '../types';

const STATUS_LABELS: Record<string, string> = {
  RELEASING: 'En diffusion',
  FINISHED: 'Terminé',
  NOT_YET_RELEASED: 'À venir',
  CANCELLED: 'Annulé',
  HIATUS: 'En pause',
};

const PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="230" height="345"><rect width="100%" height="100%" fill="#1e2330"/><text x="50%" y="50%" fill="#777" font-size="14" text-anchor="middle">No image</text></svg>`,
  );

type ApiErrorLike = {
  response?: { status?: number; data?: { message?: string } };
};

function isApiError(value: unknown): value is ApiErrorLike {
  return typeof value === 'object' && value !== null && 'response' in value;
}

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Serie[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [subscribedAnilistIds, setSubscribedAnilistIds] = useState<Set<number>>(new Set());
  const [subscribingId, setSubscribingId] = useState<number | null>(null);
  const [detailSerie, setDetailSerie] = useState<Serie | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<number[]>(getFavorites());

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    window.setTimeout(() => setToast(null), 3000);
  };

  const doSearch = useCallback(async (q: string, p: number, tags: Set<string>) => {
    const normalizedQuery = q.trim();
    if (normalizedQuery.length < 2) {
      setHasSearched(false);
      setResults([]);
      setPageInfo(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await searchAnimes(normalizedQuery, p, 20, [...tags], 'all');
      const rows = Array.isArray(res?.data) ? res.data : [];
      setResults(rows);
      setPageInfo(res?.pageInfo ?? null);
      setHasSearched(true);
    } catch {
      setError('Erreur lors de la recherche AniList.');
      setResults([]);
      setPageInfo(null);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSelectedTags(new Set());
    void doSearch(query, 1, new Set());
  };

  const goToPage = (p: number) => {
    void doSearch(query, p, selectedTags);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTag = (tag: string) => {
    const next = new Set(selectedTags);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    setSelectedTags(next);
    void doSearch(query, 1, next);
  };

  const clearTags = () => {
    setSelectedTags(new Set());
    void doSearch(query, 1, new Set());
  };

  const handleSubscribe = async (serie: Serie) => {
    setSubscribingId(serie.anilistId);
    try {
      await createSubscription({
        anilistId: serie.anilistId,
        preferredFansub: [],
        preferredResolution: '1080p',
        minSeeders: 1,
      });
      setSubscribedAnilistIds((prev) => new Set(prev).add(serie.anilistId));
      showToast(`Abonné à « ${serie.canonicalTitle} »`, true);
    } catch (err) {
      if (isApiError(err) && err.response?.status === 409) {
        setSubscribedAnilistIds((prev) => new Set(prev).add(serie.anilistId));
        showToast('Déjà abonné à cet animé', false);
        return;
      }
      const message = isApiError(err) ? err.response?.data?.message : undefined;
      showToast(message ?? "Erreur lors de l'abonnement", false);
    } finally {
      setSubscribingId(null);
    }
  };

  const safeResults = useMemo(() => (Array.isArray(results) ? results : []), [results]);

  const availableTags = useMemo(() => {
    const names = new Set<string>();
    for (const serie of safeResults) {
      for (const tag of serie.tags ?? []) {
        if (!tag.isAdult) names.add(tag.name);
      }
    }
    return [...names].sort();
  }, [safeResults]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-9">
      <h1 className="mb-5 text-2xl font-bold tracking-tight text-white">Recherche AniList</h1>

      <form className="mb-5 flex gap-2" onSubmit={handleSubmit}>
        <input
          className="flex-1 rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-accent"
          type="text"
          placeholder="Ex : Frieren, Solo Leveling, One Piece…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40"
          type="submit"
          disabled={loading || query.trim().length < 2}
        >
          {loading ? '…' : 'Rechercher'}
        </button>
      </form>

      {error && <p className="py-6 text-center text-red-400">{error}</p>}
      {loading && <p className="py-6 text-center text-slate-400">Chargement…</p>}

      {!loading && availableTags.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-1.5">
          {availableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${selectedTags.has(tag) ? 'bg-accent text-white' : 'bg-surface-2 text-slate-400 hover:text-white'
                }`}
            >
              {tag}
            </button>
          ))}
          {selectedTags.size > 0 && (
            <button
              type="button"
              className="ml-1 text-xs font-medium text-slate-400 underline hover:text-white"
              onClick={clearTags}
            >
              Effacer les filtres
            </button>
          )}
        </div>
      )}

      {!loading && safeResults.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3.5">
          {safeResults.map((serie) => {
            const isSubscribed = subscribedAnilistIds.has(serie.anilistId);
            const isSubscribing = subscribingId === serie.anilistId;
            const isFav = favorites.includes(serie.anilistId);
            const genres = Array.isArray(serie.genres) ? serie.genres : [];
            const visibleTags = (serie.tags ?? []).filter((t) => !t.isAdult);

            return (
              <article
                key={serie.anilistId}
                className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-surface transition-colors hover:border-white/20"
              >
                <img
                  src={serie.coverImage || PLACEHOLDER}
                  alt={serie.canonicalTitle}
                  loading="lazy"
                  className="aspect-[2/3] w-full bg-surface-2 object-cover"
                />
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <h3 className="line-clamp-2 text-sm font-semibold text-white" title={serie.canonicalTitle}>
                    {serie.canonicalTitle}
                  </h3>

                  <div className="flex flex-wrap gap-1.5">
                    {serie.status && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-mono ${serie.status === 'RELEASING'
                            ? 'bg-emerald-400/15 text-emerald-400'
                            : 'bg-surface-2 text-slate-400'
                          }`}
                      >
                        {STATUS_LABELS[serie.status] ?? serie.status}
                      </span>
                    )}
                    {serie.format && (
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-mono text-slate-400">
                        {serie.format}
                      </span>
                    )}
                  </div>

                  <p className="font-mono text-xs text-slate-400">
                    {serie.episodeCount ? `${serie.episodeCount} ép.` : 'Ép. inconnu'} · #{serie.anilistId}
                  </p>

                  {genres.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {genres.slice(0, 3).map((genre) => (
                        <span key={genre} className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-slate-400">
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}

                  {visibleTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {visibleTags.slice(0, 4).map((tag) => (
                        <span key={tag.id} className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex gap-1.5 pt-1.5">
                    <button
                      type="button"
                      className="flex-1 rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-40"
                      disabled={isSubscribed || isSubscribing}
                      onClick={() => void handleSubscribe(serie)}
                    >
                      {isSubscribing ? '…' : isSubscribed ? '✓ Abonné' : "+ S'abonner"}
                    </button>
                    <button
                      type="button"
                      className={`shrink-0 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${isFav
                          ? 'border-accent bg-accent/15 text-accent'
                          : 'border-white/10 text-slate-300 hover:border-accent hover:text-accent'
                        }`}
                      onClick={() => setFavorites(toggleFavorite(serie.anilistId))}
                      aria-label={`${isFav ? 'Retirer' : 'Ajouter'} ${serie.canonicalTitle} des favoris`}
                    >
                      {isFav ? '♥' : '♡'}
                    </button>
                    <button
                      type="button"
                      className="shrink-0 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-slate-300 hover:border-accent hover:text-accent"
                      onClick={() => setDetailSerie(serie)}
                      aria-label={`Voir les détails de ${serie.canonicalTitle}`}
                    >
                      Détails
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && hasSearched && safeResults.length === 0 && !error && (
        <p className="py-14 text-center text-slate-400">Aucun résultat pour « {query.trim()} ».</p>
      )}
      {!hasSearched && !loading && (
        <p className="py-14 text-center text-slate-400">Tape un titre d'animé pour lancer la recherche.</p>
      )}

      {pageInfo && pageInfo.lastPage > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            className="rounded-md border border-white/10 px-3 py-1.5 text-sm text-slate-200 hover:border-accent disabled:opacity-40"
            disabled={pageInfo.currentPage <= 1 || loading}
            onClick={() => goToPage(pageInfo.currentPage - 1)}
          >
            ← Précédent
          </button>
          <span className="font-mono text-xs text-slate-400">
            Page {pageInfo.currentPage} / {pageInfo.lastPage} ({pageInfo.total} résultats)
          </span>
          <button
            className="rounded-md border border-white/10 px-3 py-1.5 text-sm text-slate-200 hover:border-accent disabled:opacity-40"
            disabled={!pageInfo.hasNextPage || loading}
            onClick={() => goToPage(pageInfo.currentPage + 1)}
          >
            Suivant →
          </button>
        </div>
      )}

      {detailSerie && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          onClick={() => setDetailSerie(null)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-surface p-6"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-white">{detailSerie.canonicalTitle}</h2>

            {[
              ['AniList ID', `#${detailSerie.anilistId}`],
              ['Statut', STATUS_LABELS[detailSerie.status ?? ''] ?? detailSerie.status ?? '—'],
              ['Format', detailSerie.format ?? '—'],
              ['Épisodes', detailSerie.episodeCount ?? '—'],
              ['Genres', Array.isArray(detailSerie.genres) && detailSerie.genres.length > 0 ? detailSerie.genres.join(', ') : '—'],
              [
                'Tags',
                (detailSerie.tags ?? []).filter((t) => !t.isAdult).length > 0
                  ? (detailSerie.tags ?? []).filter((t) => !t.isAdult).map((t) => t.name).join(', ')
                  : '—',
              ],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 text-sm">
                <span className="text-slate-400">{label}</span>
                <span className="text-right text-slate-200">{value}</span>
              </div>
            ))}

            <button
              className="mt-2 self-end rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
              type="button"
              onClick={() => setDetailSerie(null)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'
            }`}
        >
          {toast.msg}
        </div>
      )}
    </main>
  );
}
