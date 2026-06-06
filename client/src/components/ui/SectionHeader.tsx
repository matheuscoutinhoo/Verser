import type { HTMLAttributes, ReactNode } from 'react';

export interface SectionHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export function SectionHeader({
  title,
  subtitle,
  action,
  className = '',
  ...rest
}: SectionHeaderProps) {
  return (
    <header
      className={`flex flex-wrap items-end justify-between gap-3 ${className}`}
      {...rest}
    >
      <div className="relative pl-3">
        {/* Decorative gold-gradient bar with a faint halo. */}
        <span
          aria-hidden
          className="absolute left-0 top-1 h-[calc(100%-0.5rem)] w-px bg-gradient-to-b from-accent-gold-light via-accent-gold to-transparent shadow-[0_0_8px_rgba(196,162,101,0.45)]"
        />
        <h2 className="font-display text-xs uppercase tracking-[0.3em] text-text-secondary">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary/80">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </header>
  );
}
