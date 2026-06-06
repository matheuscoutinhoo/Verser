import { forwardRef, useId, type SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: ReadonlyArray<{ value: string; label: string } | string>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, id, className = '', ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? rest.name ?? generatedId;
  const inputClasses = [
    'w-full rounded-md border bg-bg-tertiary px-3 py-2 text-text-primary',
    'font-ui transition-colors duration-200',
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
      <select ref={ref} id={inputId} className={inputClasses} {...rest}>
        {options.map((opt) => {
          const value = typeof opt === 'string' ? opt : opt.value;
          const label = typeof opt === 'string' ? opt : opt.label;
          return (
            <option key={value} value={value}>
              {label}
            </option>
          );
        })}
      </select>
      {error ? <span className="text-xs text-accent-red">{error}</span> : null}
    </div>
  );
});
