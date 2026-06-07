import type { MouseEvent, ReactNode } from 'react';
import { PenIcon, TrashIcon } from '../ui/Icons';

export interface PosterCardProps {
  /** Mostrado como `aria-label` do botão e fallback de leitura por screen-reader. */
  name: string;
  /** Imagem principal — quando null, renderizamos um fallback de pergaminho. */
  imageUrl: string | null;
  /** Glyph centralizado no fallback (☉ ◆ ✦ ✧ ◈). */
  fallbackGlyph: ReactNode;
  /** Caption pequena (uppercase tracking-22em) acima do título. */
  caption?: ReactNode;
  /** Título display (geralmente o nome do entity). */
  title: ReactNode;
  /** Snippet de 1–2 linhas abaixo do título. */
  snippet?: ReactNode;
  /** Texto que aparece no canto inferior esquerdo (ex.: data). */
  footnote?: ReactNode;
  /** Toda card é um botão; isso é o que dispara o detalhe. */
  onOpen: () => void;
  /** Mostrado num glass toolbar no hover/focus se passado. */
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Generic poster-style worldbuilding card.
 *
 * Mirrors UniverseCard: 4:5 ratio, full-bleed image with a parchment
 * fallback, dark gradient overlay for legibility, gold-glow halo on
 * hover, and a hover-revealed glass toolbar (pen/trash) in the top-right
 * corner. The entire card is a button — onOpen fires on click; the
 * inline edit/delete buttons stop propagation so they don't fire onOpen.
 */
export function PosterCard({
  name,
  imageUrl,
  fallbackGlyph,
  caption,
  title,
  snippet,
  footnote,
  onOpen,
  onEdit,
  onDelete,
}: PosterCardProps) {
  function stop(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="surface-card is-interactive gold-glow-hover group relative block aspect-[4/5] w-full overflow-hidden text-left transition-transform duration-base ease-out hover:-translate-y-1"
      aria-label={`Open ${name}`}
    >
      {imageUrl ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-slow ease-out group-hover:scale-105"
            style={{ backgroundImage: `url(${imageUrl})` }}
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/70 to-transparent"
            aria-hidden
          />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-parchment-gradient" aria-hidden />
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center font-display text-7xl text-text-accent/30"
          >
            {fallbackGlyph}
          </div>
        </>
      )}

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

      <div className="relative flex h-full flex-col justify-end gap-2 p-5">
        {caption ? (
          <p className="line-clamp-1 font-ui text-[10px] uppercase tracking-[0.22em] text-text-accent/80">
            {caption}
          </p>
        ) : null}
        <h3 className="font-display text-2xl leading-tight text-text-primary drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
          {title}
        </h3>
        {snippet ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-text-secondary drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">
            {snippet}
          </p>
        ) : null}
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
            {footnote}
          </span>
          <span
            aria-hidden
            className="text-xs text-text-accent/70 transition-transform duration-fast ease-out group-hover:translate-x-1"
          >
            →
          </span>
        </div>
      </div>
    </button>
  );
}
