# Copilot instructions for madebygpsblog

A personal blog built with Astro (static output) and hosted on Azure Static Web Apps.

## Tech stack
- Astro 6, TypeScript, plain CSS. No UI framework, no CSS framework.
- Content is Markdown files. Hosting is Azure Static Web Apps (Bicep in `infra/`).

## Project structure
- `src/pages/` - routes. File names map to URLs. `[brackets]` are dynamic routes.
- `src/layouts/BaseLayout.astro` - shared page shell and all global styles.
- `src/components/` - reusable page pieces.
- `src/content/blog/` - blog posts as Markdown.
- `src/content.config.ts` - the schema every blog post must follow.
- `src/lib/` - helper functions (e.g. tag slug).
- `infra/` - Azure Bicep. `public/` - static assets copied as-is.

## Commands
- `npm run dev` - local dev server.
- `npm run build` - build static site to `dist/`. Run this to verify changes.
- `npm run preview` - preview the build.

## Blog posts
- File name uses lowercase-dashed words and becomes the URL slug.
- Frontmatter fields are defined in `src/content.config.ts`: `title`, `description`, `pubDate` (required); `updatedDate`, `tags` (max 2), `featureImage` (URL), `canonicalUrl` (URL) (optional).
- Adding a new field means updating `src/content.config.ts` first, or the build fails.

## Styling
All styles live in one global `<style>` block in `BaseLayout.astro`. Reuse the
`--` CSS variables defined there instead of hardcoding colors.

## Working rules
- Never commit to `main`. Branch first, named `madebygps/<topic>`.
- When talking to me, use clear, plain language. No jargon. No em dashes.
- No hacks or workarounds. If a fix needs a refactor, say so. Never silence linters or tests.
- Keep changes small and scoped to the request.
