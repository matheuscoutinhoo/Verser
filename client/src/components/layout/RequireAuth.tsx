import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, status } = useAuth();
  const location = useLocation();

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex h-64 items-center justify-center text-text-secondary">Loading…</div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
