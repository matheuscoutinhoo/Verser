import { useMemo, useState } from 'react';
import type { UpsertWorldSystemInput, WorldSystem } from '@verser/shared';
import { WORLD_SYSTEM_TYPES } from '@verser/shared';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import { useConfirmDialog } from '../../ui/useConfirmDialog';
import { useEntityCrud } from '../../../hooks/useEntityCrud';
import { systemsService } from '../../../services/worldbuilding.service';
import { EntityListItem } from '../EntityListItem';
import { ManagerShell } from '../ManagerShell';

export interface SystemsManagerProps {
  universeId: string;
  onChange?: () => void;
}

type Editing = { mode: 'create' } | { mode: 'edit'; system: WorldSystem };

interface FormState {
  name: string;
  type: string;
  description: string;
  rules: string;
  limitations: string;
  interactions: string;
}

const EMPTY: FormState = {
  name: '',
  type: 'magic',
  description: '',
  rules: '',
  limitations: '',
  interactions: '',
};

function toForm(s: WorldSystem): FormState {
  return {
    name: s.name,
    type: s.type,
    description: s.description ?? '',
    rules: s.rules ?? '',
    limitations: s.limitations ?? '',
    interactions: s.interactions ?? '',
  };
}

function toInput(form: FormState): UpsertWorldSystemInput {
  return {
    name: form.name.trim(),
    type: form.type.trim(),
    description: form.description.trim() || null,
    rules: form.rules.trim() || null,
    limitations: form.limitations.trim() || null,
    interactions: form.interactions.trim() || null,
  };
}

export function SystemsManager({ universeId, onChange }: SystemsManagerProps) {
  const { confirm, ConfirmDialogPortal } = useConfirmDialog();

  const crud = useEntityCrud<WorldSystem, UpsertWorldSystemInput, UpsertWorldSystemInput>(
    useMemo(
      () => ({
        list: () => systemsService.list(universeId, { limit: 100 }).then((p) => p.items),
        create: (input) => systemsService.create(universeId, input),
        update: (id, input) => systemsService.update(universeId, id, input),
        delete: (id) => systemsService.delete(universeId, id),
      }),
      [universeId],
    ),
    [universeId],
  );

  const [editing, setEditing] = useState<Editing | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function openCreate(): void {
    setEditing({ mode: 'create' });
    setForm(EMPTY);
    setSubmitError(null);
  }

  function openEdit(system: WorldSystem): void {
    setEditing({ mode: 'edit', system });
    setForm(toForm(system));
    setSubmitError(null);
  }

  async function handleSubmit(): Promise<void> {
    if (!editing) return;
    const input = toInput(form);
    if (!input.name || !input.type) {
      setSubmitError('Name and type are required.');
      return;
    }
    try {
      if (editing.mode === 'create') await crud.create(input);
      else await crud.update(editing.system.id, input);
      setEditing(null);
      onChange?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save system.');
    }
  }

  async function handleDelete(system: WorldSystem): Promise<void> {
    const ok = await confirm({
      title: 'Delete system?',
      description: (
        <>
          <strong className="text-text-accent">{system.name}</strong> will be removed from the
          universe.
        </>
      ),
      destructive: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await crud.remove(system.id);
      onChange?.();
    } catch {
      /* surfaced */
    }
  }

  return (
    <ManagerShell
      title="World systems"
      description="Magic, technology, politics, economy, religion — the rules of how your world works."
      status={crud.status}
      error={crud.error}
      isEmpty={crud.items.length === 0}
      emptyGlyph="✦"
      emptyDescription="Define how magic, technology, politics and other systems shape your universe."
      emptyAction={<Button onClick={openCreate}>Add system</Button>}
      onRetry={() => void crud.refresh()}
      primaryAction={
        <Button onClick={openCreate} disabled={crud.mutating}>
          New system
        </Button>
      }
    >
      <ul className="grid gap-3 sm:grid-cols-2">
        {crud.items.map((s) => (
          <li key={s.id}>
            <EntityListItem
              title={s.name}
              subtitle={s.type}
              glyph="✦"
              body={s.description ? <p className="line-clamp-3">{s.description}</p> : null}
              onEdit={() => openEdit(s)}
              onDelete={() => void handleDelete(s)}
            />
          </li>
        ))}
      </ul>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === 'edit' ? `Edit ${editing.system.name}` : 'New system'}
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Memory Magic"
            autoFocus
          />
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={WORLD_SYSTEM_TYPES.map((t) => ({ value: t, label: t }))}
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Textarea
            label="Rules"
            value={form.rules}
            onChange={(e) => setForm({ ...form, rules: e.target.value })}
          />
          <Textarea
            label="Limitations"
            value={form.limitations}
            onChange={(e) => setForm({ ...form, limitations: e.target.value })}
          />
          <Textarea
            label="Interactions"
            value={form.interactions}
            onChange={(e) => setForm({ ...form, interactions: e.target.value })}
            hint="How this system interacts with other systems."
          />
          {submitError ? <p className="text-sm text-accent-red">{submitError}</p> : null}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={crud.mutating}>
              {editing?.mode === 'edit' ? 'Save changes' : 'Create system'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialogPortal />
    </ManagerShell>
  );
}
