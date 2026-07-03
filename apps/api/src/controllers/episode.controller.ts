// src/controllers/episode.controller.ts
import type { Request, Response } from 'express';
import type { EpisodeService } from '../services/episode.service.js';

export class EpisodeController {
  constructor(private readonly episodeService: EpisodeService) { }

  list = async (_req: Request, res: Response) => {
    const episodes = await this.episodeService.list();
    res.json(episodes);
  };

  listAvailableFiles = async (_req: Request, res: Response) => {
    const episodes = await this.episodeService.listAvailableFiles();
    res.json(episodes);
  };

  getDetails = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid episode id' });
    }

    const episode = await this.episodeService.getDetails(id);
    if (!episode) {
      return res.status(404).json({ message: 'Episode not found' });
    }
    res.json(episode);
  };

  resolveDownloadLink = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid episode id' });
    }

    const { magnetOrTorrentUrl } = req.body;
    const episode = await this.episodeService.resolveDownloadLink(id, magnetOrTorrentUrl);
    res.json(episode);
  };
}
