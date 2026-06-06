import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  // Primary stays outlined-only at rest; the gold gradient fill + halo
  // only appear on hover/focus, so the UI doesn't feel crowded with
  // illuminated rectangles.
  primary:
    'bg-transparent text-text-accent border-border-strong hover:[background:var(--gradient-gold-soft)] hover:shadow-[var(--glow-gold-md)] hover:border-border-glow hover:text-accent-gold-light focus-visible:[background:var(--gradient-gold-soft)] focus-visible:shadow-[var(--glow-gold-sm)]',
  secondary:
    'bg-transparent text-text-primary border-border-primary hover:bg-bg-elevated hover:border-border-strong',
  ghost:
    'bg-transparent text-text-secondary border-transparent hover:text-text-primary hover:bg-bg-elevated',
  danger:
    'bg-transparent text-accent-red border-transparent hover:bg-accent-red-soft hover:border-accent-red/40',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  // Square icon-only button. Caller renders an Icon as the only child.
  icon: 'h-8 w-8 p-0 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, disabled, children, className = '', ...rest },
  ref,
) {
  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-md border font-ui font-medium',
    size === 'icon' ? 'tracking-normal' : 'uppercase tracking-[0.15em]',
    'transition-all duration-fast ease-out',
    'active:scale-[0.98]',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
    VARIANTS[variant],
    SIZES[size],
    className,
  ].join(' ');

  return (
    <button ref={ref} disabled={disabled || loading} className={classes} {...rest}>
      {loading ? (
        <span
          className="block h-3 w-3 animate-[verser-spin_700ms_linear_infinite] rounded-full border border-current border-t-transparent"
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  );
});
