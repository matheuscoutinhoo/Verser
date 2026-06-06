import type { Request, Response } from 'express';
import type { WorldSystemService } from '../services/world-system.service';
import { getPagination, jsonOk, requireUniverse } from './controller-helpers';

export class WorldSystemController {
  constructor(private readonly service: WorldSystemService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const result = await this.service.list(universe.id, getPagination(req));
    jsonOk(res, result);
  };

  detail = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const system = await this.service.getById(universe.id, req.params.id as string);
    jsonOk(res, system);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const system = await this.service.create(universe.id, req.body);
    jsonOk(res, system, 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const system = await this.service.update(universe.id, req.params.id as string, req.body);
    jsonOk(res, system);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    await this.service.delete(universe.id, req.params.id as string);
    res.status(204).send();
  };
}
