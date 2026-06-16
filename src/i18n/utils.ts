import { ui, defaultLang, type Lang, type UIKey } from './ui';

export { type Lang } from './ui';

const dateLocale: Record<Lang, string> = {
  en: 'en-US',
  es: 'es-ES'
};

export function getLangFromUrl(url: URL): Lang {
  const [, maybeLang] = url.pathname.split('/');
  if (maybeLang in ui) {
    return maybeLang as Lang;
  }
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: UIKey): string {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}

export function formatDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(dateLocale[lang], { dateStyle: 'medium' }).format(date);
}

export function langPrefix(lang: Lang): string {
  return lang === defaultLang ? '' : `/${lang}`;
}

export function homePath(lang: Lang): string {
  return `${langPrefix(lang)}/`;
}

export function blogPath(lang: Lang): string {
  return `${langPrefix(lang)}/blog/`;
}

export function aboutPath(lang: Lang): string {
  return `${langPrefix(lang)}/about/`;
}

export function tagPath(lang: Lang, slug: string): string {
  return `${langPrefix(lang)}/blog/tags/${slug}/`;
}

export function postPath(lang: Lang, slug: string): string {
  return `${langPrefix(lang)}/blog/${slug}/`;
}
