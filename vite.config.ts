import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative asset paths so the build also works from a sub-path (e.g. GitHub Pages).
  base: './',
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
