import { useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { SparkleIcon, TrashIcon, UploadIcon } from '../ui/Icons';
import { Spinner } from '../ui/Spinner';
import { AIImageGeneratorModal } from '../ai/AIImageGeneratorModal';

export interface CoverImagePickerProps {
  universeId: string;
  currentUrl: string | null;
  promptHint?: string;
  /** Persists an uploaded file and returns the new URL. */
  onUpload: (file: File) => Promise<string>;
  /** Persists a remote URL (e.g. AI-generated). */
  onSetUrl: (url: string) => Promise<void>;
  onRemove?: () => Promise<void>;
  /**
   * Layout style. `toolbar` (default) renders labelled buttons.
   * `compact` collapses everything to icon-only buttons, suitable for
   * overlays on top of the cover image itself.
   */
  variant?: 'toolbar' | 'compact';
}

export function CoverImagePicker({
  universeId,
  currentUrl,
  promptHint,
  onUpload,
  onSetUrl,
  onRemove,
  variant = 'toolbar',
}: CoverImagePickerProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
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

  async function handleAIAccept(url: string): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await onSetUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not apply image.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(): Promise<void> {
    if (!onRemove) return;
    setBusy(true);
    setError(null);
    try {
      await onRemove();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove cover.');
    } finally {
      setBusy(false);
    }
  }

  const isCompact = variant === 'compact';

  return (
    <div className={isCompact ? '' : 'space-y-2'}>
      <div className={`flex flex-wrap items-center gap-2 ${isCompact ? 'gap-1' : ''}`}>
        {isCompact ? (
          <>
            <Button
              size="icon"
              variant="secondary"
              title={currentUrl ? 'Replace image' : 'Upload image'}
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              aria-label={currentUrl ? 'Replace image' : 'Upload image'}
            >
              <UploadIcon />
            </Button>
            <Button
              size="icon"
              variant="primary"
              title="Generate with AI"
              onClick={() => setAiOpen(true)}
              disabled={busy}
              aria-label="Generate with AI"
            >
              <SparkleIcon />
            </Button>
            {onRemove && currentUrl ? (
              <Button
                size="icon"
                variant="ghost"
                title="Remove cover"
                onClick={() => void handleRemove()}
                disabled={busy}
                aria-label="Remove cover"
              >
                <TrashIcon />
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              <UploadIcon />
              {currentUrl ? 'Replace' : 'Upload'}
            </Button>
            <Button size="sm" onClick={() => setAiOpen(true)} disabled={busy}>
              <SparkleIcon />
              Generate
            </Button>
            {onRemove && currentUrl ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void handleRemove()}
                disabled={busy}
              >
                <TrashIcon />
                Remove
              </Button>
            ) : null}
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => void handleFileChange(e)}
        />
        {busy ? <Spinner label="Saving" /> : null}
      </div>
      {error ? <p className="mt-1 text-xs text-accent-red">{error}</p> : null}
      <AIImageGeneratorModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        universeId={universeId}
        defaultPrompt={promptHint ?? ''}
        onAccept={handleAIAccept}
      />
    </div>
  );
}
