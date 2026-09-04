# Illustrations — sources of the schematic figures

The HTML sources of optional schematic illustrations — drawings of a screen, not screenshots — and the script that renders them to JPEGs in the parent folder (one JPEG per source, same name). Every schematic carries a "Schematic · not a screenshot" ribbon and a footer naming the screen it simplifies. Gated (part of `Documentation/`).

**Not in use.** No article embeds these drawings today: the team decided that only real screenshots go into the documentation, and Anthropic's public documentation has none of the two screens below (checked September 2026). To add real ones, an Owner of the Claude organization captures, on their own account, (1) **Admin settings › Claude Code** with the organization switches and the saved Managed settings text, and (2) the Claude Code desktop app's **mode selector** open next to an **approval card** for a file change — saved as JPEG in the parent folder and placed with `image(file, alt, caption)` in *Set up Claude Code for the team* (`content.js`), then `node build.js` and `node build-pdf.js`. To use a schematic instead, render it (`node render.js`) and place it the same way, keeping the "schematic, not a screenshot" wording in the caption.

**Read this when:** You are adding screenshots or a schematic to an article, or changing a drawing.

## Files

- [render.js](render.js) — Renders every `*.html` here (or one, by name) to `../<name>.jpg` at 2× through `../chrome.js`; the canvas size comes from `<body data-canvas="WIDTHxHEIGHT">`. Run `node render.js`, then rebuild the site (`node ../build.js`) and any PDF that shows the figure (`node ../build-pdf.js`).
- [claude-admin-console.html](claude-admin-console.html) — The Claude Code page of the Claude admin console (organization switches, Managed settings box) for *Set up Claude Code for the team*; layout and names follow Anthropic's documentation.
- [claude-code-mode-selector.html](claude-code-mode-selector.html) — The Claude Code desktop app under the organization rule: the mode selector without Auto and Bypass permissions, and the approval card before a file change — for *Set up Claude Code for the team*.
