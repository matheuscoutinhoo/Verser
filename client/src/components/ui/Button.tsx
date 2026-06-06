import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'border-border-ornate bg-bg-secondary text-text-accent hover:border-border-glow hover:shadow-glow',
  secondary:
    'border-border-primary bg-transparent text-text-primary hover:border-border-ornate hover:bg-bg-hover',
  ghost: 'border-transparent bg-transparent text-text-secondary hover:text-text-primary',
  danger:
    'border-accent-red bg-bg-secondary text-text-primary hover:border-red-400 hover:bg-bg-hover',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, disabled, children, className = '', ...rest },
  ref,
) {
  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-md border font-ui font-medium uppercase tracking-wider transition-all duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    VARIANTS[variant],
    SIZES[size],
    className,
  ].join(' ');

  return (
    <button ref={ref} disabled={disabled || loading} className={classes} {...rest}>
      {loading ? <span aria-label="loading">…</span> : null}
      {children}
    </button>
  );
});
