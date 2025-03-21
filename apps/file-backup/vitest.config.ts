import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    clearMocks: true,
    ...(process.env.VITEST_ENV === 'performance'
      ? {
        include: ['**/__tests_performance__/**/*.test.ts'],
        testTimeout: 100000,
      } : {
        include: ['**/__tests__/**/*.test.ts'],
        testTimeout: 20000,
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
      }
    ),
  },
});
