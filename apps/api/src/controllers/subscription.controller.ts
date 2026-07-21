import type { Request, Response } from 'express';
import type { SubscriptionService } from '../services/subscription/subscription.service.js';

export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
  ) { }

  list = async (_req: Request, res: Response): Promise<void> => {
    const subscriptions = await this.subscriptionService.getAll();
    res.json(subscriptions);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ message: 'Invalid subscription id' });
      return;
    }

    const subscription = await this.subscriptionService.getById(id);

    if (!subscription) {
      res.status(404).json({ message: 'Subscription not found' });
      return;
    }

    res.json(subscription);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const subscription = await this.subscriptionService.create(req.body);

    res.status(201).json(subscription);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ message: 'Invalid subscription id' });
      return;
    }

    await this.subscriptionService.delete(id);

    res.status(204).send();
  };
}
