import type { Request, Response } from 'express';
import type { TimelineEventService } from '../services/timeline-event.service';
import { jsonOk, requireUniverse } from './controller-helpers';

export class TimelineEventController {
  constructor(private readonly service: TimelineEventService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const events = await this.service.list(universe.id);
    jsonOk(res, events);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const event = await this.service.create(universe.id, req.body);
    jsonOk(res, event, 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const event = await this.service.update(universe.id, req.params.id as string, req.body);
    jsonOk(res, event);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    await this.service.delete(universe.id, req.params.id as string);
    res.status(204).send();
  };

  reorder = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const events = await this.service.reorder(universe.id, req.body);
    jsonOk(res, events);
  };
}
