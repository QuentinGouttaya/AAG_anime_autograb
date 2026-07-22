import type { Request, Response } from 'express';
import type { MetadataService } from '../services/metadata/metadata.service.js';
import type { RecommendationService } from '../services/recommendation/service.js';
import type { AnimeMetadata } from '../services/filter/metadata/filter.js';
import type { Season } from '../models/season.js';
import { SEASONS } from '../models/season.js';

function parseIds(value: unknown): number[] {
  return typeof value === 'string' && value.length > 0
    ? value.split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0)
    : [];
}

export class RecommendationController {
  constructor(
    private readonly recommendationService: RecommendationService,
    private readonly metadataService: MetadataService,
  ) { }

  recommend = async (req: Request, res: Response): Promise<void> => {
    const season = String(req.query.season ?? '').toUpperCase() as Season;
    const year = Number(req.query.year);

    if (!SEASONS.includes(season) || !Number.isInteger(year) || year < 1990) {
      res.status(400).json({ message: 'Params "season" et "year" requis et valides' });
      return;
    }

    const likedAnilistIds = parseIds(req.query.liked);
    const excluded = new Set(parseIds(req.query.excluded));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

    try {
      const catalog = await this.metadataService.getSeasonMetadata(season, year);

      // Un favori peut appartenir à une autre saison que celle consultée :
      // sans ce fetch, il serait absent de `catalog`, le profil resterait
      // vide et le classement retomberait sur le fallback neutre (score 0
      // partout — exactement le symptôme "toujours 0.0%").
      const catalogIds = new Set(catalog.map((a) => a.anilistId));
      const missingIds = likedAnilistIds.filter((id) => !catalogIds.has(id));
      const likedItemsOutsideCatalog = (
        await Promise.all(missingIds.map((id) => this.metadataService.getAnimeMetadataById(id)))
      ).filter((a): a is AnimeMetadata => a !== null);

      const results = this.recommendationService.getRecommendations({
        catalog,
        likedAnilistIds,
        likedItemsOutsideCatalog,
        excludedAnilistIds: excluded,
        limit,
      });
      res.json(results);
    } catch {
      res.status(502).json({ message: 'AniList request failed' });
    }
  };
}
