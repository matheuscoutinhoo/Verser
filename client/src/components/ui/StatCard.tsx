import type { ReactNode } from 'react';

export interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  glyph?: ReactNode;
}

export function StatCard({ label, value, hint, glyph }: StatCardProps) {
  return (
    <article className="surface-card is-interactive group flex flex-col gap-2 p-5">
      <div className="flex items-center justify-between">
        <p className="font-ui text-[10px] uppercase tracking-[0.22em] text-text-secondary">
          {label}
        </p>
        {glyph ? (
          <span
            className="font-display text-sm text-text-accent/70 transition-colors group-hover:text-text-accent"
            aria-hidden
          >
            {glyph}
          </span>
        ) : null}
      </div>
      <p className="font-display text-3xl leading-none tracking-wide text-text-primary">
        {value}
      </p>
      {hint ? <p className="text-xs text-text-muted">{hint}</p> : null}
    </article>
  );
}
