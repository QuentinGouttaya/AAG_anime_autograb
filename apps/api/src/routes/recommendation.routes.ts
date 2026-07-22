import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendation.controller.js';

export function recommendationRoutes(controller: RecommendationController): Router {
  const router = Router();
  router.get('/recommendations', controller.recommend);
  return router;
}
