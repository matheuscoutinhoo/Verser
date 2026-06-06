export interface StoredFile {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

export interface StorageWriteParams {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  ownerId: string;
}

export interface IStorageProvider {
  write(params: StorageWriteParams): Promise<StoredFile>;
  delete(key: string): Promise<void>;
  resolveUrl(key: string): string;
}
