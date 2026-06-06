import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}

export function Card({ title, subtitle, children, className = '', ...rest }: CardProps) {
  return (
    <div className={`surface-card p-6 ${className}`} {...rest}>
      {title ? (
        <header className="mb-5">
          <h2 className="font-display text-lg uppercase tracking-[0.2em] text-text-accent">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1.5 text-sm text-text-secondary">{subtitle}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </div>
  );
}
