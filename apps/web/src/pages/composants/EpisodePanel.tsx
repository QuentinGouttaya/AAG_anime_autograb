import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEpisodesBySerieId, grabEpisode, resolveDownloadLink } from '../../api/episodes';
import type { SubscriptionWithSerie } from '../../types';

const inputClass =
  'rounded-lg border border-white/10 bg-surface-2 px-3 py-2 text-sm text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-accent';

export function EpisodePanel({ subscription }: { subscription: SubscriptionWithSerie }) {
  const queryClient = useQueryClient();
  const [magnet, setMagnet] = useState('');
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number | null>(null);

  const { data: episodesData, isLoading } = useQuery({
    queryKey: ['episodes', subscription.seriesId],
    queryFn: () => getEpisodesBySerieId(subscription.seriesId),
  });

  const seriesEpisodes = useMemo(
    () => (episodesData ?? []).slice().sort((a, b) => a.episodeNumber - b.episodeNumber),
    [episodesData],
  );

  const grabMutation = useMutation({
    mutationFn: (epId: number) => grabEpisode(subscription.id, epId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['episodes', subscription.seriesId] }),
  });

  const resolveMutation = useMutation({
    mutationFn: () => resolveDownloadLink(subscription.id, selectedEpisodeId as number, magnet.trim()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['episodes', subscription.seriesId] });
      setMagnet('');
    },
  });

  const isGrabbed = (status?: string) =>
    status === 'found' || status === 'added' || status === 'ready' || status === 'grabbed';

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap gap-2">
        <select
          className={`${inputClass} flex-1 basis-[200px]`}
          value={selectedEpisodeId ?? ''}
          onChange={(e) => setSelectedEpisodeId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Épisode à résoudre manuellement…</option>
          {seriesEpisodes.map((ep) => (
            <option key={ep.id} value={ep.id}>Épisode {ep.episodeNumber}</option>
          ))}
        </select>
        <input
          className={`${inputClass} flex-[2] basis-[240px]`}
          placeholder="Magnet ou URL torrent"
          value={magnet}
          onChange={(e) => setMagnet(e.target.value)}
        />
        <button
          className="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-slate-200 hover:border-accent hover:text-accent disabled:opacity-40"
          disabled={!selectedEpisodeId || !magnet.trim() || resolveMutation.isPending}
          onClick={() => resolveMutation.mutate()}
        >
          {resolveMutation.isPending ? 'Résolution…' : 'Résoudre le lien'}
        </button>
      </div>

      {isLoading && <p className="text-center text-sm text-slate-400">Chargement des épisodes…</p>}

      <div className="flex flex-col gap-1.5">
        {seriesEpisodes.map((ep) => (
          <div
            key={ep.id}
            className={`flex items-center gap-3.5 rounded-lg border px-3 py-2 ${selectedEpisodeId === ep.id ? 'border-accent' : 'border-transparent bg-surface-2'
              }`}
          >
            <div className="flex min-w-[90px] flex-col">
              <strong className="text-sm text-white">
                Ép. <span className="font-mono">{String(ep.episodeNumber).padStart(2, '0')}</span>
              </strong>
              <span className="font-mono text-xs text-slate-400">
                {ep.airedAt ? new Date(ep.airedAt).toLocaleDateString('fr-FR') : '—'}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-xs ${isGrabbed(ep.status) ? 'bg-emerald-400/15 text-emerald-400' : 'bg-surface text-slate-400'
                  }`}
              >
                {ep.status ?? 'pending'}
              </span>
              {ep.torrentTitle && (
                <span className="truncate font-mono text-xs text-slate-400" title={ep.torrentTitle}>
                  {ep.torrentTitle}
                </span>
              )}
            </div>
            <button
              className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40"
              disabled={grabMutation.isPending || isGrabbed(ep.status)}
              onClick={() => {
                setSelectedEpisodeId(ep.id);
                grabMutation.mutate(ep.id);
              }}
            >
              {isGrabbed(ep.status) ? 'Récupéré' : 'Grab'}
            </button>
          </div>
        ))}
        {seriesEpisodes.length === 0 && !isLoading && (
          <p className="text-center text-sm text-slate-400">Aucun épisode pour cette série.</p>
        )}
      </div>

      {grabMutation.isError && (
        <p className="text-sm text-red-400">
          Grab impossible : {(grabMutation.error as Error)?.message ?? 'erreur inconnue'}.
        </p>
      )}
      {resolveMutation.isSuccess && (
        <p className="text-sm text-emerald-400">Lien résolu — statut : {resolveMutation.data.status}</p>
      )}
      {resolveMutation.isError && (
        <p className="text-sm text-red-400">La résolution du lien a échoué. Vérifie le magnet.</p>
      )}
    </div>
  );
}
