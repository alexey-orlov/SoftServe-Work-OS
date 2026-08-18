# Documentation source

The single source of the documentation and the script that builds the site from it. Gated (part of `Documentation/`).

**Read this when:** You are changing what the documentation says, or rebuilding it.

## Files

- [content.js](content.js) — The one source: sections → articles → blocks (`h2`, `p`, `steps`, `say`, `callout`, `table`, `platform`, `image`, …). Inline markup: `**bold**`, `*italic*`, `` `code` ``, `[text](#/section/article)`, `{gh:GitHub wording|az:Azure wording}`. Edit this file, nothing else.
- [build.js](build.js) — Renders `content.js` to `../work-os-docs.html` (self-contained site: routing, platform switch, navigation, copy buttons, embedded images and logo). Run `node build.js` here — no dependencies to install. Prints `⚠ unresolved link …` for internal links that point nowhere and `⚠ both platforms …` for a sentence that names GitHub and Azure together outside a `{gh:|az:}` token — `/docs-update` treats both as must-fix.
- [package.json](package.json) — Build script entry (`npm run build`); no dependencies. `node_modules/` is git-ignored.
- [logo-inner.svg.txt](logo-inner.svg.txt) — The official SoftServe wordmark paths (from `assets.softserveinc.com/logos/softserve-logo.svg`), inlined into the site header.
- [pillars.jpg](pillars.jpg) — Illustration for *Work OS 101*: the six capabilities (AI PM Jumpstart, Session 1 deck).
- [levels.jpg](levels.jpg) — Illustration for *Work OS 101*: the four levels of AI acceleration (same deck).
