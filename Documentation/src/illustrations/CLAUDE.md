# Illustrations — sources of the schematic figures

The HTML sources of the documentation's schematic illustrations — drawings of a screen where a real screenshot can't be captured or would go stale — and the script that renders them to the JPEGs `content.js` embeds (one JPEG per source, same name, in the parent folder). Every schematic carries a "Schematic · not a screenshot" ribbon and a footer naming the screen it simplifies. Gated (part of `Documentation/`).

**Read this when:** You are changing a schematic, adding one, or a rendered JPEG looks out of date.

## Files

- [render.js](render.js) — Renders every `*.html` here (or one, by name) to `../<name>.jpg` at 2× through `../chrome.js`; the canvas size comes from `<body data-canvas="WIDTHxHEIGHT">`. Run `node render.js`, then rebuild the site (`node ../build.js`) and any PDF that shows the figure (`node ../build-pdf.js`).
- [claude-admin-console.html](claude-admin-console.html) — The Claude Code page of the Claude admin console (organization switches, Managed settings box) for *Set up Claude Code for the team*; layout and names follow Anthropic's documentation.
- [claude-code-mode-selector.html](claude-code-mode-selector.html) — The Claude Code desktop app under the organization rule: the mode selector without Auto and Bypass permissions, and the approval card before a file change — for *Set up Claude Code for the team*.
