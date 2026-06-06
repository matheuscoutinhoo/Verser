import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { UniverseWithCounts } from '@verser/shared';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ArrowRightIcon, TrashIcon } from '../components/ui/Icons';
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
  // Track which tabs have ever been opened. We render visited tabs once and
  // toggle visibility via the `hidden` attribute so revisiting a tab doesn't
  // unmount its manager (which would refetch and flash a spinner).
  const [visited, setVisited] = useState<Record<TabKey, boolean>>(() => ({
    characters: true,
    locations: false,
    systems: false,
    lore: false,
    laws: false,
    timeline: false,
    relations: false,
    tags: false,
  }));

  useEffect(() => {
    setVisited((prev) => (prev[activeTab] ? prev : { ...prev, [activeTab]: true }));
  }, [activeTab]);

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
    <div className="space-y-10">
      {/* Cover hero — minimal silhouette frame, image bleeds top-to-bottom. */}
      <section className="surface-card overflow-hidden">
        <div
          className="relative h-56 bg-bg-secondary bg-cover bg-center sm:h-72 lg:h-96"
          style={data.coverUrl ? { backgroundImage: `url(${data.coverUrl})` } : undefined}
        >
          {!data.coverUrl ? (
            <div className="absolute inset-0 bg-parchment-gradient" aria-hidden />
          ) : null}
          {/* Subtle dual-tone overlay keeps the bottom legible without darkening the whole frame */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/50 to-transparent"
            aria-hidden
          />

          {/* Floating cover tools — top-right, glass surface, only when content needs them */}
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-lg border border-white/10 bg-bg-primary/55 p-1 backdrop-blur-md">
            <CoverImagePicker
              variant="compact"
              universeId={data.id}
              currentUrl={data.coverUrl}
              promptHint={`Book cover for "${data.name}"${data.genre ? `, ${data.genre} genre` : ''}${
                data.description ? `. ${data.description.slice(0, 200)}` : ''
              }`}
              onUpload={handleUploadCover}
              onSetUrl={handleSetCoverUrl}
              onRemove={handleRemoveCover}
            />
          </div>

          <div className="relative flex h-full flex-col justify-end p-6 sm:p-8">
            <Link
              to="/dashboard"
              className="self-start text-[10px] uppercase tracking-[0.22em] text-text-secondary transition-colors hover:text-text-primary"
            >
              ← All universes
            </Link>
            <div className="mt-3">
              {data.genre ? (
                <p className="font-ui text-[10px] uppercase tracking-[0.25em] text-text-accent/80">
                  {data.genre}
                </p>
              ) : null}
              <h1 className="mt-1 font-display text-4xl tracking-tight text-text-primary drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] sm:text-5xl lg:text-6xl">
                {data.name}
              </h1>
            </div>
          </div>
        </div>

        {/* Compact footer: description on the left, single primary CTA on the right,
            destructive action discreetly tucked at the far end. */}
        <div className="flex flex-col gap-4 border-t border-border-primary p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="max-w-3xl text-sm leading-relaxed text-text-secondary">
            {data.description ?? (
              <span className="text-text-muted italic">No description yet.</span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:flex-shrink-0">
            <Link to={`/universes/${data.id}/write`}>
              <Button>
                Writing studio
                <ArrowRightIcon />
              </Button>
            </Link>
            <Button
              size="icon"
              variant="ghost"
              title="Delete universe"
              aria-label="Delete universe"
              onClick={() => void handleDelete()}
              loading={deleting}
            >
              <TrashIcon />
            </Button>
          </div>
        </div>
      </section>

      <section aria-label="World bible" className="space-y-4">
        <SectionHeader
          title="World bible"
          subtitle="A glance at every category of your universe."
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
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

      <OrnateDivider variant="diamond" />

      <section aria-label="Worldbuilding workspace" className="space-y-6">
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
        {/* Keep-alive: render each tab once visited and toggle visibility.
            Avoids the flash-of-spinner that comes from remounting on every
            tab switch. */}
        <div className="relative">
          {visited.characters && (
            <TabPanel active={activeTab === 'characters'}>
              <CharactersManager universeId={data.id} onChange={() => void run()} />
            </TabPanel>
          )}
          {visited.locations && (
            <TabPanel active={activeTab === 'locations'}>
              <LocationsManager universeId={data.id} onChange={() => void run()} />
            </TabPanel>
          )}
          {visited.systems && (
            <TabPanel active={activeTab === 'systems'}>
              <SystemsManager universeId={data.id} onChange={() => void run()} />
            </TabPanel>
          )}
          {visited.lore && (
            <TabPanel active={activeTab === 'lore'}>
              <LoreManager universeId={data.id} onChange={() => void run()} />
            </TabPanel>
          )}
          {visited.laws && (
            <TabPanel active={activeTab === 'laws'}>
              <LawsManager universeId={data.id} onChange={() => void run()} />
            </TabPanel>
          )}
          {visited.timeline && (
            <TabPanel active={activeTab === 'timeline'}>
              <TimelineManager universeId={data.id} onChange={() => void run()} />
            </TabPanel>
          )}
          {visited.relations && (
            <TabPanel active={activeTab === 'relations'}>
              <RelationsManager universeId={data.id} onChange={() => void run()} />
            </TabPanel>
          )}
          {visited.tags && (
            <TabPanel active={activeTab === 'tags'}>
              <TagsManager universeId={data.id} onChange={() => void run()} />
            </TabPanel>
          )}
        </div>
      </section>

      <ConfirmDialogPortal />
    </div>
  );
}

function TabPanel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div hidden={!active} className={active ? 'anim-fade-up' : ''}>
      {children}
    </div>
  );
}
