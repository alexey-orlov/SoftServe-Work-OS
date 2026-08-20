# Figma MCP cheat sheet (remote server)

Server URL: `https://mcp.figma.com/mcp`. Verified against Figma's developer docs,
"Tools and prompts". Tool names change occasionally - if a call fails with an
unknown-tool error, list the connected server's tools rather than guessing.

## The one constraint that shapes everything

**The remote server has no concept of "my selection."** Selection-based prompting
works only on the desktop (Dev Mode) server. Every remote call needs a file, page,
frame, or node link. When a user says "the frame I have open," ask for the link:
right-click the frame in Figma, Copy link to selection.

A whole-file URL works when nothing specific is selected, and gives file-wide
context - useful for token extraction, wasteful for building one screen.

## Tools, in the order this skill uses them

| Tool | Returns | Use it for |
|---|---|---|
| `get_variable_defs` | variables and styles used in the selection (colors, spacing, typography) | primary token extraction |
| `get_libraries` | subscribed libraries plus available ones, with names and keys | finding the real design system when the frame's variables look thin |
| `search_design_system` | components, variables, styles matching a text query, across connected libraries | looking up a specific component or token by name instead of dumping everything |
| `get_metadata` | sparse XML outline - layer ids, names, types, positions, sizes | mapping a file cheaply before pulling any styling |
| `get_design_context` | code plus styling for a layer | building a specific screen |
| `get_screenshot` | PNG of one node | layout ground truth, and the comparison target for the finished preview |
| `download_assets` | export renders and original source images, up to 20 nodes, PNG/JPG/SVG/PDF | real logos, illustrations, icons |
| `get_code_connect_map` | Figma node id to code component mapping | only when the user wants real components, which is out of scope here |

Also available and occasionally relevant: `get_motion_context` returns keyframe
data with ready-made CSS `@keyframes` for animated nodes - worth a call when the
design has meaningful motion and the preview should demonstrate it.

## Context discipline

`get_design_context` on a page or a large frame returns enough output to consume
the whole context window, leaving nothing to write HTML with. Figma documents this
explicitly and recommends against large frames.

The reliable pattern:

1. `get_metadata` with no node id - returns the file's top-level pages.
2. `get_metadata` on the page id - returns the outline of frames.
3. Pick the two to six frames that matter. Confirm the list with the user if the
   page has many candidates and the choice is not obvious.
4. `get_design_context` per chosen frame, plus `get_screenshot` for the same node.

If a `get_metadata` call is passed a bad node id, the error response includes the
page list, which is a usable recovery path rather than a dead end.

## Getting HTML instead of React

`get_design_context` defaults to React plus Tailwind. Ask for what you need in the
prompt to the tool - "generate this in plain HTML and CSS". Even then, treat the
output as a description of the design rather than shippable markup: it will not use
the project's token names, and reconciling it with the token set is the actual work.

## Rate limits

The server is rate limited per user. This is the practical reason the skill caches
tokens to `product-development/product/prototypes/design-system/`: a second
prototype against the same design system should cost zero Figma calls for the
token half of the job.

## Related tools worth knowing about but not using here

`use_figma`, `create_new_file`, `generate_figma_design`, and `upload_assets` write
to Figma. This skill reads only. Writing back to a designer's file as a side effect
of a preview request would be a genuinely unwelcome surprise - if the user wants
that, it is a separate, explicit request.
