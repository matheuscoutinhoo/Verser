import { create } from 'zustand';
import type { AuthenticatedUser, LoginInput, RegisterInput } from '@verser/shared';
import { apiClient } from '../services/api-client';
import { authService } from '../services/auth.service';

export interface AuthState {
  user: AuthenticatedUser | null;
  accessToken: string | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | null>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: 'idle',
  error: null,

  bootstrap: async () => {
    set({ status: 'loading' });
    try {
      const result = await authService.refresh();
      set({
        user: result.user,
        accessToken: result.tokens.accessToken,
        status: 'authenticated',
        error: null,
      });
    } catch {
      set({ user: null, accessToken: null, status: 'unauthenticated' });
    }
  },

  login: async (input) => {
    set({ status: 'loading', error: null });
    try {
      const result = await authService.login(input);
      set({
        user: result.user,
        accessToken: result.tokens.accessToken,
        status: 'authenticated',
        error: null,
      });
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Login failed',
      });
      throw err;
    }
  },

  register: async (input) => {
    set({ status: 'loading', error: null });
    try {
      const result = await authService.register(input);
      set({
        user: result.user,
        accessToken: result.tokens.accessToken,
        status: 'authenticated',
        error: null,
      });
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Registration failed',
      });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Logout is idempotent on the client — clear local state regardless of network errors.
    } finally {
      set({ user: null, accessToken: null, status: 'unauthenticated', error: null });
    }
  },

  refresh: async () => {
    try {
      const result = await authService.refresh();
      set({
        user: result.user,
        accessToken: result.tokens.accessToken,
        status: 'authenticated',
      });
      return result.tokens.accessToken;
    } catch {
      set({ user: null, accessToken: null, status: 'unauthenticated' });
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));

// Wire the API client's auth + refresh callbacks to the store.
apiClient.configure({
  getToken: () => useAuthStore.getState().accessToken,
  setToken: (token) => useAuthStore.setState({ accessToken: token }),
  refresh: () => useAuthStore.getState().refresh(),
});
