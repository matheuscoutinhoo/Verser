import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { UniverseWithCounts } from '@verser/shared';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { OrnateDivider } from '../components/ui/OrnateDivider';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Spinner } from '../components/ui/Spinner';
import { StatCard } from '../components/ui/StatCard';
import { useConfirmDialog } from '../components/ui/useConfirmDialog';
import { useAsync } from '../hooks/useAsync';
import { universeService } from '../services/universe.service';

const SECTIONS: Array<{ key: keyof UniverseWithCounts['counts']; label: string; glyph: string }> = [
  { key: 'characters', label: 'Characters', glyph: '☉' },
  { key: 'locations', label: 'Locations', glyph: '◆' },
  { key: 'systems', label: 'Systems', glyph: '✦' },
  { key: 'loreEntries', label: 'Lore', glyph: '✧' },
  { key: 'immutableLaws', label: 'Laws', glyph: '◈' },
  { key: 'timelineEvents', label: 'Timeline', glyph: '◇' },
  { key: 'tags', label: 'Tags', glyph: '◉' },
  { key: 'writings', label: 'Writings', glyph: '✒' },
];

export function UniverseDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const { confirm, ConfirmDialogPortal } = useConfirmDialog();

  const fetchOne = useCallback(() => universeService.detail(id), [id]);
  const { data, status, error } = useAsync(fetchOne);

  async function handleDelete(): Promise<void> {
    if (!data) return;
    const ok = await confirm({
      title: 'Delete universe?',
      description: (
        <>
          <p>
            <strong className="text-text-accent">{data.name}</strong> and all its characters,
            locations, systems, lore, laws, timeline events, tags and writings will be permanently
            removed.
          </p>
          <p className="mt-2 text-text-muted">This cannot be undone.</p>
        </>
      ),
      confirmLabel: 'Delete forever',
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await universeService.delete(data.id);
      navigate('/dashboard');
    } finally {
      setDeleting(false);
    }
  }

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="py-10">
        <Spinner label="Loading universe…" />
      </div>
    );
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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            to="/dashboard"
            className="text-xs uppercase tracking-widest text-text-secondary hover:text-text-primary"
          >
            ← All universes
          </Link>
          <h1 className="mt-2 font-display text-3xl text-text-accent sm:text-4xl">{data.name}</h1>
          {data.genre ? (
            <p className="mt-1 font-ui text-xs uppercase tracking-widest text-text-secondary">
              {data.genre}
            </p>
          ) : null}
          {data.description ? (
            <p className="mt-4 max-w-2xl text-text-primary/90">{data.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/universes/${data.id}/write`}>
            <Button>Open writing studio →</Button>
          </Link>
          <Button variant="danger" onClick={() => void handleDelete()} loading={deleting}>
            Delete
          </Button>
        </div>
      </header>

      <OrnateDivider variant="diamond" />

      <section aria-label="World bible">
        <SectionHeader title="World bible" subtitle="Counts across every category of your universe." />
        <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {SECTIONS.map((section) => (
            <StatCard
              key={section.key}
              label={section.label}
              value={data.counts[section.key]}
              glyph={section.glyph}
            />
          ))}
        </div>
      </section>

      <section>
        <Card
          title="Manage your worldbuilding"
          subtitle="Per-entity editors are part of Phase 5 polish."
        >
          <p className="text-sm text-text-secondary">
            Characters, locations, systems, lore, immutable laws, timeline events and tags can
            already be managed through the API. The writing studio uses them automatically as
            context for the AI assistant.
          </p>
        </Card>
      </section>

      <ConfirmDialogPortal />
    </div>
  );
}
