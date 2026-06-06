import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** Maximum width — defaults to "lg". */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_CLASS: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({ open, onClose, title, children, size = 'lg' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    // Prevent body scroll while modal is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  // SSR-safe guard.
  if (typeof document === 'undefined') return null;

  // Portal to <body> so `position: fixed` is always relative to the viewport,
  // not to any ancestor that happens to set `transform` / `filter` /
  // `perspective` (which, per CSS spec, become the containing block for
  // fixed descendants). Layout's <main> uses `anim-fade-up` whose final
  // keyframe leaves `transform: translateY(0)` applied — without this
  // portal the modal would be clipped to <main>'s `max-w-7xl` width.
  return createPortal(
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-6 backdrop-blur-sm sm:items-center sm:py-10"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={[
          'surface-modal anim-scale-in flex w-full flex-col',
          SIZE_CLASS[size],
          // Cap height to 90% of the dynamic viewport so the modal never
          // exceeds the screen, leaves a halo of overlay around it, and
          // `flex flex-col` lets the body scroll internally.
          'max-h-[90dvh]',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-border-primary px-6 py-4">
            <h2 className="gold-text font-display text-lg uppercase tracking-[0.2em]">
              {title}
            </h2>
            <button
              type="button"
              aria-label="Close"
              className="rounded p-1 text-text-muted transition-colors hover:text-text-primary"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
