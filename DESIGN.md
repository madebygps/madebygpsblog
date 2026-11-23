# Design Direction

<!-- impeccable:design-schema 1 -->

## Thesis

The site is a quiet personal profile: a short introduction and a few things GPS is building, writing, reading, and sharing.

## World

The visual language uses warm white paper, charcoal text, muted olive accents, and restrained rules. Sans-serif headings and navigation keep browsing clear. Serif post text supports close reading. There are no activity cards, engagement counts, or embedded social feeds.

## Type and Color

Use `--sans` for headings, navigation, archive titles, and metadata. Use `--serif` for post text and book spine titles. Reserve `--mono` for code and technical shelf details. Keep the palette restrained: `--background` is warm white, `--surface` is the paper tone used for code, `--text` is charcoal, `--muted` is a readable gray, and `--accent` is muted olive. Code blocks use a light syntax theme on `--surface`.

## Composition

All content is left-aligned. The shared header, standard pages, and footer use `--measure` (35rem). Posts use `--reading` (35rem). The Books shelf alone uses `--shell` (52rem) and retains its cover dialog. All pages share the same top spacing, profile photo, GPS wordmark, and navigation dimensions. Reserve scrollbar space to prevent horizontal movement between pages. Keep the footer at the bottom of short pages. On small screens, all widths adapt to the viewport.

The home page opens with a one-line bio and five small social icons. Four plain rows show Building, Writing, Reading, and Sharing. Maintain those selections in `HomeContent.astro`; this version does not fetch external feeds. Do not add a More disclosure or affiliate recommendations.

Writing shows titles beside small year labels, with a topic selector that opens the existing tag routes. Keep summaries, per-post dates, and tag chips out of the archive. About uses plain paragraphs and links to the existing bookshelf. Posts retain their dates, descriptions, tags, and readable article links.

The header contains GPS, Writing, and About. The footer links “Made with Astro and Azure” to this repository and retains the language switch. `/links` redirects permanently to `/`.

## Interaction

Links retain obvious keyboard focus. Hover underlines text links. Social icons use accessible names and restrained color changes. Topic links remain available without JavaScript. The archive stays calm and readable on touch screens, with no decorative motion required.

## Constraints

Preserve blog and tag URLs, English and Spanish content, semantic links, tag filtering, and the shared layout. Books links use the existing English `/read/` route. Preserve the book spine styling and cover popup. Avoid new decorative gradients, rounded card grids, heavy shadows, graph canvases, and noisy animation.
