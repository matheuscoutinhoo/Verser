import type { Request, Response } from 'express';
import type { LocationService } from '../services/location.service';
import { getPagination, jsonOk, requireUniverse } from './controller-helpers';

export class LocationController {
  constructor(private readonly service: LocationService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const result = await this.service.list(universe.id, getPagination(req));
    jsonOk(res, result);
  };

  detail = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const location = await this.service.getById(universe.id, req.params.id as string);
    jsonOk(res, location);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const location = await this.service.create(universe.id, req.body);
    jsonOk(res, location, 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const location = await this.service.update(
      universe.id,
      req.params.id as string,
      req.body,
    );
    jsonOk(res, location);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    await this.service.delete(universe.id, req.params.id as string);
    res.status(204).send();
  };
}
