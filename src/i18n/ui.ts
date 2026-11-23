export const languages = {
  en: 'English',
  es: 'Español'
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'en';

export const ui = {
  en: {
    'site.title': 'madebygps',
    'site.description': 'Developer experience at GitHub. Building, writing, reading, and sharing.',
    'nav.home': 'Home',
    'nav.blog': 'Writing',
    'nav.books': 'Books',
    'nav.about': 'About',
    'nav.social': 'Social links',
    'nav.main': 'Main navigation',
    'lang.label': 'Language',
    'footer.builtWith': 'Made with Astro and Azure.',
    'home.title': 'Hi, I’m GPS',
    'home.intro': 'Developer experience at GitHub.',
    'home.lately': 'Lately',
    'home.building': 'Building',
    'home.writing': 'Writing',
    'home.reading': 'Reading',
    'home.sharing': 'Sharing',
    'home.by': 'by',
    'blog.title': 'Writing',
    'blog.lede': 'All posts, newest first.',
    'blog.browseByTopic': 'Browse by topic',
    'blog.allTopics': 'All topics',
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
    'site.description': 'Experiencia del desarrollador en GitHub. Construyo, escribo, leo y comparto.',
    'nav.home': 'Inicio',
    'nav.blog': 'Escritura',
    'nav.books': 'Libros',
    'nav.about': 'Acerca de',
    'nav.social': 'Redes sociales',
    'nav.main': 'Navegación principal',
    'lang.label': 'Idioma',
    'footer.builtWith': 'Hecho con Astro y Azure.',
    'home.title': 'Hola, soy GPS',
    'home.intro': 'Experiencia del desarrollador en GitHub.',
    'home.lately': 'Últimamente',
    'home.building': 'Construyo',
    'home.writing': 'Escribo',
    'home.reading': 'Leo',
    'home.sharing': 'Comparto',
    'home.by': 'de',
    'blog.title': 'Escritura',
    'blog.lede': 'Todas las entradas, de la más reciente a la más antigua.',
    'blog.browseByTopic': 'Explorar por tema',
    'blog.allTopics': 'Todos los temas',
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
