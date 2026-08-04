#!/bin/bash
# Team OS auto-commit / auto-merge — Stop hook.
#
# Reads the `settings:` block of product-development/_meta/write-policy.yaml and, when
# enabled, commits the turn's work (and optionally merges it into the target branch).
# Both features ship DISABLED — this script is a no-op until someone turns one on.
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

POLICY="product-development/_meta/write-policy.yaml"
[ -f "$POLICY" ] || exit 0
command -v git >/dev/null 2>&1 || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

# --- surface a non-blocking note to the session, then leave -----------------------
# JSON strings take no raw newlines or control characters — escape before emitting,
# or Claude Code discards the whole object and the report is lost silently.
note() {
  printf '{"hookSpecificOutput":{"hookEventName":"Stop","additionalContext":"[auto-commit] %s"}}\n' \
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

# --- does a path match a confirm/admin pattern in the policy? ----------------------
is_protected() {
  local rel="$1" section="" pat glob
  while IFS= read -r line; do
    case "$line" in
      *confirm:*) section="p"; continue ;;
      *admin:*)   section="p"; continue ;;
      living-pages:*|settings:*|tiers:*) section=""; continue ;;
    esac
    case "$line" in
      *"- "*)
        [ -z "$section" ] && continue
        pat="${line#*- }"; pat="${pat%%#*}"
        pat=$(printf '%s' "$pat" | sed 's/^ *//;s/ *$//')
        [ -z "$pat" ] && continue
        glob=${pat//\*\*/\*}
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

ALLOWED=""; HELD=""
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$AC_SCOPE" in
    all)                 ALLOWED="$ALLOWED$f
" ;;
    product-development) case "$f" in product-development/*) ALLOWED="$ALLOWED$f
" ;; *) HELD="$HELD$f
" ;; esac ;;
    auto-tier|*)         if is_protected "$f"; then HELD="$HELD$f
"; else ALLOWED="$ALLOWED$f
"; fi ;;
  esac
done <<EOF
$CANDIDATES
EOF

ALLOWED=$(printf '%s' "$ALLOWED" | sed '/^$/d')
HELD=$(printf '%s' "$HELD" | sed '/^$/d')

if [ -z "$ALLOWED" ]; then
  [ -n "$HELD" ] && note "nothing auto-committed — every change is a protected path under scope '$AC_SCOPE'. Left for you to commit:
$HELD"
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
product-development/_meta/write-policy.yaml."

if ! git commit -q -m "$MSG" 2>/dev/null; then
  note "git commit FAILED — the turn's work is staged but not committed. Commit it by hand."
fi
COMMITTED=$(git rev-parse --short HEAD)

REPORT="committed $COMMITTED ($COUNT file(s)) on $BRANCH"
[ -n "$HELD" ] && REPORT="$REPORT
Left uncommitted (protected paths, commit these yourself):
$HELD"

# --- merge -------------------------------------------------------------------------
[ "${AM_ENABLED:-false}" = "true" ] || { [ -n "$HELD" ] && note "$REPORT"; exit 0; }
[ "$BRANCH" = "$AM_TARGET" ] && { [ -n "$HELD" ] && note "$REPORT"; exit 0; }

if ! git show-ref --verify --quiet "refs/heads/$AM_TARGET"; then
  note "$REPORT
merge skipped: branch '$AM_TARGET' does not exist."
fi

# Refuse to merge a branch that touched protected paths anywhere in its history.
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
merge skipped: this branch touches protected paths, which land via reviewed PR:
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

# --- push --------------------------------------------------------------------------
if [ "${AM_PUSH:-false}" = "true" ]; then
  if git remote get-url origin >/dev/null 2>&1; then
    if git push -q origin "$AM_TARGET" 2>/dev/null; then
      REPORT="$REPORT; pushed to origin/$AM_TARGET"
    else
      note "$REPORT
push FAILED: '$AM_TARGET' is merged locally but not pushed. Push it by hand."
    fi
  else
    note "$REPORT
push skipped: no 'origin' remote configured."
  fi
fi

# Merging moves the default branch — always worth saying out loud.
note "$REPORT"
