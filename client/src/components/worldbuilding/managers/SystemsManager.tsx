import { useMemo, useState } from 'react';
import type { UpsertWorldSystemInput, WorldSystem } from '@verser/shared';
import { WORLD_SYSTEM_TYPES } from '@verser/shared';
import { AIImageGeneratorModal } from '../../ai/AIImageGeneratorModal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import { useConfirmDialog } from '../../ui/useConfirmDialog';
import { useEntityCrud } from '../../../hooks/useEntityCrud';
import { useEntityImageFlow } from '../../../hooks/useEntityImageFlow';
import { systemsService } from '../../../services/worldbuilding.service';
import { EntityDetailModal } from '../EntityDetailModal';
import { InlineImagePicker } from '../InlineImagePicker';
import { ManagerShell } from '../ManagerShell';
import { PosterCard } from '../PosterCard';

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

function toInput(form: FormState, imageUrl: string | null): UpsertWorldSystemInput {
  return {
    name: form.name.trim(),
    type: form.type.trim(),
    description: form.description.trim() || null,
    rules: form.rules.trim() || null,
    limitations: form.limitations.trim() || null,
    interactions: form.interactions.trim() || null,
    imageUrl: imageUrl ?? undefined,
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

  const image = useEntityImageFlow<WorldSystem>({
    applyAIForExisting: async (system, url) => {
      await systemsService.update(universeId, system.id, { imageUrl: url });
      await crud.refresh();
      onChange?.();
    },
  });

  const [editing, setEditing] = useState<Editing | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<WorldSystem | null>(null);

  function openCreate(): void {
    setEditing({ mode: 'create' });
    setForm(EMPTY);
    image.resetImageState();
    setSubmitError(null);
  }

  function openEdit(system: WorldSystem): void {
    setEditing({ mode: 'edit', system });
    setForm(toForm(system));
    image.setImageState(() => ({ imageUrl: system.imageUrl ?? null, previewUrl: null, pendingFile: null }));
    setSubmitError(null);
  }

  function closeForm(): void {
    image.cleanupPreview();
    setEditing(null);
  }

  async function handleSubmit(): Promise<void> {
    if (!editing) return;
    const input = toInput(form, image.imageState.imageUrl);
    if (!input.name || !input.type) {
      setSubmitError('Name and type are required.');
      return;
    }
    try {
      if (editing.mode === 'create') {
        const created = await crud.create(input);
        if (image.imageState.pendingFile && created) {
          try {
            await image.flushPendingUpload(created, (entity, file) =>
              systemsService.uploadImage(universeId, entity.id, file),
            );
            await crud.refresh();
          } catch (err) {
            setSubmitError(
              err instanceof Error
                ? `System created, but image upload failed: ${err.message}`
                : 'System created, but image upload failed.',
            );
            return;
          }
        }
      } else {
        await crud.update(editing.system.id, input);
      }
      closeForm();
      onChange?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save system.');
    }
  }

  async function handleImageUpload(system: WorldSystem, file: File): Promise<string> {
    const result = await systemsService.uploadImage(universeId, system.id, file);
    await crud.refresh();
    onChange?.();
    return result.system.imageUrl ?? '';
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
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {crud.items.map((s) => (
          <li key={s.id}>
            <PosterCard
              name={s.name}
              imageUrl={s.imageUrl ?? null}
              fallbackGlyph="✦"
              caption={s.type}
              title={s.name}
              snippet={s.description}
              footnote={new Date(s.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                year: 'numeric',
              })}
              onOpen={() => setViewing(s)}
              onEdit={() => openEdit(s)}
              onDelete={() => void handleDelete(s)}
            />
          </li>
        ))}
      </ul>

      <EntityDetailModal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing?.name ?? ''}
        imageUrl={viewing?.imageUrl ?? null}
        fallbackGlyph="✦"
        sidebar={{
          label: 'Type',
          content: viewing ? (
            <span className="inline-flex items-center rounded border border-border-primary bg-bg-elevated px-2 py-0.5 text-xs text-text-primary">
              {viewing.type}
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
        fields={[
          { label: 'Description', value: viewing?.description ?? null },
          { label: 'Rules', value: viewing?.rules ?? null },
          { label: 'Limitations', value: viewing?.limitations ?? null },
          { label: 'Interactions', value: viewing?.interactions ?? null },
        ]}
        onEdit={viewing ? () => openEdit(viewing) : undefined}
        onDelete={viewing ? () => void handleDelete(viewing) : undefined}
      />

      <Modal
        open={editing !== null}
        onClose={closeForm}
        title={editing?.mode === 'edit' ? `Edit ${editing.system.name}` : 'New system'}
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
                  image.imageState.previewUrl ??
                  image.imageState.imageUrl ??
                  (editing.mode === 'edit' ? editing.system.imageUrl : null)
                }
                onUpload={async (file) => {
                  if (editing.mode === 'edit') return handleImageUpload(editing.system, file);
                  return image.handleUploadForCreate(file);
                }}
                onGenerate={() => {
                  if (editing.mode === 'edit') image.setAiTarget(editing.system);
                  else image.openAIForCreate();
                }}
              />
            </div>
          ) : null}
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
            <Button type="button" variant="secondary" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" loading={crud.mutating}>
              {editing?.mode === 'edit' ? 'Save changes' : 'Create system'}
            </Button>
          </div>
        </form>
      </Modal>

      {image.aiTarget ? (
        <AIImageGeneratorModal
          open={image.aiTarget !== null}
          onClose={() => image.setAiTarget(null)}
          universeId={universeId}
          defaultPrompt={`Illustration of the ${image.aiTarget.type} system "${image.aiTarget.name}"${
            image.aiTarget.description ? `: ${image.aiTarget.description}` : ''
          }`}
          onAccept={(url) => image.handleAIAcceptForExisting(image.aiTarget!, url)}
        />
      ) : null}

      <AIImageGeneratorModal
        open={image.aiOpenForCreate}
        onClose={image.closeAIForCreate}
        universeId={universeId}
        defaultPrompt={`Illustration of the ${form.type} system "${form.name || 'this system'}"${
          form.description ? `: ${form.description}` : ''
        }`}
        onAccept={image.handleAIAcceptForCreate}
      />

      <ConfirmDialogPortal />
    </ManagerShell>
  );
}
