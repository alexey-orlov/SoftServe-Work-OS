#!/bin/bash
# Team OS write-guard — PreToolUse hook enforcing governance/write-policy.yaml.
# Reads the tool-call JSON on stdin. If the target file matches a gated pattern,
# returns permissionDecision "ask" so the user approves the write in-session.
# Auto-tier paths (everything not listed) pass through silently (no output, exit 0).
# Wired via .claude/settings.json on matcher "Edit|Write|MultiEdit|NotebookEdit".

set -u
INPUT=$(cat)
ROOT="${CLAUDE_PROJECT_DIR:-.}"
POLICY="$ROOT/governance/write-policy.yaml"
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

# --- match against the gated patterns from the policy ----------------------------
TIER=""
SECTION=""
while IFS= read -r line; do
  case "$line" in
    *gated:*)                          SECTION="gated" ; continue ;;
    living-pages:*|settings:*|tiers:*) SECTION=""      ; continue ;;
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

REASON="Gated path per governance/write-policy.yaml — review the exact change, then approve to write it. Auto-sync never commits or pushes gated files: land it afterwards by saying 'commit and push the gated changes' (or with git yourself). Headless runs file a proposal in governance/proposals/ instead of writing."

printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"%s"}}\n' "$REASON"
exit 0
