import express from 'express';
import { subscriptionRoutes } from './routes/subscription.routes.js';
import { episodeRoutes } from './routes/episode.routes.js';
import type { AppDependencies } from './dependencies/app_dependencies.js';




export function createApp({ subscriptionController, episodeController }: AppDependencies) {
  const app = express();
  app.use(express.json());
  app.use('/api', subscriptionRoutes(subscriptionController));
  app.use('/api', episodeRoutes(episodeController));
  return app;
}
