import type { ReactNode } from 'react';
import type { Character } from '@verser/shared';
import { Button } from '../ui/Button';
import { PenIcon, TrashIcon } from '../ui/Icons';
import { Modal } from '../ui/Modal';

export interface CharacterDetailModalProps {
  character: Character | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (character: Character) => void;
  onDelete?: (character: Character) => void;
}

/**
 * Read-only character sheet rendered inside the themed Modal shell.
 * The portrait sits on the left (or top, on small screens) and every
 * piece of structured data the character carries gets its own labelled
 * section on the right.
 */
export function CharacterDetailModal({
  character,
  open,
  onClose,
  onEdit,
  onDelete,
}: CharacterDetailModalProps) {
  if (!character) return null;

  const aliases = character.aliases ?? [];

  return (
    <Modal open={open} onClose={onClose} title={character.name} size="xl">
      <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
        {/* Portrait column */}
        <div className="flex flex-col gap-3">
          <div className="surface-card relative aspect-[3/4] overflow-hidden">
            {character.imageUrl ? (
              <img
                src={character.imageUrl}
                alt={character.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-parchment-gradient" aria-hidden />
                <div
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center font-display text-7xl text-text-accent/40"
                >
                  ☉
                </div>
              </>
            )}
          </div>
          {aliases.length > 0 ? (
            <div className="space-y-1">
              <p className="font-ui text-[10px] uppercase tracking-[0.22em] text-text-secondary">
                Also known as
              </p>
              <div className="flex flex-wrap gap-1.5">
                {aliases.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center rounded border border-border-primary bg-bg-elevated px-2 py-0.5 text-xs text-text-primary"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
            Added{' '}
            {new Date(character.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Sheet column */}
        <div className="space-y-5">
          <Section label="Physical description" value={character.physicalDesc} />
          <Section label="Personality" value={character.personality} />
          <Section label="Skills" value={character.skills} />
          <Section label="Backstory" value={character.backstory} />
          <Section label="Motivations" value={character.motivations} />
          <Section label="Notes" value={character.notes} muted />

          {(onEdit || onDelete) && (
            <div className="flex justify-end gap-2 border-t border-border-primary pt-4">
              {onEdit ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    onEdit(character);
                    onClose();
                  }}
                >
                  <PenIcon />
                  Edit
                </Button>
              ) : null}
              {onDelete ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    onDelete(character);
                    onClose();
                  }}
                >
                  <TrashIcon />
                  Delete
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Section({
  label,
  value,
  muted,
}: {
  label: string;
  value: string | null | undefined;
  muted?: boolean;
}): ReactNode {
  return (
    <section className="space-y-1.5">
      <h3 className="font-ui text-[10px] uppercase tracking-[0.22em] text-text-secondary">
        {label}
      </h3>
      {value && value.trim().length > 0 ? (
        <p
          className={
            muted
              ? 'whitespace-pre-wrap text-sm leading-relaxed text-text-muted'
              : 'whitespace-pre-wrap text-sm leading-relaxed text-text-primary'
          }
        >
          {value}
        </p>
      ) : (
        <p className="text-sm italic text-text-muted">Not set.</p>
      )}
    </section>
  );
}
