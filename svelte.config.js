import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      runtime: 'nodejs22.x'
    }),
    alias: {
      $components: 'src/lib/components',
      $mocks: 'src/lib/mocks',
      $stores: 'src/lib/stores',
      $types: 'src/lib/types'
    }
  }
};

export default config;
