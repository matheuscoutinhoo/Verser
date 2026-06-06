import { useMemo, useState } from 'react';
import type { Character, UpsertCharacterInput } from '@verser/shared';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { Textarea } from '../../ui/Textarea';
import { useConfirmDialog } from '../../ui/useConfirmDialog';
import { useEntityCrud } from '../../../hooks/useEntityCrud';
import { charactersService } from '../../../services/worldbuilding.service';
import { EntityListItem } from '../EntityListItem';
import { InlineImagePicker } from '../InlineImagePicker';
import { ManagerShell } from '../ManagerShell';
import { AIImageGeneratorModal } from '../../ai/AIImageGeneratorModal';

export interface CharactersManagerProps {
  universeId: string;
  /** Fired after any mutation so the parent can refresh its counts. */
  onChange?: () => void;
}

type Editing =
  | { mode: 'create' }
  | { mode: 'edit'; character: Character };

interface FormState {
  name: string;
  aliases: string;
  physicalDesc: string;
  personality: string;
  backstory: string;
  motivations: string;
  skills: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  aliases: '',
  physicalDesc: '',
  personality: '',
  backstory: '',
  motivations: '',
  skills: '',
  notes: '',
};

function characterToForm(c: Character): FormState {
  return {
    name: c.name,
    aliases: (c.aliases ?? []).join(', '),
    physicalDesc: c.physicalDesc ?? '',
    personality: c.personality ?? '',
    backstory: c.backstory ?? '',
    motivations: c.motivations ?? '',
    skills: c.skills ?? '',
    notes: c.notes ?? '',
  };
}

function formToInput(form: FormState): UpsertCharacterInput {
  return {
    name: form.name.trim(),
    aliases: form.aliases
      ? form.aliases.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined,
    physicalDesc: form.physicalDesc.trim() || null,
    personality: form.personality.trim() || null,
    backstory: form.backstory.trim() || null,
    motivations: form.motivations.trim() || null,
    skills: form.skills.trim() || null,
    notes: form.notes.trim() || null,
  };
}

export function CharactersManager({ universeId, onChange }: CharactersManagerProps) {
  const { confirm, ConfirmDialogPortal } = useConfirmDialog();

  const crud = useEntityCrud<Character, UpsertCharacterInput, UpsertCharacterInput>(
    useMemo(
      () => ({
        list: () => charactersService.list(universeId, { limit: 100 }).then((p) => p.items),
        create: (input) => charactersService.create(universeId, input),
        update: (id, input) => charactersService.update(universeId, id, input),
        delete: (id) => charactersService.delete(universeId, id),
      }),
      [universeId],
    ),
    [universeId],
  );

  const [editing, setEditing] = useState<Editing | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [aiTarget, setAiTarget] = useState<Character | null>(null);

  function openCreate(): void {
    setEditing({ mode: 'create' });
    setForm(EMPTY_FORM);
    setSubmitError(null);
  }

  function openEdit(character: Character): void {
    setEditing({ mode: 'edit', character });
    setForm(characterToForm(character));
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
        await crud.update(editing.character.id, input);
      }
      setEditing(null);
      onChange?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save character.');
    }
  }

  async function handleDelete(character: Character): Promise<void> {
    const ok = await confirm({
      title: 'Delete character?',
      description: (
        <>
          <strong className="text-text-accent">{character.name}</strong> and any relations to other
          characters will be permanently removed.
        </>
      ),
      destructive: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await crud.remove(character.id);
      onChange?.();
    } catch {
      /* error already surfaced by the hook */
    }
  }

  async function handleImageUpload(character: Character, file: File): Promise<string> {
    const result = await charactersService.uploadImage(universeId, character.id, file);
    await crud.refresh();
    onChange?.();
    return result.character.imageUrl ?? '';
  }

  async function handleAIAccept(character: Character, url: string): Promise<void> {
    await charactersService.update(universeId, character.id, { imageUrl: url });
    await crud.refresh();
    onChange?.();
    setAiTarget(null);
  }

  return (
    <ManagerShell
      title="Characters"
      description="Cast of your universe — names, relationships, skills, motivations."
      status={crud.status}
      error={crud.error}
      isEmpty={crud.items.length === 0}
      emptyGlyph="☉"
      emptyDescription="Add the cast that drives your story. They will be available as context for AI suggestions."
      emptyAction={<Button onClick={openCreate}>Add character</Button>}
      onRetry={() => void crud.refresh()}
      primaryAction={
        <Button onClick={openCreate} disabled={crud.mutating}>
          New character
        </Button>
      }
    >
      <ul className="grid gap-3 sm:grid-cols-2">
        {crud.items.map((c) => (
          <li key={c.id}>
            <EntityListItem
              title={c.name}
              subtitle={c.aliases?.length ? `aka ${c.aliases.join(', ')}` : undefined}
              imageUrl={c.imageUrl ?? undefined}
              glyph="☉"
              body={
                c.personality || c.physicalDesc ? (
                  <p className="line-clamp-3 text-text-secondary">
                    {(c.personality ?? '') + (c.physicalDesc ? ` · ${c.physicalDesc}` : '')}
                  </p>
                ) : null
              }
              onEdit={() => openEdit(c)}
              onDelete={() => void handleDelete(c)}
            />
          </li>
        ))}
      </ul>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === 'edit' ? `Edit ${editing.character.name}` : 'New character'}
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
                Portrait
              </label>
              <InlineImagePicker
                currentUrl={editing.character.imageUrl}
                onUpload={async (file) => handleImageUpload(editing.character, file)}
                onGenerate={() => setAiTarget(editing.character)}
              />
            </div>
          ) : null}
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Aldric the Gray"
            autoFocus
          />
          <Input
            label="Aliases (comma separated)"
            value={form.aliases}
            onChange={(e) => setForm({ ...form, aliases: e.target.value })}
            placeholder="Gray Wolf, Old Bear"
          />
          <Textarea
            label="Physical description"
            value={form.physicalDesc}
            onChange={(e) => setForm({ ...form, physicalDesc: e.target.value })}
          />
          <Textarea
            label="Personality"
            value={form.personality}
            onChange={(e) => setForm({ ...form, personality: e.target.value })}
          />
          <Textarea
            label="Backstory"
            value={form.backstory}
            onChange={(e) => setForm({ ...form, backstory: e.target.value })}
          />
          <Textarea
            label="Motivations"
            value={form.motivations}
            onChange={(e) => setForm({ ...form, motivations: e.target.value })}
          />
          <Textarea
            label="Skills"
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
            placeholder="Swordsmanship, persuasion, hacking… describe freely."
          />
          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          {submitError ? <p className="text-sm text-accent-red">{submitError}</p> : null}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={crud.mutating}>
              {editing?.mode === 'edit' ? 'Save changes' : 'Create character'}
            </Button>
          </div>
        </form>
      </Modal>

      {aiTarget ? (
        <AIImageGeneratorModal
          open={aiTarget !== null}
          onClose={() => setAiTarget(null)}
          universeId={universeId}
          defaultPrompt={`Portrait of ${aiTarget.name}${
            aiTarget.physicalDesc ? `: ${aiTarget.physicalDesc}` : ''
          }`}
          onAccept={(url) => handleAIAccept(aiTarget, url)}
        />
      ) : null}

      <ConfirmDialogPortal />
    </ManagerShell>
  );
}
