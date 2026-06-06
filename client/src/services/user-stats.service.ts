import type { UserStats } from '@verser/shared';
import { apiClient } from './api-client';

export const userStatsService = {
  me(): Promise<UserStats> {
    return apiClient.get('/users/me/stats');
  },
};
