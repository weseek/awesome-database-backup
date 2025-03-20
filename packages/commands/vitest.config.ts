import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts'],
    clearMocks: true,
    coverage: {
      provider: 'v8',
      enabled: true,
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
    },
    ...(process.env.CI
      ? {
        reporters: [
          'default',
          'json',
        ],
      }
      : {}),
    testTimeout: 20000,
  },
});
