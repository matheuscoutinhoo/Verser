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
import { InlineImagePicker } from '../InlineImagePicker';
import { LocationCard } from '../LocationCard';
import { LocationDetailModal } from '../LocationDetailModal';
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
  /** Persisted (server) URL when editing, or AI-generated URL when creating. */
  imageUrl: string | null;
  /** Local-only object URL for previewing an uploaded-but-not-yet-saved file. */
  previewUrl: string | null;
  /** File staged during creation; uploaded after the location row exists. */
  pendingFile: File | null;
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
  imageUrl: null,
  previewUrl: null,
  pendingFile: null,
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
    imageUrl: l.imageUrl ?? null,
    previewUrl: null,
    pendingFile: null,
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
    // Only send AI-generated remote URLs at create time. Local uploads
    // happen as a second step against the new location's id (see
    // handleSubmit below) since the upload endpoint needs that id.
    imageUrl: form.imageUrl ?? undefined,
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
  // When the AI modal is opened from the create form (no location row yet),
  // we land the generated URL straight into the form state.
  const [aiOpenForCreate, setAiOpenForCreate] = useState(false);
  // Location whose detail sheet is currently open (modal).
  const [viewing, setViewing] = useState<Location | null>(null);

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

  function closeForm(): void {
    // Free the staged preview's object URL to avoid leaking blob memory.
    if (form.previewUrl) URL.revokeObjectURL(form.previewUrl);
    setEditing(null);
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
        const created = await crud.create(input);
        // Two-step: if a local file was staged, upload it now that the row
        // exists. The upload endpoint requires the new location's id.
        if (form.pendingFile && created) {
          try {
            await locationsService.uploadImage(universeId, created.id, form.pendingFile);
            await crud.refresh();
          } catch (err) {
            // The location itself was created successfully; surface the
            // upload failure but don't roll back.
            setSubmitError(
              err instanceof Error
                ? `Location created, but image upload failed: ${err.message}`
                : 'Location created, but image upload failed.',
            );
            return;
          }
        }
      } else {
        await crud.update(editing.location.id, input);
      }
      closeForm();
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
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {crud.items.map((l) => {
          const parent = l.parentId ? locationsById.get(l.parentId) : null;
          return (
            <li key={l.id}>
              <LocationCard
                location={l}
                parentName={parent?.name ?? null}
                onOpen={(picked) => setViewing(picked)}
                onEdit={(picked) => openEdit(picked)}
                onDelete={(picked) => void handleDelete(picked)}
              />
            </li>
          );
        })}
      </ul>

      <LocationDetailModal
        location={viewing}
        open={viewing !== null}
        onClose={() => setViewing(null)}
        parentName={
          viewing?.parentId ? (locationsById.get(viewing.parentId)?.name ?? null) : null
        }
        onEdit={(picked) => openEdit(picked)}
        onDelete={(picked) => void handleDelete(picked)}
      />

      <Modal
        open={editing !== null}
        onClose={closeForm}
        title={editing?.mode === 'edit' ? `Edit ${editing.location.name}` : 'New location'}
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          {editing ? (
            <div className="flex flex-col gap-2">
              <label className="font-ui text-xs uppercase tracking-wider text-text-secondary">
                Imagery
              </label>
              <InlineImagePicker
                currentUrl={
                  // Prefer the local preview while the form is open so the
                  // user immediately sees the image they just picked or
                  // generated; fall back to the persisted URL for edit mode.
                  form.previewUrl ??
                  form.imageUrl ??
                  (editing.mode === 'edit' ? editing.location.imageUrl : null)
                }
                onUpload={async (file) => {
                  if (editing.mode === 'edit') {
                    return handleImageUpload(editing.location, file);
                  }
                  // Create mode: stage the file locally for upload-after-create.
                  // We render an object URL just for the preview.
                  const objectUrl = URL.createObjectURL(file);
                  setForm((prev) => ({
                    ...prev,
                    pendingFile: file,
                    previewUrl: objectUrl,
                    // Clear any AI URL — user picked a file over the AI one.
                    imageUrl: null,
                  }));
                  return objectUrl;
                }}
                onGenerate={() => {
                  if (editing.mode === 'edit') {
                    setAiTarget(editing.location);
                  } else {
                    setAiOpenForCreate(true);
                  }
                }}
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
            <Button type="button" variant="secondary" onClick={closeForm}>
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

      {/* AI generator for the create form — lands the URL into the form
          state instead of patching a non-existent location. */}
      <AIImageGeneratorModal
        open={aiOpenForCreate}
        onClose={() => setAiOpenForCreate(false)}
        universeId={universeId}
        defaultPrompt={`Wide shot of ${form.name || 'this location'}${
          form.description ? `: ${form.description}` : ''
        }`}
        onAccept={(url) => {
          setForm((prev) => {
            // Free the previous object URL if we had one staged.
            if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
            return { ...prev, imageUrl: url, previewUrl: null, pendingFile: null };
          });
          setAiOpenForCreate(false);
        }}
      />

      <ConfirmDialogPortal />
    </ManagerShell>
  );
}
