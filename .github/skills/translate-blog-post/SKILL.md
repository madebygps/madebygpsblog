---
name: translate-blog-post
description: "Translate a madebygps blog post or page from English into neutral Latin American Spanish in GPS's voice. Use when asked to translate a post, create a Spanish version of a page, or add an es/ version of content. WHEN: translate this post, translate to Spanish, make a Spanish version, traducir, crear versión en español, add es translation."
license: MIT
metadata:
  author: madebygps
  version: "1.0.0"
---

# Translate Blog Post

Translate English content into Spanish for this blog the way GPS would write it herself. The goal is not a literal translation. The goal is the same idea, the same voice, in natural Spanish.

## The voice

GPS writes in plain, warm, direct language. She:

- Talks to one reader, like a friend who codes.
- Uses short sentences and concrete words.
- Avoids jargon, hype, and corporate filler.
- Is honest about what she does not know, and explains her reasoning out loud.

When you translate, read the whole English piece first. Understand what she is actually saying and how she is saying it. Then write it again in Spanish. If a sentence sounds stiff or robotic when read out loud, rewrite it.

## Translation rules

1. **Neutral Latin American Spanish.** No regionalisms tied to one country. It should read naturally to readers across Latin America.
2. **Use tuteo (tú), never usted and never vos.** Address the reader as "tú".
3. **Keep technical terms in English when that is how developers actually say them.** Do not force a Spanish word that nobody uses. Examples that stay in English: flag, subprocess, bootstrap, heredoc, helper, release, tarball, checksum, workflow, inline, skill, testing, troubleshooting, timeouts, assets, open source, benchmark, bug, logs, daemon, boot data, user data, startup script. Also keep product and proper names as-is: Python, Azure, MCP, Microsoft, Learn to Cloud.
4. **Job title is always "Python Cloud Advocate" in English.** Never translate it.
5. **Use straight quotes ("like this"), not angle quotes («like this»).**
6. **Preserve the author's lowercase titles.** If the English title is lowercase, keep the Spanish title lowercase.
7. **Do not translate code, commands, file paths, URLs, or anything inside backticks or code fences.** Translate prose only.
8. **Keep all Markdown structure intact:** links, headings, lists, code blocks, and inline code stay where they are. Translate link text, keep link targets unchanged.

## When you are unsure

If you hit a term or phrase you are not confident how to translate well, do not guess silently. Pick the option you think is best, use it, and keep a list. At the end, tell GPS every judgment call you made and the alternatives you considered, so she can decide. Examples of past judgment calls: flag vs bandera, mergear vs fusionar, "reloj de pared" for wall clock, "biblioteca estándar" vs "librería".

## Blog post mechanics

Spanish posts live in `src/content/blog/es/` and share the same filename as their English original in `src/content/blog/`.

The frontmatter must:

- Translate `title` and `description` into Spanish (following the rules above).
- Keep `pubDate` and `tags` exactly the same as the English original. Tags are not translated.
- Add `lang: "es"`.
- Add `translationKey: "<english-slug>"` where the slug is the English filename without the `.md` extension. This links the two language versions together.

Example, for an English post `src/content/blog/verify-time-wall-clock.md`, the Spanish version at `src/content/blog/es/verify-time-wall-clock.md` has frontmatter:

```yaml
---
title: "verificar el tiempo y el reloj de pared"
description: "Qué mide en realidad el temporizador del CTF..."
pubDate: 2026-05-26
tags: ["linux", "learntocloud"]
lang: "es"
translationKey: "verify-time-wall-clock"
---
```

## Page mechanics

For pages (like About), the Spanish copy lives in its own component, for example `src/components/AboutContentEs.astro`. Read the English source component to capture the voice, then translate the prose into the Spanish component. Do not change layout, props, or markup, only the text.

## Steps

1. Read the full English source (post or page). Understand the meaning and the voice.
2. Translate into Spanish following every rule above. Write naturally, not literally.
3. Place the result in the correct location with correct frontmatter or component.
4. Run `npm run build` to confirm it builds cleanly.
5. Report to GPS: a short summary, plus the full list of any judgment calls or terms you were unsure about.
