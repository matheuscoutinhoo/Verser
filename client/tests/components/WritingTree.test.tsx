import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { WritingTreeNode } from '@verser/shared';
import { WritingTree } from '../../src/components/editor/WritingTree';

function node(partial: Partial<WritingTreeNode> & { id: string; title: string }): WritingTreeNode {
  return {
    universeId: 'u1',
    type: 'chapter',
    status: 'draft',
    wordCount: 0,
    sortOrder: 0,
    parentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    children: [],
    ...partial,
  };
}

describe('<WritingTree />', () => {
  it('renders empty state when no nodes', () => {
    render(
      <WritingTree
        nodes={[]}
        selectedId={null}
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/no documents/i)).toBeInTheDocument();
  });

  it('renders nested nodes and fires onSelect', async () => {
    const onSelect = vi.fn();
    const tree: WritingTreeNode[] = [
      node({
        id: 'p1',
        title: 'Book One',
        type: 'project',
        children: [node({ id: 'c1', title: 'Chapter 1', type: 'chapter' })],
      }),
    ];
    render(
      <WritingTree
        nodes={tree}
        selectedId={null}
        onSelect={onSelect}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('Book One')).toBeInTheDocument();
    expect(screen.getByText('Chapter 1')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Chapter 1'));
    expect(onSelect).toHaveBeenCalledWith('c1');
  });

  it('fires onCreate with the parent id when + is clicked', async () => {
    const onCreate = vi.fn();
    const tree: WritingTreeNode[] = [node({ id: 'p1', title: 'Solo' })];
    render(
      <WritingTree
        nodes={tree}
        selectedId={null}
        onSelect={vi.fn()}
        onCreate={onCreate}
        onDelete={vi.fn()}
      />,
    );
    // The +Root button creates a sibling at the root.
    await userEvent.click(screen.getByRole('button', { name: /\+ root/i }));
    expect(onCreate).toHaveBeenCalledWith(null);
  });
});
