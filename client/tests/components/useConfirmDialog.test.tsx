import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useConfirmDialog } from '../../src/components/ui/useConfirmDialog';

function Harness({ onResult }: { onResult: (result: boolean) => void }) {
  const { confirm, ConfirmDialogPortal } = useConfirmDialog();
  return (
    <>
      <button
        type="button"
        onClick={async () => {
          const value = await confirm({
            title: 'Delete?',
            description: 'This will destroy worlds.',
            confirmLabel: 'Yes, delete',
            destructive: true,
          });
          onResult(value);
        }}
      >
        Prompt
      </button>
      <ConfirmDialogPortal />
    </>
  );
}

describe('useConfirmDialog', () => {
  it('resolves true when the confirm button is clicked', async () => {
    let result: boolean | null = null;
    render(<Harness onResult={(v) => (result = v)} />);
    await userEvent.click(screen.getByRole('button', { name: 'Prompt' }));
    expect(await screen.findByRole('heading', { name: 'Delete?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));
    await waitFor(() => expect(result).toBe(true));
  });

  it('resolves false when cancel is clicked', async () => {
    let result: boolean | null = null;
    render(<Harness onResult={(v) => (result = v)} />);
    await userEvent.click(screen.getByRole('button', { name: 'Prompt' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(result).toBe(false));
  });
});
