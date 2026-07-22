import type { Request, Response } from 'express';
import type { SubscriptionService } from '../services/subscription/subscription.service.js';
import {
  SUBSCRIPTION_SORT_KEYS,
  SUBSCRIPTION_STATUSES,
} from '../models/subscription.js';
import { SORT_DIRECTIONS } from '../models/sort.js';

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asEnum<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
  ) { }

  list = async (req: Request, res: Response): Promise<void> => {
    const subscriptions = await this.subscriptionService.getAll({
      search: asString(req.query.search),
      status: asEnum(req.query.status, SUBSCRIPTION_STATUSES),
      genre: asString(req.query.genre),
      animeStatus: asString(req.query.animeStatus),
      format: asString(req.query.format),
      sort: asEnum(req.query.sort, SUBSCRIPTION_SORT_KEYS),
      direction: asEnum(req.query.direction, SORT_DIRECTIONS),
    });
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
