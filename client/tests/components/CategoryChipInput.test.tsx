import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CategoryChipInput } from '../../src/components/ui/CategoryChipInput';

const PRESETS = ['Fantasy', 'Dark Fantasy', 'Science Fiction', 'Mystery'];

describe('<CategoryChipInput />', () => {
  it('filters presets as the user types and adds the highlighted one on Enter', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(undefined);

    render(<CategoryChipInput suggestions={PRESETS} existing={[]} onAdd={onAdd} />);

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.type(input, 'fan');

    // Filtered list should contain both Fantasy entries, not Science Fiction.
    expect(screen.getByRole('option', { name: 'Fantasy' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Dark Fantasy' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Science Fiction' })).not.toBeInTheDocument();

    // Enter → first highlighted option (Fantasy) is committed.
    await user.keyboard('{Enter}');
    expect(onAdd).toHaveBeenCalledWith('Fantasy');
    expect(input).toHaveValue('');
  });

  it('adds the free-typed value when no suggestion matches', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(undefined);

    render(<CategoryChipInput suggestions={PRESETS} existing={[]} onAdd={onAdd} />);

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.type(input, 'Solarpunk');
    await user.keyboard('{Enter}');

    expect(onAdd).toHaveBeenCalledWith('Solarpunk');
    expect(input).toHaveValue('');
  });

  it('hides already-added suggestions from the dropdown', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(undefined);

    render(
      <CategoryChipInput suggestions={PRESETS} existing={['Fantasy']} onAdd={onAdd} />,
    );

    const input = screen.getByRole('combobox');
    await user.click(input);

    expect(screen.queryByRole('option', { name: 'Fantasy' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Dark Fantasy' })).toBeInTheDocument();
  });
});
