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
    # skip the frontmatter fence so the preview shows title + key fields either format
    head -14 "$PD/product/decisions/$f" 2>/dev/null | grep -v '^---$' | head -6 | sed 's/^/    /'
  done
else
  echo "none yet"
fi

echo "--- Current quarter (head) ---"
head -25 "$PD/product/strategy/current-quarter.md" 2>/dev/null || echo "none yet"

echo "--- Active initiatives ---"
# dual-read: frontmatter `status: active` (v2) or legacy `_status: active` line
ACTIVE=$(grep -lE '^_?status: active' "$PD"/product/initiatives/*.md 2>/dev/null)
if [ -n "$ACTIVE" ]; then
  echo "$ACTIVE" | while IFS= read -r f; do
    S=$(grep -m1 -E '^_?status:' "$f" 2>/dev/null)
    N=$(grep -m1 '^note:' "$f" 2>/dev/null | sed 's/^note:[[:space:]]*//; s/^"//; s/"$//')
    echo "• $(basename "$f" .md) — ${S}${N:+ — $N}"
  done
else
  echo "none"
fi

echo "--- Team learnings (.claude/team-learnings.md) ---"
cat .claude/team-learnings.md 2>/dev/null || echo "none yet"

echo "--- Latest health report ---"
LATEST=$(ls "governance/health" 2>/dev/null | grep -v 'CLAUDE' | sort | tail -1)
if [ -n "$LATEST" ]; then
  echo "$LATEST:"
  head -12 "governance/health/$LATEST" 2>/dev/null | sed 's/^/    /'
else
  echo "no lint report yet — run /wiki-lint"
fi

echo "--- Fold backlog ---"
BACKLOG=$(comm -23 \
  <(find "$PD"/product/customers/accounts \
         "$PD"/product/meetings \
         "$PD"/product/user-insights \
         "$PD"/inbox \
         -type f \( -path '*/transcripts/*' -o -path '*/interviews/*' -o -path '*/inbox/*' \) \
         \( -name '*.md' -o -name '*.txt' -o -name '*.pdf' -o -name '*.docx' \) \
         ! -name 'CLAUDE.md' 2>/dev/null | sort) \
  <(sort "governance/processed.txt" 2>/dev/null) 2>/dev/null | wc -l | tr -d ' ')
if [ "${BACKLOG:-0}" -gt 0 ] 2>/dev/null; then
  echo "$BACKLOG artifact(s) not yet folded — run /context-update"
else
  echo "clean — nothing waiting to be folded"
fi

PROPOSALS=$(ls "governance/proposals" 2>/dev/null | grep -vc 'CLAUDE' | tr -d ' ')
if [ "${PROPOSALS:-0}" -gt 0 ] 2>/dev/null; then
  echo "$PROPOSALS pending proposal(s) in governance/proposals/ — review and apply or reject (gated: apply with an in-session yes, then land deliberately)"
fi

# --- pr strategy: gated work waiting on this branch, drains not yet merged -----------
# Reads only local git state + the files auto-commit.sh keeps under .git/team-os/ — no network.
POLICY=governance/write-policy.yaml
if [ -f "$POLICY" ] && grep -q '^    strategy:[[:space:]]*pr' "$POLICY" 2>/dev/null && command -v git >/dev/null 2>&1; then
  TARGET=$(sed -n 's/^    target-branch:[[:space:]]*//p' "$POLICY" | head -1 | sed 's/[[:space:]]*#.*$//'); TARGET=${TARGET:-main}
  BR=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
  GD=$(git rev-parse --git-dir 2>/dev/null)
  if [ -n "$BR" ] && [ "$BR" != "HEAD" ] && git rev-parse --verify -q "origin/$TARGET" >/dev/null 2>&1; then
    AHEAD=$(git rev-list --count "origin/$TARGET..HEAD" 2>/dev/null)
    if [ "${AHEAD:-0}" -gt 0 ] 2>/dev/null; then
      echo "--- Gated work waiting (pr flow) ---"
      if [ "$BR" = "$TARGET" ]; then
        echo "you are on $TARGET with $AHEAD unpushed commit(s) — $TARGET is pull-request-only; the next turn moves them to your branch"
      else
        GP=$(cat "$GD/team-os/gated-pr" 2>/dev/null)
        PRREF=$(printf '%s' "$GP" | awk '{print $2}'); PRURL=$(printf '%s' "$GP" | awk '{print $3}')
        if [ -n "$PRREF" ] && [ "$PRREF" != "-" ]; then
          echo "$AHEAD commit(s) on $BR ahead of origin/$TARGET — pull request $PRREF open, awaiting admin approval${PRURL:+ · $PRURL}"
        else
          echo "$AHEAD commit(s) on $BR ahead of origin/$TARGET (gated work and/or everyday work still draining) — no pull request yet: say \"propose the gated changes\" when done iterating"
        fi
      fi
      NOPR=$(awk '$3=="-"{print $2}' "$GD/team-os/drains" 2>/dev/null | sort -u | paste -sd', ' -)
      [ -n "$NOPR" ] && echo "everyday drain branch(es) pushed but not merged (no PR tool): $NOPR → merge into $TARGET by hand"
    fi
  fi
fi

if [ -f .claude/.last-session-state ]; then
  echo "--- Last session left unfinished ---"
  cat .claude/.last-session-state
  rm -f .claude/.last-session-state
fi

exit 0
