import { Link } from 'react-router-dom';
import type { Universe } from '@verser/shared';

export interface UniverseCardProps {
  universe: Universe;
}

export function UniverseCard({ universe }: UniverseCardProps) {
  return (
    <Link
      to={`/universes/${universe.id}`}
      className="surface-card relative block overflow-hidden p-6 transition-transform duration-200 hover:-translate-y-0.5"
    >
      {universe.coverUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url(${universe.coverUrl})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-parchment-gradient" />
      )}
      <div className="relative">
        <h3 className="font-display text-2xl text-text-accent">{universe.name}</h3>
        {universe.genre ? (
          <p className="mt-1 font-ui text-xs uppercase tracking-widest text-text-secondary">
            {universe.genre}
          </p>
        ) : null}
        {universe.description ? (
          <p className="mt-3 line-clamp-3 text-sm text-text-primary/80">
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
