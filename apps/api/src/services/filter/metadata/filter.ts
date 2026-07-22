// services/filter/metadata/filter.ts
import { AbstractFilter, applyFilterChain, type FilterHandler } from '../index.js';
import { TagMatchMode, GenreMatchMode } from '../../../models/match_modes.js';

export interface AnimeMetadata {
  anilistId: number;
  title?: string;
  isAdult: boolean;
  episodes: number;
  tags: string[];   // tag names AniList
  genres: string[]; // genres AniList
  popularity?: number;
  averageScore?: number;
  year?: number;
  // rank AniList (0-100) par tag : pertinence du tag pour CET anime
  tagRanks?: Record<string, number>;
}

export interface MetadataFilterParams {
  allowAdult: boolean;
  excludedAnilistIds: Set<number>;
  requiredTags?: string[];
  tagMode?: TagMatchMode;
  requiredGenres?: string[];
  genreMode?: GenreMatchMode;
}

class AdultFilter extends AbstractFilter<AnimeMetadata> {
  constructor(private allowAdult: boolean) {
    super();
  }

  protected check(item: AnimeMetadata): boolean {
    return this.allowAdult || !item.isAdult;
  }
}

class ExcludeAnilistIdsFilter extends AbstractFilter<AnimeMetadata> {
  constructor(private excludedIds: Set<number>) {
    super();
  }

  protected check(item: AnimeMetadata): boolean {
    return !this.excludedIds.has(item.anilistId);
  }
}

class TagFilter extends AbstractFilter<AnimeMetadata> {
  constructor(
    private requiredTags: string[],
    private mode: TagMatchMode = 'any',
  ) {
    super();
  }

  protected check(item: AnimeMetadata): boolean {
    if (this.requiredTags.length === 0) return true;

    const tagSet = new Set(item.tags);

    if (this.mode === 'any') {
      return this.requiredTags.some((t) => tagSet.has(t));
    }

    // 'all'
    return this.requiredTags.every((t) => tagSet.has(t));
  }
}

class GenreFilter extends AbstractFilter<AnimeMetadata> {
  constructor(
    private requiredGenres: string[],
    private mode: GenreMatchMode = 'any',
  ) {
    super();
  }

  protected check(item: AnimeMetadata): boolean {
    if (this.requiredGenres.length === 0) return true;

    const genreSet = new Set(item.genres);

    if (this.mode === 'any') {
      return this.requiredGenres.some((g) => genreSet.has(g));
    }

    // 'all'
    return this.requiredGenres.every((g) => genreSet.has(g));
  }
}

export function buildMetadataFilterChain(
  params: MetadataFilterParams,
): FilterHandler<AnimeMetadata> {
  const head = new AdultFilter(params.allowAdult);
  const exclude = new ExcludeAnilistIdsFilter(params.excludedAnilistIds);
  head.setNext(exclude);

  let current: FilterHandler<AnimeMetadata> = exclude;

  if (params.requiredTags && params.requiredTags.length > 0) {
    const tagFilter = new TagFilter(params.requiredTags, params.tagMode ?? 'any');
    current.setNext(tagFilter);
    current = tagFilter;
  }

  if (params.requiredGenres && params.requiredGenres.length > 0) {
    const genreFilter = new GenreFilter(
      params.requiredGenres,
      params.genreMode ?? 'any',
    );
    current.setNext(genreFilter);
    current = genreFilter;
  }

  return head;
}

export function filterMetadataCandidates(
  candidates: AnimeMetadata[],
  params: MetadataFilterParams,
): AnimeMetadata[] {
  return applyFilterChain(candidates, () => buildMetadataFilterChain(params));
}
