import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col bg-bg-primary text-text-primary">
      <Navbar />
      <main
        // Key on pathname triggers the page-fade animation on every route change.
        key={location.pathname}
        className="anim-fade-up mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-10"
      >
        {children}
      </main>
      <footer className="border-t border-border-primary py-6 text-center text-[10px] uppercase tracking-[0.2em] text-text-muted">
        <span className="font-display tracking-[0.35em] text-text-secondary">Verser</span>
        <span className="mx-2 text-border-primary">·</span>
        The World-Aware Writing Studio
      </footer>
    </div>
  );
}
