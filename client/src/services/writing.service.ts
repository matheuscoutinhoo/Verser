import type {
  CreateWritingInput,
  CreateWritingVersionInput,
  ReorderWritingsInput,
  UpdateWritingInput,
  Writing,
  WritingTreeNode,
  WritingVersion,
} from '@verser/shared';
import { apiClient } from './api-client';

export interface UpdateWritingResult {
  writing: Writing;
  versionCreated: WritingVersion | null;
}

export const writingService = {
  tree(universeId: string): Promise<WritingTreeNode[]> {
    return apiClient.get(`/universes/${universeId}/writings`);
  },
  detail(universeId: string, id: string): Promise<Writing> {
    return apiClient.get(`/universes/${universeId}/writings/${id}`);
  },
  create(universeId: string, input: CreateWritingInput): Promise<Writing> {
    return apiClient.post(`/universes/${universeId}/writings`, input);
  },
  update(
    universeId: string,
    id: string,
    input: UpdateWritingInput,
  ): Promise<UpdateWritingResult> {
    return apiClient.patch(`/universes/${universeId}/writings/${id}`, input);
  },
  delete(universeId: string, id: string): Promise<void> {
    return apiClient.delete(`/universes/${universeId}/writings/${id}`);
  },
  reorder(universeId: string, input: ReorderWritingsInput): Promise<WritingTreeNode[]> {
    return apiClient.patch(`/universes/${universeId}/writings/reorder`, input);
  },
  listVersions(universeId: string, writingId: string): Promise<WritingVersion[]> {
    return apiClient.get(`/universes/${universeId}/writings/${writingId}/versions`);
  },
  createVersion(
    universeId: string,
    writingId: string,
    input: CreateWritingVersionInput = {},
  ): Promise<WritingVersion> {
    return apiClient.post(
      `/universes/${universeId}/writings/${writingId}/versions`,
      input,
    );
  },
};
