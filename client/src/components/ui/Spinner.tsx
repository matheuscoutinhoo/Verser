export interface SpinnerProps {
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function Spinner({ label = 'Loading…', className = '', size = 'sm' }: SpinnerProps) {
  const dims = size === 'sm' ? 'h-3.5 w-3.5 border' : 'h-5 w-5 border-2';
  return (
    <div
      className={`inline-flex items-center gap-2 text-text-secondary ${className}`}
      role="status"
      aria-live="polite"
    >
      <span
        className={`block ${dims} animate-[verser-spin_700ms_linear_infinite] rounded-full border-border-primary border-t-accent-gold`}
        aria-hidden
      />
      <span className="text-xs uppercase tracking-[0.15em]">{label}</span>
    </div>
  );
}
