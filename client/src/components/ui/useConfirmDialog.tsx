import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

export interface ConfirmDialogState {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  destructive: boolean;
  resolver: ((value: boolean) => void) | null;
}

export interface ConfirmOptions {
  title?: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

const INITIAL: ConfirmDialogState = {
  open: false,
  title: 'Confirm',
  description: null,
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  destructive: false,
  resolver: null,
};

/**
 * Hook + component pair for promise-based confirmation dialogs that replace
 * native `window.confirm` (which the theme can't style).
 *
 *   const { confirm, ConfirmDialogPortal } = useConfirmDialog();
 *   ...
 *   if (await confirm({ title: 'Delete?', destructive: true })) { ... }
 *   ...
 *   return (<><ConfirmDialogPortal /></>);
 */
export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmDialogState>(INITIAL);

  const close = useCallback((value: boolean) => {
    setState((s) => {
      s.resolver?.(value);
      return { ...INITIAL };
    });
  }, []);

  const confirm = useCallback(
    (opts: ConfirmOptions): Promise<boolean> =>
      new Promise<boolean>((resolve) => {
        setState({
          open: true,
          title: opts.title ?? 'Are you sure?',
          description: opts.description ?? null,
          confirmLabel: opts.confirmLabel ?? 'Confirm',
          cancelLabel: opts.cancelLabel ?? 'Cancel',
          destructive: opts.destructive ?? false,
          resolver: resolve,
        });
      }),
    [],
  );

  const ConfirmDialogPortal = useCallback(
    () => (
      <Modal open={state.open} onClose={() => close(false)} title={state.title}>
        <div className="space-y-5">
          {state.description ? (
            <div className="text-sm text-text-secondary">{state.description}</div>
          ) : null}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => close(false)}>
              {state.cancelLabel}
            </Button>
            <Button
              variant={state.destructive ? 'danger' : 'primary'}
              onClick={() => close(true)}
            >
              {state.confirmLabel}
            </Button>
          </div>
        </div>
      </Modal>
    ),
    [state, close],
  );

  return { confirm, ConfirmDialogPortal };
}
