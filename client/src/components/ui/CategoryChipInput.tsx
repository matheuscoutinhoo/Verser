import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

export interface CategoryChipInputHandle {
  focus: () => void;
}

export interface CategoryChipInputProps {
  /** Pre-curated suggestions; filtered live as the user types. */
  suggestions: ReadonlyArray<string>;
  /**
   * Values already chosen — removed from the dropdown so they can't be
   * added twice. Pass when the caller renders chips elsewhere
   * (e.g. TagsManager renders persisted tags as a separate row).
   */
  existing?: ReadonlyArray<string>;
  /**
   * Controlled list of currently selected values rendered as chips inside
   * the input field itself. Pass alongside `onRemove` to opt into the
   * "chip-in-field" layout used by forms that collect a list locally.
   */
  selected?: ReadonlyArray<string>;
  /** Called when the user picks a suggestion or presses Enter on a free-form value. */
  onAdd: (value: string) => void | Promise<void>;
  /** Required when `selected` is provided. Called when a chip is removed. */
  onRemove?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  /** Maximum suggestions visible in the dropdown at once. */
  maxResults?: number;
  className?: string;
}

const DEFAULT_MAX = 8;

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

/**
 * A chip-style input with a presets-aware autocomplete dropdown.
 *
 *  - As the user types, suggestions are filtered (case-insensitive contains).
 *  - Already-chosen values are excluded from the dropdown.
 *  - ↑/↓ navigates, Enter accepts the highlighted suggestion (or the raw typed
 *    value when nothing is highlighted), Escape closes the dropdown.
 *  - After a successful add the input clears and keeps focus, so the user
 *    can chain many additions in a row.
 */
export const CategoryChipInput = forwardRef<CategoryChipInputHandle, CategoryChipInputProps>(
  function CategoryChipInput(
    {
      suggestions,
      existing = [],
      selected,
      onAdd,
      onRemove,
      placeholder = 'Type to filter or add…',
      disabled,
      label,
      helperText,
      maxResults = DEFAULT_MAX,
      className = '',
    },
    ref,
  ) {
    const inputId = useId();
    const listboxId = `${inputId}-listbox`;
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const [busy, setBusy] = useState(false);

    useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }), []);

    // Both `selected` (chips inside the field) and `existing` (chips owned by
    // the caller) count as "already chosen" for filter + dedupe purposes.
    const existingSet = useMemo(
      () =>
        new Set(
          [...existing, ...(selected ?? [])].map((v) => normalize(v)),
        ),
      [existing, selected],
    );

    // Chip mode renders the chips inside the input shell and shows a
    // backspace-to-remove affordance. Activated when the parent opts in by
    // passing both `selected` and `onRemove`.
    const chipMode = Array.isArray(selected) && typeof onRemove === 'function';

    const filtered = useMemo(() => {
      const q = normalize(query);
      const pool = suggestions.filter((s) => !existingSet.has(normalize(s)));
      if (!q) return pool.slice(0, maxResults);
      return pool
        .filter((s) => normalize(s).includes(q))
        .slice(0, maxResults);
    }, [query, suggestions, existingSet, maxResults]);

    // Keep highlight inside bounds when filter changes.
    useEffect(() => {
      setHighlight((h) => (h >= filtered.length ? 0 : h));
    }, [filtered.length]);

    async function commit(value: string): Promise<void> {
      const trimmed = value.trim();
      if (!trimmed) return;
      if (existingSet.has(normalize(trimmed))) {
        // Silently skip duplicates but clear the input so the next add works.
        setQuery('');
        return;
      }
      setBusy(true);
      try {
        await onAdd(trimmed);
        setQuery('');
        setHighlight(0);
        // Keep focus + dropdown so the writer can add another immediately.
        inputRef.current?.focus();
      } finally {
        setBusy(false);
      }
    }

    function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>): void {
      if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        setOpen(true);
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlight((h) => (filtered.length === 0 ? 0 : (h + 1) % filtered.length));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlight((h) =>
          filtered.length === 0 ? 0 : (h - 1 + filtered.length) % filtered.length,
        );
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const picked = filtered[highlight];
        // Prefer the highlighted suggestion when one matches; otherwise
        // commit the free-typed value.
        void commit(picked ?? query);
      } else if (event.key === 'Escape') {
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
      } else if (event.key === 'Tab') {
        // Tabbing out is a soft close; let focus move naturally.
        setOpen(false);
      } else if (event.key === 'Backspace' && chipMode && query === '' && selected && selected.length > 0) {
        // Quick chip-removal: when the field is empty, Backspace pops the
        // last chip. Mirrors the gesture used in Gmail/GitHub label inputs.
        event.preventDefault();
        onRemove?.(selected[selected.length - 1]);
      }
    }

    const showDropdown = open && filtered.length > 0;
    const hasExactMatch = filtered.some((s) => normalize(s) === normalize(query));
    const trimmedQuery = query.trim();
    const canAddCustom = !!trimmedQuery && !hasExactMatch && !existingSet.has(normalize(query));

    return (
      <div className={`relative ${className}`}>
        {label ? (
          <label
            htmlFor={inputId}
            className="mb-1.5 block font-ui text-[10px] uppercase tracking-[0.22em] text-text-secondary"
          >
            {label}
          </label>
        ) : null}
        <div className="relative">
          {chipMode ? (
            <div
              className="flex w-full flex-wrap items-center gap-1.5 rounded-md border border-border-primary bg-bg-elevated px-2 py-1.5 transition-colors duration-fast focus-within:border-border-glow focus-within:ring-1 focus-within:ring-accent-gold/30"
              onClick={() => inputRef.current?.focus()}
            >
              {selected?.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1.5 rounded border border-border-strong bg-bg-secondary/80 px-2 py-0.5 text-xs text-text-primary"
                >
                  {value}
                  <button
                    type="button"
                    aria-label={`Remove ${value}`}
                    className="text-text-muted transition-colors hover:text-accent-red"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove?.(value);
                    }}
                    tabIndex={-1}
                  >
                    ✕
                  </button>
                </span>
              ))}
              <input
                ref={inputRef}
                id={inputId}
                type="text"
                role="combobox"
                aria-expanded={showDropdown}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={
                  showDropdown && filtered[highlight]
                    ? `${listboxId}-opt-${highlight}`
                    : undefined
                }
                autoComplete="off"
                disabled={disabled || busy}
                value={query}
                placeholder={selected && selected.length > 0 ? '' : placeholder}
                onFocus={() => setOpen(true)}
                onBlur={() => {
                  window.setTimeout(() => setOpen(false), 120);
                }}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                  setHighlight(0);
                }}
                onKeyDown={handleKeyDown}
                className="min-w-[8ch] flex-1 border-0 bg-transparent px-1 py-0.5 font-ui text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
              />
              {busy ? (
                <span
                  aria-hidden
                  className="inline-block h-3 w-3 animate-[verser-spin_700ms_linear_infinite] rounded-full border border-text-muted border-t-accent-gold"
                />
              ) : null}
            </div>
          ) : (
            <>
              <input
                ref={inputRef}
                id={inputId}
                type="text"
                role="combobox"
                aria-expanded={showDropdown}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={
                  showDropdown && filtered[highlight]
                    ? `${listboxId}-opt-${highlight}`
                    : undefined
                }
                autoComplete="off"
                disabled={disabled || busy}
                value={query}
                placeholder={placeholder}
                onFocus={() => setOpen(true)}
                onBlur={() => {
                  // Small delay so onMouseDown on a suggestion can run first.
                  window.setTimeout(() => setOpen(false), 120);
                }}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                  setHighlight(0);
                }}
                onKeyDown={handleKeyDown}
                className="w-full rounded-md border border-border-primary bg-bg-elevated px-3 py-2 font-ui text-sm text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none focus:ring-1 focus:ring-accent-gold/30"
              />
              {busy ? (
                <span
                  aria-hidden
                  className="absolute right-3 top-1/2 inline-block h-3 w-3 -translate-y-1/2 animate-[verser-spin_700ms_linear_infinite] rounded-full border border-text-muted border-t-accent-gold"
                />
              ) : null}
            </>
          )}
        </div>

        {showDropdown ? (
          <ul
            id={listboxId}
            role="listbox"
            className="anim-fade-in absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-md border border-border-strong bg-surface-modal py-1 shadow-[var(--shadow-md)] backdrop-blur-md"
          >
            {canAddCustom ? (
              <li
                id={`${listboxId}-opt-new`}
                role="option"
                aria-selected={false}
                onMouseDown={(e) => {
                  e.preventDefault();
                  void commit(query);
                }}
                className="cursor-pointer px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-text-accent hover:bg-bg-hover"
              >
                + Add &ldquo;{trimmedQuery}&rdquo;
              </li>
            ) : null}
            {filtered.map((suggestion, index) => {
              const isHighlighted = index === highlight;
              return (
                <li
                  key={suggestion}
                  id={`${listboxId}-opt-${index}`}
                  role="option"
                  aria-selected={isHighlighted}
                  onMouseEnter={() => setHighlight(index)}
                  onMouseDown={(e) => {
                    // mousedown fires before blur — prevent default so the
                    // input keeps focus while we add the value.
                    e.preventDefault();
                    void commit(suggestion);
                  }}
                  className={[
                    'cursor-pointer px-3 py-1.5 text-sm transition-colors duration-fast',
                    isHighlighted
                      ? 'bg-bg-hover text-text-accent'
                      : 'text-text-primary hover:bg-bg-hover',
                  ].join(' ')}
                >
                  {suggestion}
                </li>
              );
            })}
          </ul>
        ) : null}

        {helperText ? (
          <p className="mt-1.5 text-[11px] text-text-muted">{helperText}</p>
        ) : null}
      </div>
    );
  },
);
