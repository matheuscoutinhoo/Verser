import { PAGINATION } from '@verser/shared';

export interface PaginatedQuery {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  order: 'asc' | 'desc';
}

export interface PageMeta {
  skip: number;
  take: number;
}

export function toPageMeta(query: PaginatedQuery): PageMeta {
  const limit = Math.min(Math.max(query.limit, 1), PAGINATION.MAX_LIMIT);
  const page = Math.max(query.page, 1);
  return { skip: (page - 1) * limit, take: limit };
}

export interface PaginatedResultBuilder<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function buildPaginated<T>(
  items: T[],
  total: number,
  query: PaginatedQuery,
): PaginatedResultBuilder<T> {
  const limit = Math.min(Math.max(query.limit, 1), PAGINATION.MAX_LIMIT);
  const page = Math.max(query.page, 1);
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  };
}
