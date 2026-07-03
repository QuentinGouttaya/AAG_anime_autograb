// controllers/subscription.controller.ts
import type { Request, Response } from 'express';
import type { SubscriptionService } from '../services/subscription.service.js';

export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) { }

  list = async (req: Request, res: Response): Promise<void> => {
    const subscriptions = await this.subscriptionService.getAll();
    res.json(subscriptions);
  };

  getById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid subscription id' });
    }

    const subscription = await this.subscriptionService.getById(id);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    res.json(subscription);
  };

  delete = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid subscription id' });
    }

    await this.subscriptionService.delete(id);
    res.status(204).send();
  };
  create = async (req: Request, res: Response): Promise<void> => {
    const subscription = await this.subscriptionService.create(req.body);
    res.status(201).json(subscription);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      throw new Error('Invalid episode id');
    }

    await this.subscriptionService.delete(id);
    res.status(204).send();
  };
}
