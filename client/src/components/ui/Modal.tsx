import type { ReactNode } from 'react';
import { useEffect } from 'react';

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm anim-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`surface-modal anim-scale-in w-full ${SIZE_CLASS[size]} p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <div className="mb-5 flex items-start justify-between gap-4">
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
        {children}
      </div>
    </div>
  );
}
