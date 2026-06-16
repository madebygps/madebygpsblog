import { getCollection, type CollectionEntry } from 'astro:content';
import { defaultLang, type Lang } from './ui';

export type BlogPost = CollectionEntry<'blog'>;

/** Clean URL slug for a post: the file id without any leading language folder. */
export function postSlug(post: BlogPost): string {
  return post.id.replace(/^[a-z]{2}\//, '');
}

/** Stable key that links a post to its translations. */
export function translationKeyFor(post: BlogPost): string {
  return post.data.translationKey ?? postSlug(post);
}

const byNewest = (a: BlogPost, b: BlogPost) =>
  b.data.pubDate.valueOf() - a.data.pubDate.valueOf();

/** All posts written in a specific language. */
export async function getPostsInLang(lang: Lang): Promise<BlogPost[]> {
  const posts = await getCollection('blog');
  return posts.filter((post) => post.data.lang === lang).sort(byNewest);
}

/**
 * Posts to display for a viewing language. Shows the post in that language when
 * it exists; otherwise falls back to the default-language version so nothing is
 * hidden. Deduplicates translations by their translation key.
 */
export async function getDisplayPosts(lang: Lang): Promise<BlogPost[]> {
  const posts = await getCollection('blog');
  const byKey = new Map<string, BlogPost[]>();

  for (const post of posts) {
    const key = translationKeyFor(post);
    const group = byKey.get(key) ?? [];
    group.push(post);
    byKey.set(key, group);
  }

  const chosen: BlogPost[] = [];
  for (const group of byKey.values()) {
    const preferred = group.find((post) => post.data.lang === lang);
    const fallback = group.find((post) => post.data.lang === defaultLang);
    const pick = preferred ?? fallback ?? group[0];
    if (pick) {
      chosen.push(pick);
    }
  }

  return chosen.sort(byNewest);
}

/** Find the counterpart of a post in another language, if it exists. */
export async function getTranslation(
  post: BlogPost,
  lang: Lang
): Promise<BlogPost | undefined> {
  const posts = await getCollection('blog');
  const key = translationKeyFor(post);
  return posts.find((p) => p.data.lang === lang && translationKeyFor(p) === key);
}
