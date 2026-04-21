/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// Vitest config kept separate from vite.config.ts to avoid touching the
// production build configuration. Mirrors the `@` alias only.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/vitest.setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      // Legacy Jest-style tests under src/__tests__/ (top-level) — excluded
      // until migrated. See docs/audit/USERFLOW_AUDIT_2026-04-21.md.
      'src/__tests__/firestore.rules.test.ts',
      'src/__tests__/offerService.test.ts',
      'src/__tests__/services/**',
      'src/__tests__/utils/**',
      'src/__tests__/components/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/**/__tests__/**', 'src/legacy/**'],
    },
  },
});
