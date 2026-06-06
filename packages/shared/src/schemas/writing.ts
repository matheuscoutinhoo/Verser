import { z } from 'zod';
import { WRITING_STATUS, WRITING_TYPE } from '../constants';

const titleSchema = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(200, 'Title must be at most 200 characters');

const typeSchema = z.enum(WRITING_TYPE);
const statusSchema = z.enum(WRITING_STATUS);

const contentSchema = z.string().max(2_000_000); // ~2 MB cap on rich content
const plainSchema = z.string().max(2_000_000);

export const createWritingSchema = z.object({
  title: titleSchema,
  type: typeSchema.optional(),
  status: statusSchema.optional(),
  parentId: z.string().min(1).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  content: contentSchema.optional(),
  contentPlain: plainSchema.optional(),
});

export const updateWritingSchema = z
  .object({
    title: titleSchema.optional(),
    type: typeSchema.optional(),
    status: statusSchema.optional(),
    parentId: z.string().min(1).nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
    content: contentSchema.optional(),
    contentPlain: plainSchema.optional(),
    createVersion: z.boolean().optional(),
    versionNote: z.string().trim().max(500).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const reorderWritingsSchema = z.object({
  order: z
    .array(
      z.object({
        id: z.string().min(1),
        parentId: z.string().min(1).nullable(),
        sortOrder: z.number().int().min(0),
      }),
    )
    .min(1)
    .max(500),
});

export const createWritingVersionSchema = z.object({
  note: z.string().trim().max(500).optional(),
});

export type CreateWritingInput = z.infer<typeof createWritingSchema>;
export type UpdateWritingInput = z.infer<typeof updateWritingSchema>;
export type ReorderWritingsInput = z.infer<typeof reorderWritingsSchema>;
export type CreateWritingVersionInput = z.infer<typeof createWritingVersionSchema>;
