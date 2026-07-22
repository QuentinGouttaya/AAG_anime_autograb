import express, { type Request, type Response, type NextFunction } from 'express';
import type { AppDependencies } from './dependencies/app_dependencies.js';
import { subscriptionRoutes } from './routes/subscription.routes.js';
import { episodeRoutes } from './routes/episode.routes.js';
import { metadataRoutes } from './routes/metadata.routes.js';
import cors from 'cors';

export function createApp({
  subscriptionController,
  episodeController,
  metadataController,                                            // ← AJOUTÉ
}: AppDependencies) {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: 'http://localhost:5173' }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // routes
  app.use('/api', subscriptionRoutes(subscriptionController));
  app.use('/api', episodeRoutes(episodeController));
  app.use('/api/metadata', metadataRoutes(metadataController));  // ← AJOUTÉ

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
