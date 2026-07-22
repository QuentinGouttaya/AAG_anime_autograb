import { useCallback, useMemo, useState } from 'react';
import { searchAnimes } from '../api/anime';
import { createSubscription } from '../api/subscriptions';
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
    `<svg xmlns="http://www.w3.org/2000/svg" width="230" height="345"><rect width="100%" height="100%" fill="#2a2a3a"/><text x="50%" y="50%" fill="#777" font-size="14" text-anchor="middle">No image</text></svg>`,
  );

type ApiErrorLike = {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
};

function isApiError(value: unknown): value is ApiErrorLike {
  return typeof value === 'object' && value !== null && 'response' in value;
}

function statusBadgeClass(status?: string): string {
  return status === 'RELEASING' ? 'badge-active' : 'badge-inactive';
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

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    window.setTimeout(() => setToast(null), 3000);
  };

  const doSearch = useCallback(async (q: string, p: number) => {
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
      const res = await searchAnimes(normalizedQuery, p, 20);
      const rows = Array.isArray(res?.data) ? res.data : [];

      setResults(rows);
      setPageInfo(res?.pageInfo ?? null);
      setHasSearched(true);
      setSelectedTags(new Set());
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
    void doSearch(query, 1);
  };

  const goToPage = (p: number) => {
    void doSearch(query, p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const filteredResults = useMemo(() => {
    if (selectedTags.size === 0) return safeResults;
    return safeResults.filter((serie) => {
      const serieTagNames = new Set((serie.tags ?? []).map((t) => t.name));
      return [...selectedTags].every((tag) => serieTagNames.has(tag));
    });
  }, [safeResults, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  return (
    <main className="page search-page">
      <h1>Recherche AniList</h1>

      <form className="search-bar" onSubmit={handleSubmit}>
        <input
          className="input"
          type="text"
          placeholder="Ex : Frieren, Solo Leveling, One Piece…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn-primary" type="submit" disabled={loading || query.trim().length < 2}>
          {loading ? '…' : 'Rechercher'}
        </button>
      </form>

      {error && <p className="error-text center">{error}</p>}
      {loading && <p className="muted center">Chargement…</p>}

      {!loading && availableTags.length > 0 && (
        <div className="tag-filter-bar">
          {availableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`genre-tag tag-filter-chip ${selectedTags.has(tag) ? 'tag-filter-chip-active' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
          {selectedTags.size > 0 && (
            <button type="button" className="btn-ghost" onClick={() => setSelectedTags(new Set())}>
              Effacer les filtres
            </button>
          )}
        </div>
      )}

      {!loading && filteredResults.length > 0 && (
        <div className="search-grid">
          {filteredResults.map((serie) => {
            const isSubscribed = subscribedAnilistIds.has(serie.anilistId);
            const isSubscribing = subscribingId === serie.anilistId;
            const displayedEpisodes = serie.episodeCount ?? null;
            const genres = Array.isArray(serie.genres) ? serie.genres : [];

            return (
              <article key={serie.anilistId} className="anime-card">
                <img
                  className="anime-cover"
                  src={serie.coverImage || PLACEHOLDER}
                  alt={serie.canonicalTitle}
                  loading="lazy"
                />

                <div className="anime-body">
                  <h3 className="anime-title" title={serie.canonicalTitle}>
                    {serie.canonicalTitle}
                  </h3>

                  <div className="anime-badges">
                    {serie.status && (
                      <span className={`badge ${statusBadgeClass(serie.status)}`}>
                        {STATUS_LABELS[serie.status] ?? serie.status}
                      </span>
                    )}

                    {serie.format && <span className="badge badge-inactive">{serie.format}</span>}
                  </div>

                  <p className="anime-meta">
                    {displayedEpisodes ? `${displayedEpisodes} ép.` : 'Ép. inconnu'} · AniList #{serie.anilistId}
                  </p>

                  {genres.length > 0 && (
                    <div className="anime-genres">
                      {genres.slice(0, 3).map((genre) => (
                        <span key={genre} className="genre-tag">
                          {genre}
                        </span>
                      ))}
                      {genres.length > 3 && <span className="genre-tag">+{genres.length - 3}</span>}
                    </div>
                  )}

                  {(serie.tags ?? []).filter((t) => !t.isAdult).length > 0 && (
                    <div className="anime-genres">
                      {(serie.tags ?? [])
                        .filter((t) => !t.isAdult)
                        .slice(0, 4)
                        .map((tag) => (
                          <span key={tag.id} className="genre-tag tag-chip">
                            {tag.name}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                <div className="anime-actions">
                  <button
                    className="btn-primary btn-sub"
                    type="button"
                    disabled={isSubscribed || isSubscribing}
                    onClick={() => void handleSubscribe(serie)}
                  >
                    {isSubscribing ? '…' : isSubscribed ? '✓ Abonné' : "+ S'abonner"}
                  </button>

                  <button
                    className="btn-ghost btn-detail"
                    type="button"
                    onClick={() => setDetailSerie(serie)}
                    aria-label={`Voir les détails de ${serie.canonicalTitle}`}
                  >
                    ℹ️
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && hasSearched && safeResults.length === 0 && !error && (
        <div className="empty-state">Aucun résultat pour « {query.trim()} ».</div>
      )}

      {!loading && hasSearched && safeResults.length > 0 && filteredResults.length === 0 && (
        <div className="empty-state">Aucun résultat ne correspond aux tags sélectionnés.</div>
      )}

      {!hasSearched && !loading && <div className="empty-state">Tape un titre d'animé pour lancer la recherche.</div>}

      {pageInfo && pageInfo.lastPage > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            type="button"
            disabled={pageInfo.currentPage <= 1 || loading}
            onClick={() => goToPage(pageInfo.currentPage - 1)}
          >
            ← Précédent
          </button>

          <span className="page-info">
            Page {pageInfo.currentPage} / {pageInfo.lastPage} ({pageInfo.total} résultats)
          </span>

          <button
            className="page-btn"
            type="button"
            disabled={!pageInfo.hasNextPage || loading}
            onClick={() => goToPage(pageInfo.currentPage + 1)}
          >
            Suivant →
          </button>
        </div>
      )}

      {detailSerie && (
        <div className="modal-overlay" onClick={() => setDetailSerie(null)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{detailSerie.canonicalTitle}</h2>

            <div className="modal-row">
              <span className="modal-label">AniList ID</span>
              <span>#{detailSerie.anilistId}</span>
            </div>

            <div className="modal-row">
              <span className="modal-label">Statut</span>
              <span>{STATUS_LABELS[detailSerie.status ?? ''] ?? detailSerie.status ?? '—'}</span>
            </div>

            <div className="modal-row">
              <span className="modal-label">Format</span>
              <span>{detailSerie.format ?? '—'}</span>
            </div>

            <div className="modal-row">
              <span className="modal-label">Épisodes</span>
              <span>{detailSerie.episodeCount ?? '—'}</span>
            </div>

            <div className="modal-row">
              <span className="modal-label">Genres</span>
              <span>{Array.isArray(detailSerie.genres) && detailSerie.genres.length > 0 ? detailSerie.genres.join(', ') : '—'}</span>
            </div>

            <div className="modal-row">
              <span className="modal-label">Tags</span>
              <span>
                {(detailSerie.tags ?? []).filter((t) => !t.isAdult).length > 0
                  ? (detailSerie.tags ?? []).filter((t) => !t.isAdult).map((t) => t.name).join(', ')
                  : '—'}
              </span>
            </div>

            <button className="btn-primary modal-close" type="button" onClick={() => setDetailSerie(null)}>
              Fermer
            </button>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.ok ? 'toast-success' : 'toast-error'}`}>{toast.msg}</div>}
    </main>
  );
}
