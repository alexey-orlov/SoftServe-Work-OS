#!/bin/bash
# Mechanical wiki-lint — the scriptable subset of .claude/skills/wiki-lint/SKILL.md
# (checks 2–4 and 8–10: nav coverage, index↔disk, broken links, ledger integrity,
# placeholder/truncation scan, YAML parse). The judgment checks (staleness tiers,
# contradiction sweep, initiative health) live in the /wiki-lint skill.
# This script REPORTS ONLY — the repairs (and the plain-language readout with suggested
# changes) are the skill's job; run /wiki-lint in a session to fix what is listed here.
# Messages follow the skill's plain-language contract: the weekly issue is read by PMs,
# not just admins — say "folder contents list", not "nav"; "processed-files list", not
# "ledger"; "can't be read (formatting error)", not "YAML parse".
# KEEP IN SYNC with the skill: change a check there → change it here in the same PR.
#
# Usage: .github/scripts/wiki-lint.sh   (run from the repo root; exit 0 = clean)

set -u
cd "$(dirname "$0")/../.." || exit 2
PD=product-development
FAIL=0
WARN=0

note()  { printf '%s\n' "$*"; }
fail()  { printf '❌ %s\n' "$*"; FAIL=$((FAIL+1)); }
warn()  { printf '⚠️  %s\n' "$*"; WARN=$((WARN+1)); }

note "== wiki-lint (mechanical checks — this run only reports; run /wiki-lint in a session to fix) =="

# ---- Check 2a: every directory under product-development/ has a CLAUDE.md ----------
while IFS= read -r d; do
  [ -f "$d/CLAUDE.md" ] || fail "folder has no contents list (CLAUDE.md) — /wiki-lint adds one: $d/"
done < <(find "$PD" governance -type d ! -path '*/.git*')

# ---- Check 2b: every nav link target exists ----------------------------------------
# Scan CLAUDE.md files for markdown links to local paths; verify each resolves.
# (collect into a temp file first — a piped while runs in a subshell and loses $FAIL)
NAVTMP=$(mktemp)
while IFS= read -r nav; do
  dir=$(dirname "$nav")
  # extract link targets: [text](target) — local, non-anchor, non-URL
  grep -o '](\([^)]*\))' "$nav" 2>/dev/null | sed 's/^](//;s/)$//' | while IFS= read -r t; do
    case "$t" in
      http*|\#*|mailto:*) continue ;;
    esac
    t="${t%%#*}"; t="${t#<}"; t="${t%>}"
    [ -z "$t" ] && continue
    if [ ! -e "$dir/$t" ] && [ ! -e "$t" ]; then
      echo "$nav -> $t"
    fi
  done
done < <(find "$PD" governance .claude -name 'CLAUDE.md' 2>/dev/null) | sort -u > "$NAVTMP"
while IFS= read -r line; do
  [ -n "$line" ] && fail "contents-list link leads nowhere (file moved or deleted?): $line"
done < "$NAVTMP"
rm -f "$NAVTMP"

# ---- Check 2c: every content file has a nav entry in its folder's CLAUDE.md --------
while IFS= read -r f; do
  base=$(basename "$f")
  dir=$(dirname "$f")
  case "$base" in CLAUDE.md|processed.txt|.*) continue ;; esac
  # queue folders hold transient files by design — no per-file nav requirement
  case "$f" in "$PD"/inbox/*|governance/proposals/*) continue ;; esac
  if [ -f "$dir/CLAUDE.md" ] && ! grep -qF "$base" "$dir/CLAUDE.md"; then
    fail "file missing from its folder's contents list (CLAUDE.md) — /wiki-lint adds the line: $f"
  fi
done < <(find "$PD" governance -type f ! -path '*/.git*')

# ---- Check 3: feature-index ↔ disk --------------------------------------------------
if command -v python3 >/dev/null 2>&1; then
  python3 - "$PD" <<'PYEOF' || FAIL=$((FAIL+1))
import sys, os
try:
    import yaml
except ImportError:
    print("⚠️  pyyaml unavailable — feature-index path check skipped"); sys.exit(0)
pd = sys.argv[1]
bad = 0
SKIP_KEYS = {"tickets", "figma", "initiatives"}  # external refs / handled separately
def walk(node, feature):
    global bad
    if isinstance(node, dict):
        for k, v in node.items():
            if k in SKIP_KEYS:
                continue
            walk(v, feature)
    elif isinstance(node, list):
        for v in node:
            walk(v, feature)
    elif isinstance(node, str):
        # paths are relative to product-development/; skip URLs, ticket ids, slugs
        if "/" in node and not node.startswith("http") and " " not in node:
            p = os.path.join(pd, node)
            if not os.path.exists(p):
                print(f"❌ feature index points at a file that doesn't exist (moved or deleted?): {node}")
                bad += 1
try:
    idx = yaml.safe_load(open(os.path.join(pd, "feature-index.yaml")))
except Exception as e:
    print(f"❌ feature-index.yaml can't be read (formatting error) — every feature lookup is broken until fixed: {e}"); sys.exit(1)
if isinstance(idx, dict):
    for area, feats in idx.items():
        if isinstance(feats, dict):
            for feat, entry in feats.items():
                # initiatives: slugs must have pages
                if isinstance(entry, dict):
                    for slug in (entry.get("initiatives") or []):
                        page = os.path.join(pd, "product", "initiatives", f"{slug}.md")
                        if not os.path.exists(page):
                            print(f"❌ initiative named in the feature index has no page in product/initiatives/: {slug} (feature {area}.{feat})")
                            bad += 1
                    walk({k: v for k, v in entry.items() if k != "initiatives"}, feat)
sys.exit(1 if bad else 0)
PYEOF
else
  warn "python3 unavailable — feature-index path check skipped"
fi

# ---- Check 8: ledger integrity -------------------------------------------------------
LEDGER="governance/processed.txt"
if [ -f "$LEDGER" ]; then
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    [ -e "$p" ] || fail "processed-files list ($LEDGER) names a file that no longer exists: $p"
  done < "$LEDGER"
  if ! sort -c "$LEDGER" 2>/dev/null; then warn "processed-files list ($LEDGER) is out of order — /wiki-lint sorts it (or run: sort -o $LEDGER $LEDGER)"; fi
  DUPES=$(sort "$LEDGER" | uniq -d)
  [ -n "$DUPES" ] && warn "processed-files list ($LEDGER) has duplicate lines — /wiki-lint removes them: $DUPES"
else
  warn "no processed-files list at $LEDGER"
fi

# ---- Check 8b: learning loop (team-learnings cap + entry age) ------------------------
TL=".claude/team-learnings.md"
if [ -f "$TL" ]; then
  TL_COUNT=$(grep -c '^- 20' "$TL" 2>/dev/null)
  [ "${TL_COUNT:-0}" -gt 30 ] && warn "team-learnings over its ~30-entry cap ($TL_COUNT) — prune the weakest (capture-loop rule)"
  CUTOFF=$(date -d "180 days ago" +%Y-%m-%d 2>/dev/null || date -v-180d +%Y-%m-%d 2>/dev/null)
  if [ -n "${CUTOFF:-}" ]; then
    while IFS= read -r tl_line; do
      d=$(printf '%s' "$tl_line" | sed -n 's/^- \([0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]\).*/\1/p')
      if [ -n "$d" ] && [ "$(printf '%s' "$d" | tr -d -)" -lt "$(printf '%s' "$CUTOFF" | tr -d -)" ]; then
        warn "team-learnings entry older than 180d — re-validate or prune: $(printf '%.80s' "$tl_line")"
      fi
    done < <(grep '^- 20' "$TL" 2>/dev/null)
  fi
fi

# ---- Check 9: truncation scan (nav description lines ending mid-word) ---------------
while IFS= read -r nav; do
  grep -nE '^\- \[.*\] — .*[a-z]$' "$nav" 2>/dev/null | while IFS= read -r line; do
    # heuristic: a description ending without sentence-ish punctuation AND shorter than 200 chars is fine;
    # flag only classic truncations: line ends mid-word with a single trailing letter after a space
    case "$line" in
      *" s"|*" a"|*" pri"|*:) warn "a contents-list line looks cut off mid-word in $nav (line ${line%%:*}) — /wiki-lint suggests the full text" ;;
    esac
  done
done < <(find "$PD" governance .claude -name 'CLAUDE.md' 2>/dev/null)

# ---- Check 10: YAML parse -------------------------------------------------------------
if command -v python3 >/dev/null 2>&1 && python3 -c 'import yaml' 2>/dev/null; then
  for y in "$PD/feature-index.yaml" "$PD/analytics/data-catalog.yaml" \
           "governance/write-policy.yaml" "$PD/product/customers/accounts/portfolio.yaml" \
           "$PD/engineering/code-repos.yaml"; do
    [ -f "$y" ] || { warn "expected index/registry file is missing: $y"; continue; }
    python3 -c "import yaml,sys; yaml.safe_load(open('$y'))" 2>/dev/null \
      || fail "index/registry file can't be read (formatting error) — everything that reads it is broken until fixed: $y"
  done
fi

# ---- Check 11: server-side mirror of the gated list (CODEOWNERS) is in sync ------------
# .github/CODEOWNERS is generated from governance/write-policy.yaml by gated-paths.sh;
# a stale copy means GitHub asks the wrong reviewers (or none) for gated pull requests.
if [ -f .github/CODEOWNERS ] && [ -x .github/scripts/gated-paths.sh ]; then
  if ! diff -q <(.github/scripts/gated-paths.sh --format codeowners 2>/dev/null) .github/CODEOWNERS >/dev/null 2>&1; then
    warn "CODEOWNERS is out of sync with governance/write-policy.yaml — run: .github/scripts/gated-paths.sh --format codeowners --write"
  fi
  grep -q 'OWNER NOT SET' .github/CODEOWNERS 2>/dev/null && \
    warn "CODEOWNERS owner is a placeholder — set reviewers.github-team in governance/write-policy.yaml (os-installation/admin-setup-github.md) or gated PRs need no approval"
fi

note ""
note "== result: $FAIL problem(s) to fix, $WARN worth a look — run /wiki-lint in a session: it fixes the mechanical ones and suggests the rest =="
[ "$FAIL" -eq 0 ]
