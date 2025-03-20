import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts'],
    clearMocks: true,
    coverage: {
      provider: 'v8',
      enabled: true,
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
    },
    ...(process.env.CI
      ? {
        reporters: ['vitest-ctrf-json-reporter'],
      }
      : {}),
    testTimeout: 30000, // dumpDB() require long time
    hookTimeout: 30000, // dumpDB() require long time
  },
});
