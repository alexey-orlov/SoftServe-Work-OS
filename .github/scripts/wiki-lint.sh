#!/bin/bash
# Mechanical wiki-lint — the scriptable subset of .claude/skills/wiki-lint/SKILL.md
# (checks 2–5 and 8–12: nav coverage, cross-references, catalog + link contract,
# join symmetry, staging hygiene, ledger integrity, truncation scan, YAML parse,
# CODEOWNERS sync). The judgment checks
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

# ---- Check 0: script/skill parity ---------------------------------------------------
# The skill (.claude/skills/wiki-lint/SKILL.md) is the spec of record; this script is its
# mechanical subset. Drift between them is how check 4 went missing for a whole release
# while this header still claimed it. This guard makes the claim testable: every check the
# skill defines must be listed here as either implemented or judgment-only.
SKILL_MD=".claude/skills/wiki-lint/SKILL.md"
IMPLEMENTED="2 3 4 5 8 9 10 12"   # has a mechanical section below
JUDGMENT_ONLY="1 6 7 11"          # runs only in a session via /wiki-lint
if [ -f "$SKILL_MD" ] && command -v python3 >/dev/null 2>&1; then
  python3 - "$SKILL_MD" "$IMPLEMENTED" "$JUDGMENT_ONLY" <<'PARITY' || FAIL=$((FAIL+1))
import re, sys
skill, impl, judg = sys.argv[1], set(sys.argv[2].split()), set(sys.argv[3].split())
body = open(skill, encoding="utf-8").read()
m = re.search(r'^## The twelve checks\s*$(.*?)^\*\*The plain-language contract\*\*', body, re.M | re.S)
if not m:
    print("❌ cannot find the check list in %s — script/skill parity is unverifiable" % skill)
    sys.exit(1)
defined = set(re.findall(r'^(\d+)\. \*\*', m.group(1), re.M))
claimed = impl | judg
missing = sorted(defined - claimed, key=int)
extra = sorted(claimed - defined, key=int)
if missing:
    print("❌ the skill defines check(s) %s that this script neither implements nor lists as "
          "judgment-only — implement them or add them to JUDGMENT_ONLY (KEEP IN SYNC)"
          % ", ".join(missing))
if extra:
    print("❌ this script claims check(s) %s that the skill no longer defines — remove them"
          % ", ".join(extra))
if not missing and not extra:
    print("script/skill parity: %d checks defined, %d mechanical, %d judgment-only"
          % (len(defined), len(impl), len(judg)))
sys.exit(1 if (missing or extra) else 0)
PARITY
fi

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

# ---- Check 4 + 5b/5c + 8c: cross-references, join symmetry, staging hygiene ----------
# Check 4 (broken cross-references, repo-wide): the skill's check 4 scans EVERY content
# file, not only CLAUDE.md — check 2b above covers nav links alone. Blank scaffolds
# (handbook/templates/, PRDs/examples/) are exempt: their links are illustrative.
# Check 5b (artifact join symmetry): write-back-contract rule 8 — an artifact that names
# an initiative must appear on that initiative's page. Also: [PENDING: path] means
# "planned but not written yet" (initiative-page-template), so a PENDING marker whose
# file EXISTS is a false statement on the page.
# Check 5c (account join symmetry): a call summary must be reachable from its
# account-context.md — the per-customer view the contract makes /process-meeting write.
# Check 8c (staging hygiene): filing MOVES; an inbox source whose filed artifact cites it
# was copied, not moved, and now exists twice.
# These FAIL LOUD when they cannot run — a silent skip once hid real damage.
if command -v python3 >/dev/null 2>&1; then
  python3 - "$PD" <<'PYEOF' || FAIL=$((FAIL+1))
import sys, os, re, glob

PD = sys.argv[1]
bad = 0
def fail(m):
    global bad
    print("❌ %s" % m); bad += 1
def warn(m):
    print("⚠️  %s" % m)

EXEMPT = (os.path.join(PD, "product", "handbook", "templates"),
          os.path.join(PD, "product", "PRDs", "examples"))
LINK = re.compile(r'\[[^\]]*\]\(([^)\s]+)\)')
FENCE = re.compile(r'```.*?```', re.S)
CODE = re.compile(r'`[^`\n]*`')

def strip_code(t):
    # A link inside a code span or fenced block is sample text, not a link — markdown
    # does not render it as one either. Scanning it produces false "leads nowhere" hits
    # on every doc that documents a link shape.
    return CODE.sub("", FENCE.sub("", t))

def content_files():
    for base in (PD, "governance"):
        for dp, dn, fn in os.walk(base):
            if ".git" in dp:
                continue
            for f in fn:
                if f.endswith(".md"):
                    yield os.path.join(dp, f)

# ---- Check 4: every markdown link in every content file resolves --------------------
broken = []
for p in content_files():
    if p.startswith(EXEMPT):
        continue
    try:
        txt = open(p, encoding="utf-8").read()
    except Exception:
        continue
    for m in LINK.finditer(strip_code(txt)):
        t = m.group(1)
        if t.startswith(("http", "#", "mailto:")) or "{" in t or "[" in t:
            continue
        t = t.split("#")[0]
        if not t:
            continue
        tgt = os.path.normpath(os.path.join(os.path.dirname(p), t))
        if not os.path.exists(tgt):
            broken.append((p, t))
for p, t in broken[:25]:
    fail("link leads nowhere — %s -> %s" % (p, t))
if len(broken) > 25:
    print("   ...and %d more broken links (full list: run /wiki-lint in a session)" % (len(broken) - 25))

# ---- Check 4b: durable pages must not cite the transient inbox ----------------------
inbox_root = os.path.join(PD, "inbox")
for p in content_files():
    if p.startswith(inbox_root) or p.startswith(EXEMPT):
        continue
    try:
        txt = open(p, encoding="utf-8").read()
    except Exception:
        continue
    for m in LINK.finditer(strip_code(txt)):
        t = m.group(1).split("#")[0]
        # folder-level references (and nav files) legitimately describe the queue;
        # only a link at a FILE inside the inbox is provenance that will break on drain.
        if t.endswith("/") or os.path.basename(p) == "CLAUDE.md":
            continue
        if "inbox/" in t and not t.startswith("http"):
            warn("durable page cites the transient inbox as provenance — repoint at the filed home: %s -> %s" % (p, t))
            break

# ---- Check 5b: artifact <-> initiative-page join symmetry ---------------------------
init_dir = os.path.join(PD, "product", "initiatives")
inits = {}
for ip in glob.glob(os.path.join(init_dir, "*.md")):
    if os.path.basename(ip) == "CLAUDE.md":
        continue
    inits[os.path.basename(ip)[:-3]] = (ip, open(ip, encoding="utf-8").read())

# Frontmatter-driven, NOT path-glob-driven: an instance that renames its files (house
# naming) must not silently drop out of coverage. Anything that DECLARES an initiative is
# an artifact of it and belongs on its page. Raw transcripts are exempt (immutable source,
# never listed as artifacts) and so are feature-request records (they route via triage
# boards, not initiative rows).
EXCLUDE_DIRS = (os.path.join(PD, "product", "user-insights", "transcripts"),
                os.path.join(PD, "product", "user-insights", "feature-requests"),
                os.path.join(PD, "product", "initiatives"),
                os.path.join(PD, "inbox"))
checked = 0
for a in sorted(content_files()):
    if a.startswith(EXCLUDE_DIRS) or a.startswith(EXEMPT) or os.path.basename(a) == "CLAUDE.md":
        continue
    if not a.startswith(os.path.join(PD, "product")) and not a.startswith(os.path.join(PD, "analytics")):
        continue
    head = open(a, encoding="utf-8").read()[:2000]
    m = re.search(r'^initiatives:\s*\[([^\]]*)\]', head, re.M)
    if not m:
        continue
    base = os.path.basename(a)
    for slug in [x.strip() for x in m.group(1).split(",") if x.strip()]:
        checked += 1
        if slug not in inits:
            fail("artifact names an initiative with no page — %s -> %s" % (a, slug))
            continue
        ipath, ibody = inits[slug]
        if base not in ibody:
            fail("artifact is not on its initiative page (write-back rule 8: row + dated "
                 "Activity line) — %s missing from %s" % (a, ipath))
if inits and checked == 0:
    fail("join symmetry matched NOTHING — no artifact anywhere declares an initiative. "
         "Either the frontmatter link contract is unused, or this check has drifted from "
         "how artifacts are actually written. A check that matches nothing must not pass")

# ---- Check 5b(ii): a [PENDING: path] whose file already exists is a false statement --
PEND = re.compile(r'\[PENDING:\s*([^\]]+?)\s*\]')
for slug, (ipath, ibody) in inits.items():
    for m in PEND.finditer(ibody):
        raw = m.group(1).strip()
        if "{" in raw or "[" in raw:
            continue
        for cand in (os.path.join(PD, raw), raw, os.path.normpath(os.path.join(os.path.dirname(ipath), raw))):
            if os.path.exists(cand):
                fail("initiative page marks an artifact PENDING but the file exists — replace the marker with the link: %s -> %s" % (ipath, raw))
                break

# ---- Check 5c: call summary <-> account-context.md ----------------------------------
acct_root = os.path.join(PD, "product", "customers", "accounts")
if os.path.isdir(acct_root):
    for acct in sorted(os.listdir(acct_root)):
        ad = os.path.join(acct_root, acct)
        ctx = os.path.join(ad, "account-context.md")
        if not os.path.isdir(ad) or not os.path.exists(ctx):
            continue
        body = open(ctx, encoding="utf-8").read()
        for s in sorted(glob.glob(os.path.join(ad, "calls", "summaries", "*.md"))):
            if os.path.basename(s) == "CLAUDE.md":
                continue
            if os.path.basename(s) not in body:
                fail("call summary is not linked from its account page (History cross-link, same change) — %s missing from %s" % (s, ctx))

# ---- Check 8c: an inbox source whose filed artifact cites it was copied, not moved ---
if os.path.isdir(inbox_root):
    citers = {}
    for p in content_files():
        if p.startswith(inbox_root):
            continue
        try:
            citers[p] = open(p, encoding="utf-8").read()
        except Exception:
            pass
    for dp, dn, fn in os.walk(inbox_root):
        for f in fn:
            if f in ("CLAUDE.md", "index.md") or f.startswith("."):
                continue
            src = os.path.join(dp, f)
            for p, txt in citers.items():
                if src in txt and ("/transcripts/" in p or "account-context" in p):
                    fail("inbox source still present although its record was filed (copied, not moved — the file now exists twice): %s, cited by %s" % (src, p))
                    break

print("cross-references: %d broken · join + staging checks complete" % len(broken))
sys.exit(1 if bad else 0)
PYEOF
else
  fail "python3 unavailable — the cross-reference and join checks CANNOT run (install python3)"
fi

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
    text = text.lstrip("\ufeff")   # a leading UTF-8 BOM must not defeat the parse:
                                  # without this, frontmatter reads as EMPTY and every
                                  # link the file declares goes silently unchecked
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
init_targets = []          # (slug, features[], areas[]) per initiative page
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
    init_targets.append((slug, list(t_feats), list(t_areas)))
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
# Filename suffixes are the OS's canonical ones. An instance that renames its FILES
# (house naming goes on titles and prose, never filenames) drops out of this glob
# silently — the zero-coverage assertion below is what makes that visible instead of
# letting the link contract go unenforced for every artifact in the repo.
CHAIN_PATS = ("product/PRDs/*/*-prd.md", "product/PRDs/*/*-jobs-breakdown.md",
              "product/PRDs/*/*-job-spec.md", "product/launches/*.md")
chain_seen = 0
if glob.glob(os.path.join(pd, "product/PRDs/*/*.md")) and not any(
        glob.glob(os.path.join(pd, q)) for q in CHAIN_PATS):
    err("the chain-artifact check matched NOTHING while product/PRDs/ holds files — the "
        "repo's artifact filenames do not use the canonical suffixes (-prd / -jobs-breakdown "
        "/ -job-spec), so the link contract is going unenforced for every one of them. "
        "Rename the files to the canonical suffixes (house terms belong in titles and prose, "
        "not filenames) or update this check deliberately")
    link_broken += 1
chain_matched = set()
for pat in CHAIN_PATS:
    chain_matched |= set(glob.glob(os.path.join(pd, pat)))
all_prd_files = {q for q in glob.glob(os.path.join(pd, "product/PRDs/*/*.md"))
                 if os.path.basename(q) != "CLAUDE.md" and "/examples/" not in q.replace(os.sep, "/")}
unmatched = sorted(all_prd_files - chain_matched)
if unmatched:
    wrn("%d file(s) under product/PRDs/ match no canonical chain suffix (-prd / -jobs-breakdown "
        "/ -job-spec), so the link contract never checks them: %s%s. House terms belong in "
        "titles and prose, not filenames — rename, or extend CHAIN_PATS deliberately"
        % (len(unmatched), ", ".join(os.path.basename(q) for q in unmatched[:4]),
           " ..." if len(unmatched) > 4 else ""))
for pat in CHAIN_PATS:
    for path in glob.glob(os.path.join(pd, pat)):
        chain_seen += 1
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

# Catalog join: an initiative naming an area that HAS catalogued features should name at
# least one of them. Area-only targeting is legal (an emerging module carries no features
# yet), but when EVERY such initiative does it, the feature->initiative rollup that
# /overview {area} and the Console feature view depend on returns nothing, for every
# feature in the catalog.
featured_areas = set(features.values())      # areas that actually have catalogued features
if featured_areas and init_targets:
    relevant = [(sl, fe) for sl, fe, ar in init_targets if set(ar) & featured_areas]
    empty = [sl for sl, fe in relevant if not fe]
    if relevant and len(empty) == len(relevant):
        wrn("NO initiative anywhere names a target feature (features: [] on %s) while %d "
            "area(s) carry catalogued features — the feature-to-initiative rollup returns "
            "nothing for all %d features; /overview {area} and the Console feature view are "
            "blind. Declare features: on the initiatives that target them"
            % (", ".join(sorted(empty)), len(featured_areas), len(features)))
    else:
        for sl in sorted(empty):
            wrn(f"initiative '{sl}' targets an area with catalogued features but names none "
                f"(features: []) — it will not appear in those features' rollup")

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

# ---- Check 9b: byte-order marks ------------------------------------------------------
# A leading UTF-8 BOM is invisible in an editor and silently defeats any parser that tests
# the first line for '---'. It is how a file can declare its links and have none of them
# read. Cheap to strip, expensive to debug.
if command -v python3 >/dev/null 2>&1; then
  python3 - "$PD" <<'BOMEOF'
import os, sys
PD = sys.argv[1]
BOM = b"\xef\xbb\xbf"
hits = []
for base in (PD, "governance", ".claude", ".github"):
    for dp, dn, fn in os.walk(base):
        if ".git" in dp:
            continue
        for f in fn:
            if f.endswith((".md", ".yaml", ".yml")):
                p = os.path.join(dp, f)
                try:
                    if open(p, "rb").read(3) == BOM:
                        hits.append(p)
                except Exception:
                    pass
if hits:
    print("\u26a0\ufe0f  %d file(s) start with a byte-order mark — invisible, and it makes "
          "frontmatter parse as empty so declared links go unchecked. /wiki-lint strips them: %s%s"
          % (len(hits), ", ".join(sorted(hits)[:6]), " ..." if len(hits) > 6 else ""))
BOMEOF
fi

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

# ---- Script-only: server-side mirror of the gated list (CODEOWNERS) is in sync --------
# NOT the skill's check 11 (code-grounding registry, judgment-only) — this is CI housekeeping.
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
