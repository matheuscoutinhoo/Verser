/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  globalSetup: '<rootDir>/tests/global-setup.ts',
  globalTeardown: '<rootDir>/tests/global-teardown.ts',
  setupFiles: ['<rootDir>/tests/env.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/types/**',
    '!src/providers/**',
  ],
  coverageThreshold: {
    global: {
      branches: 55,
      functions: 80,
      lines: 85,
      statements: 80,
    },
  },
  moduleNameMapper: {
    '^@verser/shared$': '<rootDir>/../packages/shared/src',
    '^@verser/shared/(.*)$': '<rootDir>/../packages/shared/src/$1',
  },
  testTimeout: 20000,
  clearMocks: true,
  restoreMocks: true,
};
