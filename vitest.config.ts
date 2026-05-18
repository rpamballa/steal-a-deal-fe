import {defineConfig} from 'vitest/config';

// Scoped to the web app only. The React Native scaffold keeps its own
// jest config (preset: react-native); these two runners do not overlap.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', 'android', 'ios', '__tests__'],
    globals: true,
  },
});
