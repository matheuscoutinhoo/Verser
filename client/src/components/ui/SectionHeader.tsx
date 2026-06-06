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
      <div>
        <h2 className="font-display text-lg uppercase tracking-[0.3em] text-text-accent">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </header>
  );
}
