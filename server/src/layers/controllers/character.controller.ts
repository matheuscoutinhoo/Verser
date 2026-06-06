import type { Request, Response } from 'express';
import type { CharacterService } from '../services/character.service';
import { getPagination, jsonOk, requireUniverse } from './controller-helpers';

export class CharacterController {
  constructor(private readonly service: CharacterService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const result = await this.service.list(universe.id, getPagination(req));
    jsonOk(res, result);
  };

  detail = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const character = await this.service.getById(universe.id, req.params.id as string);
    jsonOk(res, character);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const character = await this.service.create(universe.id, req.body);
    jsonOk(res, character, 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const character = await this.service.update(
      universe.id,
      req.params.id as string,
      req.body,
    );
    jsonOk(res, character);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    await this.service.delete(universe.id, req.params.id as string);
    res.status(204).send();
  };
}
