import type { ReactNode } from 'react';
import type { Location } from '@verser/shared';
import { Button } from '../ui/Button';
import { PenIcon, TrashIcon } from '../ui/Icons';
import { Modal } from '../ui/Modal';

export interface LocationDetailModalProps {
  location: Location | null;
  open: boolean;
  onClose: () => void;
  /** Optional parent location name for the lineage chip. */
  parentName?: string | null;
  onEdit?: (location: Location) => void;
  onDelete?: (location: Location) => void;
}

/**
 * Read-only location sheet rendered inside the themed Modal shell.
 * Imagery sits on the left (top on small screens) and every structured
 * field gets its own labelled section on the right — same vocabulary as
 * the CharacterDetailModal so the two surfaces feel like siblings.
 */
export function LocationDetailModal({
  location,
  open,
  onClose,
  parentName,
  onEdit,
  onDelete,
}: LocationDetailModalProps) {
  if (!location) return null;

  return (
    <Modal open={open} onClose={onClose} title={location.name} size="xl">
      <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
        {/* Imagery column */}
        <div className="flex flex-col gap-3">
          <div className="surface-card relative aspect-[3/4] overflow-hidden">
            {location.imageUrl ? (
              <img
                src={location.imageUrl}
                alt={location.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-parchment-gradient" aria-hidden />
                <div
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center font-display text-7xl text-text-accent/40"
                >
                  ◆
                </div>
              </>
            )}
          </div>
          <div className="space-y-1">
            <p className="font-ui text-[10px] uppercase tracking-[0.22em] text-text-secondary">
              Lineage
            </p>
            <span className="inline-flex items-center rounded border border-border-primary bg-bg-elevated px-2 py-0.5 text-xs text-text-primary">
              {parentName ? `inside ${parentName}` : 'top-level'}
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
            Added{' '}
            {new Date(location.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Sheet column */}
        <div className="space-y-5">
          <Section label="Description" value={location.description} />
          <Section label="Geography" value={location.geography} />
          <Section label="Culture" value={location.culture} />
          <Section label="History" value={location.history} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Section label="Climate" value={location.climate} />
            <Section label="Population" value={location.population} />
          </div>

          {(onEdit || onDelete) && (
            <div className="flex justify-end gap-2 border-t border-border-primary pt-4">
              {onEdit ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    onEdit(location);
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
                    onDelete(location);
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
}: {
  label: string;
  value: string | null | undefined;
}): ReactNode {
  return (
    <section className="space-y-1.5">
      <h3 className="font-ui text-[10px] uppercase tracking-[0.22em] text-text-secondary">
        {label}
      </h3>
      {value && value.trim().length > 0 ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">{value}</p>
      ) : (
        <p className="text-sm italic text-text-muted">Not set.</p>
      )}
    </section>
  );
}
