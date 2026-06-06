import { useAuthStore } from '../stores/auth.store';

export function useAuth() {
  return useAuthStore((s) => ({
    user: s.user,
    status: s.status,
    error: s.error,
    isAuthenticated: s.status === 'authenticated',
    login: s.login,
    register: s.register,
    logout: s.logout,
    clearError: s.clearError,
  }));
}
