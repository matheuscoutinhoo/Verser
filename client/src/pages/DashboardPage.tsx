import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { CreateUniverseForm } from '../components/worldbuilding/CreateUniverseForm';
import { UniverseCard } from '../components/worldbuilding/UniverseCard';
import { useAsync } from '../hooks/useAsync';
import { universeService } from '../services/universe.service';
import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const fetchList = useCallback(() => universeService.list({ limit: 24 }), []);
  const { data, status, error, run } = useAsync(fetchList);

  async function handleCreate(
    values: Parameters<typeof universeService.create>[0],
  ): Promise<void> {
    const created = await universeService.create(values);
    setModalOpen(false);
    navigate(`/universes/${created.id}`);
  }

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl text-text-accent">
            Welcome, {user?.displayName ?? 'Writer'}
          </h1>
          <p className="text-text-secondary">Your universes.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>New universe</Button>
      </header>

      {status === 'loading' ? (
        <p className="text-text-secondary">Loading…</p>
      ) : status === 'error' ? (
        <Card title="Could not load universes">
          <p className="text-sm text-accent-red">{error?.message}</p>
          <Button className="mt-4" variant="secondary" onClick={() => void run()}>
            Retry
          </Button>
        </Card>
      ) : data && data.items.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((u) => (
            <UniverseCard key={u.id} universe={u} />
          ))}
        </div>
      ) : (
        <Card title="No universes yet" subtitle="Create your first world to begin.">
          <Button onClick={() => setModalOpen(true)}>Create universe</Button>
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create a new universe">
        <CreateUniverseForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
