import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  // The Writing Studio is a "studio" surface — give it the whole viewport
  // width and slim vertical padding so the editor itself becomes the
  // primary canvas instead of a narrow inset.
  const isStudio = /\/write(?:\/|$)/.test(location.pathname);
  return (
    <div className="flex min-h-screen flex-col bg-bg-primary text-text-primary">
      <Navbar />
      <main
        key={location.pathname}
        className={[
          'anim-fade-up mx-auto w-full flex-1',
          isStudio
            ? 'max-w-[1600px] px-3 py-3 sm:px-4 sm:py-4'
            : 'max-w-7xl px-4 py-6 sm:px-6 sm:py-10',
        ].join(' ')}
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
