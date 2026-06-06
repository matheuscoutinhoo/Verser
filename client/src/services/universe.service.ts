import type {
  CreateUniverseInput,
  PaginatedResult,
  UpdateUniverseInput,
  Universe,
  UniverseWithCounts,
} from '@verser/shared';
import { apiClient } from './api-client';

export interface UniverseListParams {
  page?: number;
  limit?: number;
  search?: string;
}

function toQuery(params: UniverseListParams): string {
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.search) sp.set('search', params.search);
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const universeService = {
  list(params: UniverseListParams = {}): Promise<PaginatedResult<Universe>> {
    return apiClient.get(`/universes${toQuery(params)}`);
  },
  detail(id: string): Promise<UniverseWithCounts> {
    return apiClient.get(`/universes/${id}`);
  },
  create(input: CreateUniverseInput): Promise<Universe> {
    return apiClient.post('/universes', input);
  },
  update(id: string, input: UpdateUniverseInput): Promise<Universe> {
    return apiClient.patch(`/universes/${id}`, input);
  },
  delete(id: string): Promise<void> {
    return apiClient.delete(`/universes/${id}`);
  },
};
