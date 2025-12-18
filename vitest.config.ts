import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    environmentMatchGlobs: [
      // Use edge-runtime for Convex tests (required by convex-test)
      ['convex/**/*.test.ts', 'edge-runtime'],
      // Use happy-dom for everything else (React components, hooks, utils)
      ['**/*.test.{ts,tsx}', 'happy-dom'],
    ],
    setupFiles: ['./tests/vitest.setup.ts'],
    server: {
      deps: {
        inline: ['convex-test'],
      },
    },
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/convex/_generated/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/node_modules/**',
        '**/convex/_generated/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/tests/**',
        '**/__tests__/**',
        '**/dist/**',
        '**/.next/**',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
