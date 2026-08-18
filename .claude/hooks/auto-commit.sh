#!/bin/bash
# Team OS auto-commit / auto-push — Stop hook. The auto-sync engine.
#
# Reads the `settings:` block of governance/write-policy.yaml and, when enabled,
# commits the turn's work, lands it on the target branch, and pushes it to origin.
# Ships disabled — a no-op until /auto-sync on flips the settings; it re-reads them at
# every turn end, so flips apply without a restart.
#
# Two landing modes, chosen by settings → auto-merge → strategy:
#   direct (ff-only | merge-commit) — the target accepts pushes. Everyday (auto-tier)
#     work is committed on the current branch, merged into the target when the session
#     runs on a side branch, and pushed. Gated paths are ALWAYS held back, uncommitted,
#     for the user to land deliberately.
#   pr — the target is pull-request-only on the server. The session works on its own
#     branch (<pr-flow.branch-prefix><user>, created from the target when the checkout
#     sits on the target). Each turn: commit everyday files (commit A), commit gated
#     files (commit B, prefix pr-flow.gated-prefix) — the tree is always clean; drain the
#     everyday commits to the target through a background pull request that merges
#     itself (cherry-pick onto origin/<target> in a throwaway worktree → push a drain
#     branch → PR + auto-merge; asynchronous, tracked by patch-id so nothing is drained
#     twice); rebase the branch onto the target (drops what has landed); push the branch
#     with --force-with-lease. Gated commits stay on the branch — pushed, no PR — until
#     the user says "propose the gated changes" (/propose; on GitHub the desktop
#     Create PR button does the same). Nothing gated ever reaches the target from here.
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
export GIT_TERMINAL_PROMPT=0            # never hang on a credential prompt inside a hook
export GIT_HTTP_LOW_SPEED_LIMIT=1000     # abort stalled transfers instead of hanging the hook
export GIT_HTTP_LOW_SPEED_TIME=20

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
PF_PREFIX=$(cfg "pr-flow" "branch-prefix");       PF_PREFIX=${PF_PREFIX:-sync/}
PF_TOOL=$(cfg "pr-flow" "pr-tool");               PF_TOOL=${PF_TOOL:-auto}
PF_GPREFIX=$(cfg "pr-flow" "gated-prefix");       PF_GPREFIX=${PF_GPREFIX:-gated:}

MODE=direct
[ "$AM_STRATEGY" = "pr" ] && MODE=pr

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

# --- keep the server-side mirrors of the gated list fresh --------------------------
# .github/CODEOWNERS is generated from the policy; regenerating is idempotent and only
# touches the file when the list or the reviewers changed. It is itself a gated path,
# so it rides along with the gated commit (pr mode) or is held for the steward (direct).
if [ -f .github/CODEOWNERS ] && [ -x .github/scripts/gated-paths.sh ]; then
  .github/scripts/gated-paths.sh --format codeowners --write >/dev/null 2>&1 || true
fi

# ==================================================================================
# PR MODE — the target is pull-request-only; everything below this block is direct mode.
# ==================================================================================
if [ "$MODE" = "pr" ]; then

  STATE="$GITDIR/team-os"; mkdir -p "$STATE" 2>/dev/null
  DRAINS="$STATE/drains"; touch "$DRAINS" 2>/dev/null
  REPORT=""
  add() { REPORT="${REPORT:+$REPORT
}$1"; }

  # one run at a time per checkout; a lock older than 10 minutes is a crash leftover
  LOCK="$STATE/lock"
  if [ -d "$LOCK" ] && [ -n "$(find "$LOCK" -maxdepth 0 -mmin +10 2>/dev/null)" ]; then rmdir "$LOCK" 2>/dev/null; fi
  mkdir "$LOCK" 2>/dev/null || note "skipped: another auto-sync run holds the lock (concurrent session in this checkout). Nothing committed this turn — it will be picked up next turn."
  trap 'rmdir "$LOCK" 2>/dev/null' EXIT

  # --- the session branch ------------------------------------------------------------
  SLUG=$(git config user.name 2>/dev/null | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]\{1,\}/-/g; s/^-//; s/-$//')
  SLUG=${SLUG:-${USER:-user}}
  if [ "$BRANCH" = "$AM_TARGET" ]; then
    NEWB="${PF_PREFIX}${SLUG}"
    if git show-ref --verify --quiet "refs/heads/$NEWB"; then
      git checkout -q "$NEWB" 2>/dev/null || note "pr flow: could not switch from $AM_TARGET to your branch $NEWB (uncommitted changes overlap it). Nothing committed. Fix: git stash && git checkout $NEWB && git stash pop"
    else
      git checkout -q -b "$NEWB" 2>/dev/null || note "pr flow: could not create your branch $NEWB from $AM_TARGET. Nothing committed."
    fi
    BRANCH="$NEWB"
    add "moved off $AM_TARGET (pull-request-only) onto your branch $BRANCH"
  fi

  # --- classify the changes ----------------------------------------------------------
  CANDIDATES=$(git status --porcelain --untracked-files=all 2>/dev/null | sed 's/^...//' | sed 's/.* -> //')
  EVERYDAY=""; GATED=""; OUTSIDE=""
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    if is_protected "$f"; then GATED="$GATED$f
"; continue; fi
    case "$AC_SCOPE" in
      product-development) case "$f" in product-development/*) EVERYDAY="$EVERYDAY$f
" ;; *) OUTSIDE="$OUTSIDE$f
" ;; esac ;;
      *)                   EVERYDAY="$EVERYDAY$f
" ;;
    esac
  done <<EOF
$CANDIDATES
EOF
  EVERYDAY=$(printf '%s' "$EVERYDAY" | sed '/^$/d')
  GATED=$(printf '%s' "$GATED" | sed '/^$/d')
  OUTSIDE=$(printf '%s' "$OUTSIDE" | sed '/^$/d')

  # --- commit A: everyday files ------------------------------------------------------
  if [ -n "$EVERYDAY" ]; then
    N=$(printf '%s\n' "$EVERYDAY" | wc -l | tr -d ' ')
    AREAS=$(printf '%s\n' "$EVERYDAY" | cut -d/ -f1-2 | sort -u | paste -sd', ' - 2>/dev/null)
    printf '%s\n' "$EVERYDAY" | while IFS= read -r f; do [ -n "$f" ] && git add -- "$f" 2>/dev/null; done
    if ! git diff --cached --quiet 2>/dev/null; then
      if git commit -q -m "$AC_PREFIX auto-commit — $N file(s)

Areas: ${AREAS:-repo root}

Committed by .claude/hooks/auto-commit.sh (pr strategy, scope: $AC_SCOPE) per the
settings block in governance/write-policy.yaml. Drained to $AM_TARGET by pull request." 2>/dev/null; then
        add "everyday: $N file(s) committed $(git rev-parse --short HEAD) on $BRANCH"
      else
        git reset -q 2>/dev/null
        add "everyday: git commit FAILED — $N file(s) left uncommitted. Commit by hand."
      fi
    fi
  fi

  # --- commit B: gated files (kept on the branch, never drained) ---------------------
  if [ -n "$GATED" ]; then
    N=$(printf '%s\n' "$GATED" | wc -l | tr -d ' ')
    printf '%s\n' "$GATED" | while IFS= read -r f; do [ -n "$f" ] && git add -- "$f" 2>/dev/null; done
    if ! git diff --cached --quiet 2>/dev/null; then
      if git commit -q -m "$PF_GPREFIX $N gated file(s) — needs admin approval

$(printf '%s\n' "$GATED" | sed 's/^/- /')

Committed on the session branch by .claude/hooks/auto-commit.sh (pr strategy). Reaches
$AM_TARGET only through a pull request approved per governance/write-policy.yaml." 2>/dev/null; then
        add "gated: $N file(s) committed $(git rev-parse --short HEAD) — kept on $BRANCH (not drained)"
      else
        git reset -q 2>/dev/null
        add "gated: git commit FAILED — $N file(s) left uncommitted. Commit by hand."
      fi
    fi
  fi
  [ -n "$OUTSIDE" ] && add "outside scope '$AC_SCOPE' (not committed):
$OUTSIDE"

  # --- nothing more to do unless we may land -----------------------------------------
  if [ "${AM_ENABLED:-false}" != "true" ] || [ "${AM_PUSH:-false}" != "true" ]; then
    [ -n "$REPORT" ] && add "not pushed / not drained: auto-merge or push is off in write-policy.yaml (\`/auto-sync on\` turns both on)"
    [ -n "$REPORT" ] && note "$REPORT"
    exit 0
  fi
  git remote get-url origin >/dev/null 2>&1 || { add "no 'origin' remote — nothing pushed or drained"; note "$REPORT"; }

  # --- which PR tool ------------------------------------------------------------------
  ORIGIN_URL=$(git remote get-url origin 2>/dev/null)
  TOOL="$PF_TOOL"; TOOL_WHY=""
  if [ "$TOOL" = "auto" ]; then
    case "$ORIGIN_URL" in
      *dev.azure.com*|*visualstudio.com*) TOOL=az ;;
      *github.*)                          TOOL=gh ;;
      *)                                  TOOL=none; TOOL_WHY="origin is neither GitHub nor Azure DevOps" ;;
    esac
  fi
  case "$TOOL" in
    gh) if ! command -v gh >/dev/null 2>&1; then TOOL=none; TOOL_WHY="gh (GitHub CLI) is not installed"
        elif ! gh auth status >/dev/null 2>&1; then TOOL=none; TOOL_WHY="gh is not logged in (run: gh auth login)"; fi ;;
    az) if ! command -v az >/dev/null 2>&1; then TOOL=none; TOOL_WHY="az (Azure CLI) is not installed"
        elif ! az extension show --name azure-devops >/dev/null 2>&1; then TOOL=none; TOOL_WHY="az lacks the azure-devops extension (run: az extension add --name azure-devops; then az login)"; fi ;;
    none) : ;;
    *)  TOOL=none; TOOL_WHY="unknown pr-tool '$PF_TOOL' in write-policy.yaml" ;;
  esac

  # --- sync with the target: fetch, then rebase (drops what already landed) ---------
  BASE="origin/$AM_TARGET"
  if ! git fetch -q origin "$AM_TARGET" 2>/dev/null; then
    add "fetch of origin/$AM_TARGET FAILED — nothing drained or pushed this turn (offline, or auth). Work is committed locally on $BRANCH."
    note "$REPORT"
  fi
  REBASE_STATE=ok
  if ! git merge-base --is-ancestor "$BASE" HEAD 2>/dev/null; then
    if git rebase -q --autostash "$BASE" >/dev/null 2>&1; then
      REBASE_STATE=rebased
    else
      git rebase --abort >/dev/null 2>&1
      if git diff --quiet "$BASE" HEAD 2>/dev/null; then
        # everything this branch carries is already in the target (e.g. the gated PR was
        # squash-merged) — a clean tree lets us reset without losing anything
        git reset -q --keep "$BASE" 2>/dev/null && REBASE_STATE=reset || REBASE_STATE=conflict
      else
        REBASE_STATE=conflict
      fi
    fi
  fi
  case "$REBASE_STATE" in
    reset)    add "everything on $BRANCH had already landed on $AM_TARGET — branch reset to origin/$AM_TARGET (clean slate)" ;;
    conflict) add "REBASE CONFLICT: $BRANCH does not rebase onto origin/$AM_TARGET (someone changed the same files). Aborted — your commits are intact. Fix: git rebase origin/$AM_TARGET, resolve, git rebase --continue. Draining and pushing skipped this turn." ;;
  esac

  # --- everyday commits still on the branch: pending drains vs. new ------------------
  NEW_SHAS=""; PENDING=""; RETRY_BRANCHES=""; GATED_SHAS=""; GATED_FILES=""; OLDEST=""
  while read -r mark sha; do
    [ "$mark" = "+" ] || continue
    FILES=$(git diff-tree --no-commit-id --name-only -r "$sha" 2>/dev/null)
    [ -z "$FILES" ] && continue
    IS_GATED=0
    while IFS= read -r f; do [ -n "$f" ] && is_protected "$f" && { IS_GATED=1; break; }; done <<EOF
$FILES
EOF
    if [ "$IS_GATED" = 1 ]; then
      GATED_SHAS="$GATED_SHAS $sha"; GATED_FILES="$GATED_FILES
$FILES"
      [ -z "$OLDEST" ] && OLDEST=$(git log -1 --format=%ar "$sha" 2>/dev/null)   # author date survives rebases
      continue
    fi
    PID=$(git show "$sha" 2>/dev/null | git patch-id --stable 2>/dev/null | cut -d' ' -f1)
    [ -z "$PID" ] && continue
    ENTRY=$(grep "^$PID " "$DRAINS" 2>/dev/null | head -1)
    if [ -n "$ENTRY" ]; then
      DB=$(printf '%s' "$ENTRY" | awk '{print $2}'); PR=$(printf '%s' "$ENTRY" | awk '{print $3}')
      if [ "$PR" = "-" ]; then RETRY_BRANCHES=$(printf '%s\n%s' "$RETRY_BRANCHES" "$DB" | sort -u); else PENDING=$(printf '%s\n%s' "$PENDING" "$PR" | sort -u); fi
    else
      NEW_SHAS="$NEW_SHAS $sha"
    fi
  done < <(git cherry "$BASE" HEAD 2>/dev/null)
  GATED_FILES=$(printf '%s\n' "$GATED_FILES" | sed '/^$/d' | sort -u)
  # forget drains whose commits are gone from the branch (they landed and were rebased away)
  LIVE_PIDS=$(git cherry "$BASE" HEAD 2>/dev/null | awk '$1=="+"{print $2}' | while IFS= read -r c; do
    git show "$c" 2>/dev/null | git patch-id --stable 2>/dev/null | cut -d' ' -f1
  done)
  KEEP=""; DONE_DBS=""
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    P=${line%% *}
    if printf '%s\n' "$LIVE_PIDS" | grep -q "^$P\$"; then KEEP="$KEEP$line
"; else DONE_DBS="$DONE_DBS
$(printf '%s' "$line" | awk '{print $2}')"; fi
  done < "$DRAINS"
  printf '%s' "$KEEP" > "$DRAINS" 2>/dev/null
  # a drain branch whose every commit has landed is finished — remove it from origin (best effort;
  # GitHub's "automatically delete head branches" / Azure's delete-source usually did it already)
  for DB in $(printf '%s\n' "$DONE_DBS" | sed '/^$/d' | sort -u); do
    grep -q " $DB " "$DRAINS" 2>/dev/null || git push -q origin --delete "$DB" >/dev/null 2>&1
  done

  # --- PR helpers ---------------------------------------------------------------------
  # open_pr <head> <title> <bodyfile> → prints "<ref> <url>" or nothing.
  # A PR that already exists for the head (earlier retry) is looked up, not duplicated.
  open_pr() {
    case "$TOOL" in
      gh) URL=$(gh pr create --base "$AM_TARGET" --head "$1" --title "$2" --body-file "$3" 2>/dev/null) \
            || URL=$(gh pr list --head "$1" --base "$AM_TARGET" --state open --json url --jq '.[0].url' 2>/dev/null)
          [ -n "$URL" ] || return 1
          printf '#%s %s\n' "${URL##*/}" "$URL" ;;
      az) ID=$(az repos pr create --source-branch "$1" --target-branch "$AM_TARGET" --title "$2" \
                 --description "$(cat "$3")" --auto-complete true --squash true --delete-source-branch true \
                 --query pullRequestId -o tsv 2>/dev/null) \
            || ID=$(az repos pr list --source-branch "$1" --target-branch "$AM_TARGET" --status active --query "[0].pullRequestId" -o tsv 2>/dev/null)
          [ -n "$ID" ] || return 1
          printf '!%s -\n' "$ID" ;;
      *)  return 1 ;;
    esac
  }
  # arm_merge <head-branch> <ref> → sets MERGE_NOTE. GitHub: arm auto-merge (merges when
  # checks pass); if the repo has auto-merge off, merge right away; else leave open and
  # retry each turn. Azure: auto-complete was set at creation. Head branches are deleted
  # by the platform (GitHub "automatically delete head branches" / Azure delete-source).
  arm_merge() {
    MERGE_NOTE=""
    case "$TOOL" in
      gh) if gh pr merge "$1" --auto --rebase >/dev/null 2>&1 || gh pr merge "$1" --auto --squash >/dev/null 2>&1 || gh pr merge "$1" --auto --merge >/dev/null 2>&1; then
            MERGE_NOTE="auto-merge armed (merges when checks pass)"
          elif gh pr merge "$1" --rebase >/dev/null 2>&1 || gh pr merge "$1" --squash >/dev/null 2>&1 || gh pr merge "$1" --merge >/dev/null 2>&1; then
            MERGE_NOTE="merged"; git push -q origin --delete "$1" >/dev/null 2>&1
          else
            MERGE_NOTE="left OPEN — could not merge yet (checks pending, or auto-merge is off in the repo settings); retried every turn"
          fi ;;
      az) MERGE_NOTE="auto-complete set (completes when policies pass)" ;;
    esac
  }
  # pr_state <ref> → OPEN | MERGED | CLOSED | UNKNOWN
  pr_state() {
    case "$TOOL:$1" in
      gh:\#*) S=$(gh pr view "${1#\#}" --json state --jq .state 2>/dev/null); printf '%s' "${S:-UNKNOWN}" ;;
      az:\!*) S=$(az repos pr show --id "${1#\!}" --query status -o tsv 2>/dev/null)
              case "$S" in completed) printf 'MERGED' ;; active) printf 'OPEN' ;; abandoned) printf 'CLOSED' ;; *) printf 'UNKNOWN' ;; esac ;;
      *)      printf 'UNKNOWN' ;;
    esac
  }

  # --- drain the new everyday commits -------------------------------------------------
  # One open drain at a time per session branch: while an earlier drain has not merged
  # yet, new everyday commits are STACKED onto that same drain branch (its PR grows) —
  # a later commit that builds on an earlier one would otherwise not apply on the target.
  HANDLED_DB=""
  if [ -n "$NEW_SHAS" ] && [ "$REBASE_STATE" != "conflict" ]; then
    NCOMMITS=$(printf '%s\n' $NEW_SHAS | wc -l | tr -d ' ')
    STACK_DB=""; STACK_REF=""
    if [ -s "$DRAINS" ]; then
      STACK_DB=$(tail -1 "$DRAINS" | awk '{print $2}'); STACK_REF=$(tail -1 "$DRAINS" | awk '{print $3}')
      git fetch -q origin "$STACK_DB" >/dev/null 2>&1 || { STACK_DB=""; STACK_REF=""; }   # gone = merged already; start fresh
    fi
    if [ -n "$STACK_DB" ]; then
      DRAIN="$STACK_DB"; DRAIN_BASE="origin/$STACK_DB"
    else
      # `<branch>--drain-<sha>`, not `<branch>/drain-<sha>`: a ref cannot be both a branch and a folder
      DRAIN="${PF_PREFIX}${SLUG}--drain-$(git rev-parse --short "${NEW_SHAS##* }")"; DRAIN_BASE="$BASE"
    fi
    TMPW=$(mktemp -d "${TMPDIR:-/tmp}/team-os-drain.XXXXXX" 2>/dev/null)
    DRAIN_STATE=""
    if [ -n "$TMPW" ] && git worktree add -q --detach "$TMPW" "$DRAIN_BASE" >/dev/null 2>&1; then
      # shellcheck disable=SC2086
      if git -C "$TMPW" cherry-pick --allow-empty $NEW_SHAS >/dev/null 2>&1; then
        DRAIN_TIP=$(git -C "$TMPW" rev-parse HEAD 2>/dev/null)
        if git -C "$TMPW" push -q origin "HEAD:refs/heads/$DRAIN" >/dev/null 2>&1; then DRAIN_STATE=pushed; else DRAIN_STATE=pushfail; fi
      else
        git -C "$TMPW" cherry-pick --abort >/dev/null 2>&1; DRAIN_STATE=conflict
      fi
      git worktree remove --force "$TMPW" >/dev/null 2>&1
    else
      DRAIN_STATE=worktree
    fi
    rm -rf "$TMPW" 2>/dev/null; git worktree prune >/dev/null 2>&1
    case "$DRAIN_STATE" in
      pushed)
        HANDLED_DB="$DRAIN"
        REF=""; URL=""
        if [ -n "$STACK_DB" ] && [ "$STACK_REF" != "-" ]; then
          REF="$STACK_REF"
          [ "$TOOL" = "gh" ] && arm_merge "$DRAIN" "$REF"
          add "everyday: $NCOMMITS commit(s) added to the pending drain → PR $REF${MERGE_NOTE:+ — $MERGE_NOTE}"
        else
          BODY=$(mktemp "${TMPDIR:-/tmp}/team-os-pr.XXXXXX")
          {
            echo "Everyday (auto-tier) work from branch \`$BRANCH\`, drained automatically by Team OS auto-sync."
            echo
            echo "Commits:"
            git log --format='- %h %s' "$BASE..$DRAIN_TIP" 2>/dev/null
            echo
            echo "Files:"
            git diff --name-only "$BASE" "$DRAIN_TIP" 2>/dev/null | sort -u | sed 's/^/- /'
            echo
            echo "_No gated path is touched (governance/write-policy.yaml); merges without review. Opened by .claude/hooks/auto-commit.sh (pr strategy)._"
          } > "$BODY"
          TITLE="$AC_PREFIX sync from $BRANCH"
          if [ "$TOOL" != "none" ]; then
            OUT=$(open_pr "$DRAIN" "$TITLE" "$BODY"); REF=${OUT%% *}; URL=${OUT#* }; [ "$URL" = "-" ] && URL=""
          fi
          rm -f "$BODY"
          if [ -n "$REF" ]; then
            arm_merge "$DRAIN" "$REF"
            add "everyday: $NCOMMITS commit(s) drained → PR $REF — $MERGE_NOTE${URL:+ · $URL}"
            [ -n "$STACK_DB" ] && { sed -i.bak "s|^\([^ ]*\) $DRAIN -\$|\1 $DRAIN $REF|" "$DRAINS" 2>/dev/null; rm -f "$DRAINS.bak"; }
          else
            [ "$TOOL" != "none" ] && [ -z "$TOOL_WHY" ] && TOOL_WHY="$TOOL could not open it — check login (gh auth login / az login, az devops configure --defaults) and permissions"
            add "everyday: $NCOMMITS commit(s) pushed to origin/$DRAIN but NO pull request opened${TOOL_WHY:+ ($TOOL_WHY)} — open and merge it by hand: $DRAIN → $AM_TARGET (retried next turn)"
            REF="-"
          fi
        fi
        for s in $NEW_SHAS; do
          P=$(git show "$s" | git patch-id --stable | cut -d' ' -f1)
          printf '%s %s %s\n' "$P" "$DRAIN" "$REF" >> "$DRAINS"
        done ;;
      conflict)  add "everyday: drain of $NCOMMITS commit(s) hit a conflict against ${DRAIN_BASE#origin/} — retried next turn; if it persists: git rebase origin/$AM_TARGET on $BRANCH" ;;
      pushfail)  add "everyday: could not push drain branch $DRAIN (auth, or the server refused) — retried next turn" ;;
      worktree)  add "everyday: could not create the throwaway worktree for the drain — retried next turn" ;;
    esac
  fi

  # --- retry PR creation for drains that were pushed without a PR --------------------
  RETRY_BRANCHES=$(printf '%s\n' "$RETRY_BRANCHES" | sed '/^$/d' | grep -vx -- "$HANDLED_DB" 2>/dev/null)
  if [ -n "$RETRY_BRANCHES" ] && [ "$TOOL" != "none" ]; then
    while IFS= read -r DB; do
      [ -z "$DB" ] && continue
      BODY=$(mktemp "${TMPDIR:-/tmp}/team-os-pr.XXXXXX")
      printf 'Everyday (auto-tier) work from branch `%s`, drained automatically by Team OS auto-sync (retried).\n' "$BRANCH" > "$BODY"
      OUT=$(open_pr "$DB" "$AC_PREFIX sync from $BRANCH" "$BODY"); REF=${OUT%% *}; rm -f "$BODY"
      if [ -n "$REF" ]; then
        arm_merge "$DB" "$REF"
        sed -i.bak "s|^\([^ ]*\) $DB -\$|\1 $DB $REF|" "$DRAINS" 2>/dev/null; rm -f "$DRAINS.bak"
        add "everyday: pull request now open for earlier drain $DB → PR $REF — $MERGE_NOTE"
      else
        add "everyday: still no pull request for pushed drain $DB${TOOL_WHY:+ ($TOOL_WHY)} — open it by hand: $DB → $AM_TARGET"
      fi
    done <<EOF
$RETRY_BRANCHES
EOF
  elif [ -n "$RETRY_BRANCHES" ]; then
    add "everyday: drain branch(es) pushed but no PR tool available${TOOL_WHY:+ ($TOOL_WHY)} — merge by hand: $(printf '%s' "$RETRY_BRANCHES" | sed '/^$/d' | paste -sd', ' -) → $AM_TARGET"
  fi

  # --- pending drain PRs: nudge the ones that did not merge yet ----------------------
  if [ -n "$PENDING" ]; then
    while IFS= read -r PR; do
      [ -z "$PR" ] && continue
      ST=$(pr_state "$PR")
      case "$ST" in
        MERGED) DB=$(awk -v r="$PR" '$3==r{print $2; exit}' "$DRAINS")
                [ -n "$DB" ] && git push -q origin --delete "$DB" >/dev/null 2>&1
                add "everyday: PR $PR merged — its commit leaves $BRANCH at the next rebase" ;;
        OPEN)   DB=$(awk -v r="$PR" '$3==r{print $2; exit}' "$DRAINS")
                if [ "$TOOL" = "gh" ] && [ -n "$DB" ]; then arm_merge "$DB" "$PR"; add "everyday: PR $PR still open — $MERGE_NOTE"; else add "everyday: PR $PR still open (auto-complete pending)"; fi ;;
        CLOSED) add "everyday: PR $PR was CLOSED without merging — its commit stays on $BRANCH; reopen or drain by hand" ;;
        *)      add "everyday: PR $PR — state unknown${TOOL_WHY:+ ($TOOL_WHY)}" ;;
      esac
    done <<EOF
$PENDING
EOF
  fi

  # --- push the session branch --------------------------------------------------------
  if [ -n "$(git rev-list -1 "$BASE..HEAD" 2>/dev/null)" ] || git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
    if [ "$REBASE_STATE" != "conflict" ]; then
      if PUSH_ERR=$(git push -q --force-with-lease -u origin "$BRANCH" 2>&1 >/dev/null); then
        add "branch pushed → origin/$BRANCH"
      else
        add "push of $BRANCH FAILED: $(printf '%s' "$PUSH_ERR" | tail -1 | cut -c1-160)"
      fi
    fi
  fi

  # --- gated work waiting on the branch ------------------------------------------------
  if [ -n "$GATED_SHAS" ]; then
    NG=$(printf '%s\n' $GATED_SHAS | wc -l | tr -d ' ')
    NF=$(printf '%s\n' "$GATED_FILES" | sed '/^$/d' | wc -l | tr -d ' ')
    GPR=""; GURL=""; GSTATE=""
    case "$TOOL" in
      gh) GJ=$(gh pr list --head "$BRANCH" --base "$AM_TARGET" --state open --json number,url,isDraft --jq '.[0] | "\(.number) \(.url) \(.isDraft)"' 2>/dev/null)
          [ -n "$GJ" ] && { GPR="#${GJ%% *}"; GURL=$(printf '%s' "$GJ" | awk '{print $2}'); [ "${GJ##* }" = "true" ] && GSTATE="draft"; } ;;
      az) GJ=$(az repos pr list --source-branch "$BRANCH" --target-branch "$AM_TARGET" --status active --query "[0].[pullRequestId,isDraft]" -o tsv 2>/dev/null | tr '\t' ' ')
          [ -n "$GJ" ] && { GPR="!${GJ%% *}"; [ "${GJ##* }" = "true" ] || [ "${GJ##* }" = "True" ] && GSTATE="draft"; } ;;
    esac
    printf '%s %s %s %s\n' "$BRANCH" "${GPR:--}" "${GURL:--}" "${GSTATE:-open}" > "$STATE/gated-pr" 2>/dev/null
    if [ -n "$GPR" ]; then
      add "gated: $NF file(s) in $NG commit(s) on $BRANCH → PR $GPR ${GSTATE:+($GSTATE) }awaiting admin approval${GURL:+ · $GURL}"
    else
      HOWTO="say \"propose the gated changes\""
      [ "$TOOL" = "gh" ] && HOWTO="$HOWTO, or press Create PR in the desktop app"
      add "gated: $NF file(s) in $NG commit(s) waiting on $BRANCH (oldest ${OLDEST:-just now}) — no PR yet. When you are done iterating: $HOWTO."
    fi
  else
    # a gated-pr record from an earlier turn with nothing gated left = it landed
    [ -f "$STATE/gated-pr" ] && add "gated: everything that was waiting on $BRANCH has landed on $AM_TARGET — branch is clean"
    rm -f "$STATE/gated-pr" 2>/dev/null
  fi

  [ -n "$REPORT" ] && note "$REPORT"
  exit 0
fi

# ==================================================================================
# DIRECT MODE (ff-only | merge-commit) — the target accepts pushes.
# ==================================================================================

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
push FAILED: '$AM_TARGET' is committed locally but not pushed (remote ahead, or auth — or the target is pull-request-only: then set strategy: pr in write-policy.yaml). Fix: git pull --rebase origin $AM_TARGET && git push origin $AM_TARGET."
    fi
  else
    note "$REPORT
push skipped: no 'origin' remote configured."
  fi
fi

# Landing work on the target branch or origin is always worth saying out loud.
[ "$SAY" = "y" ] && note "$REPORT"
exit 0
