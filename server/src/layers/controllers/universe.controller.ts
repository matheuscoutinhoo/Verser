import type { Request, Response } from 'express';
import { UnauthorizedError } from '../../errors';
import type { UniverseService } from '../services/universe.service';
import type { PaginatedQuery } from '../../utils/pagination';

function getPagination(req: Request): PaginatedQuery {
  const q = req.query as Record<string, string | undefined>;
  return {
    page: q.page ? Number(q.page) : 1,
    limit: q.limit ? Number(q.limit) : 20,
    search: q.search,
    sort: q.sort,
    order: q.order === 'asc' ? 'asc' : 'desc',
  };
}

export class UniverseController {
  constructor(private readonly service: UniverseService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const result = await this.service.list(req.user.id, getPagination(req));
    res.status(200).json({ data: result });
  };

  detail = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const universe = await this.service.getById(req.user.id, req.params.id as string);
    res.status(200).json({ data: universe });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const universe = await this.service.create(req.user.id, req.body);
    res.status(201).json({ data: universe });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const universe = await this.service.update(req.user.id, req.params.id as string, req.body);
    res.status(200).json({ data: universe });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.delete(req.user.id, req.params.id as string);
    res.status(204).send();
  };
}
