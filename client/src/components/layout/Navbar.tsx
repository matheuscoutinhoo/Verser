import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile sheet on navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  async function handleLogout(): Promise<void> {
    await logout();
    navigate('/login');
  }

  // Wordmark is the only nav target — for authenticated users `/` redirects
  // to /dashboard, so Home/Universes links would be redundant.

  return (
    <header className="sticky top-0 z-40 border-b border-border-primary bg-bg-primary/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <NavLink
          to={isAuthenticated ? '/dashboard' : '/'}
          className="gold-text font-display text-lg tracking-[0.35em] transition-opacity hover:opacity-90"
          aria-label="Verser home"
        >
          VERSER
        </NavLink>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <span className="text-xs text-text-secondary">{user?.displayName}</span>
              <Button size="sm" variant="ghost" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className="text-[11px] uppercase tracking-[0.22em] text-text-secondary transition-colors hover:text-text-primary"
              >
                Login
              </NavLink>
              <NavLink to="/register">
                <Button size="sm">Sign up</Button>
              </NavLink>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          className="rounded-md border border-border-primary px-2.5 py-1 text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary md:hidden"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen ? (
        <div className="anim-fade-in border-t border-border-primary bg-bg-secondary md:hidden">
          <div className="px-4 py-3">
            {isAuthenticated ? (
              <div className="flex flex-col gap-2">
                <p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary">
                  Signed in as
                </p>
                <p className="text-sm text-text-primary">{user?.displayName}</p>
                <Button size="sm" variant="secondary" className="mt-2" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <NavLink to="/login" className="flex-1">
                  <Button size="sm" variant="secondary" className="w-full">
                    Login
                  </Button>
                </NavLink>
                <NavLink to="/register" className="flex-1">
                  <Button size="sm" className="w-full">
                    Sign up
                  </Button>
                </NavLink>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
