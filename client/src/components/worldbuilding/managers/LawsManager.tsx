import { useMemo, useState } from 'react';
import type { ImmutableLaw, UpsertImmutableLawInput } from '@verser/shared';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { Textarea } from '../../ui/Textarea';
import { useConfirmDialog } from '../../ui/useConfirmDialog';
import { useEntityCrud } from '../../../hooks/useEntityCrud';
import { lawsService } from '../../../services/worldbuilding.service';
import { EntityListItem } from '../EntityListItem';
import { ManagerShell } from '../ManagerShell';

export interface LawsManagerProps {
  universeId: string;
  onChange?: () => void;
}

type Editing = { mode: 'create' } | { mode: 'edit'; law: ImmutableLaw };

interface FormState {
  title: string;
  description: string;
  category: string;
}

const EMPTY: FormState = { title: '', description: '', category: 'physics' };

function toForm(l: ImmutableLaw): FormState {
  return { title: l.title, description: l.description, category: l.category };
}

function toInput(form: FormState): UpsertImmutableLawInput {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    category: form.category.trim(),
  };
}

export function LawsManager({ universeId, onChange }: LawsManagerProps) {
  const { confirm, ConfirmDialogPortal } = useConfirmDialog();
  const crud = useEntityCrud<ImmutableLaw, UpsertImmutableLawInput, UpsertImmutableLawInput>(
    useMemo(
      () => ({
        list: () => lawsService.list(universeId),
        create: (input) => lawsService.create(universeId, input),
        update: (id, input) => lawsService.update(universeId, id, input),
        delete: (id) => lawsService.delete(universeId, id),
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

  function openEdit(law: ImmutableLaw): void {
    setEditing({ mode: 'edit', law });
    setForm(toForm(law));
    setSubmitError(null);
  }

  async function handleSubmit(): Promise<void> {
    if (!editing) return;
    const input = toInput(form);
    if (!input.title || !input.description || !input.category) {
      setSubmitError('Title, description and category are required.');
      return;
    }
    try {
      if (editing.mode === 'create') await crud.create(input);
      else await crud.update(editing.law.id, input);
      setEditing(null);
      onChange?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save law.');
    }
  }

  async function handleDelete(law: ImmutableLaw): Promise<void> {
    const ok = await confirm({
      title: 'Delete immutable law?',
      description: (
        <>
          The AI will stop enforcing <strong className="text-text-accent">{law.title}</strong>.
        </>
      ),
      destructive: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await crud.remove(law.id);
      onChange?.();
    } catch {
      /* surfaced */
    }
  }

  return (
    <ManagerShell
      title="Immutable laws"
      description="Hard constraints the AI must never break — always injected into every prompt (RN002)."
      status={crud.status}
      error={crud.error}
      isEmpty={crud.items.length === 0}
      emptyGlyph="◈"
      emptyDescription="Define rules that cannot be broken: physics, magic costs, divine limits."
      emptyAction={<Button onClick={openCreate}>Add law</Button>}
      onRetry={() => void crud.refresh()}
      primaryAction={
        <Button onClick={openCreate} disabled={crud.mutating}>
          New law
        </Button>
      }
    >
      <ul className="space-y-3">
        {crud.items.map((l) => (
          <li key={l.id}>
            <EntityListItem
              title={l.title}
              subtitle={l.category}
              glyph="◈"
              body={<p>{l.description}</p>}
              onEdit={() => openEdit(l)}
              onDelete={() => void handleDelete(l)}
            />
          </li>
        ))}
      </ul>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === 'edit' ? `Edit ${editing.law.title}` : 'New immutable law'}
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Magic Costs Memory"
            autoFocus
          />
          <Input
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="physics, magic, divine, social…"
          />
          <Textarea
            label="Description"
            rows={6}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            hint="State the rule clearly — the AI will treat it as inviolable."
          />
          {submitError ? <p className="text-sm text-accent-red">{submitError}</p> : null}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={crud.mutating}>
              {editing?.mode === 'edit' ? 'Save changes' : 'Create law'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialogPortal />
    </ManagerShell>
  );
}
