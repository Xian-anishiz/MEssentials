import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    alias: {
      $components: 'src/lib/components',
      $mocks: 'src/lib/mocks',
      $stores: 'src/lib/stores',
      $types: 'src/lib/types'
    }
  }
};

export default config;
