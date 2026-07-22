import type { Request, Response } from 'express';
import type { EpisodeService } from '../services/episodes/service.js';

export class EpisodeController {
  constructor(private readonly episodeService: EpisodeService) { }

  list = async (req: Request, res: Response): Promise<void> => {
    const seriesId = Number(req.query.seriesId);

    const episodes = Number.isInteger(seriesId) && seriesId > 0
      ? await this.episodeService.listBySerie(seriesId)
      : await this.episodeService.list();

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

  resolveDownloadLink = async (req: Request, res: Response): Promise<void> => {
    const subscriptionId = Number(req.params.subscriptionId);
    const episodeId = Number(req.params.episodeId);
    const { magnetOrTorrentUrl } = req.body as { magnetOrTorrentUrl?: unknown };

    if (!Number.isInteger(subscriptionId) || subscriptionId <= 0 || !Number.isInteger(episodeId) || episodeId <= 0) {
      res.status(400).json({ message: 'Invalid subscription id or episode id' });
      return;
    }

    if (typeof magnetOrTorrentUrl !== 'string' || magnetOrTorrentUrl.trim().length === 0) {
      res.status(400).json({ message: 'magnetOrTorrentUrl is required' });
      return;
    }

    const episode = await this.episodeService.resolveDownloadLink(subscriptionId, episodeId, magnetOrTorrentUrl);
    res.json(episode);
  };

  grab = async (req: Request, res: Response): Promise<void> => {
    const subscriptionId = Number(req.params.subscriptionId);
    const episodeId = Number(req.params.episodeId);

    if (!Number.isInteger(subscriptionId) || subscriptionId <= 0 || !Number.isInteger(episodeId) || episodeId <= 0) {
      res.status(400).json({ message: 'Invalid subscription id or episode id' });
      return;
    }

    const result = await this.episodeService.grabEpisode(subscriptionId, episodeId);
    res.json(result);
  };
}
