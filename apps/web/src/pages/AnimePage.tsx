import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getAnimeById } from '../api/animes';
import { AppLayout } from '../layouts/AppLayout';

export function AnimePage() {
  const { id } = useParams();
  const { data, isPending, error } = useQuery({
    queryKey: ['anime', id],
    queryFn: () => getAnimeById(id ?? ''),
    enabled: Boolean(id),
  });

  return (
    <AppLayout>
      <main className="page">
        {isPending && <div className="empty-state">Loading anime...</div>}
        {error && <div className="empty-state">Failed to load anime.</div>}
        {data && (
          <section className="card stack">
            <header className="page-header">
              <div>
                <h1 className="page-title">{data.title}</h1>
                <p className="page-subtitle">Anime details.</p>
              </div>
            </header>

            <div className="meta-row">
              <span className="badge">{data.episodesCount ?? '?'} episodes</span>
              <span className="badge">{data.isAdult ? 'Adult' : 'Safe'}</span>
              {data.genres.map((genre) => (
                <span key={genre.id} className="badge">
                  {genre.name}
                </span>
              ))}
            </div>

            <p className="card-text">{data.synopsis ?? 'No synopsis available.'}</p>
          </section>
        )}
      </main>
    </AppLayout>
  );
}

