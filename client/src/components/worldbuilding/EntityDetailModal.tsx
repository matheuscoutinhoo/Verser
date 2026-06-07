import type { ReactNode } from 'react';
import { Button } from '../ui/Button';
import { PenIcon, TrashIcon } from '../ui/Icons';
import { Modal } from '../ui/Modal';

export interface EntityDetailField {
  label: string;
  value: ReactNode | string | null | undefined;
  /** Renders the value in muted text — used for Notes-like fields. */
  muted?: boolean;
  /** When true, this field takes a half column on `sm:` and above. */
  half?: boolean;
}

export interface EntityDetailSidebar {
  /** Optional small caption above the chip — eg. "Lineage" / "Aliases". */
  label?: string;
  /** When provided, replaces the default lineage chip / aliases list. */
  content?: ReactNode;
}

export interface EntityDetailModalProps {
  open: boolean;
  onClose: () => void;
  /** Modal title — usually the entity's name. */
  title: string;
  /** Imagem principal — null mostra fallback de pergaminho. */
  imageUrl: string | null;
  /** Glyph centralizado no fallback. */
  fallbackGlyph: ReactNode;
  /** Conteúdo da coluna esquerda abaixo da imagem (chips, aliases). */
  sidebar?: EntityDetailSidebar;
  /** Texto pequeno bem no fim da coluna esquerda (ex.: data de criação). */
  footnote?: ReactNode;
  /** Lista de campos do entity para renderizar na coluna direita. */
  fields: ReadonlyArray<EntityDetailField>;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Generic read-only entity sheet rendered inside the themed Modal shell.
 * Used by Character, Location, System, Lore and Law to ensure they all
 * share the same visual rhythm.
 */
export function EntityDetailModal({
  open,
  onClose,
  title,
  imageUrl,
  fallbackGlyph,
  sidebar,
  footnote,
  fields,
  onEdit,
  onDelete,
}: EntityDetailModalProps) {
  const halfFields = fields.filter((f) => f.half);
  const fullFields = fields.filter((f) => !f.half);

  return (
    <Modal open={open} onClose={onClose} title={title} size="xl">
      <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
        {/* Imagery column */}
        <div className="flex flex-col gap-3">
          <div className="surface-card relative aspect-[3/4] overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-parchment-gradient" aria-hidden />
                <div
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center font-display text-7xl text-text-accent/40"
                >
                  {fallbackGlyph}
                </div>
              </>
            )}
          </div>
          {sidebar?.content ? (
            <div className="space-y-1">
              {sidebar.label ? (
                <p className="font-ui text-[10px] uppercase tracking-[0.22em] text-text-secondary">
                  {sidebar.label}
                </p>
              ) : null}
              {sidebar.content}
            </div>
          ) : null}
          {footnote ? (
            <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">{footnote}</p>
          ) : null}
        </div>

        {/* Sheet column */}
        <div className="space-y-5">
          {fullFields.map((f) => (
            <Section key={f.label} field={f} />
          ))}
          {halfFields.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {halfFields.map((f) => (
                <Section key={f.label} field={f} />
              ))}
            </div>
          ) : null}

          {(onEdit || onDelete) && (
            <div className="flex justify-end gap-2 border-t border-border-primary pt-4">
              {onEdit ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    onEdit();
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
                    onDelete();
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

function Section({ field }: { field: EntityDetailField }) {
  const { label, value, muted } = field;
  const isString = typeof value === 'string';
  const isEmpty = value === null || value === undefined || (isString && value.trim().length === 0);
  return (
    <section className="space-y-1.5">
      <h3 className="font-ui text-[10px] uppercase tracking-[0.22em] text-text-secondary">
        {label}
      </h3>
      {isEmpty ? (
        <p className="text-sm italic text-text-muted">Not set.</p>
      ) : isString ? (
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
        <div className="text-sm leading-relaxed text-text-primary">{value}</div>
      )}
    </section>
  );
}
