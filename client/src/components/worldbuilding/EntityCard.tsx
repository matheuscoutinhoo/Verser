import type { MouseEvent, ReactNode } from 'react';
import { PenIcon, TrashIcon } from '../ui/Icons';

export interface EntityCardProps {
  /** Mostrado como `aria-label` do botão. */
  name: string;
  /** Glyph principal (decorativo, centro-esquerda). */
  glyph: ReactNode;
  /** Caption pequena uppercase acima do título (ex.: categoria · importância). */
  caption?: ReactNode;
  /** Título display. */
  title: ReactNode;
  /** Snippet de 2–3 linhas. */
  snippet?: ReactNode;
  /** Texto pequeno no canto inferior esquerdo (ex.: data). */
  footnote?: ReactNode;
  onOpen: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Entity card for entities that don't carry imagery (Lore, Laws, …).
 *
 * Shares the same visual vocabulary as PosterCard — gold-glow halo on
 * hover, slight lift, glass toolbar with edit/delete that stops
 * propagation — but uses a side-by-side layout (glyph + text column)
 * on a parchment surface instead of a full-bleed poster.
 */
export function EntityCard({
  name,
  glyph,
  caption,
  title,
  snippet,
  footnote,
  onOpen,
  onEdit,
  onDelete,
}: EntityCardProps) {
  function stop(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${name}`}
      className="surface-card is-interactive gold-glow-hover group relative flex h-full w-full gap-4 overflow-hidden p-5 text-left transition-transform duration-base ease-out hover:-translate-y-1"
    >
      {/* Decorative glyph column */}
      <div
        aria-hidden
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-bg-elevated font-display text-2xl text-text-accent/70 ring-1 ring-border-primary transition-colors duration-base group-hover:text-text-accent group-hover:[text-shadow:var(--glow-gold-text)]"
      >
        {glyph}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {caption ? (
          <p className="line-clamp-1 font-ui text-[10px] uppercase tracking-[0.22em] text-text-accent/80">
            {caption}
          </p>
        ) : null}
        <h3 className="font-display text-lg leading-tight text-text-primary">{title}</h3>
        {snippet ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-text-secondary">{snippet}</p>
        ) : null}
        {footnote ? (
          <span className="mt-auto pt-2 text-[10px] uppercase tracking-[0.2em] text-text-muted">
            {footnote}
          </span>
        ) : null}
      </div>

      {(onEdit || onDelete) && (
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md border border-white/10 bg-bg-primary/55 p-1 opacity-0 backdrop-blur-md transition-opacity duration-base ease-out group-hover:opacity-100 focus-within:opacity-100">
          {onEdit ? (
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                onEdit();
              }}
              aria-label={`Edit ${name}`}
              title="Edit"
              className="inline-flex h-7 w-7 items-center justify-center rounded text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
            >
              <PenIcon />
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                onDelete();
              }}
              aria-label={`Delete ${name}`}
              title="Delete"
              className="inline-flex h-7 w-7 items-center justify-center rounded text-text-secondary transition-colors hover:bg-accent-red-soft hover:text-accent-red"
            >
              <TrashIcon />
            </button>
          ) : null}
        </div>
      )}
    </button>
  );
}
