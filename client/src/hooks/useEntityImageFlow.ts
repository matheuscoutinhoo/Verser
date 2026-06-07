import { useCallback, useState } from 'react';

/**
 * Generic image-attachment flow shared by every entity manager that supports
 * uploading a file or generating one with the AI image generator.
 *
 * It encapsulates:
 *  - the in-form image state (`imageUrl`, `previewUrl`, `pendingFile`),
 *  - the "AI modal for the create form" toggle (`aiOpenForCreate`),
 *  - the "AI modal for an existing row" target (`aiTarget`),
 *  - the two-step upload-after-create dance (caller invokes
 *    `flushPendingUpload` once the row exists),
 *  - URL.revokeObjectURL cleanup when the form closes.
 *
 * The caller owns persistence: it provides the `uploadForExisting` and
 * `applyAIForExisting` callbacks that talk to its specific service. The hook
 * stays entity-agnostic so Characters, Locations, Systems, Lore and Laws
 * can all reuse it.
 */
export interface EntityImageFlowState {
  imageUrl: string | null;
  previewUrl: string | null;
  pendingFile: File | null;
}

export interface UseEntityImageFlowOptions<TEntity extends { id: string }> {
  /** Persists an AI-generated URL against an *existing* row (edit mode).
   *  The hook calls this when `handleAIAcceptForExisting(entity, url)`
   *  fires, then clears its own `aiTarget`. */
  applyAIForExisting: (entity: TEntity, url: string) => Promise<void>;
}

export interface UseEntityImageFlowReturn<TEntity extends { id: string }> {
  // Form state
  imageState: EntityImageFlowState;
  setImageState: (updater: (prev: EntityImageFlowState) => EntityImageFlowState) => void;
  resetImageState: () => void;

  // AI modal
  /** Set to an entity to open the AI modal that patches it directly. */
  aiTarget: TEntity | null;
  setAiTarget: (entity: TEntity | null) => void;
  /** Toggles the AI modal that lands the URL into form state (create flow). */
  aiOpenForCreate: boolean;
  openAIForCreate: () => void;
  closeAIForCreate: () => void;

  // File-picker handlers — wire these straight into InlineImagePicker.
  handleUploadForCreate: (file: File) => Promise<string>;
  handleAIAcceptForCreate: (url: string) => void;
  handleAIAcceptForExisting: (entity: TEntity, url: string) => Promise<void>;

  // Submit helpers
  /** Call inside handleSubmit AFTER creating the row, when in create mode. */
  flushPendingUpload: (
    created: TEntity,
    uploadFn: (entity: TEntity, file: File) => Promise<unknown>,
  ) => Promise<void>;

  /** Releases the staged object URL — call from your closeForm helper. */
  cleanupPreview: () => void;
}

const EMPTY: EntityImageFlowState = {
  imageUrl: null,
  previewUrl: null,
  pendingFile: null,
};

export function useEntityImageFlow<TEntity extends { id: string }>(
  options: UseEntityImageFlowOptions<TEntity>,
): UseEntityImageFlowReturn<TEntity> {
  const [imageState, setStateInternal] = useState<EntityImageFlowState>(EMPTY);
  const [aiTarget, setAiTarget] = useState<TEntity | null>(null);
  const [aiOpenForCreate, setAiOpenForCreate] = useState(false);

  const setImageState = useCallback(
    (updater: (prev: EntityImageFlowState) => EntityImageFlowState) => {
      setStateInternal((prev) => updater(prev));
    },
    [],
  );

  const resetImageState = useCallback(() => {
    setStateInternal((prev) => {
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return EMPTY;
    });
  }, []);

  const cleanupPreview = useCallback(() => {
    setStateInternal((prev) => {
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return prev;
    });
  }, []);

  /** Stage a file in the create form (object-URL preview). */
  const handleUploadForCreate = useCallback(async (file: File): Promise<string> => {
    const objectUrl = URL.createObjectURL(file);
    setStateInternal((prev) => {
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return {
        pendingFile: file,
        previewUrl: objectUrl,
        // Local file wins over any prior AI URL.
        imageUrl: null,
      };
    });
    return objectUrl;
  }, []);

  /** Land an AI-generated URL into the create form. */
  const handleAIAcceptForCreate = useCallback((url: string) => {
    setStateInternal((prev) => {
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return { imageUrl: url, previewUrl: null, pendingFile: null };
    });
    setAiOpenForCreate(false);
  }, []);

  const handleAIAcceptForExisting = useCallback(
    async (entity: TEntity, url: string): Promise<void> => {
      await options.applyAIForExisting(entity, url);
      setAiTarget(null);
    },
    [options],
  );

  const flushPendingUpload = useCallback(
    async (
      created: TEntity,
      uploadFn: (entity: TEntity, file: File) => Promise<unknown>,
    ): Promise<void> => {
      const file = imageState.pendingFile;
      if (!file) return;
      await uploadFn(created, file);
    },
    [imageState.pendingFile],
  );

  return {
    imageState,
    setImageState,
    resetImageState,
    aiTarget,
    setAiTarget,
    aiOpenForCreate,
    openAIForCreate: () => setAiOpenForCreate(true),
    closeAIForCreate: () => setAiOpenForCreate(false),
    handleUploadForCreate,
    handleAIAcceptForCreate,
    handleAIAcceptForExisting,
    flushPendingUpload,
    cleanupPreview,
  } satisfies UseEntityImageFlowReturn<TEntity>;
}
