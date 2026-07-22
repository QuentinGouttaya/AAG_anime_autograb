import type { Request, Response } from 'express';
import type { MetadataService } from '../services/metadata/metadata.service.js';
import type { Season } from '../models/season.js';

const VALID_SEASONS: Season[] = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];

export class MetadataController {
  constructor(private readonly metadataService: MetadataService) { }

  // ── AJOUTÉ : recherche paginée ──
  searchAnime = async (req: Request, res: Response): Promise<void> => {
    const query = String(req.query.q ?? '').trim();

    if (!query || query.length < 2) {
      res.status(400).json({ message: 'Query param "q" is required (min 2 chars)' });
      return;
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = Math.min(50, Math.max(1, Number(req.query.perPage) || 20));

    try {
      const result = await this.metadataService.searchAnime(query, page, perPage);
      res.json(result);
    } catch {
      res.status(502).json({ message: 'AniList request failed' });
    }
  };

  getSeasonAnime = async (req: Request, res: Response): Promise<void> => {
    const season = String(req.query.season ?? '').toUpperCase() as Season;
    const year = Number(req.query.year);

    if (!VALID_SEASONS.includes(season)) {
      res.status(400).json({
        message: `Invalid season, expected one of ${VALID_SEASONS.join(', ')}`,
      });
      return;
    }

    if (!Number.isInteger(year) || year < 1990) {
      res.status(400).json({ message: 'Invalid year' });
      return;
    }

    const series = await this.metadataService.getSeasonAnime(season, year);
    res.json(series);
  };
}
