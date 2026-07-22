// src/pages/SubscriptionsPage.tsx
import { Fragment, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteSubscription, getSubscriptions } from '../api/subscriptions';
import type { SubscriptionWithSerie } from '../types';
import { EpisodePanel } from './composants/EpisodePanel';

type SortKey = 'createdAt' | 'seriesTitle' | 'episodeCount' | 'genre';

export function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [animeStatusFilter, setAnimeStatusFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ['subscriptions', statusFilter, genreFilter, animeStatusFilter, formatFilter, search, sortKey, sortDir],
    queryFn: () =>
      getSubscriptions({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        genre: genreFilter !== 'all' ? genreFilter : undefined,
        animeStatus: animeStatusFilter !== 'all' ? animeStatusFilter : undefined,
        format: formatFilter !== 'all' ? formatFilter : undefined,
        search: search.trim() || undefined,
        sortBy: sortKey,
        sortOrder: sortDir,
      }),
  });

  const subscriptions = useMemo<SubscriptionWithSerie[]>(() => (Array.isArray(data) ? data : []), [data]);

  const removeMutation = useMutation({
    mutationFn: deleteSubscription,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  const availableGenres = useMemo(() => {
    const genres = new Set<string>();
    for (const sub of subscriptions) {
      for (const genre of sub.serie?.genres ?? []) {
        genres.add(genre);
      }
    }
    return [...genres].sort();
  }, [subscriptions]);

  const availableFormats = useMemo(() => {
    const formats = new Set<string>();
    for (const sub of subscriptions) {
      if (sub.serie?.format) {
        formats.add(sub.serie.format);
      }
    }
    return [...formats].sort();
  }, [subscriptions]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir(key === 'seriesTitle' ? 'asc' : 'desc');
  };

  if (isPending) return <main className="page"><div className="loading-spinner">Chargement des abonnements...</div></main>;
  if (error) return <main className="page"><p className="error-text center">Erreur lors du chargement des abonnements.</p></main>;

  return (
    <main className="page">
      <div className="page-header">
        <h1>Mes Abonnements</h1>
        <p className="page-subtitle">Gère tes séries et suis tes épisodes</p>
      </div>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Rechercher par titre ou AniList ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
          <option value="all">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
        </select>

        <select className="input" value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)}>
          <option value="all">Tous les genres</option>
          {availableGenres.map((genre) => (
            <option key={genre} value={genre}>{genre}</option>
          ))}
        </select>

        <select className="input" value={animeStatusFilter} onChange={(e) => setAnimeStatusFilter(e.target.value)}>
          <option value="all">Tous les statuts d'anime</option>
          <option value="RELEASING">En diffusion</option>
          <option value="FINISHED">Terminé</option>
          <option value="NOT_YET_RELEASED">À venir</option>
        </select>

        <select className="input" value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)}>
          <option value="all">Tous les formats</option>
          {availableFormats.map((format) => (
            <option key={format} value={format}>{format}</option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table className="sub-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort('seriesTitle')} className={`sortable ${sortKey === 'seriesTitle' ? sortDir : ''}`}>
                Série
              </th>
              <th>Genres</th>
              <th>Statut</th>
              <th>Format</th>
              <th onClick={() => toggleSort('episodeCount')} className={`sortable ${sortKey === 'episodeCount' ? sortDir : ''}`}>
                Épisodes
              </th>
              <th onClick={() => toggleSort('createdAt')} className={`sortable ${sortKey === 'createdAt' ? sortDir : ''}`}>
                Créé le
              </th>
              <th />
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((s) => (
              <Fragment key={s.id}>
                <tr>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={s.serie?.coverImage}
                        alt={s.serie?.canonicalTitle}
                        style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
                      />
                      <div>
                        <strong>{s.serie?.canonicalTitle ?? `Série #${s.seriesId}`}</strong>
                        <div className="muted" style={{ fontSize: '0.85rem' }}>AniList #{s.serie?.anilistId}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {(s.serie?.genres ?? []).slice(0, 2).map((genre) => (
                        <span key={genre} className="genre-tag">{genre}</span>
                      ))}
                      {(s.serie?.genres ?? []).length > 2 && (
                        <span className="genre-tag more">+{(s.serie?.genres ?? []).length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {s.serie?.status && (
                      <span className={`status-badge status-${s.serie.status.toLowerCase().replace('_', '-')}`}>
                        {s.serie.status}
                      </span>
                    )}
                  </td>
                  <td>{s.serie?.format ?? '—'}</td>
                  <td>
                    <strong>{s.episodeCount ?? 0}</strong>
                    <span className="muted"> / {s.serie?.episodeCount ?? '?'}</span>
                  </td>
                  <td>{new Date(s.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="row-actions">
                    <button
                      className={`btn-primary btn-sm ${expandedId === s.id ? 'btn-subscribed' : ''}`}
                      onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    >
                      {expandedId === s.id ? '✓ Fermer' : '📺 Épisodes'}
                    </button>
                    <button
                      className="btn-danger btn-sm"
                      onClick={() => removeMutation.mutate(s.id)}
                      disabled={removeMutation.isPending}
                    >
                      {removeMutation.isPending ? '⏳' : '🗑️'}
                    </button>
                  </td>
                </tr>
                {expandedId === s.id && (
                  <tr>
                    <td colSpan={7}>
                      <EpisodePanel subscription={s} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {subscriptions.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Aucun abonnement</h3>
          <p>Tu n'as pas encore d'abonnements ou aucun ne correspond à tes filtres.</p>
        </div>
      )}
    </main>
  );
}
