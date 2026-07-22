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
  app.use(cors());
  app.use(express.json());
  app.disable('etag');

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
  app.use((err: Error & { code?: number }, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    const status = typeof err.code === 'number' && err.code >= 400 && err.code < 600 ? err.code : 500;
    res.status(status).json({ error: err.message ?? 'Internal server error' });
  });

  return app;
}
