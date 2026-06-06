import { useEffect, useImperativeHandle, useMemo, forwardRef } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { EditorToolbar } from './EditorToolbar';

export interface RichEditorChange {
  html: string;
  text: string;
  words: number;
  chars: number;
}

export interface RichEditorSelection {
  text: string;
  /** Plain text of the entire document — useful as "surrounding" context. */
  fullText: string;
}

export interface RichEditorProps {
  content: string;
  onChange?: (change: RichEditorChange) => void;
  onSelectionChange?: (selection: RichEditorSelection) => void;
  placeholder?: string;
  /** When true, swaps the surface into a full-viewport overlay (RN014). */
  fullscreen?: boolean;
  onFullscreenToggle?: () => void;
}

export interface RichEditorHandle {
  editor: Editor | null;
  insertAtCursor: (text: string) => void;
}

export const RichEditor = forwardRef<RichEditorHandle, RichEditorProps>(function RichEditor(
  { content, onChange, onSelectionChange, placeholder, fullscreen, onFullscreenToggle },
  ref,
) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ['http', 'https', 'mailto'],
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: placeholder ?? 'Begin writing…' }),
      CharacterCount.configure({ limit: null }),
    ],
    [placeholder],
  );

  const editor = useEditor({
    extensions,
    content: content || '',
    editorProps: {
      attributes: {
        // Centered manuscript-width column (~80ch ≈ ~6.5 inches at 12pt,
        // close to a Word/Google Docs page width). `break-words` makes
        // long unbroken strings wrap inside the column instead of pushing
        // the line off-screen.
        class:
          'editor-surface tiptap prose prose-invert mx-auto w-full max-w-[80ch] min-h-full break-words focus:outline-none px-6 py-10 sm:px-12 sm:py-14',
      },
    },
    onUpdate({ editor: e }) {
      if (!onChange) return;
      const html = e.getHTML();
      const text = e.getText();
      onChange({
        html,
        text,
        words: e.storage.characterCount.words() as number,
        chars: e.storage.characterCount.characters() as number,
      });
    },
    onSelectionUpdate({ editor: e }) {
      if (!onSelectionChange) return;
      const { from, to } = e.state.selection;
      const selectedText = from === to ? '' : e.state.doc.textBetween(from, to, ' ');
      onSelectionChange({ text: selectedText, fullText: e.getText() });
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      editor,
      insertAtCursor: (text: string) => {
        editor?.chain().focus().insertContent(text).run();
      },
    }),
    [editor],
  );

  // Sync external content updates (when user switches documents).
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== content) {
      // Second arg = emitUpdate. Avoid re-firing onChange when we set programmatically.
      editor.commands.setContent(content || '', false);
    }
  }, [content, editor]);

  const words = (editor?.storage.characterCount?.words?.() as number | undefined) ?? 0;
  const chars = (editor?.storage.characterCount?.characters?.() as number | undefined) ?? 0;

  return (
    <div
      className={[
        // Treat the editor card as a paper-like surface. Slightly lifted
        // tone vs. the page background so the writing area visually pulls
        // forward as the focal point of the studio.
        'flex h-full flex-col rounded-md border border-border-primary bg-bg-secondary/60',
        fullscreen ? 'fixed inset-0 z-50 h-screen rounded-none border-0 bg-bg-primary' : '',
      ].join(' ')}
    >
      <EditorToolbar
        editor={editor}
        fullscreen={fullscreen}
        onFullscreenToggle={onFullscreenToggle}
      />
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} />
      </div>
      <div className="flex justify-end gap-4 border-t border-border-primary px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-text-muted">
        <span>{words} words</span>
        <span>{chars} chars</span>
      </div>
    </div>
  );
});
