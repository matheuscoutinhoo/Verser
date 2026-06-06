import { useCallback, useEffect, useState } from 'react';

export interface EntityCrudApi<T, CreateInput, UpdateInput> {
  list: () => Promise<T[]>;
  create: (input: CreateInput) => Promise<T>;
  update?: (id: string, input: UpdateInput) => Promise<T>;
  delete: (id: string) => Promise<void>;
}

export interface EntityCrudState<T> {
  items: T[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  /** True between calls to create/update/delete. */
  mutating: boolean;
}

export interface EntityCrudHandle<T, CreateInput, UpdateInput>
  extends EntityCrudState<T> {
  refresh: () => Promise<void>;
  create: (input: CreateInput) => Promise<T>;
  update: (id: string, input: UpdateInput) => Promise<T>;
  remove: (id: string) => Promise<void>;
}

/**
 * Lightweight CRUD coordinator for list-shaped resources. Replaces the
 * repetitive `useState + try/catch + refresh` triplet every manager would
 * otherwise duplicate.
 *
 * The hook is intentionally simple: refetches the entire list after each
 * mutation. Volume per universe is small (≤ 100s of items) so latency is fine.
 */
export function useEntityCrud<T extends { id: string }, CreateInput, UpdateInput>(
  api: EntityCrudApi<T, CreateInput, UpdateInput>,
  deps: ReadonlyArray<unknown> = [],
): EntityCrudHandle<T, CreateInput, UpdateInput> {
  const [state, setState] = useState<EntityCrudState<T>>({
    items: [],
    status: 'idle',
    error: null,
    mutating: false,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const items = await api.list();
      setState({ items, status: 'ready', error: null, mutating: false });
    } catch (err) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to load.',
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const wrap = useCallback(
    async <R,>(op: () => Promise<R>): Promise<R> => {
      setState((s) => ({ ...s, mutating: true, error: null }));
      try {
        const result = await op();
        await refresh();
        return result;
      } catch (err) {
        setState((s) => ({
          ...s,
          mutating: false,
          error: err instanceof Error ? err.message : 'Operation failed.',
        }));
        throw err;
      }
    },
    [refresh],
  );

  return {
    ...state,
    refresh,
    create: (input) => wrap(() => api.create(input)),
    update: (id, input) =>
      wrap(() => {
        if (!api.update) throw new Error('update not supported');
        return api.update(id, input);
      }),
    remove: (id) => wrap(() => api.delete(id)),
  };
}
