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
import { useFlipAnimation } from '../../../hooks/useFlipAnimation';
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

  // Stable sorted view — derive once per render so JSX, animation ids and
  // any future drag-and-drop wiring all see the same order.
  const orderedItems = useMemo(
    () => [...crud.items].sort((a, b) => a.sortOrder - b.sortOrder),
    [crud.items],
  );
  const orderedIds = useMemo(() => orderedItems.map((e) => e.id), [orderedItems]);
  // FLIP animation: when the id order changes, each tracked <li> slides
  // smoothly from its previous position to its new one.
  const flip = useFlipAnimation([orderedIds.join('|')]);

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
      {/* Vertical gold rail — same gradient + drop-shadow halo as the
          decorative SectionHeader bar, rotated 90°. Renders as a
          ::before-style absolute span so the <ol> itself stays semantic. */}
      <ol className="relative space-y-4 pl-8">
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-2 left-3 top-2 w-px bg-gradient-to-b from-accent-gold-light via-accent-gold to-transparent opacity-70 shadow-[0_0_10px_rgba(196,162,101,0.45)]"
        />
        {orderedItems.map((ev, idx, arr) => (
            <li
              key={ev.id}
              ref={(el) => flip.register(ev.id, el)}
              className="surface-card gold-glow-hover group relative overflow-hidden p-4 will-change-transform"
            >
              {/* Gold diamond marker — small rotated square with a soft halo,
                  echoing the OrnateDivider glyphs. */}
              <span
                aria-hidden
                className="absolute -left-[1.6rem] top-5 inline-block h-2.5 w-2.5 rotate-45 border border-accent-gold-light bg-accent-gold shadow-[0_0_8px_rgba(196,162,101,0.7),0_0_18px_rgba(196,162,101,0.35)]"
              />
              {/* Subtle inner left border that lights up on hover. */}
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-px bg-accent-gold/0 transition-colors duration-base group-hover:bg-accent-gold/40"
              />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-display text-[11px] uppercase tracking-[0.28em] text-text-accent/80">
                    <span aria-hidden className="text-text-accent/60">
                      ✦
                    </span>
                    {ev.date}
                    <span aria-hidden className="text-text-muted">
                      ·
                    </span>
                    <span className="text-text-secondary">{ev.importance}</span>
                  </p>
                  <h4 className="mt-1 font-display text-lg leading-tight text-text-primary">
                    {ev.title}
                  </h4>
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
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                  {ev.description}
                </p>
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
