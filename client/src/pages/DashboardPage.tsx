import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { OrnateDivider } from '../components/ui/OrnateDivider';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Spinner } from '../components/ui/Spinner';
import { StatCard } from '../components/ui/StatCard';
import { CreateUniverseForm } from '../components/worldbuilding/CreateUniverseForm';
import { UniverseCard } from '../components/worldbuilding/UniverseCard';
import { useAsync } from '../hooks/useAsync';
import { universeService } from '../services/universe.service';
import { userStatsService } from '../services/user-stats.service';
import { useAuth } from '../hooks/useAuth';

const formatNumber = (value: number): string => new Intl.NumberFormat('en-US').format(value);

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const fetchList = useCallback(() => universeService.list({ limit: 24 }), []);
  const fetchStats = useCallback(() => userStatsService.me(), []);
  const { data, status, error, run } = useAsync(fetchList);
  const { data: stats, status: statsStatus } = useAsync(fetchStats);

  async function handleCreate(
    values: Parameters<typeof universeService.create>[0],
  ): Promise<void> {
    const created = await universeService.create(values);
    setModalOpen(false);
    navigate(`/universes/${created.id}`);
  }

  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-ui text-[10px] uppercase tracking-[0.25em] text-text-secondary">
            Dashboard
          </p>
          <h1 className="mt-1 font-display text-3xl tracking-tight text-text-primary sm:text-4xl">
            Welcome, <span className="text-text-accent">{user?.displayName ?? 'Writer'}</span>
          </h1>
          <p className="mt-1.5 text-sm text-text-secondary">A bird's-eye view of your craft.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ New universe</Button>
      </header>

      <section aria-label="Writing statistics" className="space-y-4">
        <SectionHeader
          title="Statistics"
          subtitle="Updated in real time as you write."
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {statsStatus === 'loading' || !stats ? (
            <div className="col-span-full">
              <Spinner label="Loading stats…" />
            </div>
          ) : (
            <>
              <StatCard
                label="Words today"
                value={formatNumber(stats.writingActivity.today)}
                glyph="✒"
              />
              <StatCard
                label="Last 7 days"
                value={formatNumber(stats.writingActivity.last7Days)}
                hint={`${formatNumber(stats.writingActivity.last30Days)} this month`}
              />
              <StatCard
                label="Streak"
                value={stats.streak.current}
                hint={`Longest: ${stats.streak.longest}`}
                glyph="✦"
              />
              <StatCard
                label="Universes"
                value={stats.totals.universes}
                hint={`${formatNumber(stats.totals.words)} total words`}
              />
              <StatCard
                label="Characters"
                value={stats.totals.characters}
                hint={`${stats.totals.locations} locations`}
              />
              <StatCard
                label="AI calls (24h)"
                value={stats.ai.callsLast24h}
                hint={`${formatNumber(stats.ai.callsTotal)} all-time`}
                glyph="◆"
              />
            </>
          )}
        </div>
      </section>

      <OrnateDivider variant="diamond" />

      <section aria-label="Universes" className="space-y-5">
        <SectionHeader
          title="Universes"
          subtitle="Worlds you have built."
          action={
            data && data.items.length > 0 ? (
              <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
                {data.items.length} {data.items.length === 1 ? 'world' : 'worlds'}
              </span>
            ) : undefined
          }
        />
        <div>
          {status === 'loading' ? (
            <Spinner label="Loading universes…" />
          ) : status === 'error' ? (
            <Card title="Could not load universes">
              <p className="text-sm text-accent-red">{error?.message}</p>
              <Button className="mt-4" variant="secondary" onClick={() => void run()}>
                Retry
              </Button>
            </Card>
          ) : data && data.items.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.items.map((u) => (
                <UniverseCard key={u.id} universe={u} />
              ))}
            </div>
          ) : (
            <EmptyState
              glyph="◇"
              title="No universes yet"
              description="Create your first world to begin populating it with characters, locations, systems, lore and immutable laws."
              action={<Button onClick={() => setModalOpen(true)}>Create universe</Button>}
            />
          )}
        </div>
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create a new universe">
        <CreateUniverseForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
