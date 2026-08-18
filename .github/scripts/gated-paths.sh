#!/bin/bash
# gated-paths — print the gated list from governance/write-policy.yaml in the dialect a
# server-side rule needs, so the list is maintained in ONE place and mirrored mechanically.
#
#   .github/scripts/gated-paths.sh                       # raw entries, one per line
#   .github/scripts/gated-paths.sh --format codeowners   # GitHub CODEOWNERS body (owner = reviewers.github-team)
#   .github/scripts/gated-paths.sh --format codeowners --write   # (re)write .github/CODEOWNERS if it changed
#   .github/scripts/gated-paths.sh --format ado          # Azure Repos required-reviewer path filter (one line, ';'-separated)
#   .github/scripts/gated-paths.sh --format ruleset      # GitHub push-ruleset "restrict file paths" patterns (fnmatch)
#   ... --owner "@org/team"                              # override the CODEOWNERS owner
#
# Called by .claude/hooks/auto-commit.sh (keeps CODEOWNERS fresh), by /propose (Azure
# reminder in the PR body), by the wiki-lint drift check, and by the admin setup guides.
# Exit 0 = ok. With --write: prints "updated"/"unchanged". Never touches anything else.

set -u
cd "$(dirname "$0")/../.." || exit 2
POLICY="governance/write-policy.yaml"
[ -f "$POLICY" ] || { echo "no $POLICY" >&2; exit 2; }

FORMAT=list; WRITE=0; OWNER=""
while [ $# -gt 0 ]; do
  case "$1" in
    --format) FORMAT="$2"; shift 2 ;;
    --write)  WRITE=1; shift ;;
    --owner)  OWNER="$2"; shift 2 ;;
    -h|--help) sed -n '2,15p' "$0"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

# --- the gated list (same walk as the weekly audit in .github/workflows/wiki-lint.yml) --
ENTRIES=$(awk '
  /^tiers:/ { t=1; next }
  /^[a-zA-Z]/ { t=0; g=0 }
  t && /^  gated:/ { g=1; next }
  t && g && /^  [a-zA-Z]/ { g=0 }
  t && g && /^ *- / {
    sub(/^ *- */, ""); sub(/[ \t]*#.*/, ""); gsub(/^[ \t]+|[ \t]+$/, "")
    if (length($0)) print
  }' "$POLICY")
[ -n "$ENTRIES" ] || { echo "no gated entries parsed from $POLICY" >&2; exit 2; }

if [ -z "$OWNER" ]; then
  OWNER=$(awk '
    /^reviewers:/ { r=1; next }
    /^[a-zA-Z]/ { r=0 }
    r && /^  github-team:/ { sub(/^  github-team:[ \t]*/, ""); sub(/[ \t]*#.*/, ""); gsub(/^"|"$/, ""); print; exit }' "$POLICY")
fi
OWNER=${OWNER:-@[org]/os-admins}

# entry → (kind, stem):  dir/** or dir/ → dir ; anything else → itself
kind_of() { case "$1" in */\*\*|*/) echo dir ;; *) echo path ;; esac; }
stem_of() { local e="$1"; e="${e%/\*\*}"; e="${e%/}"; printf '%s' "$e"; }

case "$FORMAT" in
  list)
    printf '%s\n' "$ENTRIES" ;;

  ado)
    OUT=""
    while IFS= read -r e; do
      [ -z "$e" ] && continue
      case "$(kind_of "$e")" in
        dir)  p="/$(stem_of "$e")/*" ;;
        path) p="/${e//\*\*/\*}" ;;          # ADO's * already crosses /
      esac
      OUT="${OUT:+$OUT;}$p"
    done <<EOF
$ENTRIES
EOF
    printf '%s\n' "$OUT" ;;

  ruleset)
    while IFS= read -r e; do
      [ -z "$e" ] && continue
      case "$(kind_of "$e")" in
        dir)  printf '%s/**/*\n' "$(stem_of "$e")" ;;
        path) printf '%s\n' "$e" ;;
      esac
    done <<EOF
$ENTRIES
EOF
    ;;

  codeowners)
    gen_codeowners() {
      echo "# GENERATED from governance/write-policy.yaml (tiers → gated) by .github/scripts/gated-paths.sh — do not edit by hand."
      echo "# Every path below needs an approving review from the OS admins before a pull request into the"
      echo "# target branch can merge (branch ruleset: Require a pull request → Require review from Code Owners)."
      echo "# Regenerate after changing the list or the team: .github/scripts/gated-paths.sh --format codeowners --write"
      case "$OWNER" in
        *"["*) echo "# ⚠️  OWNER NOT SET — fill reviewers.github-team in governance/write-policy.yaml and regenerate;"
               echo "#     until then GitHub ignores these lines and gated pull requests need NO approval." ;;
      esac
      echo
      while IFS= read -r e; do
        [ -z "$e" ] && continue
        case "$(kind_of "$e")" in
          dir)  printf '/%s/ %s\n' "$(stem_of "$e")" "$OWNER" ;;
          path) printf '/%s %s\n' "$e" "$OWNER" ;;
        esac
      done <<EOF
$ENTRIES
EOF
    }
    BODY=$(gen_codeowners)
    if [ "$WRITE" = 1 ]; then
      mkdir -p .github
      if [ -f .github/CODEOWNERS ] && [ "$(cat .github/CODEOWNERS)" = "$BODY" ]; then
        echo "unchanged"
      else
        printf '%s\n' "$BODY" > .github/CODEOWNERS
        echo "updated"
      fi
    else
      printf '%s\n' "$BODY"
    fi ;;

  *) echo "unknown format: $FORMAT (list | codeowners | ado | ruleset)" >&2; exit 2 ;;
esac
exit 0
