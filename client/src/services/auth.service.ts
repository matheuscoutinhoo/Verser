import type {
  AuthenticatedUser,
  ChangePasswordInput,
  DeleteAccountInput,
  LoginInput,
  RegisterInput,
  SessionInfo,
  UpdateProfileInput,
} from '@verser/shared';
import { apiClient } from './api-client';

export interface LoginResponse {
  user: AuthenticatedUser;
  tokens: { accessToken: string; expiresIn: number };
}

export const authService = {
  register: (input: RegisterInput): Promise<LoginResponse> =>
    apiClient.post('/auth/register', input, { skipAuth: true, skipRefresh: true }),

  login: (input: LoginInput): Promise<LoginResponse> =>
    apiClient.post('/auth/login', input, { skipAuth: true, skipRefresh: true }),

  refresh: (): Promise<LoginResponse> =>
    apiClient.post('/auth/refresh', undefined, { skipAuth: true, skipRefresh: true }),

  logout: (): Promise<void> =>
    apiClient.post('/auth/logout', undefined, { skipAuth: true, skipRefresh: true }),

  listSessions: (): Promise<SessionInfo[]> => apiClient.get('/auth/sessions'),

  revokeSession: (id: string): Promise<void> => apiClient.delete(`/auth/sessions/${id}`),
};

export const userService = {
  me: (): Promise<AuthenticatedUser> => apiClient.get('/users/me'),
  update: (input: UpdateProfileInput): Promise<AuthenticatedUser> =>
    apiClient.patch('/users/me', input),
  changePassword: (input: ChangePasswordInput): Promise<void> =>
    apiClient.patch('/users/me/password', input),
  deleteAccount: (input: DeleteAccountInput): Promise<void> =>
    apiClient.delete('/users/me', input),
};
