export type AnimeMetadata = {
  anilistId: number;
  title?: string;
  isAdult: boolean;
  episodes: number;
  tags: string[];
  genres: string[];
  popularity?: number;
  averageScore?: number;
  year?: number;
  tagRanks?: Record<string, number>;
};
