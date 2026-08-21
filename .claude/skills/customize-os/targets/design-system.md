# Playbook — target: `design-system`

A guided choice, not a template derivation: no examples needed, one question set, the
answer lands in the `prototyping:` key of `product-development/toolchain.yaml` (gated).
`/prototype` routes by it from the next run. Shared lifecycle, state, readout, and write
rules: SKILL.md.

1. **When it runs:** at its slot in the guided sequence — prototyping grounding shapes
   every `/prototype` run — and by name anytime: `/customize-os design-system` re-asks
   the full question even when a choice exists; that IS the change mechanism. Skipping is
   one word: record `approach: undecided`, phase → `complete`, Open — Other: "prototypes
   ask at run time". Never nag afterwards.
2. **Evidence before questions:** a reachable Figma or design MCP, an existing
   `product/prototypes/design-system/` cache, or a screenshots folder is evidence of the
   answer — quote it and confirm rather than asking cold.
3. **The one question** (recommendation first, from the evidence): how should prototypes
   get their design grounding?
   - `figma-mcp` — the design system lives in Figma; `/prototype` extracts real tokens.
     Params: `library-url`. Not yet connected → offer to run `/connect-mcps connect to
     figma` in this run (connection is that skill's job, including the Connectors-screen
     route).
   - `design-mcp` — another design tool with an MCP. Params: `mcp-name`, `source-url`.
     Same delegation to `/connect-mcps`.
   - `claude-design` — the system lives in a Claude Design space. Params: `design-url`.
   - `screenshots` — no design tool; a folder of product screenshots is the visual
     reference. Params: `screenshots-dir` (default
     `product-development/product/prototypes/design-system/screenshots/`); scaffold the
     folder with a 5-line CLAUDE.md ("drop reference screenshots here") when missing.
   - `external-prompts` — the team reviews in v0 / Lovable / Bolt rather than HTML files;
     `/prototype` defaults to the prompt path. Params: `preferred-tool`.
   - `plain-html` — prototype without a design system, honestly un-branded.
4. **Install:** write approach + params + `decided:` date + one-line notes behind the
   gated prompt. Master repo: the file ships `undecided` — a real choice stages outside
   the repo like every master-run output.
5. **Companions:** the `/connect-mcps` delegation when the chosen approach needs a
   connection that isn't live yet; the screenshots-folder scaffold when that approach was
   chosen; offer `/decision-log-entry` ("Chose {approach} for prototyping design
   grounding"). All done → `complete`. Skipped (`undecided`) → `complete` immediately,
   with the Open — Other line.
