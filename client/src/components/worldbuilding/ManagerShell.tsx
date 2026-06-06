import type { ReactNode } from 'react';
import { EmptyState } from '../ui/EmptyState';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/Button';

export interface ManagerShellProps {
  title: string;
  description?: ReactNode;
  /** Action button shown in the header (typically "New"). */
  primaryAction?: ReactNode;
  /** Filter / search controls rendered below the header. */
  controls?: ReactNode;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  /** Truthy when there are 0 items after loading. */
  isEmpty: boolean;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  emptyGlyph?: ReactNode;
  emptyAction?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
}

/**
 * Common layout used by all worldbuilding managers: header + filters + status
 * (loading/error/empty) + children.
 */
export function ManagerShell({
  title,
  description,
  primaryAction,
  controls,
  status,
  error,
  isEmpty,
  emptyTitle,
  emptyDescription,
  emptyGlyph,
  emptyAction,
  onRetry,
  children,
}: ManagerShellProps) {
  return (
    <div className="space-y-5 anim-fade-up">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-base uppercase tracking-[0.22em] text-text-primary">
            {title}
          </h3>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-text-secondary">
              {description}
            </p>
          ) : null}
        </div>
        {primaryAction}
      </header>

      {controls ? <div className="flex flex-wrap items-center gap-2">{controls}</div> : null}

      {status === 'error' ? (
        <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-accent-red">{error}</p>
          {onRetry ? (
            <Button size="sm" variant="secondary" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}

      {status === 'loading' && isEmpty ? <Spinner label={`Loading ${title.toLowerCase()}…`} /> : null}

      {status === 'ready' && isEmpty ? (
        <EmptyState
          glyph={emptyGlyph ?? '◇'}
          title={emptyTitle ?? `No ${title.toLowerCase()} yet`}
          description={emptyDescription}
          action={emptyAction}
        />
      ) : null}

      {/* Always render children — managers put their dialogs/modals here so
          they remain mounted even when the list view shows an empty state. */}
      {children}
    </div>
  );
}
