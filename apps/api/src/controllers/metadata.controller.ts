import type { Request, Response } from 'express';
import type { MetadataService } from '../services/metadata/metadata.service.js';
import type { Season } from '../models/season.js';

const VALID_SEASONS: Season[] = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];

export class MetadataController {
  constructor(private readonly metadataService: MetadataService) { }

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


