import { Router } from 'express';
import { MetadataController } from '../controllers/metadata.controller.js';

export function metadataRoutes(controller: MetadataController): Router {
  const router = Router();
  router.get('/season', controller.getSeasonAnime);
  return router;
}

