import { useEffect, useMemo, useState } from 'react';
import type {
  Character,
  CharacterRelation,
  UpsertCharacterRelationInput,
} from '@verser/shared';
import { RELATION_TYPES } from '@verser/shared';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import { useConfirmDialog } from '../../ui/useConfirmDialog';
import { useEntityCrud } from '../../../hooks/useEntityCrud';
import {
  charactersService,
  characterRelationsService,
} from '../../../services/worldbuilding.service';
import { EntityListItem } from '../EntityListItem';
import { ManagerShell } from '../ManagerShell';

export interface RelationsManagerProps {
  universeId: string;
  onChange?: () => void;
}

interface FormState {
  fromCharacterId: string;
  toCharacterId: string;
  relationType: string;
  description: string;
}

const EMPTY: FormState = {
  fromCharacterId: '',
  toCharacterId: '',
  relationType: 'ally',
  description: '',
};

export function RelationsManager({ universeId, onChange }: RelationsManagerProps) {
  const { confirm, ConfirmDialogPortal } = useConfirmDialog();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [charactersError, setCharactersError] = useState<string | null>(null);

  const crud = useEntityCrud<CharacterRelation, UpsertCharacterRelationInput, never>(
    useMemo(
      () => ({
        list: () => characterRelationsService.list(universeId),
        create: (input) => characterRelationsService.create(universeId, input),
        delete: (id) => characterRelationsService.delete(universeId, id),
      }),
      [universeId],
    ),
    [universeId],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await charactersService.list(universeId, { limit: 100 });
        if (!cancelled) setCharacters(list.items);
      } catch (err) {
        if (!cancelled) setCharactersError(err instanceof Error ? err.message : 'Failed to load characters.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [universeId, crud.items]);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const charactersById = useMemo(
    () => new Map(characters.map((c) => [c.id, c])),
    [characters],
  );

  const characterOptions = useMemo(
    () => [
      { value: '', label: '— select —' },
      ...characters.map((c) => ({ value: c.id, label: c.name })),
    ],
    [characters],
  );

  function openCreate(): void {
    setForm({
      ...EMPTY,
      fromCharacterId: characters[0]?.id ?? '',
      toCharacterId: characters[1]?.id ?? '',
    });
    setSubmitError(null);
    setCreating(true);
  }

  async function handleSubmit(): Promise<void> {
    if (!form.fromCharacterId || !form.toCharacterId) {
      setSubmitError('Select both characters.');
      return;
    }
    if (form.fromCharacterId === form.toCharacterId) {
      setSubmitError('Pick two different characters.');
      return;
    }
    try {
      await crud.create({
        fromCharacterId: form.fromCharacterId,
        toCharacterId: form.toCharacterId,
        relationType: form.relationType,
        description: form.description.trim() || null,
      });
      setCreating(false);
      onChange?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not create relation.');
    }
  }

  async function handleDelete(relation: CharacterRelation): Promise<void> {
    const a = charactersById.get(relation.fromCharacterId)?.name ?? '?';
    const b = charactersById.get(relation.toCharacterId)?.name ?? '?';
    const ok = await confirm({
      title: 'Remove relation?',
      description: (
        <>
          The {relation.relationType} relation between{' '}
          <strong className="text-text-accent">{a}</strong> and{' '}
          <strong className="text-text-accent">{b}</strong> will be removed.
        </>
      ),
      destructive: true,
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    try {
      await crud.remove(relation.id);
      onChange?.();
    } catch {
      /* surfaced */
    }
  }

  const noCharacters = characters.length < 2;

  return (
    <ManagerShell
      title="Character relations"
      description="How your cast connects: allies, rivals, mentors, family."
      status={crud.status}
      error={crud.error ?? charactersError}
      isEmpty={crud.items.length === 0}
      emptyGlyph="✧"
      emptyDescription={
        noCharacters
          ? 'Add at least two characters first to start linking them.'
          : 'Connect your characters to build the social graph the AI uses for context.'
      }
      emptyAction={
        noCharacters ? null : <Button onClick={openCreate}>Add relation</Button>
      }
      onRetry={() => void crud.refresh()}
      primaryAction={
        <Button onClick={openCreate} disabled={crud.mutating || noCharacters}>
          New relation
        </Button>
      }
    >
      <ul className="space-y-3">
        {crud.items.map((r) => {
          const a = charactersById.get(r.fromCharacterId);
          const b = charactersById.get(r.toCharacterId);
          return (
            <li key={r.id}>
              <EntityListItem
                title={
                  <>
                    {a?.name ?? '?'}{' '}
                    <span className="font-ui text-xs uppercase tracking-widest text-text-secondary">
                      → {r.relationType} →
                    </span>{' '}
                    {b?.name ?? '?'}
                  </>
                }
                glyph="✧"
                body={r.description ? <p>{r.description}</p> : null}
                onDelete={() => void handleDelete(r)}
              />
            </li>
          );
        })}
      </ul>

      <Modal open={creating} onClose={() => setCreating(false)} title="New relation">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          <Select
            label="From"
            value={form.fromCharacterId}
            onChange={(e) => setForm({ ...form, fromCharacterId: e.target.value })}
            options={characterOptions}
          />
          <Select
            label="Relation"
            value={form.relationType}
            onChange={(e) => setForm({ ...form, relationType: e.target.value })}
            options={RELATION_TYPES.map((t) => ({ value: t, label: t }))}
          />
          <Select
            label="To"
            value={form.toCharacterId}
            onChange={(e) => setForm({ ...form, toCharacterId: e.target.value })}
            options={characterOptions}
          />
          <Textarea
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          {submitError ? <p className="text-sm text-accent-red">{submitError}</p> : null}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={crud.mutating}>
              Create relation
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialogPortal />
    </ManagerShell>
  );
}
