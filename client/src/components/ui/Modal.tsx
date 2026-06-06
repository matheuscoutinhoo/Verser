import type { ReactNode } from 'react';
import { useEffect } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="surface-card w-full max-w-lg border-border-ornate p-6 shadow-glow"
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <h2 className="mb-4 font-display text-2xl text-text-accent">{title}</h2>
        ) : null}
        {children}
      </div>
    </div>
  );
}
