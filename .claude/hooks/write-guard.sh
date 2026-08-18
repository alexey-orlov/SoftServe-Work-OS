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
# `- pattern   # note` entry is matched with shell globbing (`**` treated as `*`; a bare
# `dir/` is read as `dir/**`, so a hand-written directory entry never silently matches nothing).
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
      case "$PAT" in */) GLOB="${GLOB}*" ;; esac        # bare `dir/` → whole directory
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

# --- landing mode and who is asking -------------------------------------------------
# settings → auto-merge → strategy decides what "approve" leads to; settings → write-guard →
# non-steward decides whether a non-steward is asked or only warned in the pr strategy.
cfg() {
  awk -v grp="$1" -v key="$2" '
    /^settings:/            { in_s=1; next }
    in_s && /^[a-zA-Z_-]+:/ { in_s=0 }
    in_s && $0 ~ "^  " grp ":" { in_g=1; next }
    in_g && /^  [a-zA-Z_-]+:/  { in_g=0 }
    in_g && $0 ~ "^    " key ":" {
      sub("^    " key ":[ \t]*", ""); sub("#.*", "")
      gsub(/^[ \t]+|[ \t]+$/, ""); gsub(/^"|"$/, "")
      print; exit
    }' "$POLICY"
}
STRATEGY=$(cfg "auto-merge" "strategy");     STRATEGY=${STRATEGY:-ff-only}
NONSTEWARD=$(cfg "write-guard" "non-steward"); NONSTEWARD=${NONSTEWARD:-ask}
STEWARD=$(sed -n 's/^steward:[[:space:]]*//p' "$POLICY" | head -1 | sed 's/[[:space:]]*#.*$//; s/^"//; s/"$//' | tr '[:upper:]' '[:lower:]')
IS_STEWARD=0
case "$STEWARD" in
  ""|*"["*) ;;                                              # unset / placeholder → nobody is the steward
  *) GNAME=$(git -C "$ROOT" config user.name 2>/dev/null | tr '[:upper:]' '[:lower:]')
     GMAIL=$(git -C "$ROOT" config user.email 2>/dev/null | tr '[:upper:]' '[:lower:]')
     { [ -n "$GNAME" ] && case "$STEWARD" in *"$GNAME"*) IS_STEWARD=1 ;; esac; } 2>/dev/null
     { [ -n "$GMAIL" ] && case "$STEWARD" in *"$GMAIL"*) IS_STEWARD=1 ;; esac; } 2>/dev/null ;;
esac

# --- compose the prompt text -------------------------------------------------------
# GROUP is the comment heading above the matched entry ("Steering files — the distilled
# context …"); keep the part before the dash, lower-cased ("steering files").
GROUP_SHORT=$(printf '%s' "$GROUP" | sed 's/[[:space:]]*—.*$//;s/[[:space:]]*-.*$//' | tr '[:upper:]' '[:lower:]')
WHY=""
[ -n "$GROUP_SHORT" ] && WHY="$GROUP_SHORT"
[ -n "$NOTE" ] && WHY="${WHY:+$WHY · }$NOTE"
WHY="${WHY:+$WHY }(rule: $PAT)"

if [ "$STRATEGY" = "pr" ]; then
  LANDING="Approve → written now; auto-sync commits it on YOUR branch (never on the target branch) — it reaches the target only through a pull request an admin approves (say \"propose the gated changes\" when done). Reject → nothing is written. Unsure → reject and ask for the exact before/after."
else
  LANDING="Approve → written now, but NOT auto-committed or pushed (land it afterwards: \"commit and push the gated changes\", or git). Reject → nothing is written. Unsure → reject and ask for the exact before/after."
fi
REASON="🔒 GATED FILE — Team OS write policy · $REL
Why: $WHY. Protected context — every change needs your explicit yes.
$LANDING"

DECISION="ask"
if [ "$STRATEGY" = "pr" ] && [ "$IS_STEWARD" = 0 ] && [ "$NONSTEWARD" = "warn" ]; then
  DECISION="allow"
  REASON="⚠️ GATED FILE — Team OS write policy · $REL — written on your branch; it reaches the target branch only through a pull request an admin approves (\"propose the gated changes\" when done). Why gated: $WHY."
fi

# --- emit ------------------------------------------------------------------------
if command -v python3 >/dev/null 2>&1; then
  printf '%s' "$REASON" | DECISION="$DECISION" python3 -c '
import json,sys,os
r = sys.stdin.read(); d = os.environ.get("DECISION","ask")
out = {"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":d,"permissionDecisionReason":r}}
if d == "allow":
    out["systemMessage"] = r          # allow = no dialog; the warning still reaches the user
print(json.dumps(out))
'
else
  # Fallback without python3: single line, minimal JSON escaping
  ESC=$(printf '%s' "$REASON" | tr '\n' ' ' | sed 's/\\/\\\\/g; s/"/\\"/g')
  if [ "$DECISION" = "allow" ]; then
    printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow","permissionDecisionReason":"%s"},"systemMessage":"%s"}\n' "$ESC" "$ESC"
  else
    printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"%s"}}\n' "$ESC"
  fi
fi
exit 0
