import express, { type Request, type Response, type NextFunction } from 'express';
import type { AppDependencies } from './dependencies/app_dependencies.js';
import { subscriptionRoutes } from './routes/subscription.routes.js';
import { episodeRoutes } from './routes/episode.routes.js';

export function createApp({ subscriptionController, episodeController }: AppDependencies) {
  const app = express();

  app.use(express.json());

  // routes
  app.use('/api', subscriptionRoutes(subscriptionController));
  app.use('/api', episodeRoutes(episodeController));

  // 404
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // error handler global
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: err.message ?? 'Internal server error' });
  });

  return app;
}
