export type Subscription = {
  id: number;
  seriesId: number;
  preferredFansub: string[];
  preferredResolution: string;
  minSeeders: number;
  active: boolean;
  createdAt: string;
  episodeCount?: number; // AJOUTÉ - Propriété calculée par la requête SQL
};
