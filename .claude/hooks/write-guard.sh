#!/bin/bash
# Team OS write-guard — PreToolUse hook enforcing governance/write-policy.yaml.
# Reads the tool-call JSON on stdin. If the target file matches a gated pattern,
# returns permissionDecision "ask" so the user approves the write in-session.
# Auto-tier paths (everything not listed) pass through silently (no output, exit 0).
# Wired via .claude/settings.json on matcher "Edit|Write|MultiEdit|NotebookEdit".
#
# The prompt text is designed to be unmistakable next to ordinary permission asks:
#   line 1  🔒 GATED FILE — Team OS write policy · <repo-relative path>
#   line 2  Why: <policy group> — <the entry's trailing comment> (rule: <pattern>) …
#   line 3  what Approve / Reject mean (written now but never auto-committed/pushed)
# Rendering, verified against Claude Code 2.1.227 and the desktop app: the terminal
# shows the reason inside the dialog after "Hook PreToolUse:<Tool> requires
# confirmation for this edit:" and honours the line breaks; the desktop app shows it
# as one paragraph on the approval card (~6 lines visible, then scrolls). Keep the
# badge first and the text short. The trailing "# comment" on a gated entry in the
# policy is surfaced verbatim as the human "why" — write those comments for a person.

set -u
INPUT=$(cat)
ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
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
# Walks the YAML by line: `gated:` opens the list, any other `key:` closes it, comment-only
# lines inside the list name the group that follows (e.g. "Steering files — …"), and each
# `- pattern   # note` entry is matched with shell globbing (`**` treated as `*`).
TIER=""; SECTION=""; GROUP=""; NOTE=""; PAT=""
trim() { printf '%s' "$1" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'; }
while IFS= read -r line; do
  T=$(trim "$line")
  case "$T" in
    "") continue ;;
    "- "*)                                              # a list entry
      [ "$SECTION" = "gated" ] || continue
      ENTRY="${T#- }"
      PAT=$(trim "${ENTRY%%#*}")                        # pattern (comment stripped)
      NOTE=""
      case "$ENTRY" in *"#"*) NOTE=$(trim "${ENTRY#*#}") ;; esac   # its human note
      [ -z "$PAT" ] && continue
      GLOB=${PAT//\*\*/\*}                              # case-glob: * already crosses /
      # shellcheck disable=SC2254
      case "$REL" in
        $GLOB) TIER="$SECTION"; break ;;
      esac
      ;;
    "#"*)                                               # comment-only line
      [ "$SECTION" = "gated" ] && GROUP=$(trim "${T#\#}")
      ;;
    gated:*)                                            SECTION="gated"; GROUP="" ;;
    *:*)                                                SECTION="" ;;    # any other key ends the list
  esac
done < "$POLICY"

[ -z "$TIER" ] && exit 0

# --- compose the prompt text -------------------------------------------------------
# GROUP is the comment heading above the matched entry ("Steering files — the distilled
# context …"); keep the part before the dash, lower-cased ("steering files").
GROUP_SHORT=$(printf '%s' "$GROUP" | sed 's/[[:space:]]*—.*$//;s/[[:space:]]*-.*$//' | tr '[:upper:]' '[:lower:]')
WHY=""
[ -n "$GROUP_SHORT" ] && WHY="$GROUP_SHORT"
[ -n "$NOTE" ] && WHY="${WHY:+$WHY · }$NOTE"
WHY="${WHY:+$WHY }(rule: $PAT)"

REASON="🔒 GATED FILE — Team OS write policy · $REL
Why: $WHY. Protected context — every change needs your explicit yes.
Approve → written now, but NOT auto-committed or pushed (land it afterwards: \"commit and push the gated changes\", or git). Reject → nothing is written. Unsure → reject and ask for the exact before/after."

# --- emit ------------------------------------------------------------------------
if command -v python3 >/dev/null 2>&1; then
  printf '%s' "$REASON" | python3 -c '
import json,sys
r = sys.stdin.read()
print(json.dumps({"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":r}}))
'
else
  # Fallback without python3: single line, minimal JSON escaping
  ESC=$(printf '%s' "$REASON" | tr '\n' ' ' | sed 's/\\/\\\\/g; s/"/\\"/g')
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"%s"}}\n' "$ESC"
fi
exit 0
