import { forwardRef, useId, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className = '', ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? rest.name ?? generatedId;
  const inputClasses = [
    'w-full rounded-md border bg-transparent px-3 py-2 text-sm text-text-primary',
    'placeholder:text-text-muted font-ui',
    'transition-colors duration-fast ease-out',
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
      <input ref={ref} id={inputId} className={inputClasses} {...rest} />
      {hint ? <span className="text-xs text-text-muted">{hint}</span> : null}
      {error ? <span className="text-xs text-accent-red">{error}</span> : null}
    </div>
  );
});
