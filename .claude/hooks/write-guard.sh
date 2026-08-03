#!/bin/bash
# Team OS write-guard — PreToolUse hook enforcing product-development/_meta/write-policy.yaml.
# Reads the tool-call JSON on stdin. If the target file matches a confirm- or admin-tier
# pattern, returns permissionDecision "ask" so the user approves the write in-session.
# Auto-tier paths (everything not listed) pass through silently (no output, exit 0).
# Wired via .claude/settings.json on matcher "Edit|Write|MultiEdit|NotebookEdit".

set -u
INPUT=$(cat)
ROOT="${CLAUDE_PROJECT_DIR:-.}"
POLICY="$ROOT/product-development/_meta/write-policy.yaml"
[ -f "$POLICY" ] || exit 0

# --- extract the target path from the tool input ---------------------------------
FILE=""
if command -v python3 >/dev/null 2>&1; then
  FILE=$(printf '%s' "$INPUT" | python3 -c '
import json,sys
try:
    d = json.load(sys.stdin)
    ti = d.get("tool_input") or {}
    print(ti.get("file_path") or ti.get("notebook_path") or "")
except Exception:
    print("")
' 2>/dev/null)
else
  # Fallback: first "file_path" value in the JSON (paths with embedded quotes not supported)
  FILE=$(printf '%s' "$INPUT" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
fi
[ -n "$FILE" ] || exit 0

# Repo-relative form for matching
REL="${FILE#"$ROOT"/}"

# --- match against confirm:/admin: patterns from the policy ----------------------
TIER=""
SECTION=""
while IFS= read -r line; do
  case "$line" in
    *confirm:*)      SECTION="confirm" ; continue ;;
    *admin:*)        SECTION="admin"   ; continue ;;
    *living-pages:*) SECTION=""        ; continue ;;
  esac
  case "$line" in
    *"- "*)
      [ -z "$SECTION" ] && continue
      PAT="${line#*- }"
      PAT="${PAT%%#*}"                                   # strip trailing comment
      PAT=$(printf '%s' "$PAT" | sed 's/^ *//;s/ *$//')  # trim
      [ -z "$PAT" ] && continue
      GLOB=${PAT//\*\*/\*}                               # case-glob: * already crosses /
      # shellcheck disable=SC2254
      case "$REL" in
        $GLOB) TIER="$SECTION"; break ;;
      esac
      ;;
  esac
done < "$POLICY"

[ -z "$TIER" ] && exit 0

if [ "$TIER" = "admin" ]; then
  REASON="Admin-tier path per product-development/_meta/write-policy.yaml — the system rules. Route this change through the repo steward (reviewed PR); approve only if you are the steward."
else
  REASON="Confirm-tier path per product-development/_meta/write-policy.yaml — a steering file. The agent must show the exact before/after; approve only after reviewing it. Headless runs must file a proposal in product-development/_meta/proposals/ instead."
fi

printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"%s"}}\n' "$REASON"
exit 0
