# Design Direction

<!-- impeccable:design-schema 1 -->

## Thesis

The site is a modern personal notebook: a compact collection of writing, books, and working notes that rewards close reading.

## World

The visual language uses warm white paper, charcoal text, a muted rust accent, and restrained rules. Sans-serif headings and navigation keep browsing clear. Serif post text supports close reading. Diagrams and tables belong to the writing, not dashboard widgets.

## Type and Color

Use `--sans` for headings, navigation, archive titles, and metadata. Use `--serif` for post text and book spine titles. Reserve `--mono` for code and technical shelf details. Keep the palette restrained: `--background` is warm white, `--surface` is the paper tone used for code, `--text` is charcoal, `--muted` is a readable stone gray, and `--accent` is muted rust. Code blocks use a light syntax theme on `--surface`.

## Composition

All content is left-aligned. The header and footer use `--shell` (52rem). Standard pages use `--measure` (44rem). Posts use `--reading` (39rem). The Books shelf uses the wider shell and retains its cover dialog. On small screens, all widths adapt to the viewport.

The home page opens with a short intro, four recent posts, and links to Books and Learn to Cloud. Writing lists posts under small year labels without row borders. Posts open with a date, title, and description, without a closing rule. The header contains madebygps, Writing, Books, and About. Social links and the language switch live in the footer.

## Interaction

Links retain obvious keyboard focus. Hover and focus use a soft paper tint and the rust accent without relying on color alone. The archive stays calm and readable on touch screens, with no decorative motion required.

## Constraints

Preserve the existing Astro routes, English and Spanish content, semantic links, tag filtering, and shared layout. Books links use the existing English `/read/` route. Preserve the book spine styling and cover popup. Avoid new decorative gradients, rounded card grids, heavy shadows, graph canvases, and noisy animation.
