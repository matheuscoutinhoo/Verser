import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Input } from '../../src/components/ui/Input';

describe('<Input />', () => {
  it('renders the label', () => {
    render(<Input label="Email" name="email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Input label="Email" name="email" error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('accepts typed input', async () => {
    render(<Input label="Email" name="email" />);
    const input = screen.getByLabelText('Email') as HTMLInputElement;
    await userEvent.type(input, 'a@b.test');
    expect(input.value).toBe('a@b.test');
  });
});
