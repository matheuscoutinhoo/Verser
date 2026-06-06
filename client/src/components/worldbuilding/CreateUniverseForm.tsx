import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { CreateUniverseInput } from '@verser/shared';
import { createUniverseSchema } from '@verser/shared';
import { Button } from '../ui/Button';
import { CategoryChipInput } from '../ui/CategoryChipInput';
import { Input } from '../ui/Input';
import { UNIVERSE_CATEGORY_PRESETS } from '../../constants/universe-categories';

export interface CreateUniverseFormProps {
  onSubmit: (values: CreateUniverseInput) => Promise<void>;
  onCancel?: () => void;
}

export function CreateUniverseForm({ onSubmit, onCancel }: CreateUniverseFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Genre is collected as a list locally and serialised to a comma-separated
  // string at submit time, matching the existing `genre: string | null` schema.
  const [genres, setGenres] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateUniverseInput>();

  async function handle(values: CreateUniverseInput): Promise<void> {
    setSubmitError(null);
    const merged: CreateUniverseInput = {
      ...values,
      genre: genres.length > 0 ? genres.join(', ') : null,
    };
    const parsed = createUniverseSchema.safeParse(merged);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setSubmitError(first?.message ?? 'Invalid input');
      return;
    }
    try {
      await onSubmit(parsed.data);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create universe');
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(handle)} noValidate>
      <Input
        label="Name"
        type="text"
        autoFocus
        placeholder="Aetherfall"
        {...register('name', { required: 'Name is required' })}
        error={errors.name?.message}
      />
      <CategoryChipInput
        label="Genre"
        suggestions={UNIVERSE_CATEGORY_PRESETS}
        selected={genres}
        onAdd={(value) =>
          setGenres((prev) => (prev.includes(value) ? prev : [...prev, value]))
        }
        onRemove={(value) => setGenres((prev) => prev.filter((g) => g !== value))}
        placeholder="Fantasy, sci-fi, thriller…"
        helperText="Pick from the presets, type your own, or chain several."
      />
      <div>
        <label className="font-ui text-xs uppercase tracking-wider text-text-secondary">
          Description
        </label>
        <textarea
          className="mt-1.5 min-h-[100px] w-full rounded-md border border-border-primary bg-bg-tertiary px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none"
          placeholder="A high-fantasy world where magic comes at a memory cost."
          {...register('description')}
        />
      </div>
      {submitError ? <p className="text-sm text-accent-red">{submitError}</p> : null}
      <div className="flex justify-end gap-3">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={isSubmitting}>
          Create universe
        </Button>
      </div>
    </form>
  );
}
