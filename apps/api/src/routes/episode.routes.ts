import { Router } from 'express';
import { EpisodeController } from '../controllers/episode.controller.js';

export function episodeRoutes(controller: EpisodeController): Router {
  const router = Router();
  router.get('/episodes/files', controller.listAvailableFiles); // avant /:id
  router.get('/episodes', controller.list);
  router.get('/episodes/:id', controller.getDetails);
  router.post(
    '/subscriptions/:subscriptionId/episodes/:episodeId/resolve-link',
    controller.resolveDownloadLink,
  );
  return router;
}
