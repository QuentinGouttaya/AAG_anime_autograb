// src/pages/SubscriptionsPage.tsx
// Filtrage et tri 100% backend : chaque changement d'état relance la requête
// avec les query params ; aucun filter/sort côté client.
import { Fragment, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteSubscription, getSubscriptions, type SubscriptionSortKey } from '../api/subscriptions';
import { EpisodePanel } from './composants/EpisodePanel';

const SORT_OPTIONS: { key: SubscriptionSortKey; label: string }[] = [
  { key: 'createdAt', label: 'Ajout' },
  { key: 'title', label: 'Titre' },
  { key: 'episodeCount', label: 'Épisodes' },
];

const STATUS_LABELS: Record<string, string> = {
  RELEASING: 'En diffusion',
  FINISHED: 'Terminé',
  NOT_YET_RELEASED: 'À venir',
};

const selectClass =
  'rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-accent';

export function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [genre, setGenre] = useState('all');
  const [animeStatus, setAnimeStatus] = useState('all');
  const [format, setFormat] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SubscriptionSortKey>('createdAt');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ['subscriptions', status, genre, animeStatus, format, search, sort, direction],
    queryFn: () =>
      getSubscriptions({
        status: status !== 'all' ? status : undefined,
        genre: genre !== 'all' ? genre : undefined,
        animeStatus: animeStatus !== 'all' ? animeStatus : undefined,
        format: format !== 'all' ? format : undefined,
        search: search.trim() || undefined,
        sort,
        direction,
      }),
  });

  const subscriptions = data ?? [];

  const removeMutation = useMutation({
    mutationFn: deleteSubscription,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
  });

  const genreOptions = useMemo(
    () => [...new Set(subscriptions.flatMap((s) => s.serie?.genres ?? []))].sort(),
    [subscriptions],
  );
  const formatOptions = useMemo(
    () => [...new Set(subscriptions.map((s) => s.serie?.format).filter(Boolean) as string[])].sort(),
    [subscriptions],
  );

  const toggleSort = (key: SubscriptionSortKey) => {
    if (key === sort) {
      setDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(key);
      setDirection(key === 'title' ? 'asc' : 'desc');
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-9">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Abonnements</h1>
        <p className="mt-1 text-sm text-slate-400">
          {subscriptions.length} série{subscriptions.length > 1 ? 's' : ''} suivie{subscriptions.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <input
          className={`${selectClass} min-w-[200px] flex-1`}
          placeholder="Titre ou AniList ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="all">Statut : tous</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
        </select>
        <select className={selectClass} value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="all">Genre : tous</option>
          {genreOptions.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select className={selectClass} value={animeStatus} onChange={(e) => setAnimeStatus(e.target.value)}>
          <option value="all">Diffusion : toutes</option>
          <option value="RELEASING">En diffusion</option>
          <option value="FINISHED">Terminé</option>
          <option value="NOT_YET_RELEASED">À venir</option>
        </select>
        <select className={selectClass} value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="all">Format : tous</option>
          {formatOptions.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>

        <div className="ml-auto flex overflow-hidden rounded-lg border border-white/10 bg-surface">
          {SORT_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${sort === key ? 'bg-accent/15 text-accent' : 'text-slate-400 hover:text-white'
                }`}
            >
              {label}{sort === key && (direction === 'asc' ? ' ↑' : ' ↓')}
            </button>
          ))}
        </div>
      </div>

      {isPending && <p className="py-16 text-center text-slate-400">Chargement…</p>}
      {error != null && (
        <p className="py-16 text-center text-red-400">
          Le chargement a échoué. Vérifie que l'API tourne, puis réessaie.
        </p>
      )}

      {!isPending && !error && (
        <div className="flex flex-col gap-2.5">
          {subscriptions.map((s) => (
            <Fragment key={s.id}>
              <article
                className={`flex items-center gap-4 rounded-xl border bg-surface p-3.5 transition-colors ${expandedId === s.id ? 'border-accent' : 'border-white/10 hover:border-white/20'
                  }`}
              >
                <img
                  src={s.serie?.coverImage}
                  alt=""
                  loading="lazy"
                  className="h-[74px] w-[52px] shrink-0 rounded-lg bg-surface-2 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-semibold text-white">
                      {s.serie?.canonicalTitle ?? `Série #${s.seriesId}`}
                    </h2>
                    {s.serie?.status && (
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-400">
                        {STATUS_LABELS[s.serie.status] ?? s.serie.status}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3.5 gap-y-1 font-mono text-xs text-slate-400">
                    <span>#{s.serie?.anilistId}</span>
                    {s.serie?.format && <span>{s.serie.format}</span>}
                    <span>{s.episodeCount ?? 0}/{s.serie?.episodeCount ?? '?'} ép.</span>
                    <span>{s.preferredResolution}</span>
                    <span>≥{s.minSeeders} seeders</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {(s.serie?.genres ?? []).slice(0, 4).map((g) => (
                      <span key={g} className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-slate-400">{g}</span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
                    onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  >
                    {expandedId === s.id ? 'Fermer' : 'Épisodes'}
                  </button>
                  <button
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-400/10 disabled:opacity-40"
                    onClick={() => removeMutation.mutate(s.id)}
                    disabled={removeMutation.isPending}
                  >
                    Supprimer
                  </button>
                </div>
              </article>
              {expandedId === s.id && (
                <div className="-mt-2.5 rounded-b-xl border border-t-0 border-accent bg-surface p-4">
                  <EpisodePanel subscription={s} />
                </div>
              )}
            </Fragment>
          ))}

          {subscriptions.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 py-14 text-center text-slate-400">
              <h3 className="mb-1 font-semibold text-white">Aucun abonnement</h3>
              <p>Aucune série ne correspond à ces filtres.</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
