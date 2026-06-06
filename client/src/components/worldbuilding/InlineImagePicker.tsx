import { useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

export interface InlineImagePickerProps {
  currentUrl: string | null;
  /** Uploads the file and returns the new URL. */
  onUpload: (file: File) => Promise<string>;
  onGenerate?: () => void;
  size?: 'sm' | 'md';
}

export function InlineImagePicker({
  currentUrl,
  onUpload,
  onGenerate,
  size = 'md',
}: InlineImagePickerProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dims = size === 'sm' ? 'h-16 w-16' : 'h-24 w-24';

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${dims} flex flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-bg-tertiary ring-1 ring-border-primary`}
      >
        {currentUrl ? (
          <img src={currentUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-2xl text-text-muted">✦</span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            {currentUrl ? 'Replace' : 'Upload'}
          </Button>
          {onGenerate ? (
            <Button type="button" size="sm" onClick={onGenerate} disabled={busy}>
              ✦ AI
            </Button>
          ) : null}
          {busy ? <Spinner label="Saving…" /> : null}
        </div>
        {error ? <p className="text-xs text-accent-red">{error}</p> : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => void handleChange(e)}
        />
      </div>
    </div>
  );
}
