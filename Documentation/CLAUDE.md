# Documentation

The customer-facing documentation of the Work OS — what a team is told when it adopts the OS: what the Work OS is, how it is set up and customized, and how to work in it. Self-contained: the site, one Word edition per platform, and the single source they are built from all live here. **Gated** (see `governance/write-policy.yaml`): changes go through the 🔒 prompt and an admin's approval, like any core file.

**Read this when:** Someone asks how the Work OS is introduced to a team, where the setup documentation is, or how to change it.

## What is here

- [work-os-docs.html](work-os-docs.html) — The documentation site, one self-contained file (open it in a browser; works offline). Sections: **Overview** (Work OS 101 · Skills and agents · Context system), **Setup** (Overview · Set up the repository · Set up your computer · Customize the Work OS · Connect your tools · Connect your product's code), **FAQ** (Troubleshooting · How changes flow · Reference). A GitHub / Azure Repos switch shows only the platform in use.
- [Work-OS-Team-Setup-GitHub.docx](Work-OS-Team-Setup-GitHub.docx) — The same content as a Word document, GitHub edition.
- [Work-OS-Team-Setup-Azure-Repos.docx](Work-OS-Team-Setup-Azure-Repos.docx) — Word document, Azure Repos edition.

### Subfolders

- [src/](src/) — The single source (`content.js`) and the build script that renders it into the site and both Word editions

## Changing the documentation

1. Edit `src/content.js` — every article is there; platform-specific wording uses `{gh:…|az:…}` inline or `platform("github", …)` blocks.
2. Rebuild: `cd Documentation/src && npm install && node build.js` (rewrites the three files above).
3. Approve the 🔒 prompts (this folder is gated) and land the change through the normal review flow.

Never edit `work-os-docs.html` or the `.docx` files by hand — they are build outputs. Terminology and folder structure follow the AI PM Jumpstart programme decks; the roles are repository admin, Work OS admin and Work OS user.
