---
name: code-first-draft
description: Build the first-pass implementation of a PRD or feature brief in the product codebase — explore, plan, get approval, implement with tests; auto-switches to a standalone reference implementation when no codebase is connected. A feature brief (PRDs/{area}/*-brief.md) is the preferred source when one exists. Writes real code plus a summary in PRDs/prototypes/. NOT for answering what the code does today (/code-qa), UI-only mockups (/prototype), or setting up code access (/connect-code).
argument-hint: "[PRD or feature] [--explore-only]"
group: delivery
---

## Quick Start

1. Point the skill to a feature brief or PRD, or describe the feature to build
2. The skill explores your codebase (framework, patterns, structure) or switch to Prototype Mode if no codebase exists
3. The skill creates an implementation plan and ask for your approval before writing code
4. The skill implements the feature following existing code patterns, with tests
5. The skill delivers a summary with files created/modified, test coverage, and next steps

**Example:** "Build the user preferences feature from product-development/product/PRDs/{area}/preferences.md"

**Output:** Code in your codebase + summary saved to `product-development/product/PRDs/prototypes/[feature]-first-draft.md`

**Time:** 1-3 hours depending on feature complexity

## Purpose

Connect to codebase and build initial implementation of a feature. Single-pass development with manual iteration.

## Usage

- `/code-first-draft` - Build feature from PRD
- `/code-first-draft [prd-name]` - Build specific PRD
- `/code-first-draft --explore-only` - Just explore codebase, don't write code yet

---

## Context Routing

**Check first:**
1. `product-development/product/PRDs/{area}/` - feature brief (`*-brief.md`, preferred when one exists — its rules/ACs and constraints are the implementation contract) or PRD for requirements
2. `product-development/engineering/code-repos.yaml` - which repo owns the area, entry points, clone command
3. `product-development/engineering/codebases/{repo-slug}.md` - cached codebase map, if one exists (routing hints only)
4. Codebase (`.git` directory, source files)

---

## Workflow

### Step 1: Codebase Setup (First Time Only)

**Detect codebase:**
```bash
# Check if in codebase directory
ls -la | grep ".git"
```

**If not in codebase:**
- Ask: "Where's your codebase?"
- Options:
  1. "Run `/connect-code`" (registers the repo, clones, grants access — the durable setup)
  2. "Navigate me there" (cd to directory)
  3. "Clone from GitHub" (provide repo URL, the skill will clone with `gh repo clone`)
  4. "Connect via MCP" (GitHub MCP for remote access)

**Explore codebase:**
```bash
# Detect framework
ls package.json || ls requirements.txt || ls Gemfile || ls go.mod

# Find key directories
find . -type d -name "components" -o -name "src" -o -name "app" | head -10

# Understand structure
tree -L 2 -I 'node_modules|__pycache__|.git'
```

**Save context:**
Don't write your own overview file — durable codebase context lives in the SHA-stamped
map at `product-development/engineering/codebases/{repo-slug}.md`, written by
`/connect-code` (one writer per surface). If the repo isn't registered yet, or the map
is missing/stale for what you just learned, suggest `/connect-code` (or `--refresh`) to
the user; keep this session's exploration findings in-session.

---

### Step 2: PRD to Technical Requirements

**Read PRD and extract:**
- User stories → Features to build
- Success metrics → Analytics to instrument
- Edge cases → Error handling needed
- Non-goals → What NOT to build

**Map to code:**
- Which files need modification?
- Which new files needed?
- Which APIs to create/modify?
- Which database changes required?

---

### Step 3: Implementation Plan

**Before writing code, create plan:**

```markdown
# Implementation Plan: [Feature]

## Files to Create
- `src/components/NewFeature.tsx` - Main component
- `src/api/feature.ts` - API routes
- `tests/feature.test.ts` - Unit tests

## Files to Modify
- `src/components/Dashboard.tsx` - Add new feature entry point
- `src/api/index.ts` - Register new routes
- `src/types/index.ts` - Add type definitions

## API Endpoints
- `POST /api/feature` - Create new item
- `GET /api/feature/:id` - Fetch item
- `PUT /api/feature/:id` - Update item

## Database Changes
- Add `features` table with columns: id, user_id, data, created_at

## Testing Approach
- Unit tests for components
- Integration tests for API
- E2E test for happy path
```

**Ask user for approval:** "This is my plan. Approve before I write code?"

---

### Step 4: Implementation

**Write code following:**
- Existing code patterns (match style)
- Framework conventions
- PRD requirements
- Best practices

**Add inline comments for:**
- Complex logic
- Edge case handling
- TODOs for future work

**Create tests:**
- Unit tests for core logic
- Basic integration tests
- Mark areas needing more coverage

---

### Step 5: Summary Document

Save to `product-development/product/PRDs/prototypes/[feature]-first-draft.md`:

```markdown
# First Draft Implementation: [Feature]

**Date:** [Date]
**PRD:** [Link]

## What Was Built

**Files created:** [X]
**Files modified:** [Y]
**Tests added:** [Z]

## Implementation Approach

[Brief description of technical approach]

## Testing

**Coverage:** [%]
**Tests passing:** [Y/N]
**Manual testing needed:** [What to test]

## Known Issues / TODOs

- [ ] [Issue 1]
- [ ] [TODO 1]

## Next Steps

- Run tests
- Manual QA
- For complex features: consider an autonomous iteration loop (`os-installation/claude-code/ralph-wiggum.md`)
```

---

## Prototype Mode (No Codebase Detected)

If no codebase is detected (no `.git` directory, no `package.json`, no source files in the workspace), switch to **Prototype Mode** automatically.

### Tech Stack Detection (Prototype Mode)

Before choosing the prototype tech stack, check `product-development/product/strategy/business-context/business-info.md` for the company's actual technology:

**Check for:**
- Frontend framework (React, Vue, Angular, Svelte)
- Language (TypeScript, JavaScript, Python)
- CSS approach (Tailwind, styled-components, CSS modules)
- Backend framework (Next.js, Express, FastAPI, Django)
- Infrastructure (AWS, GCP, Azure)

**If tech stack is found:** Match the prototype to the company's stack so engineering can more easily adopt it.
- Example: Business-info says "React + TypeScript + Tailwind on AWS" --> generate prototype using React + TypeScript + Tailwind, not Vue or plain CSS.

**If no tech stack found:** Use sensible defaults (React + TypeScript + Tailwind for UI, FastAPI for backend, Next.js for full-stack) and note: "No company tech stack found in context. Using industry-standard defaults. Engineering should adapt to your actual stack."

**What changes:**
- Instead of modifying an existing codebase, generate a **standalone reference implementation** that the PM can share with engineering
- Use the company's tech stack (from business-info) if available; otherwise fall back to the most common stack for the feature type:
  - **UI features:** React + TypeScript + Tailwind CSS
  - **Backend/API features:** Python (FastAPI) or Node.js (Express + TypeScript)
  - **Full-stack features:** Next.js + TypeScript
  - **Data processing:** Python with standard libraries
- Include a `README.md` with setup instructions (`npm install && npm run dev` or equivalent)
- Add a header comment in every file: `// Reference prototype - not production code. Share with engineering as a starting point.`

**Output:** Save all files to `product-development/product/PRDs/prototypes/[feature]-reference-impl/`

**When presenting to PM:**
> "No codebase detected, so I built a standalone reference prototype using [stack]. This is not production code -- share it with engineering as a starting point for the real implementation. They should adapt it to your actual codebase patterns, auth system, and infrastructure."

---

## Accessibility Guidance

For UI features, include basic accessibility in all generated code:

**Required accessibility patterns:**
- **ARIA labels** on all interactive elements (buttons, inputs, links, toggles)
- **Keyboard navigation** -- all interactive elements reachable via Tab, activatable via Enter/Space
- **Sufficient color contrast** -- avoid light-gray-on-white text; use WCAG AA minimum (4.5:1 for normal text)
- **Screen reader-friendly ordering** -- logical DOM order matches visual order; use semantic HTML (`<nav>`, `<main>`, `<section>`, `<button>`)
- **Focus indicators** -- visible focus ring on interactive elements (do not remove `outline`)
- **Alt text** on images and icons that convey meaning
- **Error messages** associated with form fields via `aria-describedby`

**Check stakeholder profiles** for additional accessibility requirements (e.g., WCAG AAA, specific assistive technology support).

**In code comments:**
```typescript
// a11y: Label describes the action for screen readers
<button aria-label="Save user preferences">Save</button>

// a11y: Error message linked to input for screen readers
<input aria-describedby="email-error" />
<span id="email-error" role="alert">Please enter a valid email</span>
```

---

## Testing Depth

Generate tests using the detected testing framework. If no testing framework is detected, default to the standard for the stack (Jest for React/Node, Pytest for Python, Vitest for Vite-based projects).

**Minimum test coverage:**

### 1. Unit Tests (Core Logic)
- Test every function with business logic
- Test edge cases: null inputs, empty arrays, boundary values
- Test error handling: what happens when things fail

### 2. Integration Tests (Main User Flow)
- Test the primary happy path end-to-end
- Test API endpoint responses (status codes, response shapes)
- Test database operations if applicable (create, read, update, delete)

### 3. Edge Case Tests (Error States)
- Test with invalid inputs
- Test with missing required fields
- Test with unauthorized access (if auth exists)
- Test with network failures / timeouts (mock these)

**Target:** 80% coverage of new code. Always include test data fixtures.

**Test file naming:**
- `[feature].test.ts` for unit tests
- `[feature].integration.test.ts` for integration tests
- `__fixtures__/[feature]-data.ts` for test data

**In the summary document, report:**
```markdown
## Testing

**Framework:** [Jest/Vitest/Pytest]
**Tests written:** [X] unit, [Y] integration, [Z] edge case
**Coverage:** [%] (of new code)
**All passing:** [Yes/No]
**Manual testing needed:** [List specific flows to test manually]
```

---

## Integration with Other Skills

**Before:**
- `/prd-draft` - Define feature
- `/prototype` - Validate UX first

**After:**
- `/launch-checklist` - Prepare for launch
- `/create-tickets` - Track remaining work

**Related:**
- `/prd-challenge` - Full multi-lens review of the spec this draft implements

---

## Output Quality Self-Check

Before delivering the first draft, verify:

- [ ] **Implementation plan was approved** -- PM confirmed the plan before code was written
- [ ] **Existing code patterns followed** -- New code matches the codebase's naming conventions, file structure, and architectural patterns
- [ ] **PRD requirements covered** -- Every acceptance criterion from the PRD maps to implemented code
- [ ] **Tests written and passing** -- Unit tests for core logic, integration test for main flow, edge case tests for error states
- [ ] **Test coverage target met** -- At least 80% coverage of new code
- [ ] **Accessibility included** -- ARIA labels, keyboard navigation, focus indicators, semantic HTML (for UI features)
- [ ] **No codebase = Prototype Mode** -- If no codebase detected, standalone reference implementation generated with setup instructions
- [ ] **Tech stack checked** -- Matches company stack from business-info or defaults noted
- [ ] **Edge cases handled** -- Error states, empty states, loading states, and validation are implemented
- [ ] **Inline comments for complex logic** -- Non-obvious code is explained; TODOs are marked for future work
- [ ] **Summary document complete** -- Files created/modified, test coverage, known issues, and next steps documented
- [ ] **Output saved to correct path** -- Summary at `product-development/product/PRDs/prototypes/[feature]-first-draft.md`, not `product-development/engineering/plans/{area}/`

If any check fails, fix it before delivering. A first draft with failing tests or missing accessibility is not ready to share.

---

## Write-back (mandatory)

After saving, close the loop — full contract: `governance/write-back-contract.md`:

1. Add a one-line entry for the new file at the END of the file list in its folder's
   `CLAUDE.md` (append-only — never re-sort existing lines; re-sorting causes merge
   conflicts). If you created a new folder, add it to the parent's CLAUDE.md and create a
   5-line CLAUDE.md stub inside it.
2. Feature-scoped artifact → propose the `product-development/feature-index.yaml` addition
   and apply it only after the user confirms (Tier 2 in `governance/write-policy.yaml`).
   Initiative-scoped → link the artifact from `product-development/product/initiatives/{slug}.md`.
3. In the artifact's header, link the source material it was derived from.
4. End your reply by listing every repo path you wrote or updated.
