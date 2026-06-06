import type { HTMLAttributes } from 'react';

export type OrnateDividerVariant = 'plain' | 'diamond' | 'rune';

export interface OrnateDividerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: OrnateDividerVariant;
  label?: string;
}

/**
 * Decorative horizontal divider with optional center glyph or label.
 */
export function OrnateDivider({
  variant = 'plain',
  label,
  className = '',
  ...rest
}: OrnateDividerProps) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={`relative my-8 flex items-center ${className}`}
      {...rest}
    >
      <span className="gold-line-lg flex-1" />
      {variant !== 'plain' ? (
        <span className="mx-4 select-none font-display text-[10px] uppercase tracking-[0.35em] text-text-accent [text-shadow:var(--glow-gold-text)]">
          {variant === 'diamond' ? '◆' : '✦'}
          {label ? <span className="ml-2 text-text-muted [text-shadow:none]">{label}</span> : null}
        </span>
      ) : null}
      <span className="gold-line-lg flex-1" />
    </div>
  );
}
