import type { MouseEvent } from 'react';
import type { Location } from '@verser/shared';
import { PenIcon, TrashIcon } from '../ui/Icons';

export interface LocationCardProps {
  location: Location;
  /** Optional parent location name for the badge ribbon. */
  parentName?: string | null;
  onOpen: (location: Location) => void;
  onEdit?: (location: Location) => void;
  onDelete?: (location: Location) => void;
}

/**
 * Poster-style location card that mirrors UniverseCard / CharacterCard:
 * full-bleed imagery (or parchment fallback) with a dark gradient + footer
 * overlay. Hover reveals quick edit/delete buttons in the top-right glass
 * toolbar. The whole card acts as a button that opens the detail modal.
 */
export function LocationCard({
  location,
  parentName,
  onOpen,
  onEdit,
  onDelete,
}: LocationCardProps) {
  function stop(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(location)}
      className="surface-card is-interactive gold-glow-hover group relative block aspect-[4/5] w-full overflow-hidden text-left transition-transform duration-base ease-out hover:-translate-y-1"
      aria-label={`Open ${location.name}`}
    >
      {location.imageUrl ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-slow ease-out group-hover:scale-105"
            style={{ backgroundImage: `url(${location.imageUrl})` }}
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
            ◆
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
                onEdit(location);
              }}
              aria-label={`Edit ${location.name}`}
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
                onDelete(location);
              }}
              aria-label={`Delete ${location.name}`}
              title="Delete"
              className="inline-flex h-7 w-7 items-center justify-center rounded text-text-secondary transition-colors hover:bg-accent-red-soft hover:text-accent-red"
            >
              <TrashIcon />
            </button>
          ) : null}
        </div>
      )}

      <div className="relative flex h-full flex-col justify-end gap-2 p-5">
        <p className="line-clamp-1 font-ui text-[10px] uppercase tracking-[0.22em] text-text-accent/80">
          {parentName ? `inside ${parentName}` : 'top-level'}
        </p>
        <h3 className="font-display text-2xl leading-tight text-text-primary drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
          {location.name}
        </h3>
        {location.description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-text-secondary drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">
            {location.description}
          </p>
        ) : null}
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
            {new Date(location.createdAt).toLocaleDateString(undefined, {
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
    </button>
  );
}
