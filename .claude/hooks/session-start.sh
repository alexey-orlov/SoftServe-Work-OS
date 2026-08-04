#!/bin/bash
# Team OS session-start hook — injects DELTAS only (root CLAUDE.md loads separately;
# re-catting it here would double-spend tokens). Wired via .claude/settings.json.
# Budget: keep total output under ~150 lines.

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
PD=product-development

echo "=== TEAM CONTEXT (session-start hook) ==="

echo "--- Recent decisions (newest 3) ---"
DECISIONS=$(ls "$PD/product/decisions" 2>/dev/null | grep -E '^[0-9]{4}-' | sort -r | head -3)
if [ -n "$DECISIONS" ]; then
  echo "$DECISIONS" | while IFS= read -r f; do
    echo "• $f"
    head -6 "$PD/product/decisions/$f" 2>/dev/null | sed 's/^/    /'
  done
else
  echo "none yet"
fi

echo "--- Current quarter (head) ---"
head -25 "$PD/product/strategy/current-quarter.md" 2>/dev/null || echo "none yet"

echo "--- Active initiatives ---"
ACTIVE=$(grep -l '_status: active' "$PD"/product/initiatives/*.md 2>/dev/null)
if [ -n "$ACTIVE" ]; then
  echo "$ACTIVE" | while IFS= read -r f; do
    echo "• $(basename "$f" .md) — $(grep -m1 '_status:' "$f")"
  done
else
  echo "none"
fi

echo "--- Team learnings (.claude/team-learnings.md) ---"
cat .claude/team-learnings.md 2>/dev/null || echo "none yet"

echo "--- Latest health report ---"
LATEST=$(ls "$PD/_meta/health" 2>/dev/null | grep -v 'CLAUDE' | sort | tail -1)
if [ -n "$LATEST" ]; then
  echo "$LATEST:"
  head -12 "$PD/_meta/health/$LATEST" 2>/dev/null | sed 's/^/    /'
else
  echo "no lint report yet — run /wiki-lint"
fi

echo "--- Fold backlog ---"
BACKLOG=$(comm -23 \
  <(find "$PD"/product/customers/accounts \
         "$PD"/product/meetings \
         "$PD"/inbox \
         -type f \( -path '*/transcripts/*' -o -path '*/inbox/*' \) \
         \( -name '*.md' -o -name '*.txt' -o -name '*.pdf' -o -name '*.docx' \) \
         ! -name 'CLAUDE.md' 2>/dev/null | sort) \
  <(sort "$PD/_meta/processed.txt" 2>/dev/null) 2>/dev/null | wc -l | tr -d ' ')
if [ "${BACKLOG:-0}" -gt 0 ] 2>/dev/null; then
  echo "$BACKLOG artifact(s) not yet folded — run /context-update"
else
  echo "clean — nothing waiting to be folded"
fi

PROPOSALS=$(ls "$PD/_meta/proposals" 2>/dev/null | grep -vc 'CLAUDE' | tr -d ' ')
if [ "${PROPOSALS:-0}" -gt 0 ] 2>/dev/null; then
  echo "$PROPOSALS pending Tier-2 proposal(s) in $PD/_meta/proposals/ — review and apply or reject"
fi

if [ -f .claude/.last-session-state ]; then
  echo "--- Last session left unfinished ---"
  cat .claude/.last-session-state
  rm -f .claude/.last-session-state
fi

exit 0
