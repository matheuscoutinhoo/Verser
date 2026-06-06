import type { ReactNode } from 'react';
import { Navbar } from './Navbar';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-primary text-text-primary">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        {children}
      </main>
      <footer className="border-t border-border-primary py-6 text-center text-xs text-text-muted">
        <span className="font-display tracking-widest">VERSER</span> · The World-Aware Writing Studio
      </footer>
    </div>
  );
}
