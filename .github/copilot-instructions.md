# Copilot instructions for madebygpsblog

This file tells GitHub Copilot how this project works and how to help with it.

## What this project is

This is a personal blog. It is built with [Astro](https://astro.build) and
hosted on Azure Static Web Apps. The site is fully static, which means every
page is built ahead of time into plain HTML, CSS, and a little JavaScript. There
is no server running code when a visitor loads a page.

## How the project is organized

- `src/pages/` holds the pages of the site. Astro turns each file here into a
  URL. For example, `src/pages/about.astro` becomes the `/about` page. Files
  with square brackets in the name, like `src/pages/blog/[id].astro`, are
  templates that build many pages from data.
- `src/layouts/BaseLayout.astro` is the shared wrapper for every page. It holds
  the header, footer, and all of the site styles in one place.
- `src/components/` holds smaller reusable pieces of a page.
- `src/content/blog/` holds the blog posts. Each post is a Markdown file.
- `src/content.config.ts` defines the rules for what a blog post must contain.
- `src/lib/` holds small helper functions, such as the one that turns a tag
  name into a clean URL slug.
- `infra/` holds the Azure infrastructure files (Bicep) that describe the
  hosting setup.
- `public/` holds files that are copied to the site as-is, such as images.

## Blog post format

Every blog post is a Markdown file in `src/content/blog/`. The file name becomes
part of the URL, so use lowercase words separated by dashes (for example,
`my-new-post.md`).

Each post starts with a block of settings at the top called frontmatter. It is
wrapped in three dashes. The rules live in `src/content.config.ts`. The fields
are:

- `title` (required): the post title, in quotes.
- `description` (required): a short summary of the post, in quotes.
- `pubDate` (required): the date the post was published, like `2024-01-20`.
- `updatedDate` (optional): the date the post was last changed.
- `tags` (optional): a list of up to two tags, like `["cloud", "linux"]`.
- `featureImage` (optional): a full image URL shown at the top of the post.
- `canonicalUrl` (optional): a full URL if the post first appeared somewhere
  else.

If you add a field that is not in this list, update `src/content.config.ts`
first so the build does not fail.

## Commands

- `npm run dev` starts a local preview server while you work.
- `npm run build` builds the final static site into the `dist/` folder.
- `npm run preview` shows the built site locally.

Run `npm run build` after making changes to confirm nothing is broken. The build
will stop with an error if a blog post is missing a required field.

## Styling

All styles live in one global `<style>` block inside
`src/layouts/BaseLayout.astro`. There is no separate CSS framework and no
per-component style files. Colors are set once as CSS variables (the names that
start with `--`) at the top of that block, so reuse those variables instead of
typing raw color values.

## Working agreements

- Never make changes or commits directly on the `main` branch. Always create a
  feature branch first. Start the branch name with `madebygps/`.
- Write in clear, plain language. Avoid jargon and technical shorthand. If a
  non-engineer would not understand a sentence, rewrite it.
- Do not use em dashes anywhere. Use commas, colons, or rewrite the sentence
  instead.
- Do not write quick hacks, bandaids, or workarounds. If a proper fix needs a
  larger refactor, say so and explain the choice. Do not silence linters or
  hide errors to make warnings go away.
- Keep changes small and focused on what was asked. Do not change unrelated
  files.
