import type { Request, Response } from 'express';
import type { CharacterRelationService } from '../services/character-relation.service';
import { jsonOk, requireUniverse } from './controller-helpers';

export class CharacterRelationController {
  constructor(private readonly service: CharacterRelationService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const relations = await this.service.list(universe.id);
    jsonOk(res, relations);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const relation = await this.service.create(universe.id, req.body);
    jsonOk(res, relation, 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const relation = await this.service.update(
      universe.id,
      req.params.id as string,
      req.body,
    );
    jsonOk(res, relation);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    await this.service.delete(universe.id, req.params.id as string);
    res.status(204).send();
  };
}
