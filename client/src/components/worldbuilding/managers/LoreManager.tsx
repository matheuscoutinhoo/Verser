import { useMemo, useState } from 'react';
import type { LoreEntry, LoreImportance, UpsertLoreEntryInput } from '@verser/shared';
import { LORE_IMPORTANCE } from '@verser/shared';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import { useConfirmDialog } from '../../ui/useConfirmDialog';
import { useEntityCrud } from '../../../hooks/useEntityCrud';
import { loreService } from '../../../services/worldbuilding.service';
import { EntityCard } from '../EntityCard';
import { EntityDetailModal } from '../EntityDetailModal';
import { ManagerShell } from '../ManagerShell';

export interface LoreManagerProps {
  universeId: string;
  onChange?: () => void;
}

type Editing = { mode: 'create' } | { mode: 'edit'; entry: LoreEntry };

interface FormState {
  title: string;
  category: string;
  content: string;
  importance: LoreImportance;
}

const EMPTY: FormState = { title: '', category: 'history', content: '', importance: 'normal' };

const IMPORTANCE_GLYPH: Record<LoreImportance, string> = {
  critical: '🛑',
  high: '⚠',
  normal: '◇',
  low: '·',
};

function toForm(e: LoreEntry): FormState {
  return {
    title: e.title,
    category: e.category,
    content: e.content,
    importance: e.importance,
  };
}

function toInput(form: FormState): UpsertLoreEntryInput {
  return {
    title: form.title.trim(),
    category: form.category.trim(),
    content: form.content,
    importance: form.importance,
  };
}

export function LoreManager({ universeId, onChange }: LoreManagerProps) {
  const { confirm, ConfirmDialogPortal } = useConfirmDialog();
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [importanceFilter, setImportanceFilter] = useState<string>('');

  const crud = useEntityCrud<LoreEntry, UpsertLoreEntryInput, UpsertLoreEntryInput>(
    useMemo(
      () => ({
        list: () =>
          loreService
            .list(universeId, {
              limit: 100,
              category: categoryFilter || undefined,
              importance: importanceFilter || undefined,
            })
            .then((p) => p.items),
        create: (input) => loreService.create(universeId, input),
        update: (id, input) => loreService.update(universeId, id, input),
        delete: (id) => loreService.delete(universeId, id),
      }),
      [universeId, categoryFilter, importanceFilter],
    ),
    [universeId, categoryFilter, importanceFilter],
  );

  const [editing, setEditing] = useState<Editing | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<LoreEntry | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of crud.items) set.add(item.category);
    return Array.from(set).sort();
  }, [crud.items]);

  function openCreate(): void {
    setEditing({ mode: 'create' });
    setForm(EMPTY);
    setSubmitError(null);
  }

  function openEdit(entry: LoreEntry): void {
    setEditing({ mode: 'edit', entry });
    setForm(toForm(entry));
    setSubmitError(null);
  }

  async function handleSubmit(): Promise<void> {
    if (!editing) return;
    const input = toInput(form);
    if (!input.title || !input.content || !input.category) {
      setSubmitError('Title, category and content are required.');
      return;
    }
    try {
      if (editing.mode === 'create') await crud.create(input);
      else await crud.update(editing.entry.id, input);
      setEditing(null);
      onChange?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save lore entry.');
    }
  }

  async function handleDelete(entry: LoreEntry): Promise<void> {
    const ok = await confirm({
      title: 'Delete lore entry?',
      description: (
        <>
          <strong className="text-text-accent">{entry.title}</strong> will be removed.
        </>
      ),
      destructive: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await crud.remove(entry.id);
      onChange?.();
    } catch {
      /* surfaced */
    }
  }

  return (
    <ManagerShell
      title="Lore"
      description="Categorised knowledge that feeds the AI context. Critical and high items are always injected."
      status={crud.status}
      error={crud.error}
      isEmpty={crud.items.length === 0 && !categoryFilter && !importanceFilter}
      emptyGlyph="✧"
      emptyDescription="Capture the histories, mythologies and traditions that shape your universe."
      emptyAction={<Button onClick={openCreate}>Add lore entry</Button>}
      onRetry={() => void crud.refresh()}
      primaryAction={
        <Button onClick={openCreate} disabled={crud.mutating}>
          New entry
        </Button>
      }
      controls={
        <>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: '', label: 'All categories' },
              ...categories.map((c) => ({ value: c, label: c })),
            ]}
            className="w-auto"
          />
          <Select
            value={importanceFilter}
            onChange={(e) => setImportanceFilter(e.target.value)}
            options={[
              { value: '', label: 'All importance' },
              ...LORE_IMPORTANCE.map((i) => ({ value: i, label: i })),
            ]}
            className="w-auto"
          />
        </>
      }
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {crud.items.map((e) => (
          <li key={e.id}>
            <EntityCard
              name={e.title}
              glyph={IMPORTANCE_GLYPH[e.importance]}
              caption={`${e.category} · ${e.importance}`}
              title={e.title}
              snippet={e.content}
              footnote={new Date(e.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                year: 'numeric',
              })}
              onOpen={() => setViewing(e)}
              onEdit={() => openEdit(e)}
              onDelete={() => void handleDelete(e)}
            />
          </li>
        ))}
      </ul>

      <EntityDetailModal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing?.title ?? ''}
        imageUrl={null}
        fallbackGlyph={viewing ? IMPORTANCE_GLYPH[viewing.importance] : '✧'}
        sidebar={{
          label: 'Category · Importance',
          content: viewing ? (
            <span className="inline-flex items-center rounded border border-border-primary bg-bg-elevated px-2 py-0.5 text-xs text-text-primary">
              {viewing.category} · {viewing.importance}
            </span>
          ) : undefined,
        }}
        footnote={
          viewing
            ? `Added ${new Date(viewing.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}`
            : undefined
        }
        fields={[{ label: 'Content', value: viewing?.content ?? null }]}
        onEdit={viewing ? () => openEdit(viewing) : undefined}
        onDelete={viewing ? () => void handleDelete(viewing) : undefined}
      />

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === 'edit' ? `Edit ${editing.entry.title}` : 'New lore entry'}
      >
        <form
          className="space-y-3"
          onSubmit={(ev) => {
            ev.preventDefault();
            void handleSubmit();
          }}
        >
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            autoFocus
          />
          <Input
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="history, mythology, culture…"
          />
          <Select
            label="Importance"
            value={form.importance}
            onChange={(e) => setForm({ ...form, importance: e.target.value as LoreImportance })}
            options={LORE_IMPORTANCE.map((i) => ({ value: i, label: i }))}
          />
          <Textarea
            label="Content"
            rows={8}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          {submitError ? <p className="text-sm text-accent-red">{submitError}</p> : null}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={crud.mutating}>
              {editing?.mode === 'edit' ? 'Save changes' : 'Create entry'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialogPortal />
    </ManagerShell>
  );
}
