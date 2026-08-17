#!/bin/bash
# Team OS auto-commit / auto-push — Stop hook. The auto-sync engine.
#
# Reads the `settings:` block of governance/write-policy.yaml and, when enabled,
# commits the turn's work, lands it on the target branch (merging only when the
# session runs on a side branch), and pushes it to origin. Gated paths are ALWAYS
# held back for the user. Ships disabled — a no-op until /auto-sync on flips the
# settings; it re-reads them at every turn end, so flips apply without a restart.
#
# Contract with Claude Code:
#   - Stop hooks take NO matcher. Wired via .claude/settings.json as a bare group.
#   - Exit 0 with empty stdout = "did nothing, carry on". That is the success path.
#   - NEVER print {"decision":"block"} or exit 2 — a blocking Stop hook can loop forever.
#   - Problems are surfaced via hookSpecificOutput.additionalContext, which reaches the
#     session WITHOUT blocking it. Per the repo's failure-visibility rule, an automation
#     that drops work must say so; a silent success-shaped exit is the bug.

set -u
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
export GIT_TERMINAL_PROMPT=0   # never hang on a credential prompt inside a hook

POLICY="governance/write-policy.yaml"
[ -f "$POLICY" ] || exit 0
command -v git >/dev/null 2>&1 || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

# --- surface a non-blocking note to the session, then leave -----------------------
# JSON strings take no raw newlines or control characters — escape before emitting,
# or Claude Code discards the whole object and the report is lost silently.
note() {
  printf '{"hookSpecificOutput":{"hookEventName":"Stop","additionalContext":"[auto-sync] %s"}}\n' \
    "$(printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g' | awk '{ printf "%s%s", sep, $0; sep="\\n" }')"
  exit 0
}

# --- read one key out of the settings: block --------------------------------------
# cfg <group> <key> — groups sit at 2 spaces, keys at 4, per the file's own shape.
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

AC_ENABLED=$(cfg "auto-commit" "enabled")
[ "${AC_ENABLED:-false}" = "true" ] || exit 0          # disabled → silent no-op

AC_SCOPE=$(cfg "auto-commit" "scope");            AC_SCOPE=${AC_SCOPE:-auto-tier}
AC_PREFIX=$(cfg "auto-commit" "message-prefix");  AC_PREFIX=${AC_PREFIX:-context:}
AM_ENABLED=$(cfg "auto-merge" "enabled")
AM_TARGET=$(cfg "auto-merge" "target-branch");    AM_TARGET=${AM_TARGET:-main}
AM_STRATEGY=$(cfg "auto-merge" "strategy");       AM_STRATEGY=${AM_STRATEGY:-ff-only}
AM_BLOCK=$(cfg "auto-merge" "block-protected-tiers"); AM_BLOCK=${AM_BLOCK:-true}
AM_PUSH=$(cfg "auto-merge" "push");               AM_PUSH=${AM_PUSH:-false}

# --- refuse to act on a repo that is mid-operation ---------------------------------
GITDIR=$(git rev-parse --git-dir 2>/dev/null)
for marker in MERGE_HEAD REBASE_HEAD CHERRY_PICK_HEAD BISECT_LOG; do
  [ -e "$GITDIR/$marker" ] && note "skipped: repository is mid-operation ($marker). Nothing was committed."
done
[ -d "$GITDIR/rebase-merge" ] || [ -d "$GITDIR/rebase-apply" ] && \
  note "skipped: a rebase is in progress. Nothing was committed."

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
[ "$BRANCH" = "HEAD" ] && note "skipped: detached HEAD. Nothing was committed."

# --- does a path match a gated pattern in the policy? -------------------------------
is_protected() {
  local rel="$1" section="" pat glob
  while IFS= read -r line; do
    case "$line" in
      *gated:*)                          section="p"; continue ;;
      living-pages:*|settings:*|tiers:*) section="";  continue ;;
    esac
    case "$line" in
      *"- "*)
        [ -z "$section" ] && continue
        pat="${line#*- }"; pat="${pat%%#*}"
        pat=$(printf '%s' "$pat" | sed 's/^ *//;s/ *$//')
        [ -z "$pat" ] && continue
        glob=${pat//\*\*/\*}
        case "$pat" in */) glob="${glob}*" ;; esac      # bare `dir/` → whole directory
        # shellcheck disable=SC2254
        case "$rel" in $glob) return 0 ;; esac
        ;;
    esac
  done < "$POLICY"
  return 1
}

# --- collect the changed paths this scope allows ----------------------------------
CANDIDATES=$(git status --porcelain --untracked-files=all 2>/dev/null | sed 's/^...//' | sed 's/.* -> //')
[ -n "$CANDIDATES" ] || exit 0                          # nothing changed → silent no-op

# Gated paths are held back FIRST, whatever `scope` says — the one invariant of
# auto-sync ("never commits or pushes gated files"). Scope only narrows the rest:
#   auto-tier (default)  — every non-gated change
#   product-development  — non-gated changes under product-development/ only
#   all                  — legacy alias of auto-tier (older configs)
ALLOWED=""; HELD=""; OUTSIDE=""
while IFS= read -r f; do
  [ -z "$f" ] && continue
  if is_protected "$f"; then HELD="$HELD$f
"; continue; fi
  case "$AC_SCOPE" in
    product-development) case "$f" in product-development/*) ALLOWED="$ALLOWED$f
" ;; *) OUTSIDE="$OUTSIDE$f
" ;; esac ;;
    *)                   ALLOWED="$ALLOWED$f
" ;;
  esac
done <<EOF
$CANDIDATES
EOF

ALLOWED=$(printf '%s' "$ALLOWED" | sed '/^$/d')
HELD=$(printf '%s' "$HELD" | sed '/^$/d')
OUTSIDE=$(printf '%s' "$OUTSIDE" | sed '/^$/d')

# What was left uncommitted, and why — appended to every report that has something to say.
LEFT=""
[ -n "$HELD" ] && LEFT="Held back (gated paths — land them yourself, or say: commit and push the gated changes):
$HELD"
if [ -n "$OUTSIDE" ]; then
  [ -n "$LEFT" ] && LEFT="$LEFT
"
  LEFT="${LEFT}Outside scope '$AC_SCOPE' (not auto-committed):
$OUTSIDE"
fi

if [ -z "$ALLOWED" ]; then
  [ -n "$LEFT" ] && note "nothing auto-committed.
$LEFT"
  exit 0
fi

# --- commit ------------------------------------------------------------------------
COUNT=$(printf '%s\n' "$ALLOWED" | wc -l | tr -d ' ')
AREAS=$(printf '%s\n' "$ALLOWED" | cut -d/ -f1-2 | sort -u | paste -sd', ' - 2>/dev/null)

printf '%s\n' "$ALLOWED" | while IFS= read -r f; do
  [ -n "$f" ] && git add -- "$f" 2>/dev/null
done

git diff --cached --quiet 2>/dev/null && exit 0        # add staged nothing → no-op

MSG="$AC_PREFIX auto-commit — $COUNT file(s)

Areas: ${AREAS:-repo root}

Committed by .claude/hooks/auto-commit.sh (scope: $AC_SCOPE) per the settings block in
governance/write-policy.yaml."

if ! git commit -q -m "$MSG" 2>/dev/null; then
  note "git commit FAILED — the turn's work is staged but not committed. Commit it by hand."
fi
COMMITTED=$(git rev-parse --short HEAD)

REPORT="committed $COMMITTED ($COUNT file(s)) on $BRANCH"
[ -n "$LEFT" ] && REPORT="$REPORT
$LEFT"

# --- land it: merge only when on a side branch, then push ---------------------------
if [ "${AM_ENABLED:-false}" != "true" ]; then
  [ -n "$LEFT" ] && note "$REPORT"
  exit 0
fi

SAY=""
[ -n "$LEFT" ] && SAY=y

if [ "$BRANCH" != "$AM_TARGET" ]; then
  if ! git show-ref --verify --quiet "refs/heads/$AM_TARGET"; then
    note "$REPORT
merge skipped: branch '$AM_TARGET' does not exist."
  fi

  # Refuse to merge a branch that touched gated paths anywhere in its history.
  if [ "$AM_BLOCK" = "true" ]; then
    TOUCHED=$(git diff --name-only "$AM_TARGET...HEAD" 2>/dev/null)
    PROT=""
    while IFS= read -r f; do
      [ -z "$f" ] && continue
      is_protected "$f" && PROT="$PROT$f
"
    done <<EOF
$TOUCHED
EOF
    PROT=$(printf '%s' "$PROT" | sed '/^$/d')
    [ -n "$PROT" ] && note "$REPORT
merge skipped: this branch touches gated paths, which you land deliberately:
$PROT"
  fi

  case "$AM_STRATEGY" in
    merge-commit)
      # Needs a checkout. Restore the caller's branch whatever happens.
      if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
        note "$REPORT
merge skipped: working tree still has uncommitted changes."
      fi
      if ! git checkout -q "$AM_TARGET" 2>/dev/null; then
        note "$REPORT
merge skipped: could not check out '$AM_TARGET'."
      fi
      if git merge --no-ff -q -m "$AC_PREFIX merge $BRANCH into $AM_TARGET" "$BRANCH" 2>/dev/null; then
        MERGED=yes
      else
        git merge --abort 2>/dev/null
        MERGED=no
      fi
      git checkout -q "$BRANCH" 2>/dev/null
      [ "$MERGED" = "no" ] && note "$REPORT
merge FAILED: '$BRANCH' does not merge cleanly into '$AM_TARGET'. Aborted; you are still on $BRANCH."
      ;;
    ff-only|*)
      # No checkout at all: fast-forward the target ref straight from HEAD.
      if ! git fetch -q . "HEAD:$AM_TARGET" 2>/dev/null; then
        note "$REPORT
merge skipped: '$AM_TARGET' cannot fast-forward from '$BRANCH' (it has commits this branch lacks). Merge it by hand, or set strategy: merge-commit."
      fi
      ;;
  esac

  REPORT="$REPORT
merged into $AM_TARGET ($AM_STRATEGY)"
  SAY=y
fi

# --- push --------------------------------------------------------------------------
if [ "${AM_PUSH:-false}" = "true" ]; then
  if git remote get-url origin >/dev/null 2>&1; then
    if git push -q origin "$AM_TARGET" 2>/dev/null; then
      REPORT="$REPORT
pushed to origin/$AM_TARGET"
      SAY=y
    else
      note "$REPORT
push FAILED: '$AM_TARGET' is committed locally but not pushed (remote ahead, or auth). Fix: git pull --rebase origin $AM_TARGET && git push origin $AM_TARGET."
    fi
  else
    note "$REPORT
push skipped: no 'origin' remote configured."
  fi
fi

# Landing work on the target branch or origin is always worth saying out loud.
[ "$SAY" = "y" ] && note "$REPORT"
exit 0
