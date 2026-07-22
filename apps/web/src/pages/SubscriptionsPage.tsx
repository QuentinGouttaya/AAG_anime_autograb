import { Fragment, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteSubscription, getSubscriptions } from '../api/subscriptions';
import { getEpisodes, resolveDownloadLink, grabEpisode } from '../api/episodes';
import type { Episode, SubscriptionWithSerie } from '../types';

type SortKey = 'createdAt' | 'minSeeders' | 'seriesTitle' | 'episodeCount';

function compareText(a: string, b: string, dir: 'asc' | 'desc') {
  return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }) * (dir === 'asc' ? 1 : -1);
}

function compareNumber(a: number, b: number, dir: 'asc' | 'desc') {
  return (a - b) * (dir === 'asc' ? 1 : -1);
}

export function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [resolutionFilter, setResolutionFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: getSubscriptions,
  });

  const { data: episodesData } = useQuery({
    queryKey: ['episodes'],
    queryFn: getEpisodes,
  });

  const subscriptions = useMemo<SubscriptionWithSerie[]>(() => (Array.isArray(data) ? data : []), [data]);
  const episodes = useMemo<Episode[]>(() => (Array.isArray(episodesData) ? episodesData : []), [episodesData]);

  const episodeCountBySeries = useMemo(() => {
    const counts = new Map<number, number>();
    for (const episode of episodes) {
      counts.set(episode.serieId, (counts.get(episode.serieId) ?? 0) + 1);
    }
    return counts;
  }, [episodes]);

  const removeMutation = useMutation({
    mutationFn: deleteSubscription,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  const resolutions = useMemo(
    () => Array.from(new Set(subscriptions.map((s) => s.preferredResolution).filter(Boolean))).sort(),
    [subscriptions],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return subscriptions
      .filter((s) => {
        if (statusFilter !== 'all' && (statusFilter === 'active') !== s.active) {
          return false;
        }
        if (resolutionFilter !== 'all' && s.preferredResolution !== resolutionFilter) {
          return false;
        }
        if (!q) {
          return true;
        }

        const title = s.serie?.canonicalTitle ?? `Serie #${s.seriesId}`;
        const fansubs = Array.isArray(s.preferredFansub) ? s.preferredFansub : [];

        return (
          title.toLowerCase().includes(q) ||
          String(s.seriesId).includes(q) ||
          String(s.serie?.anilistId ?? '').includes(q) ||
          fansubs.some((f) => f.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortKey === 'createdAt') {
          return compareNumber(new Date(a.createdAt).getTime(), new Date(b.createdAt).getTime(), sortDir);
        }
        if (sortKey === 'minSeeders') {
          return compareNumber(a.minSeeders, b.minSeeders, sortDir);
        }
        if (sortKey === 'episodeCount') {
          return compareNumber(
            episodeCountBySeries.get(a.seriesId) ?? 0,
            episodeCountBySeries.get(b.seriesId) ?? 0,
            sortDir,
          );
        }
        return compareText(a.serie?.canonicalTitle ?? `Serie #${a.seriesId}`, b.serie?.canonicalTitle ?? `Serie #${b.seriesId}`, sortDir);
      });
  }, [subscriptions, statusFilter, resolutionFilter, search, sortKey, sortDir, episodeCountBySeries]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir(key === 'seriesTitle' ? 'asc' : 'desc');
  };

  if (isPending) return <main className="page"><p>Loading subscriptions...</p></main>;
  if (error) return <main className="page"><p>Failed to load subscriptions.</p></main>;

  return (
    <main className="page">
      <h1>Subscriptions</h1>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Search by title, AniList ID, series ID or fansub..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select className="input" value={resolutionFilter} onChange={(e) => setResolutionFilter(e.target.value)}>
          <option value="all">All resolutions</option>
          {resolutions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <table className="sub-table">
        <thead>
          <tr>
            <th onClick={() => toggleSort('seriesTitle')} className="sortable">
              Series {sortKey === 'seriesTitle' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th>Fansub</th>
            <th>Resolution</th>
            <th onClick={() => toggleSort('minSeeders')} className="sortable">
              Min seeders {sortKey === 'minSeeders' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => toggleSort('episodeCount')} className="sortable">
              Episodes {sortKey === 'episodeCount' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th>Status</th>
            <th onClick={() => toggleSort('createdAt')} className="sortable">
              Created {sortKey === 'createdAt' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => (
            <Fragment key={s.id}>
              <tr>
                <td>{s.serie?.canonicalTitle ?? `Serie #${s.seriesId}`}</td>
                <td>{Array.isArray(s.preferredFansub) && s.preferredFansub.length > 0 ? s.preferredFansub.join(', ') : '—'}</td>
                <td>{s.preferredResolution}</td>
                <td>{s.minSeeders}</td>
                <td>{episodeCountBySeries.get(s.seriesId) ?? 0}</td>
                <td>
                  <span className={`badge ${s.active ? 'badge-active' : 'badge-inactive'}`}>
                    {s.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                <td className="row-actions">
                  <button className="btn-primary" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                    {expandedId === s.id ? 'Close' : 'Episodes'}
                  </button>
                  <button className="btn-danger" onClick={() => removeMutation.mutate(s.id)} disabled={removeMutation.isPending}>
                    Unsubscribe
                  </button>
                </td>
              </tr>
              {expandedId === s.id && (
                <tr>
                  <td colSpan={8}>
                    <EpisodePanel subscription={s} allEpisodes={episodes} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && <p className="empty-state">No subscriptions match your filters.</p>}
    </main>
  );
}

function EpisodePanel({ subscription, allEpisodes }: { subscription: SubscriptionWithSerie; allEpisodes: Episode[] }) {
  const queryClient = useQueryClient();
  const [episodeId, setEpisodeId] = useState<number | null>(null);
  const [magnet, setMagnet] = useState('');

  const seriesEpisodes = useMemo(
    () =>
      allEpisodes
        .filter((e) => e.serieId === subscription.seriesId)
        .sort((a, b) => a.episodeNumber - b.episodeNumber),
    [allEpisodes, subscription.seriesId],
  );

  const selectedEpisode = useMemo(
    () => seriesEpisodes.find((e) => e.id === episodeId) ?? null,
    [seriesEpisodes, episodeId],
  );

  const grabMutation = useMutation({
    mutationFn: () => grabEpisode(subscription.id, episodeId as number),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['episodes'] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: () => resolveDownloadLink(subscription.id, episodeId as number, magnet.trim()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['episodes'] });
    },
  });

  return (
    <div className="resolve-panel">
      <select
        className="input"
        value={episodeId ?? ''}
        onChange={(e) => setEpisodeId(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">Select episode...</option>
        {seriesEpisodes.map((ep) => (
          <option key={ep.id} value={ep.id}>
            Episode {ep.episodeNumber}{ep.airedAt ? ` · ${new Date(ep.airedAt).toLocaleDateString()}` : ''}
          </option>
        ))}
      </select>

      <button className="btn-primary" disabled={!episodeId || grabMutation.isPending} onClick={() => grabMutation.mutate()}>
        {grabMutation.isPending ? '🧲 Grabbing...' : '🧲 Grab'}
      </button>

      <span className="muted">or manual:</span>

      <input
        className="input"
        placeholder="Magnet or torrent URL"
        value={magnet}
        onChange={(e) => setMagnet(e.target.value)}
      />

      <button
        className="btn-ghost"
        disabled={!episodeId || !magnet.trim() || resolveMutation.isPending}
        onClick={() => resolveMutation.mutate()}
      >
        {resolveMutation.isPending ? 'Resolving...' : 'Resolve link'}
      </button>

      {selectedEpisode && (
        <span className="badge badge-inactive">
          Selected: {subscription.serie?.canonicalTitle ?? `Serie #${subscription.seriesId}`} · Episode {selectedEpisode.episodeNumber}
        </span>
      )}

      {grabMutation.isSuccess && (
        <span className="badge badge-active">
          ✓ {grabMutation.data.torrent.title} ({grabMutation.data.torrent.seeders} seeders)
        </span>
      )}
      {grabMutation.isError && (
        <span className="badge badge-inactive">
          Grab failed: {(grabMutation.error as Error)?.message ?? 'Unknown error'}
        </span>
      )}

      {resolveMutation.isSuccess && <span className="badge badge-active">Status: {resolveMutation.data.status}</span>}
      {resolveMutation.isError && <span className="badge badge-inactive">Failed to resolve link.</span>}

      {seriesEpisodes.length === 0 && <p className="empty-state">No episodes found for this series yet.</p>}
    </div>
  );
}
