import type { Episode } from '../../models/episode.js';
import type {
  EpisodeStatus,
  SubscriptionEpisode,
} from '../../models/subscription_episode.js';
import type { EpisodeRepository } from '../../repositories/episode.repository.js';
import type { SubscriptionEpisodeRepository } from '../../repositories/subscription_episode.repository.js';
import type { SubscriptionRepository } from '../../repositories/subscription.repository.js';
import type { SerieRepository } from '../../repositories/serie.repository.js';
import type { DebridProvider } from '../debrid/debrid.service.js';
import type { TorrentIndexer, Torrent } from '../torrents/torrent.service.js';
import {
  EpisodeLinkUnavailableError,
  EpisodeNotFoundError,
} from './error.js';
import type { CreatePendingEpisodeInput } from './types.js';

// ── Résultat du grab ──
export interface GrabResult {
  subscriptionEpisode: SubscriptionEpisode;
  torrent: Torrent;
  links: { path: string; size: number; link: string }[];
}

export class EpisodeService {
  constructor(
    private readonly episodeRepository: EpisodeRepository,
    private readonly subscriptionEpisodeRepository: SubscriptionEpisodeRepository,
    private readonly subscriptionRepository: SubscriptionRepository,   // ← AJOUTÉ
    private readonly serieRepository: SerieRepository,                 // ← AJOUTÉ
    private readonly torrentIndexer: TorrentIndexer,                   // ← AJOUTÉ
    private readonly debridProvider: DebridProvider,
  ) { }

  // ── Existant ──

  async list(): Promise<Episode[]> {
    return this.episodeRepository.findAll();
  }

  async getDetails(id: number): Promise<Episode | null> {
    return this.episodeRepository.findById(id);
  }

  async listAvailableFiles(): Promise<SubscriptionEpisode[]> {
    return this.subscriptionEpisodeRepository.findByStatus('found');
  }

  async createPending(
    input: CreatePendingEpisodeInput,
  ): Promise<SubscriptionEpisode> {
    return this.subscriptionEpisodeRepository.upsert({
      subscriptionId: input.subscriptionId,
      episodeId: input.episodeId,
      status: 'pending',
      grabbedAt: null,
    });
  }

  async resolveDownloadLink(
    subscriptionId: number,
    episodeId: number,
    magnetOrTorrentUrl: string,
  ): Promise<SubscriptionEpisode> {
    const links = await this.debridProvider.getDirectDownloadLink(
      magnetOrTorrentUrl,
    );

    if (links.length === 0) {
      await this.updateStatus(subscriptionId, episodeId, 'failed');
      throw new EpisodeLinkUnavailableError(episodeId);
    }

    return this.updateStatus(subscriptionId, episodeId, 'found');
  }

  // ── NOUVEAU : grab automatique via NyaaIndexer ──

  async grabEpisode(
    subscriptionId: number,
    episodeId: number,
  ): Promise<GrabResult> {
    // 1. Récupérer la subscription (préférences)
    const subscription =
      await this.subscriptionRepository.findById(subscriptionId);
    if (!subscription) {
      throw new EpisodeNotFoundError(episodeId); // ou une SubscriptionNotFoundError
    }

    // 2. Récupérer la série (titre pour la query)
    const serie = await this.serieRepository.findById(subscription.seriesId);
    if (!serie) {
      throw new Error(`Serie #${subscription.seriesId} not found`);
    }

    // 3. Récupérer l'épisode (numéro)
    const episode = await this.episodeRepository.findById(episodeId);
    if (!episode) {
      throw new EpisodeNotFoundError(episodeId);
    }

    // 4. Construire la query de recherche Nyaa
    const episodeNum = String(episode.episodeNumber).padStart(2, '0');
    const query = `${serie.canonicalTitle} ${episodeNum}`;

    // 5. Chercher sur Nyaa
    const results = await this.torrentIndexer.search(query);

    // 6. Filtrer selon les préférences de la subscription
    const valid = this.filterTorrents(results, {
      minSeeders: subscription.minSeeders,
      preferredResolution: subscription.preferredResolution,
    });

    if (valid.length === 0) {
      await this.updateStatus(subscriptionId, episodeId, 'failed');
      throw new Error(
        `No valid torrent for "${query}" (minSeeders: ${subscription.minSeeders}, res: ${subscription.preferredResolution})`,
      );
    }

    // 7. Prendre le 1er résultat (M1 — pas de scoring)
    const best = valid[0];

    // 8. Envoyer le magnet au débrideur (Premiumize)
    const links = await this.debridProvider.getDirectDownloadLink(best.magnet);

    if (links.length === 0) {
      await this.updateStatus(subscriptionId, episodeId, 'failed');
      throw new EpisodeLinkUnavailableError(episodeId);
    }

    // 9. Mettre à jour le statut → 'found'
    const subscriptionEpisode = await this.updateStatus(
      subscriptionId,
      episodeId,
      'found',
    );

    return {
      subscriptionEpisode,
      torrent: best,
      links,
    };
  }

  // ── Filtrage M1 ──

  private filterTorrents(
    results: Torrent[],
    prefs: { minSeeders: number; preferredResolution: string },
  ): Torrent[] {
    return results
      // Filtrer par seeders minimum
      .filter((t) => t.seeders >= prefs.minSeeders)
      // Filtrer par résolution si spécifiée
      .filter((t) => {
        if (!prefs.preferredResolution) return true;
        return t.title
          .toLowerCase()
          .includes(prefs.preferredResolution.toLowerCase());
      })
      // Trier par seeders desc (meilleur en premier)
      .sort((a, b) => b.seeders - a.seeders);
  }



  private async updateStatus(
    subscriptionId: number,
    episodeId: number,
    status: EpisodeStatus,
  ): Promise<SubscriptionEpisode> {
    const entries =
      await this.subscriptionEpisodeRepository.findBySubscriptionId(
        subscriptionId,
      );

    const entry = entries.find((item) => item.episodeId === episodeId);

    if (!entry) {
      throw new EpisodeNotFoundError(episodeId);
    }

    return this.subscriptionEpisodeRepository.upsert({
      ...entry,
      status,
      grabbedAt:
        status === 'found' || status === 'added' || status === 'ready'
          ? new Date().toISOString()
          : entry.grabbedAt,
    });
  }
}
