import type { HTMLAttributes } from 'react';

export type OrnateDividerVariant = 'plain' | 'diamond' | 'rune' | 'glyph';

export interface OrnateDividerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: OrnateDividerVariant;
  label?: string;
}

/**
 * Decorative horizontal divider with optional center glyph or label.
 *
 * - `plain`   — gold gradient lines only.
 * - `diamond` — gold lines + centered ◆ glyph.
 * - `rune`    — gold lines + centered ✦ glyph.
 * - `glyph`   — minimalist, no lines: just a centered ✦ glyph with
 *               extra vertical breathing room. Use when a horizontal
 *               line would compete with another nearby line (e.g. the
 *               glowing header underline).
 */
export function OrnateDivider({
  variant = 'plain',
  label,
  className = '',
  ...rest
}: OrnateDividerProps) {
  if (variant === 'glyph') {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        className={`my-12 flex items-center justify-center ${className}`}
        {...rest}
      >
        <span
          className="select-none font-display text-sm tracking-[0.5em] text-text-accent/70 [text-shadow:var(--glow-gold-text)]"
          aria-hidden
        >
          ✦
        </span>
        {label ? (
          <span className="ml-3 font-display text-[10px] uppercase tracking-[0.35em] text-text-muted">
            {label}
          </span>
        ) : null}
      </div>
    );
  }

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
