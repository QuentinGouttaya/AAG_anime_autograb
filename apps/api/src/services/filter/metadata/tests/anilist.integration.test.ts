// src/services/filter/metadata/tests/filter_anilist.integration.test.ts
import { describe, it, expect } from 'vitest';
import { AnilistService } from '../../../metadata/anilist/service.js';
import {
  filterMetadataCandidates,
  type AnimeMetadata,
  type MetadataFilterParams,
} from '../filter.js';
import type { Season } from '../../../../models/season.js';

describe('filterMetadataCandidates with real AniList', () => {
  // tu peux factoriser le service si tu veux
  const anilist = new AnilistService();

  it(
    'filtre une vraie saison AniList selon adult / exclusion / tags / genres',
    async () => {
      // 1) Récupère les métadonnées de saison enrichies
      const season: Season = 'SUMMER';
      const year = 2024;

      const seasonMetadata: AnimeMetadata[] = await anilist.getSeasonMetadata(
        season as any, // adapte si Season est un enum TS
        year,
      );

      expect(seasonMetadata.length).toBeGreaterThan(0);

      // 2) Exclure au moins un anime (simulateur de "déjà souscrit")
      const excludedId = seasonMetadata[0]?.anilistId;
      const excludedAnilistIds = new Set<number>(
        excludedId ? [excludedId] : [],
      );

      // 3) Paramètres de filtre réalistes
      const params: MetadataFilterParams = {
        allowAdult: false,
        excludedAnilistIds,
        requiredTags: ['Isekai'],
        tagMode: 'any',
        requiredGenres: ['Action'],
        genreMode: 'any',
      };

      // 4) Appliquer le moteur de filtre
      const filtered = filterMetadataCandidates(seasonMetadata, params);

      // 5) Assertions minimales mais parlantes
      // - rien d'adulte
      expect(filtered.every((a) => !a.isAdult)).toBe(true);

      // - aucun anime exclu
      if (excludedId) {
        expect(filtered.some((a) => a.anilistId === excludedId)).toBe(false);
      }

      // - et au moins un résultat (sauf si la saison est bizarre)
      expect(filtered.length).toBeGreaterThan(0);
    },
    20_000, // timeout Vitest
  );
});
