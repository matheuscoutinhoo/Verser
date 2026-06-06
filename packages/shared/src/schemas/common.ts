import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  sort: z.string().trim().max(50).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationSchema = z.infer<typeof paginationSchema>;

export const cuidSchema = z
  .string()
  .min(1)
  .regex(/^c[a-z0-9]{20,}$/i, 'Invalid id format');

export const idParamSchema = z.object({
  id: cuidSchema,
});
