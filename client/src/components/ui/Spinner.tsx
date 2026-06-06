export interface SpinnerProps {
  label?: string;
  className?: string;
}

/**
 * Minimal CSS spinner that uses the theme tokens. Animation is keyframed in
 * globals.css (`@keyframes verser-spin`).
 */
export function Spinner({ label = 'Loading…', className = '' }: SpinnerProps) {
  return (
    <div
      className={`flex items-center gap-2 text-text-secondary ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="block h-4 w-4 animate-[verser-spin_900ms_linear_infinite] rounded-full border-2 border-border-primary border-t-border-glow" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
