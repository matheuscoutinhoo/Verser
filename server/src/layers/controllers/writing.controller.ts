import type { Request, Response } from 'express';
import type { WritingService } from '../services/writing.service';
import { jsonOk, requireUniverse, requireUser } from './controller-helpers';

export class WritingController {
  constructor(private readonly service: WritingService) {}

  tree = async (req: Request, res: Response): Promise<void> => {
    const universe = requireUniverse(req);
    const tree = await this.service.tree(universe.id);
    jsonOk(res, tree);
  };

  detail = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const universe = requireUniverse(req);
    const writing = await this.service.getById(user.id, universe.id, req.params.id as string);
    jsonOk(res, writing);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const universe = requireUniverse(req);
    const writing = await this.service.create(user.id, universe.id, req.body);
    jsonOk(res, writing, 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const universe = requireUniverse(req);
    const result = await this.service.update(
      user.id,
      universe.id,
      req.params.id as string,
      req.body,
    );
    jsonOk(res, result);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const universe = requireUniverse(req);
    await this.service.delete(user.id, universe.id, req.params.id as string);
    res.status(204).send();
  };

  reorder = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const universe = requireUniverse(req);
    const tree = await this.service.reorder(user.id, universe.id, req.body);
    jsonOk(res, tree);
  };

  listVersions = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const universe = requireUniverse(req);
    const versions = await this.service.listVersions(
      user.id,
      universe.id,
      req.params.id as string,
    );
    jsonOk(res, versions);
  };

  createVersion = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const universe = requireUniverse(req);
    const version = await this.service.createManualVersion(
      user.id,
      universe.id,
      req.params.id as string,
      req.body ?? {},
    );
    jsonOk(res, version, 201);
  };
}
