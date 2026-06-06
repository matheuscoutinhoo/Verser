import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  glyph?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, glyph, action }: EmptyStateProps) {
  return (
    <div className="surface-card flex flex-col items-center gap-4 px-6 py-12 text-center">
      {glyph ? (
        <span
          className="font-display text-3xl text-text-accent/60"
          aria-hidden
        >
          {glyph}
        </span>
      ) : null}
      <h3 className="font-display text-base uppercase tracking-[0.25em] text-text-primary">
        {title}
      </h3>
      {description ? (
        <p className="max-w-md text-sm leading-relaxed text-text-secondary">{description}</p>
      ) : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
