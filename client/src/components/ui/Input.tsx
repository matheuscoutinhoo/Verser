import { forwardRef, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = '', ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  const inputClasses = [
    'w-full rounded-md border bg-bg-tertiary px-3 py-2 text-text-primary',
    'placeholder:text-text-muted font-ui transition-colors duration-200',
    'focus:outline-none focus:border-border-glow',
    error ? 'border-accent-red' : 'border-border-primary',
    className,
  ].join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label
          htmlFor={inputId}
          className="font-ui text-xs uppercase tracking-wider text-text-secondary"
        >
          {label}
        </label>
      ) : null}
      <input ref={ref} id={inputId} className={inputClasses} {...rest} />
      {error ? <span className="text-xs text-accent-red">{error}</span> : null}
    </div>
  );
});
