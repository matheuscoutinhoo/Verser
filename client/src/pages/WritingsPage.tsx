import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { WRITING, type Writing, type WritingTreeNode } from '@verser/shared';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { RichEditor, type RichEditorChange } from '../components/editor/RichEditor';
import { WritingTree } from '../components/editor/WritingTree';
import { useDebouncedEffect } from '../hooks/useDebouncedEffect';
import { writingService, type UpdateWritingResult } from '../services/writing.service';
import { ApiClientError } from '../services/api-client';

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

interface CreateTarget {
  parentId: string | null;
}

export function WritingsPage() {
  const { id: universeId = '' } = useParams<{ id: string }>();

  const [tree, setTree] = useState<WritingTreeNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [writing, setWriting] = useState<Writing | null>(null);
  const [content, setContent] = useState('');
  const [contentPlain, setContentPlain] = useState('');
  const [words, setWords] = useState(0);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const [createTarget, setCreateTarget] = useState<CreateTarget | null>(null);
  const [createTitle, setCreateTitle] = useState('');

  const [versionsOpen, setVersionsOpen] = useState(false);

  // Keep the latest persisted snapshot so we can compute "dirty".
  const persistedContent = useRef<string>('');

  const refreshTree = useCallback(async () => {
    setTreeLoading(true);
    setTreeError(null);
    try {
      const data = await writingService.tree(universeId);
      setTree(data);
      // Auto-select the first leaf if nothing selected.
      if (!selectedId && data.length > 0) {
        setSelectedId(findFirstId(data));
      }
    } catch (err) {
      setTreeError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setTreeLoading(false);
    }
  }, [universeId, selectedId]);

  useEffect(() => {
    void refreshTree();
    // Only on universe change — refreshTree captures selectedId via closure
    // and would loop otherwise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universeId]);

  // Load selected writing whenever selection changes.
  useEffect(() => {
    if (!selectedId) {
      setWriting(null);
      setContent('');
      setContentPlain('');
      persistedContent.current = '';
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const w = await writingService.detail(universeId, selectedId);
        if (cancelled) return;
        setWriting(w);
        setContent(w.content ?? '');
        setContentPlain(w.contentPlain ?? '');
        persistedContent.current = w.content ?? '';
        setWords(w.wordCount);
        setSaveStatus('idle');
        setSaveError(null);
      } catch (err) {
        if (!cancelled) {
          setSaveError(err instanceof Error ? err.message : 'Failed to load document');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [universeId, selectedId]);

  const handleEditorChange = useCallback((change: RichEditorChange) => {
    setContent(change.html);
    setContentPlain(change.text);
    setWords(change.words);
    setSaveStatus((prev) => (change.html === persistedContent.current ? prev : 'dirty'));
  }, []);

  const doSave = useCallback(async () => {
    if (!writing) return;
    if (content === persistedContent.current) return;
    setSaveStatus('saving');
    setSaveError(null);
    try {
      const result: UpdateWritingResult = await writingService.update(
        universeId,
        writing.id,
        { content, contentPlain },
      );
      persistedContent.current = result.writing.content;
      setWriting(result.writing);
      setWords(result.writing.wordCount);
      setSaveStatus('saved');
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Auto-save failed';
      setSaveError(message);
      setSaveStatus('error');
    }
  }, [writing, content, contentPlain, universeId]);

  useDebouncedEffect(
    { content, contentPlain, id: writing?.id ?? null },
    () => {
      void doSave();
    },
    WRITING.AUTOSAVE_DEBOUNCE_MS,
    saveStatus === 'dirty',
  );

  const handleCreate = useCallback((parentId: string | null) => {
    setCreateTarget({ parentId });
    setCreateTitle('');
  }, []);

  const handleConfirmCreate = useCallback(async () => {
    if (!createTarget) return;
    const title = createTitle.trim();
    if (!title) return;
    try {
      const created = await writingService.create(universeId, {
        title,
        parentId: createTarget.parentId,
      });
      setCreateTarget(null);
      setCreateTitle('');
      await refreshTree();
      setSelectedId(created.id);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to create document');
    }
  }, [createTarget, createTitle, universeId, refreshTree]);

  const handleDelete = useCallback(
    async (node: WritingTreeNode) => {
      if (!confirm(`Delete "${node.title}" and all its children? This cannot be undone.`)) return;
      try {
        await writingService.delete(universeId, node.id);
        if (selectedId === node.id) setSelectedId(null);
        await refreshTree();
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Failed to delete document');
      }
    },
    [universeId, selectedId, refreshTree],
  );

  const handleManualSnapshot = useCallback(async () => {
    if (!writing) return;
    try {
      await writingService.createVersion(universeId, writing.id, {
        note: 'Manual snapshot',
      });
      setSaveStatus('saved');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to snapshot');
    }
  }, [writing, universeId]);

  const saveLabel = useMemo(() => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving…';
      case 'saved':
        return 'Saved';
      case 'dirty':
        return 'Unsaved changes';
      case 'error':
        return `Error: ${saveError ?? 'unknown'}`;
      default:
        return ' ';
    }
  }, [saveStatus, saveError]);

  return (
    <div className="grid h-[calc(100vh-9rem)] grid-cols-1 gap-6 lg:grid-cols-[280px,1fr]">
      <div className="min-h-0">
        {treeLoading ? (
          <p className="text-text-secondary">Loading…</p>
        ) : treeError ? (
          <Card title="Could not load documents">
            <p className="text-sm text-accent-red">{treeError}</p>
            <Button className="mt-3" variant="secondary" onClick={() => void refreshTree()}>
              Retry
            </Button>
          </Card>
        ) : (
          <WritingTree
            nodes={tree}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onCreate={handleCreate}
            onDelete={handleDelete}
          />
        )}
      </div>

      <div className="flex min-h-0 flex-col gap-3">
        {writing ? (
          <>
            <header className="flex items-center justify-between">
              <div>
                <Link
                  to={`/universes/${universeId}`}
                  className="text-xs uppercase tracking-widest text-text-secondary hover:text-text-primary"
                >
                  ← Universe
                </Link>
                <h1 className="font-display text-2xl text-text-accent">{writing.title}</h1>
                <p className="text-xs text-text-secondary">
                  {writing.type} · {writing.status} · {words} words
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={[
                    'text-xs',
                    saveStatus === 'error' ? 'text-accent-red' : 'text-text-muted',
                  ].join(' ')}
                >
                  {saveLabel}
                </span>
                <Button size="sm" variant="secondary" onClick={() => setVersionsOpen(true)}>
                  Versions
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void handleManualSnapshot()}>
                  Snapshot
                </Button>
                <Button size="sm" onClick={() => void doSave()} disabled={saveStatus !== 'dirty'}>
                  Save now
                </Button>
              </div>
            </header>
            <div className="flex-1 min-h-0">
              <RichEditor
                content={content}
                onChange={handleEditorChange}
                fullscreen={fullscreen}
                onFullscreenToggle={() => setFullscreen((f) => !f)}
                placeholder="Write the next scene…"
              />
            </div>
          </>
        ) : (
          <Card title="Select a document" subtitle="Choose a document from the sidebar or create one.">
            <Button onClick={() => handleCreate(null)}>New root document</Button>
          </Card>
        )}
      </div>

      <Modal
        open={createTarget !== null}
        onClose={() => setCreateTarget(null)}
        title="New document"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void handleConfirmCreate();
          }}
        >
          <Input
            label="Title"
            autoFocus
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            placeholder="Chapter 1"
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setCreateTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!createTitle.trim()}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={versionsOpen} onClose={() => setVersionsOpen(false)} title="Version history">
        {writing ? (
          <VersionList
            universeId={universeId}
            writingId={writing.id}
            onRestore={(content, words) => {
              setContent(content);
              setWords(words);
              setSaveStatus('dirty');
              setVersionsOpen(false);
            }}
          />
        ) : null}
      </Modal>

      {saveError && saveStatus !== 'error' ? (
        <p className="text-sm text-accent-red">{saveError}</p>
      ) : null}
    </div>
  );
}

interface VersionListProps {
  universeId: string;
  writingId: string;
  onRestore: (content: string, words: number) => void;
}

function VersionList({ universeId, writingId, onRestore }: VersionListProps) {
  const [versions, setVersions] = useState<
    Array<{ id: string; createdAt: string; wordCount: number; note: string | null; content: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await writingService.listVersions(universeId, writingId);
        if (!cancelled) setVersions(list);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load versions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [universeId, writingId]);

  if (loading) return <p className="text-text-secondary">Loading…</p>;
  if (error) return <p className="text-accent-red">{error}</p>;
  if (versions.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        No snapshots yet. They are created automatically when your word count changes by 100+ or
        when you click <em>Snapshot</em>.
      </p>
    );
  }

  return (
    <ul className="max-h-[60vh] divide-y divide-border-primary overflow-auto">
      {versions.map((v) => (
        <li key={v.id} className="flex items-start justify-between gap-3 py-3">
          <div>
            <p className="font-ui text-sm text-text-primary">
              {new Date(v.createdAt).toLocaleString()}
            </p>
            <p className="text-xs text-text-secondary">
              {v.wordCount} words{v.note ? ` · ${v.note}` : ''}
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => onRestore(v.content, v.wordCount)}>
            Load
          </Button>
        </li>
      ))}
    </ul>
  );
}

function findFirstId(nodes: WritingTreeNode[]): string | null {
  for (const n of nodes) {
    if (n.children.length === 0) return n.id;
    const first = findFirstId(n.children);
    if (first) return first;
  }
  return nodes[0]?.id ?? null;
}
