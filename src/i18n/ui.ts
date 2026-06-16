export const languages = {
  en: 'English',
  es: 'Español'
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'en';

export const ui = {
  en: {
    'site.title': 'madebygps',
    'site.description': 'A minimal Astro blog hosted on Azure Static Web Apps.',
    'nav.blog': 'Blog',
    'nav.about': 'About',
    'nav.social': 'Social links',
    'nav.main': 'Main navigation',
    'lang.label': 'Language',
    'footer.builtWith': 'Built with Astro and Azure Static Web Apps.',
    'blog.title': 'Blog',
    'blog.lede': 'All posts, newest first.',
    'blog.browseByTopic': 'Browse by topic',
    'blog.allPosts': 'All posts',
    'blog.post': 'post',
    'blog.posts': 'posts',
    'post.originallyPublished': 'Originally published on',
    'tag.tagsFor': 'Tags for',
    'tag.tags': 'Tags',
    'notFound.title': 'Page not found',
    'notFound.heading': '404',
    'notFound.body': 'That page does not exist.',
    'notFound.home': 'Go back home'
  },
  es: {
    'site.title': 'madebygps',
    'site.description': 'Un blog minimalista hecho con Astro y alojado en Azure Static Web Apps.',
    'nav.blog': 'Blog',
    'nav.about': 'Acerca de',
    'nav.social': 'Redes sociales',
    'nav.main': 'Navegación principal',
    'lang.label': 'Idioma',
    'footer.builtWith': 'Hecho con Astro y Azure Static Web Apps.',
    'blog.title': 'Blog',
    'blog.lede': 'Todas las entradas, de la más reciente a la más antigua.',
    'blog.browseByTopic': 'Explorar por tema',
    'blog.allPosts': 'Todas las entradas',
    'blog.post': 'entrada',
    'blog.posts': 'entradas',
    'post.originallyPublished': 'Publicado originalmente en',
    'tag.tagsFor': 'Etiquetas de',
    'tag.tags': 'Etiquetas',
    'notFound.title': 'Página no encontrada',
    'notFound.heading': '404',
    'notFound.body': 'Esa página no existe.',
    'notFound.home': 'Volver al inicio'
  }
} as const;

export type UIKey = keyof (typeof ui)['en'];
