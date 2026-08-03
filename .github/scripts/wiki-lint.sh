#!/bin/bash
# Mechanical wiki-lint — the scriptable subset of .claude/skills/wiki-lint/SKILL.md
# (checks 2–4 and 8–10: nav coverage, index↔disk, broken links, ledger integrity,
# placeholder/truncation scan, YAML parse). The judgment checks (staleness tiers,
# contradiction sweep, initiative health) live in the /wiki-lint skill.
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

note "== wiki-lint (mechanical) =="

# ---- Check 2a: every directory under product-development/ has a CLAUDE.md ----------
while IFS= read -r d; do
  [ -f "$d/CLAUDE.md" ] || fail "missing CLAUDE.md: $d/"
done < <(find "$PD" -type d ! -path '*/.git*')

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
done < <(find "$PD" .claude -name 'CLAUDE.md' 2>/dev/null) | sort -u > "$NAVTMP"
while IFS= read -r line; do
  [ -n "$line" ] && fail "nav link broken: $line"
done < "$NAVTMP"
rm -f "$NAVTMP"

# ---- Check 2c: every content file has a nav entry in its folder's CLAUDE.md --------
while IFS= read -r f; do
  base=$(basename "$f")
  dir=$(dirname "$f")
  case "$base" in CLAUDE.md|processed.txt|.*) continue ;; esac
  if [ -f "$dir/CLAUDE.md" ] && ! grep -qF "$base" "$dir/CLAUDE.md"; then
    fail "file not in its folder's CLAUDE.md: $f"
  fi
done < <(find "$PD" -type f ! -path '*/.git*')

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
                print(f"❌ feature-index path missing on disk: {node}")
                bad += 1
try:
    idx = yaml.safe_load(open(os.path.join(pd, "feature-index.yaml")))
except Exception as e:
    print(f"❌ feature-index.yaml does not parse: {e}"); sys.exit(1)
if isinstance(idx, dict):
    for area, feats in idx.items():
        if isinstance(feats, dict):
            for feat, entry in feats.items():
                # initiatives: slugs must have pages
                if isinstance(entry, dict):
                    for slug in (entry.get("initiatives") or []):
                        page = os.path.join(pd, "product", "initiatives", f"{slug}.md")
                        if not os.path.exists(page):
                            print(f"❌ initiative slug without a page: {slug} (feature {area}.{feat})")
                            bad += 1
                    walk({k: v for k, v in entry.items() if k != "initiatives"}, feat)
sys.exit(1 if bad else 0)
PYEOF
else
  warn "python3 unavailable — feature-index path check skipped"
fi

# ---- Check 8: ledger integrity -------------------------------------------------------
LEDGER="$PD/_meta/processed.txt"
if [ -f "$LEDGER" ]; then
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    [ -e "$p" ] || fail "ledger path missing on disk: $p"
  done < "$LEDGER"
  if ! sort -c "$LEDGER" 2>/dev/null; then warn "ledger not sorted — run: sort -o $LEDGER $LEDGER"; fi
  DUPES=$(sort "$LEDGER" | uniq -d)
  [ -n "$DUPES" ] && warn "ledger has duplicate lines: $DUPES"
else
  warn "no ledger at $LEDGER"
fi

# ---- Check 9: truncation scan (nav description lines ending mid-word) ---------------
while IFS= read -r nav; do
  grep -nE '^\- \[.*\] — .*[a-z]$' "$nav" 2>/dev/null | while IFS= read -r line; do
    # heuristic: a description ending without sentence-ish punctuation AND shorter than 200 chars is fine;
    # flag only classic truncations: line ends mid-word with a single trailing letter after a space
    case "$line" in
      *" s"|*" a"|*" pri"|*:) warn "possible truncated nav line in $nav: ${line%%:*}" ;;
    esac
  done
done < <(find "$PD" .claude -name 'CLAUDE.md' 2>/dev/null)

# ---- Check 10: YAML parse -------------------------------------------------------------
if command -v python3 >/dev/null 2>&1 && python3 -c 'import yaml' 2>/dev/null; then
  for y in "$PD/feature-index.yaml" "$PD/analytics/data-catalog.yaml" \
           "$PD/_meta/write-policy.yaml" "$PD/product/customers/accounts/portfolio.yaml"; do
    [ -f "$y" ] || { warn "yaml missing: $y"; continue; }
    python3 -c "import yaml,sys; yaml.safe_load(open('$y'))" 2>/dev/null \
      || fail "yaml does not parse: $y"
  done
fi

note ""
note "== result: $FAIL failure(s), $WARN warning(s) =="
[ "$FAIL" -eq 0 ]
