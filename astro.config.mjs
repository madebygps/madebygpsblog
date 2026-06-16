import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://madebygps.com',
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false
    }
  }
});
