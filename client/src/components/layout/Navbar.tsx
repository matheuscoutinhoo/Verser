import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Universes', to: '/dashboard' },
];

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

  return (
    <header className="sticky top-0 z-40 border-b border-border-primary bg-bg-primary/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <NavLink
          to="/"
          className="font-display text-lg tracking-[0.35em] text-text-accent transition-colors hover:text-accent-gold-light"
        >
          VERSER
        </NavLink>

        <nav className="hidden gap-6 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                [
                  'relative font-ui text-[11px] uppercase tracking-[0.22em] transition-colors duration-fast',
                  isActive ? 'text-text-accent' : 'text-text-secondary hover:text-text-primary',
                  // Active underline indicator
                  isActive
                    ? 'after:absolute after:-bottom-[18px] after:left-1/2 after:h-px after:w-6 after:-translate-x-1/2 after:bg-accent-gold'
                    : '',
                ].join(' ')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

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
        <nav className="border-t border-border-primary bg-bg-secondary anim-fade-in md:hidden">
          <ul className="flex flex-col px-4 py-3">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    [
                      'block py-2 font-display text-sm uppercase tracking-[0.2em]',
                      isActive ? 'text-text-accent' : 'text-text-secondary',
                    ].join(' ')
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li className="border-t border-border-primary pt-3">
              {isAuthenticated ? (
                <Button size="sm" variant="secondary" className="w-full" onClick={handleLogout}>
                  Logout · {user?.displayName}
                </Button>
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
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
