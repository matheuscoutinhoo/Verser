import { useMemo, useState } from 'react';
import type { Location, UpsertLocationInput } from '@verser/shared';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import { useConfirmDialog } from '../../ui/useConfirmDialog';
import { useEntityCrud } from '../../../hooks/useEntityCrud';
import { locationsService } from '../../../services/worldbuilding.service';
import { EntityListItem } from '../EntityListItem';
import { InlineImagePicker } from '../InlineImagePicker';
import { ManagerShell } from '../ManagerShell';
import { AIImageGeneratorModal } from '../../ai/AIImageGeneratorModal';

export interface LocationsManagerProps {
  universeId: string;
  onChange?: () => void;
}

interface FormState {
  name: string;
  parentId: string;
  description: string;
  geography: string;
  culture: string;
  history: string;
  climate: string;
  population: string;
}

const EMPTY: FormState = {
  name: '',
  parentId: '',
  description: '',
  geography: '',
  culture: '',
  history: '',
  climate: '',
  population: '',
};

function locationToForm(l: Location): FormState {
  return {
    name: l.name,
    parentId: l.parentId ?? '',
    description: l.description ?? '',
    geography: l.geography ?? '',
    culture: l.culture ?? '',
    history: l.history ?? '',
    climate: l.climate ?? '',
    population: l.population ?? '',
  };
}

function formToInput(form: FormState): UpsertLocationInput {
  return {
    name: form.name.trim(),
    parentId: form.parentId || null,
    description: form.description.trim() || null,
    geography: form.geography.trim() || null,
    culture: form.culture.trim() || null,
    history: form.history.trim() || null,
    climate: form.climate.trim() || null,
    population: form.population.trim() || null,
  };
}

type Editing = { mode: 'create' } | { mode: 'edit'; location: Location };

export function LocationsManager({ universeId, onChange }: LocationsManagerProps) {
  const { confirm, ConfirmDialogPortal } = useConfirmDialog();

  const crud = useEntityCrud<Location, UpsertLocationInput, UpsertLocationInput>(
    useMemo(
      () => ({
        list: () => locationsService.list(universeId, { limit: 100 }).then((p) => p.items),
        create: (input) => locationsService.create(universeId, input),
        update: (id, input) => locationsService.update(universeId, id, input),
        delete: (id) => locationsService.delete(universeId, id),
      }),
      [universeId],
    ),
    [universeId],
  );

  const [editing, setEditing] = useState<Editing | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [aiTarget, setAiTarget] = useState<Location | null>(null);

  const parentOptions = useMemo(
    () => [
      { value: '', label: '(no parent)' },
      ...crud.items
        .filter((l) => editing?.mode !== 'edit' || l.id !== editing.location.id)
        .map((l) => ({ value: l.id, label: l.name })),
    ],
    [crud.items, editing],
  );

  function openCreate(): void {
    setEditing({ mode: 'create' });
    setForm(EMPTY);
    setSubmitError(null);
  }

  function openEdit(location: Location): void {
    setEditing({ mode: 'edit', location });
    setForm(locationToForm(location));
    setSubmitError(null);
  }

  async function handleSubmit(): Promise<void> {
    if (!editing) return;
    const input = formToInput(form);
    if (!input.name) {
      setSubmitError('Name is required.');
      return;
    }
    try {
      if (editing.mode === 'create') {
        await crud.create(input);
      } else {
        await crud.update(editing.location.id, input);
      }
      setEditing(null);
      onChange?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save location.');
    }
  }

  async function handleDelete(location: Location): Promise<void> {
    const ok = await confirm({
      title: 'Delete location?',
      description: (
        <>
          <strong className="text-text-accent">{location.name}</strong> and any references to it
          will be removed. Children will be detached, not deleted.
        </>
      ),
      destructive: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await crud.remove(location.id);
      onChange?.();
    } catch {
      /* surfaced by hook */
    }
  }

  async function handleImageUpload(location: Location, file: File): Promise<string> {
    const result = await locationsService.uploadImage(universeId, location.id, file);
    await crud.refresh();
    onChange?.();
    return result.location.imageUrl ?? '';
  }

  async function handleAIAccept(location: Location, url: string): Promise<void> {
    await locationsService.update(universeId, location.id, { imageUrl: url });
    await crud.refresh();
    onChange?.();
    setAiTarget(null);
  }

  const locationsById = useMemo(
    () => new Map(crud.items.map((l) => [l.id, l])),
    [crud.items],
  );

  return (
    <ManagerShell
      title="Locations"
      description="Worlds, continents, cities, rooms — the geography of your story."
      status={crud.status}
      error={crud.error}
      isEmpty={crud.items.length === 0}
      emptyGlyph="◆"
      emptyDescription="Map your world with hierarchical locations. Use parents to nest cities inside regions, regions inside continents."
      emptyAction={<Button onClick={openCreate}>Add location</Button>}
      onRetry={() => void crud.refresh()}
      primaryAction={
        <Button onClick={openCreate} disabled={crud.mutating}>
          New location
        </Button>
      }
    >
      <ul className="grid gap-3 sm:grid-cols-2">
        {crud.items.map((l) => {
          const parent = l.parentId ? locationsById.get(l.parentId) : null;
          return (
            <li key={l.id}>
              <EntityListItem
                title={l.name}
                subtitle={parent ? `inside ${parent.name}` : 'top-level'}
                imageUrl={l.imageUrl ?? undefined}
                glyph="◆"
                body={l.description ? <p className="line-clamp-3">{l.description}</p> : null}
                onEdit={() => openEdit(l)}
                onDelete={() => void handleDelete(l)}
              />
            </li>
          );
        })}
      </ul>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === 'edit' ? `Edit ${editing.location.name}` : 'New location'}
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          {editing?.mode === 'edit' ? (
            <div className="flex flex-col gap-2">
              <label className="font-ui text-xs uppercase tracking-wider text-text-secondary">
                Imagery
              </label>
              <InlineImagePicker
                currentUrl={editing.location.imageUrl}
                onUpload={async (file) => handleImageUpload(editing.location, file)}
                onGenerate={() => setAiTarget(editing.location)}
              />
            </div>
          ) : null}
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="City of Vael"
            autoFocus
          />
          <Select
            label="Parent location"
            value={form.parentId}
            onChange={(e) => setForm({ ...form, parentId: e.target.value })}
            options={parentOptions}
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Textarea
            label="Geography"
            value={form.geography}
            onChange={(e) => setForm({ ...form, geography: e.target.value })}
          />
          <Textarea
            label="Culture"
            value={form.culture}
            onChange={(e) => setForm({ ...form, culture: e.target.value })}
          />
          <Textarea
            label="History"
            value={form.history}
            onChange={(e) => setForm({ ...form, history: e.target.value })}
          />
          <Input
            label="Climate"
            value={form.climate}
            onChange={(e) => setForm({ ...form, climate: e.target.value })}
          />
          <Input
            label="Population"
            value={form.population}
            onChange={(e) => setForm({ ...form, population: e.target.value })}
          />
          {submitError ? <p className="text-sm text-accent-red">{submitError}</p> : null}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={crud.mutating}>
              {editing?.mode === 'edit' ? 'Save changes' : 'Create location'}
            </Button>
          </div>
        </form>
      </Modal>

      {aiTarget ? (
        <AIImageGeneratorModal
          open={aiTarget !== null}
          onClose={() => setAiTarget(null)}
          universeId={universeId}
          defaultPrompt={`Wide shot of ${aiTarget.name}${
            aiTarget.description ? `: ${aiTarget.description}` : ''
          }`}
          onAccept={(url) => handleAIAccept(aiTarget, url)}
        />
      ) : null}

      <ConfirmDialogPortal />
    </ManagerShell>
  );
}
