import { z } from 'zod';
import { LORE_IMPORTANCE } from '../constants';

// ─────────────────────────────────────────────
// Reusable primitives
// ─────────────────────────────────────────────

const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(120, 'Name must be at most 120 characters');

const titleSchema = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(200, 'Title must be at most 200 characters');

const shortTextSchema = z.string().trim().max(500).nullable().optional();
const longTextSchema = z.string().trim().max(10_000).nullable().optional();
const requiredLongTextSchema = z.string().trim().min(1, 'Content is required').max(10_000);
const categorySchema = z.string().trim().min(1).max(80);
const customFieldsSchema = z.record(z.unknown()).optional();
const hexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, 'Color must be a hex value like #c4a265')
  .nullable()
  .optional();

const importanceSchema = z.enum(LORE_IMPORTANCE);

// ─────────────────────────────────────────────
// Universe
// ─────────────────────────────────────────────

export const createUniverseSchema = z.object({
  name: nameSchema,
  description: shortTextSchema,
  genre: z.string().trim().max(50).nullable().optional(),
});

export const updateUniverseSchema = z
  .object({
    name: nameSchema.optional(),
    description: shortTextSchema,
    genre: z.string().trim().max(50).nullable().optional(),
    coverUrl: z.string().url().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const universeIdParamSchema = z.object({
  universeId: z.string().min(1),
});

// ─────────────────────────────────────────────
// Character
// ─────────────────────────────────────────────

const aliasesSchema = z.array(z.string().trim().min(1).max(80)).max(20).optional();

export const upsertCharacterSchema = z.object({
  name: nameSchema,
  aliases: aliasesSchema,
  physicalDesc: longTextSchema,
  personality: longTextSchema,
  backstory: longTextSchema,
  motivations: longTextSchema,
  skills: longTextSchema,
  notes: longTextSchema,
  imageUrl: z.string().url().nullable().optional(),
  imageStyle: z.string().trim().max(30).nullable().optional(),
  customFields: customFieldsSchema,
});

export const updateCharacterSchema = upsertCharacterSchema
  .partial()
  .extend({
    imageUrl: z.string().url().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

// ─────────────────────────────────────────────
// Character Relation
// ─────────────────────────────────────────────

export const upsertCharacterRelationSchema = z
  .object({
    fromCharacterId: z.string().min(1),
    toCharacterId: z.string().min(1),
    relationType: z.string().trim().min(1).max(50),
    description: longTextSchema,
  })
  .refine((data) => data.fromCharacterId !== data.toCharacterId, {
    message: 'A character cannot relate to itself',
    path: ['toCharacterId'],
  });

export const updateCharacterRelationSchema = z
  .object({
    relationType: z.string().trim().min(1).max(50).optional(),
    description: longTextSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

// ─────────────────────────────────────────────
// Location
// ─────────────────────────────────────────────

export const upsertLocationSchema = z.object({
  name: nameSchema,
  description: longTextSchema,
  geography: longTextSchema,
  culture: longTextSchema,
  history: longTextSchema,
  climate: shortTextSchema,
  population: shortTextSchema,
  imageUrl: z.string().url().nullable().optional(),
  imageStyle: z.string().trim().max(30).nullable().optional(),
  customFields: customFieldsSchema,
  parentId: z.string().min(1).nullable().optional(),
});

export const updateLocationSchema = upsertLocationSchema
  .partial()
  .extend({
    imageUrl: z.string().url().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

// ─────────────────────────────────────────────
// World System
// ─────────────────────────────────────────────

export const upsertWorldSystemSchema = z.object({
  name: nameSchema,
  type: z.string().trim().min(1).max(50),
  description: longTextSchema,
  rules: longTextSchema,
  limitations: longTextSchema,
  interactions: longTextSchema,
  imageUrl: z.string().url().nullable().optional(),
  imageStyle: z.string().trim().max(30).nullable().optional(),
  customFields: customFieldsSchema,
});

export const updateWorldSystemSchema = upsertWorldSystemSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' },
);

// ─────────────────────────────────────────────
// Lore Entry
// ─────────────────────────────────────────────

export const upsertLoreEntrySchema = z.object({
  title: titleSchema,
  category: categorySchema,
  content: requiredLongTextSchema,
  importance: importanceSchema.optional(),
  customFields: customFieldsSchema,
});

export const updateLoreEntrySchema = upsertLoreEntrySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' },
);

// ─────────────────────────────────────────────
// Immutable Law
// ─────────────────────────────────────────────

export const upsertImmutableLawSchema = z.object({
  title: titleSchema,
  description: requiredLongTextSchema,
  category: categorySchema,
});

export const updateImmutableLawSchema = upsertImmutableLawSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' },
);

// ─────────────────────────────────────────────
// Timeline Event
// ─────────────────────────────────────────────

export const upsertTimelineEventSchema = z.object({
  title: titleSchema,
  description: longTextSchema,
  date: z.string().trim().min(1).max(80),
  sortOrder: z.number().int().min(0).optional(),
  importance: importanceSchema.optional(),
});

export const updateTimelineEventSchema = upsertTimelineEventSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' },
);

export const reorderTimelineSchema = z.object({
  order: z
    .array(
      z.object({
        id: z.string().min(1),
        sortOrder: z.number().int().min(0),
      }),
    )
    .min(1)
    .max(500),
});

// ─────────────────────────────────────────────
// Universe Tag
// ─────────────────────────────────────────────

export const upsertUniverseTagSchema = z.object({
  name: z.string().trim().min(1).max(50),
  color: hexColorSchema,
});

// ─────────────────────────────────────────────
// Inferred input types
// ─────────────────────────────────────────────

export type CreateUniverseInput = z.infer<typeof createUniverseSchema>;
export type UpdateUniverseInput = z.infer<typeof updateUniverseSchema>;
export type UpsertCharacterInput = z.infer<typeof upsertCharacterSchema>;
export type UpdateCharacterInput = z.infer<typeof updateCharacterSchema>;
export type UpsertCharacterRelationInput = z.infer<typeof upsertCharacterRelationSchema>;
export type UpdateCharacterRelationInput = z.infer<typeof updateCharacterRelationSchema>;
export type UpsertLocationInput = z.infer<typeof upsertLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type UpsertWorldSystemInput = z.infer<typeof upsertWorldSystemSchema>;
export type UpdateWorldSystemInput = z.infer<typeof updateWorldSystemSchema>;
export type UpsertLoreEntryInput = z.infer<typeof upsertLoreEntrySchema>;
export type UpdateLoreEntryInput = z.infer<typeof updateLoreEntrySchema>;
export type UpsertImmutableLawInput = z.infer<typeof upsertImmutableLawSchema>;
export type UpdateImmutableLawInput = z.infer<typeof updateImmutableLawSchema>;
export type UpsertTimelineEventInput = z.infer<typeof upsertTimelineEventSchema>;
export type UpdateTimelineEventInput = z.infer<typeof updateTimelineEventSchema>;
export type ReorderTimelineInput = z.infer<typeof reorderTimelineSchema>;
export type UpsertUniverseTagInput = z.infer<typeof upsertUniverseTagSchema>;
