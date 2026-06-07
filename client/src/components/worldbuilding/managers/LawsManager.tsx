import { useMemo, useState } from 'react';
import type { ImmutableLaw, UpsertImmutableLawInput } from '@verser/shared';
import { AIImageGeneratorModal } from '../../ai/AIImageGeneratorModal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { Textarea } from '../../ui/Textarea';
import { useConfirmDialog } from '../../ui/useConfirmDialog';
import { useEntityCrud } from '../../../hooks/useEntityCrud';
import { useEntityImageFlow } from '../../../hooks/useEntityImageFlow';
import { lawsService } from '../../../services/worldbuilding.service';
import { EntityDetailModal } from '../EntityDetailModal';
import { InlineImagePicker } from '../InlineImagePicker';
import { ManagerShell } from '../ManagerShell';
import { PosterCard } from '../PosterCard';

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

function toInput(form: FormState, imageUrl: string | null): UpsertImmutableLawInput {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    category: form.category.trim(),
    imageUrl: imageUrl ?? undefined,
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

  const image = useEntityImageFlow<ImmutableLaw>({
    applyAIForExisting: async (law, url) => {
      await lawsService.update(universeId, law.id, { imageUrl: url });
      await crud.refresh();
      onChange?.();
    },
  });

  const [editing, setEditing] = useState<Editing | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ImmutableLaw | null>(null);

  function openCreate(): void {
    setEditing({ mode: 'create' });
    setForm(EMPTY);
    image.resetImageState();
    setSubmitError(null);
  }

  function openEdit(law: ImmutableLaw): void {
    setEditing({ mode: 'edit', law });
    setForm(toForm(law));
    image.setImageState(() => ({ imageUrl: law.imageUrl ?? null, previewUrl: null, pendingFile: null }));
    setSubmitError(null);
  }

  function closeForm(): void {
    image.cleanupPreview();
    setEditing(null);
  }

  async function handleSubmit(): Promise<void> {
    if (!editing) return;
    const input = toInput(form, image.imageState.imageUrl);
    if (!input.title || !input.description || !input.category) {
      setSubmitError('Title, description and category are required.');
      return;
    }
    try {
      if (editing.mode === 'create') {
        const created = await crud.create(input);
        if (image.imageState.pendingFile && created) {
          try {
            await image.flushPendingUpload(created, (entity, file) =>
              lawsService.uploadImage(universeId, entity.id, file),
            );
            await crud.refresh();
          } catch (err) {
            setSubmitError(
              err instanceof Error
                ? `Law created, but image upload failed: ${err.message}`
                : 'Law created, but image upload failed.',
            );
            return;
          }
        }
      } else {
        await crud.update(editing.law.id, input);
      }
      closeForm();
      onChange?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save law.');
    }
  }

  async function handleImageUpload(law: ImmutableLaw, file: File): Promise<string> {
    const result = await lawsService.uploadImage(universeId, law.id, file);
    await crud.refresh();
    onChange?.();
    return result.law.imageUrl ?? '';
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
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {crud.items.map((l) => (
          <li key={l.id}>
            <PosterCard
              name={l.title}
              imageUrl={l.imageUrl ?? null}
              fallbackGlyph="◈"
              caption={l.category}
              title={l.title}
              snippet={l.description}
              footnote={new Date(l.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                year: 'numeric',
              })}
              onOpen={() => setViewing(l)}
              onEdit={() => openEdit(l)}
              onDelete={() => void handleDelete(l)}
            />
          </li>
        ))}
      </ul>

      <EntityDetailModal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing?.title ?? ''}
        imageUrl={viewing?.imageUrl ?? null}
        fallbackGlyph="◈"
        sidebar={{
          label: 'Category',
          content: viewing ? (
            <span className="inline-flex items-center rounded border border-border-primary bg-bg-elevated px-2 py-0.5 text-xs text-text-primary">
              {viewing.category}
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
        fields={[{ label: 'Description', value: viewing?.description ?? null }]}
        onEdit={viewing ? () => openEdit(viewing) : undefined}
        onDelete={viewing ? () => void handleDelete(viewing) : undefined}
      />

      <Modal
        open={editing !== null}
        onClose={closeForm}
        title={editing?.mode === 'edit' ? `Edit ${editing.law.title}` : 'New immutable law'}
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
                  (editing.mode === 'edit' ? editing.law.imageUrl : null)
                }
                onUpload={async (file) => {
                  if (editing.mode === 'edit') return handleImageUpload(editing.law, file);
                  return image.handleUploadForCreate(file);
                }}
                onGenerate={() => {
                  if (editing.mode === 'edit') image.setAiTarget(editing.law);
                  else image.openAIForCreate();
                }}
              />
            </div>
          ) : null}
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
            <Button type="button" variant="secondary" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" loading={crud.mutating}>
              {editing?.mode === 'edit' ? 'Save changes' : 'Create law'}
            </Button>
          </div>
        </form>
      </Modal>

      {image.aiTarget ? (
        <AIImageGeneratorModal
          open={image.aiTarget !== null}
          onClose={() => image.setAiTarget(null)}
          universeId={universeId}
          defaultPrompt={`Symbolic illustration of the immutable law "${image.aiTarget.title}" (${image.aiTarget.category}): ${image.aiTarget.description.slice(0, 200)}`}
          onAccept={(url) => image.handleAIAcceptForExisting(image.aiTarget!, url)}
        />
      ) : null}

      <AIImageGeneratorModal
        open={image.aiOpenForCreate}
        onClose={image.closeAIForCreate}
        universeId={universeId}
        defaultPrompt={`Symbolic illustration of the immutable law "${form.title || 'this law'}" (${form.category}): ${form.description.slice(0, 200)}`}
        onAccept={image.handleAIAcceptForCreate}
      />

      <ConfirmDialogPortal />
    </ManagerShell>
  );
}
