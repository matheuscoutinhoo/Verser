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
    <article className="surface-card is-interactive group flex gap-4 p-4">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="hidden h-14 w-14 flex-shrink-0 rounded-md object-cover ring-1 ring-border-primary sm:block"
        />
      ) : glyph ? (
        <div className="hidden h-14 w-14 flex-shrink-0 items-center justify-center rounded-md bg-bg-elevated font-display text-xl text-text-accent/70 ring-1 ring-border-primary transition-colors group-hover:text-text-accent sm:flex">
          {glyph}
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="truncate font-display text-base text-text-primary">{title}</h4>
            {subtitle ? (
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-text-secondary">
                {subtitle}
              </p>
            ) : null}
          </div>
          {badges ? <div className="flex flex-wrap gap-1">{badges}</div> : null}
        </div>
        {body ? <div className="mt-2 text-sm leading-relaxed text-text-secondary">{body}</div> : null}

        {(onEdit || onDelete || extraActions) && (
          <div className="mt-3 flex flex-wrap items-center gap-1 opacity-70 transition-opacity duration-fast group-hover:opacity-100">
            {onEdit ? (
              <Button size="sm" variant="ghost" onClick={onEdit}>
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
