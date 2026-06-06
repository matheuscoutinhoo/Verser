// Loaded by jest setupFiles BEFORE the test framework — sets env required for env.ts validation.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'file:./test.db';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-with-enough-entropy-for-validation-rules';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-with-enough-entropy-for-validation-rules';
process.env.JWT_ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION ?? '15m';
process.env.JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION ?? '7d';
process.env.CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';
process.env.COOKIE_DOMAIN = 'localhost';
process.env.COOKIE_SECURE = 'false';
// Logger forces 'silent' when NODE_ENV=test regardless of LOG_LEVEL.
