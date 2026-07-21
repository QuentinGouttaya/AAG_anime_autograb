import type { Request, Response } from 'express';
import type { EpisodeService } from '../services/episodes/service.js';

export class EpisodeController {
  constructor(private readonly episodeService: EpisodeService) { }

  list = async (_req: Request, res: Response): Promise<void> => {
    const episodes = await this.episodeService.list();
    res.json(episodes);
  };

  listAvailableFiles = async (_req: Request, res: Response): Promise<void> => {
    const episodes = await this.episodeService.listAvailableFiles();
    res.json(episodes);
  };

  getDetails = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ message: 'Invalid episode id' });
      return;
    }

    const episode = await this.episodeService.getDetails(id);

    if (!episode) {
      res.status(404).json({ message: 'Episode not found' });
      return;
    }

    res.json(episode);
  };

  resolveDownloadLink = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const subscriptionId = Number(req.params.subscriptionId);
    const episodeId = Number(req.params.episodeId);
    const { magnetOrTorrentUrl } = req.body as {
      magnetOrTorrentUrl?: unknown;
    };

    if (
      !Number.isInteger(subscriptionId) ||
      subscriptionId <= 0 ||
      !Number.isInteger(episodeId) ||
      episodeId <= 0
    ) {
      res.status(400).json({
        message: 'Invalid subscription id or episode id',
      });
      return;
    }

    if (
      typeof magnetOrTorrentUrl !== 'string' ||
      magnetOrTorrentUrl.trim().length === 0
    ) {
      res.status(400).json({
        message: 'magnetOrTorrentUrl is required',
      });
      return;
    }

    const episode = await this.episodeService.resolveDownloadLink(
      subscriptionId,
      episodeId,
      magnetOrTorrentUrl,
    );

    res.json(episode);
  };
}
