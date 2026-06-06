import { useState } from 'react';
import type { ImageStyle } from '@verser/shared';
import { aiService } from '../../services/ai.service';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';

const STYLES: Array<{ value: ImageStyle; label: string }> = [
  { value: '2d', label: '2D illustration' },
  { value: '3d', label: '3D render' },
  { value: 'realistic', label: 'Realistic' },
  { value: 'anime', label: 'Anime' },
  { value: 'pixel_art', label: 'Pixel art' },
  { value: 'concept_art', label: 'Concept art' },
];

export interface AIImageGeneratorModalProps {
  open: boolean;
  onClose: () => void;
  universeId: string;
  /** Pre-filled prompt — for cover use the universe name + description. */
  defaultPrompt?: string;
  /** Called with the resulting image URL when the user accepts. */
  onAccept: (imageUrl: string) => void | Promise<void>;
}

export function AIImageGeneratorModal({
  open,
  onClose,
  universeId,
  defaultPrompt = '',
  onAccept,
}: AIImageGeneratorModalProps) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [style, setStyle] = useState<ImageStyle>('realistic');
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mocked, setMocked] = useState(false);
  const [accepting, setAccepting] = useState(false);

  async function generate(): Promise<void> {
    if (!prompt.trim()) {
      setError('Add a prompt to generate an image.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await aiService.generateImage({
        universeId,
        prompt: prompt.trim(),
        style,
      });
      setPreviewUrl(result.imageUrl);
      setMocked(result.mocked);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image.');
    } finally {
      setBusy(false);
    }
  }

  async function accept(): Promise<void> {
    if (!previewUrl) return;
    setAccepting(true);
    try {
      await onAccept(previewUrl);
      onClose();
      setPreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply image.');
    } finally {
      setAccepting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Generate image with AI">
      <div className="space-y-4">
        <div>
          <label className="font-ui text-xs uppercase tracking-wider text-text-secondary">
            Prompt
          </label>
          <textarea
            className="mt-1.5 min-h-[80px] w-full rounded-md border border-border-primary bg-bg-tertiary px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="An ancient watchtower on a windswept cliff under a violet sky"
          />
        </div>
        <div>
          <label className="font-ui text-xs uppercase tracking-wider text-text-secondary">
            Style
          </label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {STYLES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStyle(opt.value)}
                className={[
                  'rounded-full border px-3 py-1 text-xs uppercase tracking-wider transition-colors',
                  style === opt.value
                    ? 'border-border-ornate bg-bg-hover text-text-accent'
                    : 'border-border-primary text-text-secondary hover:text-text-primary',
                ].join(' ')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error ? <p className="text-sm text-accent-red">{error}</p> : null}

        {busy ? (
          <Spinner label="Generating…" />
        ) : previewUrl ? (
          <div className="space-y-2">
            <div className="overflow-hidden rounded-md border border-border-primary">
              <img
                src={previewUrl}
                alt="AI preview"
                className="block max-h-72 w-full object-cover"
              />
            </div>
            {mocked ? (
              <p className="rounded border-l-2 border-accent-gold bg-bg-secondary px-2 py-1 text-xs text-text-secondary">
                Mock provider — set <code>ABACUS_AI_API_KEY</code> for real images.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={accepting}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => void generate()} disabled={busy || accepting}>
            {previewUrl ? 'Regenerate' : 'Generate'}
          </Button>
          <Button onClick={() => void accept()} loading={accepting} disabled={!previewUrl || busy}>
            Use this image
          </Button>
        </div>
      </div>
    </Modal>
  );
}
