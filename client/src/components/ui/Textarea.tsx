import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, id, className = '', rows = 3, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? rest.name ?? generatedId;
  const inputClasses = [
    'w-full rounded-md border bg-transparent px-3 py-2 text-sm text-text-primary',
    'placeholder:text-text-muted font-ui leading-relaxed',
    'transition-colors duration-fast ease-out resize-y',
    'focus:outline-none focus:border-border-glow focus:bg-bg-elevated',
    error ? 'border-accent-red' : 'border-border-primary hover:border-border-strong',
    className,
  ].join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label
          htmlFor={inputId}
          className="font-ui text-[10px] uppercase tracking-[0.18em] text-text-secondary"
        >
          {label}
        </label>
      ) : null}
      <textarea ref={ref} id={inputId} rows={rows} className={inputClasses} {...rest} />
      {hint ? <span className="text-xs text-text-muted">{hint}</span> : null}
      {error ? <span className="text-xs text-accent-red">{error}</span> : null}
    </div>
  );
});
