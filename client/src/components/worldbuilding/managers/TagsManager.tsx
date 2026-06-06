import { useMemo, useState } from 'react';
import type { UniverseTag, UpsertUniverseTagInput } from '@verser/shared';
import { CategoryChipInput } from '../../ui/CategoryChipInput';
import { useConfirmDialog } from '../../ui/useConfirmDialog';
import { useEntityCrud } from '../../../hooks/useEntityCrud';
import { tagsService } from '../../../services/worldbuilding.service';
import { UNIVERSE_CATEGORY_PRESETS } from '../../../constants/universe-categories';
import { ManagerShell } from '../ManagerShell';

export interface TagsManagerProps {
  universeId: string;
  onChange?: () => void;
}

// Subtle, theme-friendly palette to auto-assign new tags from. Cycled by
// insertion order so the same word always gets the same colour, but new
// additions visually distinguish from neighbours.
const TAG_PALETTE = [
  '#c4a265', // gold
  '#8b7355', // ornate
  '#4d6796', // muted blue
  '#4f8a4f', // muted green
  '#b04545', // muted red
  '#9a6cb5', // soft violet
  '#c47a3d', // copper
  '#5e8a8a', // muted teal
] as const;

function pickColor(index: number): string {
  return TAG_PALETTE[index % TAG_PALETTE.length];
}

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

  const [submitError, setSubmitError] = useState<string | null>(null);

  const existingNames = useMemo(() => crud.items.map((t) => t.name), [crud.items]);

  async function handleAdd(name: string): Promise<void> {
    setSubmitError(null);
    try {
      await crud.create({ name, color: pickColor(crud.items.length) });
      onChange?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not add tag.');
      throw err;
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
      description="Lightweight category labels. Type to filter the presets or hit Enter to add your own."
      status={crud.status}
      error={crud.error}
      // The chip input itself acts as the empty-state CTA, so we never want
      // ManagerShell to swap to its empty surface.
      isEmpty={false}
      onRetry={() => void crud.refresh()}
    >
      <div className="space-y-4">
        <CategoryChipInput
          suggestions={UNIVERSE_CATEGORY_PRESETS}
          existing={existingNames}
          onAdd={handleAdd}
          placeholder="Type a category…"
          disabled={crud.mutating}
          helperText="Try fantasy roots, themes, tone — or invent your own."
        />
        {submitError ? <p className="text-xs text-accent-red">{submitError}</p> : null}

        {crud.items.length === 0 ? (
          <p className="text-xs italic text-text-muted">
            No tags yet. Pick one from the suggestions above to get started.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {crud.items.map((t) => (
              <span
                key={t.id}
                className="surface-card group inline-flex items-center gap-2 px-3 py-1.5 text-sm"
                style={{ borderColor: t.color ?? undefined }}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: t.color ?? 'var(--text-muted)' }}
                  aria-hidden
                />
                <span className="text-text-primary">{t.name}</span>
                <button
                  type="button"
                  className="text-text-muted transition-colors hover:text-accent-red"
                  onClick={() => void handleDelete(t)}
                  aria-label={`Delete tag ${t.name}`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialogPortal />
    </ManagerShell>
  );
}
