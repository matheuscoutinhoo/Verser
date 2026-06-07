import { useMemo, useState } from 'react';
import type { LoreImportance, TimelineEvent, UpsertTimelineEventInput } from '@verser/shared';
import { LORE_IMPORTANCE } from '@verser/shared';
import { Button } from '../../ui/Button';
import { ChevronDownIcon, ChevronUpIcon } from '../../ui/Icons';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import { useConfirmDialog } from '../../ui/useConfirmDialog';
import { useEntityCrud } from '../../../hooks/useEntityCrud';
import { timelineService } from '../../../services/worldbuilding.service';
import { ManagerShell } from '../ManagerShell';

export interface TimelineManagerProps {
  universeId: string;
  onChange?: () => void;
}

type Editing = { mode: 'create' } | { mode: 'edit'; event: TimelineEvent };

interface FormState {
  title: string;
  description: string;
  date: string;
  importance: LoreImportance;
}

const EMPTY: FormState = { title: '', description: '', date: '', importance: 'normal' };

function toForm(ev: TimelineEvent): FormState {
  return {
    title: ev.title,
    description: ev.description ?? '',
    date: ev.date,
    importance: ev.importance,
  };
}

function toInput(form: FormState): UpsertTimelineEventInput {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    date: form.date.trim(),
    importance: form.importance,
  };
}

export function TimelineManager({ universeId, onChange }: TimelineManagerProps) {
  const { confirm, ConfirmDialogPortal } = useConfirmDialog();
  const crud = useEntityCrud<TimelineEvent, UpsertTimelineEventInput, UpsertTimelineEventInput>(
    useMemo(
      () => ({
        list: () => timelineService.list(universeId),
        create: (input) => timelineService.create(universeId, input),
        update: (id, input) => timelineService.update(universeId, id, input),
        delete: (id) => timelineService.delete(universeId, id),
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

  function openEdit(event: TimelineEvent): void {
    setEditing({ mode: 'edit', event });
    setForm(toForm(event));
    setSubmitError(null);
  }

  async function handleSubmit(): Promise<void> {
    if (!editing) return;
    const input = toInput(form);
    if (!input.title || !input.date) {
      setSubmitError('Title and date are required.');
      return;
    }
    try {
      if (editing.mode === 'create') await crud.create(input);
      else await crud.update(editing.event.id, input);
      setEditing(null);
      onChange?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save event.');
    }
  }

  async function handleDelete(event: TimelineEvent): Promise<void> {
    const ok = await confirm({
      title: 'Delete event?',
      description: (
        <>
          <strong className="text-text-accent">{event.title}</strong> will be removed from the
          timeline.
        </>
      ),
      destructive: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await crud.remove(event.id);
      onChange?.();
    } catch {
      /* surfaced */
    }
  }

  async function move(event: TimelineEvent, direction: -1 | 1): Promise<void> {
    const ordered = [...crud.items].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = ordered.findIndex((e) => e.id === event.id);
    const target = idx + direction;
    if (target < 0 || target >= ordered.length) return;
    const a = ordered[idx];
    const b = ordered[target];
    if (!a || !b) return;

    // Snapshot for rollback if the server rejects the swap.
    const previous = crud.items;
    // Optimistic swap: flip the two items' sortOrder locally so React only
    // re-renders the two affected list rows, no full-list refetch +
    // re-mount cascade that made the page feel like it reloaded.
    crud.setItems((prev) =>
      prev.map((item) => {
        if (item.id === a.id) return { ...item, sortOrder: b.sortOrder };
        if (item.id === b.id) return { ...item, sortOrder: a.sortOrder };
        return item;
      }),
    );

    try {
      await timelineService.reorder(universeId, [
        { id: a.id, sortOrder: b.sortOrder },
        { id: b.id, sortOrder: a.sortOrder },
      ]);
      // Don't fire onChange here — reordering doesn't change the timeline
      // event count, so the parent's run() refetch would just cause a
      // page-wide re-render for nothing.
    } catch {
      // Rollback the optimistic swap; the user sees the row return to its
      // previous position rather than a stale-looking inconsistent state.
      crud.setItems(() => previous);
    }
  }

  return (
    <ManagerShell
      title="Timeline"
      description="Significant events in the chronology of your universe."
      status={crud.status}
      error={crud.error}
      isEmpty={crud.items.length === 0}
      emptyGlyph="◇"
      emptyDescription="Add events to anchor your story in time. Use the up/down arrows to reorder."
      emptyAction={<Button onClick={openCreate}>Add event</Button>}
      onRetry={() => void crud.refresh()}
      primaryAction={
        <Button onClick={openCreate} disabled={crud.mutating}>
          New event
        </Button>
      }
    >
      <ol className="relative space-y-3 border-l-2 border-border-ornate/30 pl-6">
        {[...crud.items]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((ev, idx, arr) => (
            <li key={ev.id} className="surface-card relative p-4">
              <span
                className="absolute -left-[1.65rem] top-5 inline-block h-3 w-3 rounded-full bg-border-glow ring-2 ring-bg-primary"
                aria-hidden
              />
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4 className="font-display text-lg text-text-accent">{ev.title}</h4>
                  <p className="text-xs uppercase tracking-wider text-text-secondary">
                    {ev.date} · {ev.importance}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Move earlier"
                    aria-label="Move earlier"
                    disabled={idx === 0}
                    onClick={() => void move(ev, -1)}
                  >
                    <ChevronUpIcon />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Move later"
                    aria-label="Move later"
                    disabled={idx === arr.length - 1}
                    onClick={() => void move(ev, 1)}
                  >
                    <ChevronDownIcon />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => openEdit(ev)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void handleDelete(ev)}>
                    Delete
                  </Button>
                </div>
              </div>
              {ev.description ? (
                <p className="mt-2 text-sm text-text-primary/90">{ev.description}</p>
              ) : null}
            </li>
          ))}
      </ol>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === 'edit' ? `Edit ${editing.event.title}` : 'New event'}
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
            placeholder="Founding of Vael"
            autoFocus
          />
          <Input
            label="Date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            placeholder="Year 0, Age of Sun"
            hint="Free-form so it fits any calendar system."
          />
          <Select
            label="Importance"
            value={form.importance}
            onChange={(e) => setForm({ ...form, importance: e.target.value as LoreImportance })}
            options={LORE_IMPORTANCE.map((i) => ({ value: i, label: i }))}
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          {submitError ? <p className="text-sm text-accent-red">{submitError}</p> : null}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={crud.mutating}>
              {editing?.mode === 'edit' ? 'Save changes' : 'Create event'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialogPortal />
    </ManagerShell>
  );
}
