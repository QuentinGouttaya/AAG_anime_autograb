import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

// Load .env from the root of the monorepo
config({ path: '../../.env' });

export default defineConfig({
  test: {
    include: ['src/**/*.integration.test.ts'],
    testTimeout: 15000,
  },
});
