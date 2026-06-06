import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  glyph?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, glyph, action }: EmptyStateProps) {
  return (
    <div className="surface-card flex flex-col items-center gap-3 p-8 text-center">
      {glyph ? (
        <span className="font-display text-4xl text-text-accent" aria-hidden>
          {glyph}
        </span>
      ) : null}
      <h3 className="font-display text-xl text-text-accent">{title}</h3>
      {description ? <p className="max-w-md text-sm text-text-secondary">{description}</p> : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
