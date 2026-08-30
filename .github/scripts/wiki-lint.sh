#!/bin/bash
# Mechanical wiki-lint — the scriptable subset of .claude/skills/wiki-lint/SKILL.md
# (checks 2–4, 8–10, and 12: nav coverage, catalog + link contract, broken links,
# ledger integrity, placeholder/truncation scan, YAML parse). The judgment checks
# (staleness tiers, contradiction sweep, initiative health) live in the /wiki-lint skill.
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

# ---- Check 3 + 12: product catalog + link contract ----------------------------------
# Check 3 (either index shape): v2 catalog — feature status vocabulary, shipped dates,
# feature-slug global uniqueness; legacy artifact-map — paths resolve, initiative slugs
# have pages (kept readable forever for mid-migration instances).
# Check 12 (link contract, governance/link-schema.yaml): every initiative page has a
# valid status and at least one resolvable target (an unmapped initiative cannot
# exist); chain artifacts (PRD / breakdown / job spec / launch) name their initiative
# via frontmatter or a filename the lint can derive it from; slugs stay unique across
# areas + features + initiatives.
# These checks FAIL LOUD when they cannot run — a silent skip once hid real damage.
if command -v python3 >/dev/null 2>&1; then
  python3 - "$PD" <<'PYEOF' || FAIL=$((FAIL+1))
import sys, os, re, glob
try:
    import yaml
except ImportError:
    print("❌ pyyaml unavailable — the catalog and link checks CANNOT run (fix: python3 -m pip install --user pyyaml)")
    sys.exit(1)
pd = sys.argv[1]
bad = 0
def err(msg):
    global bad
    print(f"❌ {msg}")
    bad += 1
def wrn(msg):
    print(f"⚠️  {msg}")

try:
    idx = yaml.safe_load(open(os.path.join(pd, "feature-index.yaml")))
except Exception as e:
    print(f"❌ feature-index.yaml can't be read (formatting error) — every feature lookup is broken until fixed: {e}"); sys.exit(1)

areas, features = {}, {}   # area slug -> spec · feature slug -> area
legacy = not (isinstance(idx, dict) and isinstance(idx.get("areas"), dict))
if not legacy:
    for a, aspec in (idx.get("areas") or {}).items():
        areas[a] = aspec or {}
        for f, fs in (((aspec or {}).get("features")) or {}).items():
            if f in features:
                err(f"feature slug '{f}' appears under two areas ({features[f]} and {a}) — feature slugs are globally unique")
            features[f] = a
            st = (fs or {}).get("status")
            if st not in ("planned", "live", "retired"):
                err(f"feature {a}.{f} status is '{st}' — must be planned | live | retired")
            sh = (fs or {}).get("shipped")
            if sh is not None and not re.match(r"^\d{4}-\d{2}-\d{2}", str(sh)):
                err(f"feature {a}.{f} shipped date '{sh}' is not YYYY-MM-DD")
elif isinstance(idx, dict):
    SKIP_KEYS = {"tickets", "figma", "initiatives"}
    def walk(node):
        if isinstance(node, dict):
            for k, v in node.items():
                if k not in SKIP_KEYS:
                    walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)
        elif isinstance(node, str):
            if "/" in node and not node.startswith("http") and " " not in node:
                if not os.path.exists(os.path.join(pd, node)):
                    err(f"feature index points at a file that doesn't exist (moved or deleted?): {node}")
    for a, feats in idx.items():
        if not isinstance(feats, dict):
            continue
        for f, entry in feats.items():
            features[f] = a
            if isinstance(entry, dict):
                for slug in (entry.get("initiatives") or []):
                    if not os.path.exists(os.path.join(pd, "product", "initiatives", f"{slug}.md")):
                        err(f"initiative named in the feature index has no page in product/initiatives/: {slug} (feature {a}.{f})")
                walk({k: v for k, v in entry.items() if k != "initiatives"})

# ---- link contract (check 12) ----
STATUSES = {"exploring", "active", "paused", "shipped", "killed"}
init_dir = os.path.join(pd, "product", "initiatives")
def read_meta(path):
    """(frontmatter dict | None on parse error, full text)"""
    try:
        text = open(path, encoding="utf-8").read()
    except Exception:
        return None, ""
    lines = text.split("\n")
    if lines and lines[0].strip() == "---":
        for i in range(1, min(len(lines), 60)):
            if lines[i].strip() == "---":
                try:
                    return (yaml.safe_load("\n".join(lines[1:i])) or {}), text
                except Exception:
                    return None, text
    return {}, text

pending = ""
if os.path.isdir("governance/proposals"):
    for p in os.listdir("governance/proposals"):
        if p.endswith(".md") and p != "CLAUDE.md":
            try:
                pending += open(os.path.join("governance/proposals", p), encoding="utf-8", errors="ignore").read()
            except Exception:
                pass

init_slugs = set()
link_broken = 0
unknown_slugs = 0
for page in sorted(glob.glob(os.path.join(init_dir, "*.md"))):
    name = os.path.basename(page)
    if name == "CLAUDE.md":
        continue
    slug = name[:-3]
    init_slugs.add(slug)
    if slug in features or slug in areas:
        which = "feature" if slug in features else "area"
        if legacy:
            wrn(f"initiative slug '{slug}' collides with a {which} slug — pre-migration state; rename (e.g. {slug}-v1) when adopting the v2 catalog")
        else:
            err(f"initiative slug '{slug}' collides with a catalog {which} slug — slugs are unique across areas + features + initiatives (rename e.g. {slug}-v1)")
    meta, text = read_meta(page)
    if meta is None:
        err(f"initiative page frontmatter can't be read (formatting error): {name}")
        link_broken += 1
        continue
    status = str(meta.get("status") or "")
    if not status:
        m = re.search(r"^_status:\s*(\S+)", text, re.M)
        status = m.group(1) if m else ""
    word = re.split(r"[\s—-]", status)[0].lower() if status else ""
    if word not in STATUSES:
        err(f"initiative {slug} status '{word or '(none)'}' — must be exploring | active | paused | shipped | killed")
    t_feats = meta.get("features") if isinstance(meta.get("features"), list) else []
    t_areas = meta.get("areas") if isinstance(meta.get("areas"), list) else []
    if not t_feats and not t_areas:
        anch = re.findall(r"feature-index\.yaml#([a-z0-9_-]+)\.([a-z0-9_-]+)", text[:1500], re.I)
        t_feats = [f for _, f in anch]
        if t_feats:
            wrn(f"initiative {slug} declares targets via the legacy anchor — /wiki-lint converts it to frontmatter")
    if not t_feats and not t_areas:
        err(f"initiative {slug} names no target feature or area — an unmapped initiative cannot exist (add areas:/features: frontmatter)")
        link_broken += 1
    for f in t_feats:
        if f not in features:
            if f in pending:
                wrn(f"initiative {slug} targets feature '{f}' still pending in governance/proposals/ — apply the proposal")
            else:
                err(f"initiative {slug} targets unknown feature '{f}' — not in feature-index.yaml")
                unknown_slugs += 1
    for a in t_areas:
        if a not in areas and not legacy:
            err(f"initiative {slug} targets unknown area '{a}' — not in feature-index.yaml")
            unknown_slugs += 1

# chain artifacts name their initiative (frontmatter, or a filename lint can derive it from)
for pat in ("product/PRDs/*/*-prd.md", "product/PRDs/*/*-jobs-breakdown.md",
            "product/PRDs/*/*-job-spec.md", "product/launches/*.md"):
    for path in glob.glob(os.path.join(pd, pat)):
        base = os.path.basename(path)
        if base == "CLAUDE.md" or "/examples/" in path.replace(os.sep, "/"):
            continue
        rel = os.path.relpath(path).replace(os.sep, "/")
        meta, _text = read_meta(path)
        m_inits = (meta or {}).get("initiatives") if isinstance((meta or {}).get("initiatives"), list) else []
        if m_inits:
            for s in m_inits:
                if s not in init_slugs:
                    err(f"{rel} names initiative '{s}' that has no page in product/initiatives/")
                    link_broken += 1
        elif any(base.startswith(s + "-") for s in init_slugs):
            wrn(f"{rel} carries no initiatives: frontmatter — derivable from its filename; /wiki-lint adds it")
        elif legacy:
            wrn(f"{rel} maps to no initiative — pre-migration state; /wiki-lint routes it when adopting the v2 catalog")
        else:
            err(f"{rel} maps to no initiative — every PRD / breakdown / job spec / launch belongs to a project (add initiatives: frontmatter)")
            link_broken += 1

# the link-health line — session-start prints the report head, so this reaches every session
print(f"links: {link_broken + unknown_slugs} broken · {unknown_slugs} unknown slug(s)")
sys.exit(1 if bad else 0)
PYEOF
else
  fail "python3 unavailable — the catalog and link checks CANNOT run (install python3)"
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
           "governance/write-policy.yaml" "governance/link-schema.yaml" \
           "$PD/product/customers/accounts/portfolio.yaml" \
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
