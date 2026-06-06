import type { HTMLAttributes } from 'react';

export type OrnateDividerVariant = 'plain' | 'diamond' | 'rune';

export interface OrnateDividerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: OrnateDividerVariant;
  label?: string;
}

/**
 * Decorative horizontal divider with optional center glyph or label.
 *
 *   <OrnateDivider />                    -> simple gold-fade line
 *   <OrnateDivider variant="diamond" />  -> line + center diamond
 *   <OrnateDivider variant="rune" label="Chapter II" />
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
      className={`relative my-6 flex items-center ${className}`}
      {...rest}
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border-ornate to-transparent" />
      {variant !== 'plain' ? (
        <span className="mx-3 select-none font-display text-xs uppercase tracking-[0.35em] text-text-accent">
          {variant === 'diamond' ? '◆' : '✦'}
          {label ? <span className="ml-2 text-text-secondary">{label}</span> : null}
        </span>
      ) : null}
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border-ornate to-transparent" />
    </div>
  );
}
