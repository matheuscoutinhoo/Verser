import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { UniverseWithCounts } from '@verser/shared';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAsync } from '../hooks/useAsync';
import { universeService } from '../services/universe.service';

const SECTIONS: Array<{ key: keyof UniverseWithCounts['counts']; label: string }> = [
  { key: 'characters', label: 'Characters' },
  { key: 'locations', label: 'Locations' },
  { key: 'systems', label: 'Systems' },
  { key: 'loreEntries', label: 'Lore' },
  { key: 'immutableLaws', label: 'Laws' },
  { key: 'timelineEvents', label: 'Timeline' },
  { key: 'tags', label: 'Tags' },
  { key: 'writings', label: 'Writings' },
];

export function UniverseDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const fetchOne = useCallback(() => universeService.detail(id), [id]);
  const { data, status, error } = useAsync(fetchOne);

  async function handleDelete(): Promise<void> {
    if (!data) return;
    if (!confirm(`Delete universe "${data.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await universeService.delete(data.id);
      navigate('/dashboard');
    } finally {
      setDeleting(false);
    }
  }

  if (status === 'loading' || status === 'idle') {
    return <p className="text-text-secondary">Loading…</p>;
  }

  if (status === 'error' || !data) {
    return (
      <Card title="Universe unavailable">
        <p className="text-sm text-accent-red">
          {error?.message ?? 'This universe could not be loaded.'}
        </p>
        <Link to="/dashboard" className="mt-4 inline-block text-text-accent hover:underline">
          ← Back to dashboard
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link to="/dashboard" className="text-xs uppercase tracking-widest text-text-secondary hover:text-text-primary">
            ← All universes
          </Link>
          <h1 className="mt-2 font-display text-4xl text-text-accent">{data.name}</h1>
          {data.genre ? (
            <p className="mt-1 font-ui text-xs uppercase tracking-widest text-text-secondary">
              {data.genre}
            </p>
          ) : null}
          {data.description ? (
            <p className="mt-4 max-w-2xl text-text-primary/90">{data.description}</p>
          ) : null}
        </div>
        <Button variant="danger" onClick={() => void handleDelete()} loading={deleting}>
          Delete
        </Button>
      </header>

      <div className="ornate-divider" />

      <section className="flex justify-end">
        <Link to={`/universes/${data.id}/write`}>
          <Button>Open writing studio →</Button>
        </Link>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl text-text-accent">World bible</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map((section) => (
            <Card key={section.key} className="text-center">
              <p className="font-display text-3xl text-text-accent">
                {data.counts[section.key]}
              </p>
              <p className="mt-1 text-xs uppercase tracking-widest text-text-secondary">
                {section.label}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <Card
          title="Manage your worldbuilding"
          subtitle="Per-entity editors land in upcoming Phase 2 iterations."
        >
          <p className="text-sm text-text-secondary">
            Characters, locations, systems, lore, immutable laws, timeline events, and tags can
            already be managed through the API. UI editors are scheduled as the next Phase 2
            increment.
          </p>
        </Card>
      </section>
    </div>
  );
}
