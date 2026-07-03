import type { Request, Response } from 'express';
import type { EpisodeService } from '../services/episode.service.js';

export class EpisodeController {
  constructor(private readonly episodeService: EpisodeService) { }

  list = async (req: Request, res: Response): Promise<void> => {
    const episodes = await this.episodeService.list();
    res.json(episodes);
  };

  listAvailableFiles = async (req: Request, res: Response): Promise<void> => {
    const episodes = await this.episodeService.listAvailableFiles();
    res.json(episodes);
  };

  getDetails = async (req: Request, res: Response): Promise<void> => {
    let id = req.params.id;
    if (isNaN(Number(id))) {
      throw new Error('Invalid episode id');
    }
    const episode = await this.episodeService.getDetails(id);

    if (!episode) {
      res.status(404).json({ error: 'Episode not found' });
      return;
    }

    res.json(episode);
  };

  resolveDownloadLink = async (req: Request, res: Response): Promise<void> => {
    let id = req.params.id;
    if (isNaN(Number(id))) {
      throw new Error('Invalid episode id');
    }

    const { magnetOrTorrentUrl } = req.body;

    const episode = await this.episodeService.resolveDownloadLink(id, magnetOrTorrentUrl);
    res.json(episode);
  };
}
