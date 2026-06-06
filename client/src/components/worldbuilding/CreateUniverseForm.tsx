import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { CreateUniverseInput } from '@verser/shared';
import { createUniverseSchema } from '@verser/shared';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface CreateUniverseFormProps {
  onSubmit: (values: CreateUniverseInput) => Promise<void>;
  onCancel?: () => void;
}

export function CreateUniverseForm({ onSubmit, onCancel }: CreateUniverseFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateUniverseInput>();

  async function handle(values: CreateUniverseInput): Promise<void> {
    setSubmitError(null);
    const parsed = createUniverseSchema.safeParse(values);
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
      <Input
        label="Genre"
        type="text"
        placeholder="fantasy, sci-fi, thriller..."
        {...register('genre')}
        error={errors.genre?.message}
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
