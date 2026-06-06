import { useRef, useState } from 'react';
import { Button } from '../ui/Button';
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
}

export function CoverImagePicker({
  universeId,
  currentUrl,
  promptHint,
  onUpload,
  onSetUrl,
  onRemove,
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

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          {currentUrl ? 'Replace image' : 'Upload image'}
        </Button>
        <Button size="sm" onClick={() => setAiOpen(true)} disabled={busy}>
          ✦ Generate with AI
        </Button>
        {onRemove && currentUrl ? (
          <Button size="sm" variant="ghost" onClick={() => void handleRemove()} disabled={busy}>
            Remove
          </Button>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => void handleFileChange(e)}
        />
        {busy ? <Spinner label="Saving…" /> : null}
      </div>
      {error ? <p className="text-sm text-accent-red">{error}</p> : null}
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
