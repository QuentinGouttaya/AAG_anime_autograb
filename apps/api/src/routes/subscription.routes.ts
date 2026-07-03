import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller.js';

export function subscriptionRoutes(controller: SubscriptionController): Router {
  const router = Router();
  router.post('/subscriptions', controller.create);
  router.get('/subscriptions', controller.list);
  router.get('/subscriptions/:id', controller.getById);
  router.delete('/subscriptions/:id', controller.remove);
  return router;
}
