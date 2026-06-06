import type { ReactNode } from 'react';

export interface TabDef<TKey extends string = string> {
  key: TKey;
  label: ReactNode;
  badge?: ReactNode;
  /** Optional small glyph rendered next to the label. */
  glyph?: ReactNode;
}

export interface TabsProps<TKey extends string = string> {
  tabs: ReadonlyArray<TabDef<TKey>>;
  active: TKey;
  onChange: (key: TKey) => void;
  className?: string;
}

/**
 * Minimalist horizontal tab strip. Active tab is marked by a thin gold underline
 * — no heavy borders. Scrolls horizontally on small screens.
 */
export function Tabs<TKey extends string = string>({
  tabs,
  active,
  onChange,
  className = '',
}: TabsProps<TKey>) {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={`relative flex gap-1 overflow-x-auto ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(tab.key)}
            className={[
              'group relative whitespace-nowrap px-3 py-2.5 text-[11px] uppercase tracking-[0.18em]',
              'transition-colors duration-fast ease-out',
              isActive
                ? 'text-text-accent'
                : 'text-text-secondary hover:text-text-primary',
            ].join(' ')}
          >
            {tab.glyph ? (
              <span className="mr-1.5 opacity-70" aria-hidden>
                {tab.glyph}
              </span>
            ) : null}
            {tab.label}
            {tab.badge !== undefined && tab.badge !== null ? (
              <span className="ml-1.5 rounded-full bg-bg-elevated px-1.5 py-0.5 text-[9px] tracking-normal text-text-secondary">
                {tab.badge}
              </span>
            ) : null}
            {/* Sliding underline indicator */}
            <span
              aria-hidden
              className={[
                'absolute bottom-0 left-2 right-2 h-px origin-center transition-all duration-base ease-out',
                isActive
                  ? 'scale-x-100 bg-accent-gold/80'
                  : 'scale-x-0 bg-border-ornate/60 group-hover:scale-x-100',
              ].join(' ')}
            />
          </button>
        );
      })}
      {/* Baseline */}
      <span aria-hidden className="absolute bottom-0 left-0 right-0 h-px bg-border-primary" />
    </div>
  );
}
