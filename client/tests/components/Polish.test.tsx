import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OrnateDivider } from '../../src/components/ui/OrnateDivider';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { StatCard } from '../../src/components/ui/StatCard';
import { Spinner } from '../../src/components/ui/Spinner';
import { EmptyState } from '../../src/components/ui/EmptyState';

describe('Phase 5 UI primitives', () => {
  it('OrnateDivider renders a separator role', () => {
    render(<OrnateDivider />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('OrnateDivider shows the label when variant is set', () => {
    render(<OrnateDivider variant="rune" label="Chapter II" />);
    expect(screen.getByText('Chapter II')).toBeInTheDocument();
  });

  it('SectionHeader renders title + subtitle + action', () => {
    render(
      <SectionHeader
        title="Statistics"
        subtitle="Last 7 days"
        action={<button type="button">Edit</button>}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Statistics' })).toBeInTheDocument();
    expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('StatCard formats value and hint', () => {
    render(<StatCard label="Words today" value={1234} hint="up 50 vs yesterday" />);
    expect(screen.getByText('Words today')).toBeInTheDocument();
    expect(screen.getByText('1234')).toBeInTheDocument();
    expect(screen.getByText('up 50 vs yesterday')).toBeInTheDocument();
  });

  it('Spinner exposes a status role and a label', () => {
    render(<Spinner label="Working…" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Working…')).toBeInTheDocument();
  });

  it('EmptyState renders title, description and action', () => {
    render(
      <EmptyState
        title="Nothing here"
        description="Start by creating your first item."
        action={<button type="button">Create</button>}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Nothing here' })).toBeInTheDocument();
    expect(screen.getByText('Start by creating your first item.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });
});
