import { execSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

export default async function globalSetup(): Promise<void> {
  const serverRoot = resolve(__dirname, '..');
  const dbPath = resolve(serverRoot, 'test.db');
  if (existsSync(dbPath)) {
    unlinkSync(dbPath);
  }
  const journalPath = `${dbPath}-journal`;
  if (existsSync(journalPath)) {
    unlinkSync(journalPath);
  }

  const childEnv = {
    ...process.env,
    DATABASE_URL: 'file:./test.db',
    NODE_ENV: 'test',
  };

  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    cwd: serverRoot,
    env: childEnv,
    stdio: 'pipe',
  });
}
