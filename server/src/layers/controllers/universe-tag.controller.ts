import type { Request, Response } from 'express';
import type { UniverseTagService } from '../services/universe-tag.service';
import { jsonOk, requireUniverse } from './controller-helpers';

export class UniverseTagController {
  constructor(private readonly service: UniverseTagService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const tags = await this.service.list(universe.id);
    jsonOk(res, tags);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const tag = await this.service.create(universe.id, req.body);
    jsonOk(res, tag, 201);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    await this.service.delete(universe.id, req.params.id as string);
    res.status(204).send();
  };
}
