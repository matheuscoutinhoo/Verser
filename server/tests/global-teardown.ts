import { existsSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

export default async function globalTeardown(): Promise<void> {
  const dbPath = resolve(__dirname, '..', 'test.db');
  if (existsSync(dbPath)) {
    try {
      unlinkSync(dbPath);
    } catch {
      // Ignore — Windows sometimes locks the file briefly.
    }
  }
}
