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
 * Themed horizontal tab strip. Scrolls horizontally on small screens so the
 * full set is always reachable on mobile.
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
      className={`flex gap-1 overflow-x-auto border-b border-border-primary ${className}`}
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
              'whitespace-nowrap px-4 py-2 text-xs uppercase tracking-[0.2em] transition-colors',
              isActive
                ? 'border-b-2 border-border-glow text-text-accent'
                : 'border-b-2 border-transparent text-text-secondary hover:text-text-primary',
            ].join(' ')}
          >
            {tab.glyph ? <span className="mr-1.5" aria-hidden>{tab.glyph}</span> : null}
            {tab.label}
            {tab.badge !== undefined && tab.badge !== null ? (
              <span className="ml-1.5 rounded-full bg-bg-tertiary px-1.5 py-0.5 text-[10px] text-text-secondary">
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
