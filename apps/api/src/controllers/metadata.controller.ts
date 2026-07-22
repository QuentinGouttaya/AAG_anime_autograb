import type { Request, Response } from 'express';
import type { MetadataService } from '../services/metadata/metadata.service.js';
import type { Season } from '../models/season.js';
import type { Serie, SerieWithTags } from '../models/serie.js';
import {
  filterMetadataCandidates,
  type AnimeMetadata,
} from '../services/filter/metadata/filter.js';
import type { TagMatchMode } from '../models/match_modes.js';

const VALID_SEASONS: Season[] = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
const TAG_MODES: TagMatchMode[] = ['any', 'all'];

function parseCsv(value: unknown): string[] {
  return typeof value === 'string' && value.length > 0
    ? value.split(',').map((v) => v.trim()).filter(Boolean)
    : [];
}

// Adapte Serie → AnimeMetadata le temps du filtrage, pour réutiliser la
// chain existante (services/filter/metadata) sans dupliquer sa logique
// de matching côté controller ni côté front.
function toAnimeMetadata(serie: SerieWithTags): AnimeMetadata {
  return {
    anilistId: serie.anilistId,
    isAdult: false,
    episodes: serie.episodeCount ?? 0,
    tags: serie.tags.filter((t) => !t.isAdult).map((t) => t.name),
    genres: serie.genres ?? [],
  };
}

export class MetadataController {
  constructor(private readonly metadataService: MetadataService) { }

  searchAnime = async (req: Request, res: Response): Promise<void> => {
    const query = String(req.query.q ?? '').trim();

    if (!query || query.length < 2) {
      res.status(400).json({ message: 'Query param "q" is required (min 2 chars)' });
      return;
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = Math.min(50, Math.max(1, Number(req.query.perPage) || 20));
    const requiredTags = parseCsv(req.query.tags);
    const tagMode: TagMatchMode = TAG_MODES.includes(req.query.tagMode as TagMatchMode)
      ? (req.query.tagMode as TagMatchMode)
      : 'all';

    try {
      const result = await this.metadataService.searchAnime(query, page, perPage);

      if (requiredTags.length === 0) {
        res.json(result);
        return;
      }

      const filtered = filterMetadataCandidates(result.data.map(toAnimeMetadata), {
        allowAdult: true,
        excludedAnilistIds: new Set(),
        requiredTags,
        tagMode,
      });
      const keptIds = new Set(filtered.map((f) => f.anilistId));

      res.json({
        ...result,
        data: result.data.filter((s) => keptIds.has(s.anilistId)),
      });
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
