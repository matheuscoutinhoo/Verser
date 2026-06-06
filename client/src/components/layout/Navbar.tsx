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
    <header className="sticky top-0 z-40 border-b border-border-primary bg-bg-primary/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <NavLink to="/" className="font-display text-2xl tracking-widest text-text-accent">
          VERSER
        </NavLink>

        <nav className="hidden gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                [
                  'font-display text-sm uppercase tracking-[0.2em] transition-colors duration-200',
                  isActive ? 'text-text-accent' : 'text-text-secondary hover:text-text-primary',
                ].join(' ')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-text-secondary">{user?.displayName}</span>
              <Button size="sm" variant="secondary" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className="text-sm uppercase tracking-wider text-text-secondary hover:text-text-primary"
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
          className="rounded border border-border-primary px-3 py-1 text-text-accent md:hidden"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen ? (
        <nav className="border-t border-border-primary bg-bg-secondary md:hidden">
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

      <div className="ornate-divider" />
    </header>
  );
}
