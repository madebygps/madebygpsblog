# Design Direction

<!-- impeccable:design-schema 1 -->

## Thesis

The site is a digital field notebook: an editorial collection of observations, diagrams, and working notes that rewards close reading.

## World

The visual language is a technical paperback: warm paper, dark ink, restrained rules, classical serif typography, and compact monospace metadata. The interface should feel printed and composed, with diagrams and tables treated as part of the writing rather than as dashboard widgets.

## Type and Color

Use a readable serif for essays, headings, and archive titles. Use a compact monospace face only for navigation labels, dates, tags, and technical metadata. Keep the palette restrained: `--background` is the surrounding paper tone, `--surface` is the raised page used for code, `--text` is dark ink, `--muted` is a readable stone gray, and `--accent` is a muted rust used sparingly for links and active states. Code blocks use a light syntax theme seated on `--surface` so they belong to the page.

## Composition

The shared shell is narrow and quiet: a single content column that header, page content, section rules, and footer all share, so every page aligns on the same rails. Each page opens with the same centered head (eyebrow, title, lede, optional topic index) closed by a hairline rule, then left-aligned body copy. The blog index lists notes under centered year markers; posts use the same head, followed by a book-like reading column where tables, figures, and code sit as evidence.

## Interaction

Links retain obvious keyboard focus. Hover and focus use a soft paper tint and the rust accent without relying on color alone. The archive stays calm and readable on touch screens, with no decorative motion required.

## Constraints

Preserve the existing Astro routes, English and Spanish content, semantic links, tag filtering, and shared layout. Avoid gradients, rounded card grids, heavy shadows, graph canvases, and noisy animation.
