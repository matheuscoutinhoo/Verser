import { z } from 'zod';
import { AI_MODE, IMAGE_STYLE } from '../constants';

const universeIdField = z.string().min(1, 'universeId is required');

export const aiGenerateTextSchema = z.object({
  universeId: universeIdField,
  mode: z.enum(AI_MODE),
  selection: z.string().max(20_000).optional(),
  instruction: z.string().max(2_000).optional(),
  surrounding: z.string().max(20_000).optional(),
  writingId: z.string().min(1).optional(),
});

export const aiGenerateImageSchema = z.object({
  universeId: universeIdField,
  prompt: z.string().trim().min(3).max(2_000),
  style: z.enum(IMAGE_STYLE),
  width: z.number().int().min(64).max(2048).optional(),
  height: z.number().int().min(64).max(2048).optional(),
});

export const aiAnalyzeConsistencySchema = z.object({
  universeId: universeIdField,
  writingId: z.string().min(1).optional(),
  text: z.string().trim().min(10).max(40_000),
});

export const ASSIST_ENTITY = [
  'character',
  'location',
  'system',
  'lore',
  'immutable_law',
  'timeline_event',
] as const;

export const aiAssistCreationSchema = z.object({
  universeId: universeIdField,
  entityType: z.enum(ASSIST_ENTITY),
  brief: z.string().trim().min(3).max(2_000),
});

export type AIGenerateTextInput = z.infer<typeof aiGenerateTextSchema>;
export type AIGenerateImageInput = z.infer<typeof aiGenerateImageSchema>;
export type AIAnalyzeConsistencyInput = z.infer<typeof aiAnalyzeConsistencySchema>;
export type AIAssistCreationInput = z.infer<typeof aiAssistCreationSchema>;
