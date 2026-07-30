import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://madebygps.com',
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true
    }
  },
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false
    }
  }
});
