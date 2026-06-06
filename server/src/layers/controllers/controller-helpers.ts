import type { Request, Response } from 'express';
import { UnauthorizedError } from '../../errors';
import type { PaginatedQuery } from '../../utils/pagination';

export function requireUser(req: Request): NonNullable<Request['user']> {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}

export function requireUniverse(req: Request): { id: string } {
  if (!req.universe) throw new UnauthorizedError();
  return req.universe;
}

export function getPagination(req: Request): PaginatedQuery {
  const q = req.query as Record<string, string | undefined>;
  return {
    page: q.page ? Number(q.page) : 1,
    limit: q.limit ? Number(q.limit) : 20,
    search: q.search,
    sort: q.sort,
    order: q.order === 'asc' ? 'asc' : 'desc',
  };
}

export function jsonOk<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ data });
}
