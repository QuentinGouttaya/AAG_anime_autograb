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
  NoTorrentFoundError
} from './error.js';
import type { CreatePendingEpisodeInput } from './types.js';
import { scoreTorrents } from '../scoring/scoring.js';
import type { ScoredTorrent } from '../scoring/scoring.js';
import { ScoringFactory } from '../scoring/scoring.factory.js';
import { WeightedScoringStrategy } from '../scoring/weighted.strategy.js';
import { ScoreDescendingSort } from '../sort/sort.js';

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
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly serieRepository: SerieRepository,
    private readonly torrentIndexer: TorrentIndexer,
    private readonly debridProvider: DebridProvider,
  ) { }

  async list(): Promise<Episode[]> {
    return this.episodeRepository.findAll();
  }

  async listBySerie(serieId: number): Promise<Episode[]> {
    return this.episodeRepository.findBySerieId(serieId);
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

  async grabEpisode(
    subscriptionId: number,
    episodeId: number,
  ): Promise<GrabResult> {
    const subscription =
      await this.subscriptionRepository.findById(subscriptionId);
    if (!subscription) {
      throw new EpisodeNotFoundError(episodeId);
    }

    const serie = await this.serieRepository.findById(subscription.seriesId);
    if (!serie) {
      throw new Error(`Serie #${subscription.seriesId} not found`);
    }

    const episode = await this.episodeRepository.findById(episodeId);
    if (!episode) {
      throw new EpisodeNotFoundError(episodeId);
    }

    const episodeNum = String(episode.episodeNumber).padStart(2, '0');

    const cleanTitle = serie.canonicalTitle.replace(/\s*(II|III|IV|2nd Season|Season 2|Part 2)$/i, '').trim();
    const cleanRomaji = serie.romajiTitle?.replace(/\s*(II|III|IV|2nd Season|Season 2|Part 2)$/i, '').trim();

    // Franchise seule, sans sous-titre de cour ni ponctuation : dernier
    // recours quand romaji/anglais complets ne matchent rien (les fansubs
    // n'indexent pas toujours le sous-titre de saison sur Nyaa).
    const bareFranchise = serie.canonicalTitle.split(/[:\-–]/)[0].trim();

    // Romaji d'abord : c'est le nommage utilisé par les fansubs sur Nyaa,
    // le titre anglais AniList ne matche presque jamais leurs releases.
    const queriesToTry = [
      cleanRomaji ? `${cleanRomaji} ${episodeNum}` : null,
      `${cleanTitle} ${episodeNum}`,
      bareFranchise && bareFranchise !== cleanTitle ? `${bareFranchise} ${episodeNum}` : null,
    ].filter(Boolean) as string[];
    let valid: Torrent[] = [];
    let lastQuery = queriesToTry[0] || serie.canonicalTitle;

    for (const query of queriesToTry) {
      lastQuery = query;
      const results = await this.torrentIndexer.search(query);

      valid = filterTorrents(results, {
        minSeeders: subscription.minSeeders,
        preferredResolution: subscription.preferredResolution,
      });

      console.info(
        `[grab] query="${query}" raw=${results.length} valid=${valid.length}` +
        (results.length > 0 ? ` sample="${results[0].title}" seeders=${results[0].seeders}` : ''),
      );

      if (valid.length > 0) {
        break;
      }
    }
    if (valid.length === 0) {
      await this.updateStatus(subscriptionId, episodeId, 'failed');


      throw new NoTorrentFoundError(
        lastQuery,
        subscription.minSeeders,
        subscription.preferredResolution
      );
    }

    // Scorer (seeders + bonus résolution/fansub) puis trier via SortStrategy
    const scoringStrategy = new WeightedScoringStrategy({
      preferredResolution: subscription.preferredResolution,
    });
    const scored = scoreTorrents(valid, scoringStrategy);
    const [best] = new ScoreDescendingSort<ScoredTorrent>().sort(scored);
    let links;
    try {
      links = await this.debridProvider.getDirectDownloadLink(best.magnet);
    } catch (error) {
      await this.updateStatus(subscriptionId, episodeId, 'failed');
      throw new EpisodeLinkUnavailableError(episodeId, { cause: error });
    }

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

  private async updateStatus(
    subscriptionId: number,
    episodeId: number,
    status: EpisodeStatus,
  ): Promise<SubscriptionEpisode> {
    const entries = await this.subscriptionEpisodeRepository.findBySubscriptionId(subscriptionId);
    const entry = entries.find((item) => item.episodeId === episodeId);

    const base: SubscriptionEpisode = entry ?? {
      subscriptionId,
      episodeId,
      status: 'pending',
      grabbedAt: null,
    };

    return this.subscriptionEpisodeRepository.upsert({
      ...base,
      status,
      grabbedAt:
        status === 'found' || status === 'added' || status === 'ready'
          ? new Date().toISOString()
          : base.grabbedAt,
    });
  }
}
