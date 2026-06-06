import { Link } from 'react-router-dom';
import type { Universe } from '@verser/shared';

export interface UniverseCardProps {
  universe: Universe;
}

export function UniverseCard({ universe }: UniverseCardProps) {
  return (
    <Link
      to={`/universes/${universe.id}`}
      className="surface-card group relative block min-h-[12rem] overflow-hidden p-6 transition-transform duration-200 hover:-translate-y-0.5"
    >
      {universe.coverUrl ? (
        <>
          {/* Cover artwork as background */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${universe.coverUrl})` }}
            aria-hidden
          />
          {/* Darken so any text remains readable. Stronger at the bottom where the text sits. */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-bg-primary/95 via-bg-primary/70 to-bg-primary/30"
            aria-hidden
          />
          {/* Subtle gold inner glow */}
          <div
            className="absolute inset-0 rounded-md ring-1 ring-inset ring-border-ornate/20"
            aria-hidden
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-parchment-gradient" aria-hidden />
      )}

      <div className="relative flex h-full min-h-[10rem] flex-col justify-end">
        <h3
          className={[
            'font-display text-2xl text-text-accent drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]',
          ].join(' ')}
        >
          {universe.name}
        </h3>
        {universe.genre ? (
          <p className="mt-1 font-ui text-xs uppercase tracking-widest text-text-secondary">
            {universe.genre}
          </p>
        ) : null}
        {universe.description ? (
          <p className="mt-3 line-clamp-3 text-sm text-text-primary/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.65)]">
            {universe.description}
          </p>
        ) : null}
        <p className="mt-4 text-xs text-text-muted">
          Created {new Date(universe.createdAt).toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}
