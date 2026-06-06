import type { ReactNode } from 'react';

export interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  glyph?: ReactNode;
}

export function StatCard({ label, value, hint, glyph }: StatCardProps) {
  return (
    <article className="surface-card flex flex-col gap-1 p-5">
      <div className="flex items-center justify-between">
        <p className="font-ui text-xs uppercase tracking-widest text-text-secondary">
          {label}
        </p>
        {glyph ? (
          <span className="font-display text-base text-text-accent" aria-hidden>
            {glyph}
          </span>
        ) : null}
      </div>
      <p className="font-display text-3xl text-text-accent">{value}</p>
      {hint ? <p className="text-xs text-text-muted">{hint}</p> : null}
    </article>
  );
}
