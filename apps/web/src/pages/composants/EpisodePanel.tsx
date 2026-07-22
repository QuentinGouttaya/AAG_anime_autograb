import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEpisodesBySerieId, grabEpisode, resolveDownloadLink } from '../../api/episodes';
import type { SubscriptionWithSerie } from '../../types';

export function EpisodePanel({ subscription }: { subscription: SubscriptionWithSerie }) {
  const queryClient = useQueryClient();
  const [magnet, setMagnet] = useState('');
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number | null>(null);

  // FIX: Fetch episodes ONLY for this specific series!
  const { data: episodesData, isLoading } = useQuery({
    queryKey: ['episodes', subscription.seriesId],
    queryFn: () => getEpisodesBySerieId(subscription.seriesId),
  });

  const seriesEpisodes = useMemo(
    () => (Array.isArray(episodesData) ? episodesData : []).sort((a, b) => a.episodeNumber - b.episodeNumber),
    [episodesData]
  );

  const grabMutation = useMutation({
    // Pass variables to avoid race conditions with state
    mutationFn: (epId: number) => grabEpisode(subscription.id, epId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['episodes', subscription.seriesId] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: () => resolveDownloadLink(subscription.id, selectedEpisodeId as number, magnet.trim()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['episodes', subscription.seriesId] });
      setMagnet('');
    },
  });

  return (
    <div className="resolve-panel">
      {isLoading && <p className="muted center">Chargement des épisodes...</p>}

      {/* Manual Resolve Section */}
      <div className="manual-resolve" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <select
          className="input"
          value={selectedEpisodeId ?? ''}
          onChange={(e) => setSelectedEpisodeId(e.target.value ? Number(e.target.value) : null)}
          style={{ flex: 1 }}
        >
          <option value="">Select episode for manual resolve...</option>
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
          style={{ flex: 2 }}
        />

        <button
          className="btn-ghost"
          disabled={!selectedEpisodeId || !magnet.trim() || resolveMutation.isPending}
          onClick={() => resolveMutation.mutate()}
        >
          {resolveMutation.isPending ? 'Resolving...' : 'Resolve link'}
        </button>
      </div>

      {/* Detailed Episodes Grid */}
      <div className="episodes-grid">
        {seriesEpisodes.map((ep) => (
          <div key={ep.id} className={`episode-row ${selectedEpisodeId === ep.id ? 'selected' : ''}`}>
            <div className="ep-info">
              <strong>Épisode {ep.episodeNumber}</strong>
              <span className="muted">{ep.airedAt ? new Date(ep.airedAt).toLocaleDateString() : 'Date inconnue'}</span>
            </div>

            <div className="ep-details">
              {/* Assuming your Episode type has 'status' and 'torrentTitle' */}
              <span className={`badge badge-${(ep.status === 'added' || ep.status === 'ready') ? 'active' : 'inactive'}`}>                {ep.status || 'pending'}
              </span>
              {ep.torrentTitle && <span className="muted ep-torrent" title={ep.torrentTitle}>{ep.torrentTitle}</span>}
            </div>

            <div className="ep-actions">
              <button
                className="btn-primary btn-sm"
                disabled={grabMutation.isPending || ep.status === 'grabbed'}
                onClick={() => {
                  setSelectedEpisodeId(ep.id);
                  grabMutation.mutate(ep.id);
                }}
              >
                {ep.status === 'grabbed' ? '✓ Grabbed' : '🧲 Grab'}
              </button>
            </div>
          </div>
        ))}
        {seriesEpisodes.length === 0 && !isLoading && <p className="empty-state">Aucun épisode trouvé pour cette série.</p>}
      </div>

      {grabMutation.isError && (
        <span className="badge badge-inactive error-msg" style={{ marginTop: '1rem', display: 'block' }}>
          Grab failed: {(grabMutation.error as Error)?.message ?? 'Unknown error'}
        </span>
      )}
      {resolveMutation.isSuccess && <span className="badge badge-active" style={{ marginTop: '1rem', display: 'block' }}>Status: {resolveMutation.data.status}</span>}
      {resolveMutation.isError && <span className="badge badge-inactive" style={{ marginTop: '1rem', display: 'block' }}>Failed to resolve link.</span>}
    </div>
  );
}
