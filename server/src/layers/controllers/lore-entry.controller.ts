import type { Request, Response } from 'express';
import type { LoreEntryService } from '../services/lore-entry.service';
import { getPagination, jsonOk, requireUniverse } from './controller-helpers';

export class LoreEntryController {
  constructor(private readonly service: LoreEntryService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const q = req.query as Record<string, string | undefined>;
    const result = await this.service.list(universe.id, {
      ...getPagination(req),
      category: q.category,
      importance: q.importance,
    });
    jsonOk(res, result);
  };

  detail = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const entry = await this.service.getById(universe.id, req.params.id as string);
    jsonOk(res, entry);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const entry = await this.service.create(universe.id, req.body);
    jsonOk(res, entry, 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const entry = await this.service.update(universe.id, req.params.id as string, req.body);
    jsonOk(res, entry);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    await this.service.delete(universe.id, req.params.id as string);
    res.status(204).send();
  };
}
