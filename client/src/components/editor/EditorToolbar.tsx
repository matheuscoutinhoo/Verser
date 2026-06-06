import type { Editor } from '@tiptap/react';

export interface EditorToolbarProps {
  editor: Editor | null;
  onFullscreenToggle?: () => void;
  fullscreen?: boolean;
}

interface ButtonProps {
  label: string;
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

function ToolbarButton({ label, title, onClick, active, disabled }: ButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className={[
        'rounded-md px-2 py-1 text-xs font-medium transition-colors duration-fast ease-out',
        active
          ? 'bg-accent-gold-soft text-text-accent'
          : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-4 w-px bg-border-primary" aria-hidden />;
}

export function EditorToolbar({ editor, onFullscreenToggle, fullscreen }: EditorToolbarProps) {
  if (!editor) return null;

  const promptLink = (): void => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', previous ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border-primary bg-bg-secondary/50 px-3 py-1.5 backdrop-blur-sm">
      <ToolbarButton
        label="B"
        title="Bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label="I"
        title="Italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label="U"
        title="Underline"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        label="S"
        title="Strikethrough"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <Divider />
      {[1, 2, 3, 4, 5, 6].map((level) => (
        <ToolbarButton
          key={level}
          label={`H${level}`}
          title={`Heading ${level}`}
          active={editor.isActive('heading', { level })}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 })
              .run()
          }
        />
      ))}
      <Divider />
      <ToolbarButton
        label="• List"
        title="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label="1. List"
        title="Ordered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        label="“ ”"
        title="Blockquote"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        label="―"
        title="Horizontal rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />
      <Divider />
      <ToolbarButton
        label="⇤"
        title="Align left"
        active={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      />
      <ToolbarButton
        label="↔"
        title="Align center"
        active={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      />
      <ToolbarButton
        label="⇥"
        title="Align right"
        active={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      />
      <ToolbarButton
        label="≡"
        title="Justify"
        active={editor.isActive({ textAlign: 'justify' })}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
      />
      <Divider />
      <ToolbarButton label="Link" title="Insert/edit link" onClick={promptLink} />
      <ToolbarButton
        label="Unlink"
        title="Remove link"
        disabled={!editor.isActive('link')}
        onClick={() => editor.chain().focus().unsetLink().run()}
      />
      <Divider />
      <ToolbarButton
        label="↺"
        title="Undo"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        label="↻"
        title="Redo"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      />
      {onFullscreenToggle ? (
        <>
          <Divider />
          <ToolbarButton
            label={fullscreen ? '⤡ Exit' : '⤢ Focus'}
            title={fullscreen ? 'Exit fullscreen' : 'Distraction-free mode'}
            onClick={onFullscreenToggle}
          />
        </>
      ) : null}
    </div>
  );
}
