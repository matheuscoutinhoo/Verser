import { Link } from 'react-router-dom';
import type { MouseEvent } from 'react';
import type { Universe } from '@verser/shared';
import { TrashIcon } from '../ui/Icons';

export interface UniverseCardProps {
  universe: Universe;
  /** Optional inline delete handler. When provided, a small trash button
   *  appears in the top-right of the card. The card itself is a link, so
   *  the button stops propagation to avoid navigating into the universe. */
  onDelete?: (universe: Universe) => void;
}

export function UniverseCard({ universe, onDelete }: UniverseCardProps) {
  function handleDeleteClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    onDelete?.(universe);
  }

  return (
    <Link
      to={`/universes/${universe.id}`}
      className="surface-card is-interactive gold-glow-hover group relative block aspect-[4/5] overflow-hidden transition-transform duration-base ease-out hover:-translate-y-1"
    >
      {universe.coverUrl ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-slow ease-out group-hover:scale-105"
            style={{ backgroundImage: `url(${universe.coverUrl})` }}
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/70 to-transparent"
            aria-hidden
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-parchment-gradient" aria-hidden />
      )}

      {onDelete ? (
        <button
          type="button"
          onClick={handleDeleteClick}
          aria-label={`Delete universe ${universe.name}`}
          title="Delete universe"
          className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-bg-primary/55 text-text-secondary opacity-0 backdrop-blur-md transition-all duration-base ease-out hover:border-accent-red/40 hover:bg-accent-red-soft hover:text-accent-red group-hover:opacity-100 focus-visible:opacity-100"
        >
          <TrashIcon />
        </button>
      ) : null}

      <div className="relative flex h-full flex-col justify-end gap-2 p-5">
        {universe.genre ? (
          <p className="font-ui text-[10px] uppercase tracking-[0.22em] text-text-accent/80">
            {universe.genre}
          </p>
        ) : null}
        <h3 className="font-display text-2xl leading-tight text-text-primary drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
          {universe.name}
        </h3>
        {universe.description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-text-secondary drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">
            {universe.description}
          </p>
        ) : null}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
            {new Date(universe.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <span
            aria-hidden
            className="text-xs text-text-accent/70 transition-transform duration-fast ease-out group-hover:translate-x-1"
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
