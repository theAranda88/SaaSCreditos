import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['reflect-metadata', 'test/setup.ts'],
    include: ['src/**/*.spec.ts', 'prisma/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
  },
});
