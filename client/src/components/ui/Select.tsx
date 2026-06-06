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
    'w-full rounded-md border bg-transparent px-3 py-2 text-sm text-text-primary',
    'font-ui appearance-none cursor-pointer',
    'transition-colors duration-fast ease-out',
    'focus:outline-none focus:border-border-glow focus:bg-bg-elevated',
    error ? 'border-accent-red' : 'border-border-primary hover:border-border-strong',
    // Custom caret rendered via background image (gold chevron)
    "bg-no-repeat bg-[right_0.7rem_center] pr-9",
    className,
  ].join(' ');

  const caret = {
    backgroundImage:
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none' stroke='%23c4a265' stroke-width='1.5'><polyline points='1 1 5 5 9 1'/></svg>\")",
  };

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
      <select ref={ref} id={inputId} className={inputClasses} style={caret} {...rest}>
        {options.map((opt) => {
          const value = typeof opt === 'string' ? opt : opt.value;
          const label = typeof opt === 'string' ? opt : opt.label;
          return (
            <option key={value} value={value} className="bg-bg-secondary text-text-primary">
              {label}
            </option>
          );
        })}
      </select>
      {error ? <span className="text-xs text-accent-red">{error}</span> : null}
    </div>
  );
});
