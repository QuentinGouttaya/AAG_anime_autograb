import { Fragment, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteSubscription, getSubscriptions } from '../api/subscriptions';
import type { SubscriptionWithSerie } from '../types';
import { EpisodePanel } from './composants/EpisodePanel';

type SortKey = 'createdAt' | 'minSeeders' | 'seriesTitle' | 'episodeCount';

export function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [resolutionFilter, setResolutionFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // 1. Pass all state to the backend via the query function
  const { data, isPending, error } = useQuery({
    queryKey: ['subscriptions', statusFilter, resolutionFilter, search, sortKey, sortDir],
    queryFn: () =>
      getSubscriptions({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        resolution: resolutionFilter !== 'all' ? resolutionFilter : undefined,
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
          placeholder="Search by title, AniList ID..."
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
          <option value="1080p">1080p</option>
          <option value="720p">720p</option>
          <option value="2160p">2160p</option>
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
          {subscriptions.map((s) => (
            <Fragment key={s.id}>
              <tr>
                <td>{s.serie?.canonicalTitle ?? `Serie #${s.seriesId}`}</td>
                <td>{Array.isArray(s.preferredFansub) && s.preferredFansub.length > 0 ? s.preferredFansub.join(', ') : '—'}</td>
                <td>{s.preferredResolution}</td>
                <td>{s.minSeeders}</td>
                {/* Note: Ensure your backend GET /subscriptions returns episodeCount, otherwise display '—' */}
                <td>{s.episodeCount ?? '—'}</td>
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
                    <EpisodePanel subscription={s} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>

      {subscriptions.length === 0 && <p className="empty-state">No subscriptions match your filters.</p>}
    </main>
  );
}
