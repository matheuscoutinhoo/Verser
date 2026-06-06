import type {
  AIAnalyzeConsistencyInput,
  AIAnalyzeConsistencyResponse,
  AIAssistCreationInput,
  AIAssistCreationResponse,
  AIGenerateImageInput,
  AIGenerateImageResponse,
  AIGenerateTextInput,
  AIGenerateTextResponse,
  AIUsageSummary,
} from '@verser/shared';
import { apiClient } from './api-client';

export const aiService = {
  generateText(input: AIGenerateTextInput): Promise<AIGenerateTextResponse> {
    return apiClient.post('/ai/generate-text', input);
  },
  generateImage(input: AIGenerateImageInput): Promise<AIGenerateImageResponse> {
    return apiClient.post('/ai/generate-image', input);
  },
  analyzeConsistency(input: AIAnalyzeConsistencyInput): Promise<AIAnalyzeConsistencyResponse> {
    return apiClient.post('/ai/analyze-consistency', input);
  },
  assistCreation<TPayload = Record<string, unknown>>(
    input: AIAssistCreationInput,
  ): Promise<AIAssistCreationResponse<TPayload>> {
    return apiClient.post('/ai/assist-creation', input);
  },
  usage(): Promise<AIUsageSummary> {
    return apiClient.get('/ai/usage');
  },
};
