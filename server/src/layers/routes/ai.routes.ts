import { Router, type RequestHandler } from 'express';
import {
  aiAnalyzeConsistencySchema,
  aiAssistCreationSchema,
  aiGenerateImageSchema,
  aiGenerateTextSchema,
} from '@verser/shared';
import type { AIController } from '../controllers/ai.controller';
import { asyncHandler } from '../../utils/async-handler';
import { validate } from '../middlewares/validate.middleware';

export function createAIRouter(controller: AIController, authenticate: RequestHandler): Router {
  const router = Router();
  router.use(authenticate);

  router.post(
    '/generate-text',
    validate(aiGenerateTextSchema),
    asyncHandler(controller.generateText),
  );
  router.post(
    '/generate-image',
    validate(aiGenerateImageSchema),
    asyncHandler(controller.generateImage),
  );
  router.post(
    '/analyze-consistency',
    validate(aiAnalyzeConsistencySchema),
    asyncHandler(controller.analyzeConsistency),
  );
  router.post(
    '/assist-creation',
    validate(aiAssistCreationSchema),
    asyncHandler(controller.assistCreation),
  );
  router.get('/usage', asyncHandler(controller.usage));

  return router;
}
