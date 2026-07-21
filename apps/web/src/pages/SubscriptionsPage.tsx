import { Fragment, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSubscriptions, unsubscribe } from '../api/subscriptions';
import { getEpisodes, resolveDownloadLink } from '../api/episodes';
import type { Subscription } from '../types';

type SortKey = 'createdAt' | 'minSeeders' | 'seriesId';

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

  const removeMutation = useMutation({
    mutationFn: unsubscribe,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  const resolutions = useMemo(
    () => Array.from(new Set((data ?? []).map((s) => s.preferredResolution))),
    [data],
  );

  const filtered = useMemo(() => {
    let rows = data ?? [];

    if (statusFilter !== 'all') {
      rows = rows.filter((s) => (statusFilter === 'active' ? s.active : !s.active));
    }
    if (resolutionFilter !== 'all') {
      rows = rows.filter((s) => s.preferredResolution === resolutionFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (s) =>
          String(s.seriesId).includes(q) ||
          s.preferredFansub.some((f) => f.toLowerCase().includes(q)),
      );
    }

    return [...rows].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'createdAt') {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      }
      return (a[sortKey] - b[sortKey]) * dir;
    });
  }, [data, statusFilter, resolutionFilter, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  if (isPending) return <main className="page"><p>Loading subscriptions...</p></main>;
  if (error) return <main className="page"><p>Failed to load subscriptions.</p></main>;

  return (
    <main className="page">
      <h1>Subscriptions</h1>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Search series id or fansub..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          className="input"
          value={resolutionFilter}
          onChange={(e) => setResolutionFilter(e.target.value)}
        >
          <option value="all">All resolutions</option>
          {resolutions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <table className="sub-table">
        <thead>
          <tr>
            <th onClick={() => toggleSort('seriesId')} className="sortable">
              Series {sortKey === 'seriesId' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th>Fansub</th>
            <th>Resolution</th>
            <th onClick={() => toggleSort('minSeeders')} className="sortable">
              Min seeders {sortKey === 'minSeeders' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th>Status</th>
            <th onClick={() => toggleSort('createdAt')} className="sortable">
              Created {sortKey === 'createdAt' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          {filtered.map((s: Subscription) => (
            <Fragment key={s.id}>
              <tr>
                <td>#{s.seriesId}</td>
                <td>{s.preferredFansub.join(', ') || '—'}</td>
                <td>{s.preferredResolution}</td>
                <td>{s.minSeeders}</td>
                <td>
                  <span className={`badge ${s.active ? 'badge-active' : 'badge-inactive'}`}>
                    {s.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                <td className="row-actions">
                  <button
                    className="btn-primary"
                    onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  >
                    {expandedId === s.id ? 'Close' : 'Prepare link'}
                  </button>
                  <button className="btn-danger" onClick={() => removeMutation.mutate(s.id)}>
                    Unsubscribe
                  </button>
                </td>
              </tr>
              {expandedId === s.id && (
                <tr key={`${s.id}-resolve`}>
                  <td colSpan={7}>
                    <ResolveLinkPanel subscription={s} />
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

function ResolveLinkPanel({ subscription }: { subscription: Subscription }) {
  const [episodeId, setEpisodeId] = useState<number | null>(null);
  const [magnet, setMagnet] = useState('');

  const { data: episodes, isPending, error } = useQuery({
    queryKey: ['episodes'],
    queryFn: getEpisodes,
  });

  const seriesEpisodes = useMemo(
    () => (episodes ?? []).filter((e) => e.serieId === subscription.seriesId),
    [episodes, subscription.seriesId],
  );

  const resolveMutation = useMutation({
    mutationFn: () =>
      resolveDownloadLink(subscription.id, episodeId as number, magnet.trim()),
  });

  if (isPending) return <p>Loading episodes...</p>;
  if (error) return <p>Failed to load episodes.</p>;

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
            Episode {ep.episodeNumber}
          </option>
        ))}
      </select>

      <input
        className="input"
        placeholder="Magnet or torrent URL"
        value={magnet}
        onChange={(e) => setMagnet(e.target.value)}
      />

      <button
        className="btn-primary"
        disabled={!episodeId || !magnet.trim() || resolveMutation.isPending}
        onClick={() => resolveMutation.mutate()}
      >
        {resolveMutation.isPending ? 'Resolving...' : 'Resolve link'}
      </button>

      {resolveMutation.isSuccess && (
        <span className="badge badge-active">Status: {resolveMutation.data.status}</span>
      )}
      {resolveMutation.isError && (
        <span className="badge badge-inactive">Failed to resolve link.</span>
      )}

      {seriesEpisodes.length === 0 && <p className="empty-state">No episodes found for this series yet.</p>}
    </div>
  );
}
