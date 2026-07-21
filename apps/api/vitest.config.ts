import { configDefaults } from 'vitest/config';

export default {
  test: {
    exclude: [
      ...configDefaults.exclude,
      '**/dist/**',
      '**/*.integration.test.ts',
      '**/anilist_tag.test.ts',
    ],
  },
};
