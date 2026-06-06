import type { Request, Response } from 'express';
import type { ImmutableLawService } from '../services/immutable-law.service';
import { jsonOk, requireUniverse } from './controller-helpers';

export class ImmutableLawController {
  constructor(private readonly service: ImmutableLawService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const items = await this.service.list(universe.id);
    jsonOk(res, items);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const law = await this.service.create(universe.id, req.body);
    jsonOk(res, law, 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const law = await this.service.update(universe.id, req.params.id as string, req.body);
    jsonOk(res, law);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    await this.service.delete(universe.id, req.params.id as string);
    res.status(204).send();
  };
}
