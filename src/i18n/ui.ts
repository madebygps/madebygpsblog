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
    'nav.blog': 'Writing',
    'nav.books': 'Books',
    'nav.about': 'About',
    'nav.social': 'Social links',
    'nav.main': 'Main navigation',
    'lang.label': 'Language',
    'footer.builtWith': 'Built with Astro and Azure Static Web Apps.',
    'home.title': 'Hi, I’m GPS',
    'home.intro': 'I work on developer experience at GitHub and build Learn to Cloud. This is my public notebook: what I’m learning, building, and thinking about.',
    'home.recent': 'Recent writing',
    'home.allWriting': 'All writing',
    'home.booksDescription': 'Books that helped me learn, grow, and see things differently.',
    'home.cloudDescription': 'The free guide to learning cloud engineering, one step at a time.',
    'blog.title': 'Writing',
    'blog.lede': 'All posts, newest first.',
    'blog.browseByTopic': 'Browse by topic',
    'blog.allPosts': 'All posts',
    'blog.post': 'post',
    'blog.posts': 'posts',
    'blog.noPosts': 'No posts in this folder.',
    'blog.mapTitle': 'Writing network',
    'blog.mapHint': 'Follow a topic, then open a connected post.',
    'blog.mapDescription': 'A map of posts connected to the topics they share.',
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
    'nav.blog': 'Escritura',
    'nav.books': 'Libros',
    'nav.about': 'Acerca de',
    'nav.social': 'Redes sociales',
    'nav.main': 'Navegación principal',
    'lang.label': 'Idioma',
    'footer.builtWith': 'Hecho con Astro y Azure Static Web Apps.',
    'home.title': 'Hola, soy GPS',
    'home.intro': 'Trabajo en experiencia del desarrollador en GitHub y construyo Learn to Cloud. Este es mi cuaderno público: lo que aprendo, construyo y pienso.',
    'home.recent': 'Escritura reciente',
    'home.allWriting': 'Todas las entradas',
    'home.booksDescription': 'Libros que me ayudaron a aprender, crecer y ver las cosas de otra manera.',
    'home.cloudDescription': 'La guía gratuita para aprender ingeniería de la nube, paso a paso.',
    'blog.title': 'Escritura',
    'blog.lede': 'Todas las entradas, de la más reciente a la más antigua.',
    'blog.browseByTopic': 'Explorar por tema',
    'blog.allPosts': 'Todas las entradas',
    'blog.post': 'entrada',
    'blog.posts': 'entradas',
    'blog.noPosts': 'No hay entradas en esta carpeta.',
    'blog.mapTitle': 'Red de escritura',
    'blog.mapHint': 'Sigue un tema y abre una entrada conectada.',
    'blog.mapDescription': 'Un mapa de entradas conectadas por los temas que comparten.',
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
