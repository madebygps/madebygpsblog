# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary readers are people browsing the author's published writing and looking for something relevant or interesting to read.

## Product Purpose

This is a personal blog that publishes essays and notes as Markdown content. Success means a reader can quickly understand the collection and choose a post to read.

## Positioning

The site presents the author's writing as a small, intentional collection rather than as a high-volume publication or a feed optimized for engagement.

## Operating Context

Readers arrive on desktop or mobile browsers, scan the blog index, use tags to narrow the collection, and open individual posts. The source content is maintained as Markdown files in the repository.

## Capabilities and Constraints

The site is built with Astro and TypeScript, renders statically, supports English and Spanish routes, and uses the existing blog content schema. Blog post URLs are derived from lowercase-dashed Markdown filenames.

## Brand Commitments

The author's requested direction is minimal, monotone, calm, and clear. The interface should feel like a connected collection of Markdown notes, with an Obsidian-like graph reference for browsing.

## Evidence on Hand

Blog posts are stored in `src/content/blog/` and rendered through the shared layout and post-list components. The repository contains existing English and Spanish translations.

## Product Principles

- Make the writing easy to browse.
- Let the content, not interface decoration, carry attention.
- Keep navigation and wayfinding clear.
- Favor a small, intentional collection over feed-like noise.

## Accessibility & Inclusion

Use semantic links and headings, preserve keyboard focus visibility, maintain readable contrast, and keep the collection usable on small screens.
