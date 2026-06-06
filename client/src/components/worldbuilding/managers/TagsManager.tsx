import { useMemo, useState } from 'react';
import type { UniverseTag, UpsertUniverseTagInput } from '@verser/shared';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { useConfirmDialog } from '../../ui/useConfirmDialog';
import { useEntityCrud } from '../../../hooks/useEntityCrud';
import { tagsService } from '../../../services/worldbuilding.service';
import { ManagerShell } from '../ManagerShell';

export interface TagsManagerProps {
  universeId: string;
  onChange?: () => void;
}

interface FormState {
  name: string;
  color: string;
}

const EMPTY: FormState = { name: '', color: '#c4a265' };

export function TagsManager({ universeId, onChange }: TagsManagerProps) {
  const { confirm, ConfirmDialogPortal } = useConfirmDialog();
  const crud = useEntityCrud<UniverseTag, UpsertUniverseTagInput, never>(
    useMemo(
      () => ({
        list: () => tagsService.list(universeId),
        create: (input) => tagsService.create(universeId, input),
        delete: (id) => tagsService.delete(universeId, id),
      }),
      [universeId],
    ),
    [universeId],
  );

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(): Promise<void> {
    const name = form.name.trim();
    if (!name) {
      setSubmitError('Name is required.');
      return;
    }
    try {
      await crud.create({ name, color: form.color || null });
      setCreating(false);
      setForm(EMPTY);
      onChange?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not create tag.');
    }
  }

  async function handleDelete(tag: UniverseTag): Promise<void> {
    const ok = await confirm({
      title: 'Delete tag?',
      description: (
        <>
          The tag <strong className="text-text-accent">{tag.name}</strong> will be removed.
        </>
      ),
      destructive: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await crud.remove(tag.id);
      onChange?.();
    } catch {
      /* surfaced */
    }
  }

  return (
    <ManagerShell
      title="Tags"
      description="Lightweight colour-coded labels for grouping anything in your universe."
      status={crud.status}
      error={crud.error}
      isEmpty={crud.items.length === 0}
      emptyGlyph="◉"
      emptyDescription="Tags work like flexible folders — use them however helps you organise."
      emptyAction={<Button onClick={() => setCreating(true)}>Add tag</Button>}
      onRetry={() => void crud.refresh()}
      primaryAction={
        <Button onClick={() => setCreating(true)} disabled={crud.mutating}>
          New tag
        </Button>
      }
    >
      <div className="flex flex-wrap gap-2">
        {crud.items.map((t) => (
          <span
            key={t.id}
            className="surface-card group inline-flex items-center gap-2 px-3 py-1.5 text-sm"
            style={{
              borderColor: t.color ?? undefined,
            }}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: t.color ?? 'var(--text-muted)' }}
              aria-hidden
            />
            <span className="text-text-primary">{t.name}</span>
            <button
              type="button"
              className="text-text-muted hover:text-accent-red"
              onClick={() => void handleDelete(t)}
              aria-label={`Delete tag ${t.name}`}
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="New tag">
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
            autoFocus
          />
          <div className="flex items-center gap-3">
            <Input
              label="Color"
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="h-10 w-20 cursor-pointer p-1"
            />
            <span className="text-sm text-text-secondary">{form.color}</span>
          </div>
          {submitError ? <p className="text-sm text-accent-red">{submitError}</p> : null}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={crud.mutating}>
              Create tag
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialogPortal />
    </ManagerShell>
  );
}
