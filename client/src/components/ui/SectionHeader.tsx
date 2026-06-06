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
