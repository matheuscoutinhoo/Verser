import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { UniverseWithCounts } from '@verser/shared';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { OrnateDivider } from '../components/ui/OrnateDivider';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Spinner } from '../components/ui/Spinner';
import { StatCard } from '../components/ui/StatCard';
import { Tabs, type TabDef } from '../components/ui/Tabs';
import { useConfirmDialog } from '../components/ui/useConfirmDialog';
import { CoverImagePicker } from '../components/worldbuilding/CoverImagePicker';
import { CharactersManager } from '../components/worldbuilding/managers/CharactersManager';
import { LocationsManager } from '../components/worldbuilding/managers/LocationsManager';
import { SystemsManager } from '../components/worldbuilding/managers/SystemsManager';
import { LoreManager } from '../components/worldbuilding/managers/LoreManager';
import { LawsManager } from '../components/worldbuilding/managers/LawsManager';
import { TimelineManager } from '../components/worldbuilding/managers/TimelineManager';
import { RelationsManager } from '../components/worldbuilding/managers/RelationsManager';
import { TagsManager } from '../components/worldbuilding/managers/TagsManager';
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

type TabKey =
  | 'characters'
  | 'locations'
  | 'systems'
  | 'lore'
  | 'laws'
  | 'timeline'
  | 'relations'
  | 'tags';

const TABS: ReadonlyArray<TabDef<TabKey>> = [
  { key: 'characters', label: 'Characters', glyph: '☉' },
  { key: 'locations', label: 'Locations', glyph: '◆' },
  { key: 'systems', label: 'Systems', glyph: '✦' },
  { key: 'lore', label: 'Lore', glyph: '✧' },
  { key: 'laws', label: 'Laws', glyph: '◈' },
  { key: 'timeline', label: 'Timeline', glyph: '◇' },
  { key: 'relations', label: 'Relations', glyph: '➤' },
  { key: 'tags', label: 'Tags', glyph: '◉' },
];

export function UniverseDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const { confirm, ConfirmDialogPortal } = useConfirmDialog();
  const [activeTab, setActiveTab] = useState<TabKey>('characters');

  const fetchOne = useCallback(() => universeService.detail(id), [id]);
  const { data, status, error, run } = useAsync(fetchOne);

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

  async function handleUploadCover(file: File): Promise<string> {
    if (!data) throw new Error('Universe not loaded.');
    const { universe } = await universeService.uploadCover(data.id, file);
    await run();
    return universe.coverUrl ?? '';
  }

  async function handleSetCoverUrl(url: string): Promise<void> {
    if (!data) return;
    await universeService.update(data.id, { coverUrl: url });
    await run();
  }

  async function handleRemoveCover(): Promise<void> {
    if (!data) return;
    await universeService.update(data.id, { coverUrl: null });
    await run();
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
      {/* Cover hero — banner image with darken overlay so the meta stays readable. */}
      <section className="relative overflow-hidden rounded-lg border border-border-primary">
        <div
          className="relative h-48 bg-bg-secondary bg-cover bg-center sm:h-64 lg:h-80"
          style={data.coverUrl ? { backgroundImage: `url(${data.coverUrl})` } : undefined}
        >
          {!data.coverUrl ? (
            <div className="absolute inset-0 bg-parchment-gradient" aria-hidden />
          ) : null}
          <div
            className="absolute inset-0 bg-gradient-to-t from-bg-primary/95 via-bg-primary/60 to-bg-primary/10"
            aria-hidden
          />
          <div className="relative flex h-full flex-col justify-end p-4 sm:p-6">
            <Link
              to="/dashboard"
              className="text-xs uppercase tracking-widest text-text-secondary hover:text-text-primary"
            >
              ← All universes
            </Link>
            <h1 className="mt-2 font-display text-3xl text-text-accent drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] sm:text-5xl">
              {data.name}
            </h1>
            {data.genre ? (
              <p className="mt-1 font-ui text-xs uppercase tracking-widest text-text-secondary">
                {data.genre}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border-primary bg-bg-secondary/60 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="max-w-3xl text-sm text-text-primary/90">
            {data.description ?? <span className="text-text-muted">No description yet.</span>}
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <CoverImagePicker
              universeId={data.id}
              currentUrl={data.coverUrl}
              promptHint={`Book cover for "${data.name}"${data.genre ? `, ${data.genre} genre` : ''}${
                data.description ? `. ${data.description.slice(0, 200)}` : ''
              }`}
              onUpload={handleUploadCover}
              onSetUrl={handleSetCoverUrl}
              onRemove={handleRemoveCover}
            />
            <div className="flex flex-wrap gap-2">
              <Link to={`/universes/${data.id}/write`}>
                <Button>Open writing studio →</Button>
              </Link>
              <Button variant="danger" onClick={() => void handleDelete()} loading={deleting}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      </section>

      <OrnateDivider variant="diamond" />

      <section aria-label="World bible">
        <SectionHeader
          title="World bible"
          subtitle="Counts across every category of your universe."
        />
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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

      <section aria-label="Worldbuilding workspace" className="space-y-4">
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
        <div className="pt-2">
          {activeTab === 'characters' && (
            <CharactersManager universeId={data.id} onChange={() => void run()} />
          )}
          {activeTab === 'locations' && (
            <LocationsManager universeId={data.id} onChange={() => void run()} />
          )}
          {activeTab === 'systems' && (
            <SystemsManager universeId={data.id} onChange={() => void run()} />
          )}
          {activeTab === 'lore' && (
            <LoreManager universeId={data.id} onChange={() => void run()} />
          )}
          {activeTab === 'laws' && (
            <LawsManager universeId={data.id} onChange={() => void run()} />
          )}
          {activeTab === 'timeline' && (
            <TimelineManager universeId={data.id} onChange={() => void run()} />
          )}
          {activeTab === 'relations' && (
            <RelationsManager universeId={data.id} onChange={() => void run()} />
          )}
          {activeTab === 'tags' && (
            <TagsManager universeId={data.id} onChange={() => void run()} />
          )}
        </div>
      </section>

      <ConfirmDialogPortal />
    </div>
  );
}
