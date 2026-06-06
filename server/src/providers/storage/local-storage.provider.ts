import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { env } from '../../config/env';
import type { IStorageProvider, StorageWriteParams, StoredFile } from './types';

export class LocalStorageProvider implements IStorageProvider {
  constructor(private readonly rootDir: string = resolve(process.cwd(), env.UPLOAD_DIR)) {}

  async write(params: StorageWriteParams): Promise<StoredFile> {
    const ext = extname(params.originalName).toLowerCase();
    const key = `${params.ownerId}/${randomUUID()}${ext}`;
    const absolutePath = join(this.rootDir, key);
    await mkdir(join(this.rootDir, params.ownerId), { recursive: true });
    await writeFile(absolutePath, params.buffer);
    return {
      url: this.resolveUrl(key),
      key,
      size: params.buffer.byteLength,
      mimeType: params.mimeType,
    };
  }

  async delete(key: string): Promise<void> {
    const absolutePath = join(this.rootDir, key);
    await unlink(absolutePath).catch(() => undefined);
  }

  resolveUrl(key: string): string {
    return `/uploads/${key}`;
  }
}
