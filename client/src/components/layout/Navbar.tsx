import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Universes', to: '/dashboard' },
];

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout(): Promise<void> {
    await logout();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border-primary bg-bg-primary/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
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

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-text-secondary md:inline">
                {user?.displayName}
              </span>
              <Button size="sm" variant="secondary" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="text-sm uppercase tracking-wider text-text-secondary hover:text-text-primary">
                Login
              </NavLink>
              <NavLink to="/register">
                <Button size="sm">Sign up</Button>
              </NavLink>
            </>
          )}
        </div>
      </div>
      <div className="ornate-divider" />
    </header>
  );
}
