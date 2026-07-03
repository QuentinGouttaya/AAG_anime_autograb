// controllers/subscription.controller.ts
import type { Request, Response } from 'express';
import type { SubscriptionService } from '../services/subscription.service.js';

export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) { }

  list = async (req: Request, res: Response): Promise<void> => {
    const subscriptions = await this.subscriptionService.getAll();
    res.json(subscriptions);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    let id = req.params.id;
    if (isNaN(Number(id))) {
      throw new Error('Invalid episode id');
    }
    const subscription = await this.subscriptionService.getById(id);

    if (!subscription) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }

    res.json(subscription);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const subscription = await this.subscriptionService.create(req.body);
    res.status(201).json(subscription);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    let id = req.params.id;
    if (isNaN(Number(id))) {
      throw new Error('Invalid episode id');
    }

    await this.subscriptionService.delete(id);
    res.status(204).send();
  };
}
