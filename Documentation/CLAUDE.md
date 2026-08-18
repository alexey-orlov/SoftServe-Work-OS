# Documentation

The customer-facing documentation of the Work OS — what a team is told when it adopts the OS: what the Work OS is, how it is set up and customized, and how to work in it. Self-contained: the site, one Word edition per platform, and the single source they are built from all live here. **Gated** (see `governance/write-policy.yaml`): changes go through the 🔒 prompt and an admin's approval, like any core file.

**Read this when:** Someone asks how the Work OS is introduced to a team, where the setup documentation is, or how to change it.

## What is here

- [work-os-docs.html](work-os-docs.html) — The documentation site, one self-contained file (open it in a browser; works offline). Sections and articles come from `src/content.js` — the top menu and the left panel are the live table of contents (Work OS 101, the skills and context-system overviews, the setup stages, troubleshooting, …). A GitHub / Azure Repos switch shows only the platform in use.
- [Work-OS-Team-Setup-GitHub.docx](Work-OS-Team-Setup-GitHub.docx) — The same content as a Word document, GitHub edition.
- [Work-OS-Team-Setup-Azure-Repos.docx](Work-OS-Team-Setup-Azure-Repos.docx) — Word document, Azure Repos edition.

### Subfolders

- [src/](src/) — The single source (`content.js`) and the build script that renders it into the site and both Word editions

## Changing the documentation — use `/docs-update`

Every change goes through the `/docs-update` skill: **edit mode** applies what you ask for ("add a step to Set up your computer", "reword the roles table"), **sync mode** ("bring the docs up to date") checks every stated fact against its source of truth in the repo and corrects what went stale — without adding articles unasked. Both edit `src/content.js` only, rebuild (`cd Documentation/src && npm install && node build.js`), verify (the build flags unresolved links and any sentence that names both platforms), and report article › section. This folder is gated: the 🔒 prompts appear, and the change lands through the normal review flow.

Never edit `work-os-docs.html` or the `.docx` files by hand — they are build outputs. Terminology and folder structure follow the AI PM Jumpstart programme decks; the roles are repository admin, Work OS admin and Work OS user.
