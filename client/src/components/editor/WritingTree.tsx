import { useCallback, useState } from 'react';
import type { WritingTreeNode, WritingType } from '@verser/shared';
import { Button } from '../ui/Button';

export interface WritingTreeProps {
  nodes: WritingTreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (parentId: string | null) => void;
  onDelete: (node: WritingTreeNode) => void;
}

const TYPE_GLYPH: Record<WritingType, string> = {
  project: '📕',
  part: '📂',
  chapter: '📄',
  scene: '✒️',
  note: '🗒️',
};

interface TreeItemProps extends Omit<WritingTreeProps, 'nodes'> {
  node: WritingTreeNode;
  depth: number;
}

function TreeItem({ node, depth, selectedId, onSelect, onCreate, onDelete }: TreeItemProps) {
  const [open, setOpen] = useState(true);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children.length > 0;

  return (
    <li className="select-none">
      <div
        className={[
          'group flex items-center gap-1 rounded-sm px-1 py-1 text-sm transition-colors duration-150',
          isSelected ? 'bg-bg-hover text-text-accent' : 'text-text-primary hover:bg-bg-hover',
        ].join(' ')}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="w-4 text-text-secondary hover:text-text-accent"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? '▾' : '▸'}
          </button>
        ) : (
          <span className="w-4 text-text-muted">·</span>
        )}
        <button
          type="button"
          className="flex-1 truncate text-left"
          onClick={() => onSelect(node.id)}
        >
          <span aria-hidden className="mr-1">
            {TYPE_GLYPH[node.type] ?? '·'}
          </span>
          {node.title}
        </button>
        <div className="hidden gap-1 text-text-secondary group-hover:flex">
          <button
            type="button"
            title="New child"
            className="px-1 hover:text-text-accent"
            onClick={(e) => {
              e.stopPropagation();
              onCreate(node.id);
            }}
          >
            +
          </button>
          <button
            type="button"
            title="Delete"
            className="px-1 hover:text-accent-red"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node);
            }}
          >
            ×
          </button>
        </div>
      </div>
      {hasChildren && open ? (
        <ul>
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onCreate={onCreate}
              onDelete={onDelete}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function WritingTree({ nodes, selectedId, onSelect, onCreate, onDelete }: WritingTreeProps) {
  const handleNewRoot = useCallback(() => onCreate(null), [onCreate]);
  return (
    <aside className="surface-card flex h-full flex-col p-3">
      <div className="mb-3 flex items-center justify-between border-b border-border-primary pb-2">
        <h2 className="font-display text-sm uppercase tracking-widest text-text-accent">
          Documents
        </h2>
        <Button size="sm" variant="secondary" onClick={handleNewRoot}>
          + Root
        </Button>
      </div>
      {nodes.length === 0 ? (
        <p className="px-1 text-xs text-text-secondary">No documents yet. Create one to begin.</p>
      ) : (
        <ul className="flex-1 overflow-auto">
          {nodes.map((node) => (
            <TreeItem
              key={node.id}
              node={node}
              depth={0}
              selectedId={selectedId}
              onSelect={onSelect}
              onCreate={onCreate}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </aside>
  );
}
