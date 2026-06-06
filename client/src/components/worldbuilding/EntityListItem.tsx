import type { ReactNode } from 'react';
import { Button } from '../ui/Button';

export interface EntityListItemProps {
  title: ReactNode;
  subtitle?: ReactNode;
  body?: ReactNode;
  imageUrl?: string | null;
  glyph?: ReactNode;
  badges?: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  extraActions?: ReactNode;
}

/**
 * Generic card-like row used by every manager. Keeps spacing, borders, and
 * action layout consistent across entity types without forcing every manager
 * to repeat the markup.
 */
export function EntityListItem({
  title,
  subtitle,
  body,
  imageUrl,
  glyph,
  badges,
  onEdit,
  onDelete,
  extraActions,
}: EntityListItemProps) {
  return (
    <article className="surface-card flex gap-4 p-4">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="hidden h-16 w-16 flex-shrink-0 rounded-md object-cover ring-1 ring-border-primary sm:block"
        />
      ) : glyph ? (
        <div className="hidden h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-bg-tertiary font-display text-2xl text-text-accent ring-1 ring-border-primary sm:flex">
          {glyph}
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="truncate font-display text-lg text-text-accent">{title}</h4>
            {subtitle ? (
              <p className="mt-0.5 text-xs uppercase tracking-wider text-text-secondary">
                {subtitle}
              </p>
            ) : null}
          </div>
          {badges ? <div className="flex flex-wrap gap-1">{badges}</div> : null}
        </div>
        {body ? <div className="mt-2 text-sm text-text-primary/90">{body}</div> : null}

        {(onEdit || onDelete || extraActions) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {onEdit ? (
              <Button size="sm" variant="secondary" onClick={onEdit}>
                Edit
              </Button>
            ) : null}
            {extraActions}
            {onDelete ? (
              <Button size="sm" variant="ghost" onClick={onDelete}>
                Delete
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}
