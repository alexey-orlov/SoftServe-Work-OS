// System files — the OS's own machinery, in the Library's tile language but on
// its own page under Manage. Three groups, no tabs: what steers the agents,
// what governs the repo, and the surfaces people read the OS through. The split
// from Library is the subject, not the style — Library holds what the team
// KNOWS, this page holds what makes the OS BEHAVE.
import { api } from '/api.js';
import { el, icon, setCrumbs, gatedTag } from '/ui.js';

const TOOLCHAIN = 'product-development/toolchain.yaml';

// Same tile vocabulary as the Library: 'file' | 'dir' → a repo path, 'view' → a
// console route used as-is (policyPath is the repo path behind it, for the gated
// badge). `alt` adds a second destination inside the tile — see .tile-dual.
function it(name, target, desc, kind, ico, opts = {}) {
  return { name, target, desc, kind, ico, ...opts };
}

const GROUPS = [
  {
    key: 'agents',
    title: 'Agent setup',
    hint: 'What steers the agents, what they can do, what runs on its own, what they remember, and what they are connected to.',
    items: [
      it('CLAUDE.md', 'CLAUDE.md', 'The root steering file every session loads first', 'file', 'file'),
      it('Skills', '#/skills', 'The team\'s guided programs, mapped to the product workflow', 'view', 'zap',
        { policyPath: '.claude/skills' }),
      it('Agents', '.claude/agents', 'Reviewer personas and subagent definitions', 'dir', 'target'),
      it('Hooks', '.claude/hooks', 'Session automation — write guard, auto-sync, session briefing', 'dir', 'refresh'),
      it('Team memory', '#/learnings', 'Rules the team taught the agents, injected at every session start', 'view', 'bulb',
        { policyPath: '.claude/team-learnings.md' }),
      it('Integrations', TOOLCHAIN, 'Which tool each workflow surface uses, and what is connected', 'file', 'external'),
    ],
  },
  {
    key: 'gov',
    title: 'Governance',
    hint: 'Who may change what, and how every artifact stays findable after it is written.',
    items: [
      it('Gated files', '#/governance', 'What is protected and needs a person\'s approval before it changes', 'view', 'shield',
        { policyPath: 'governance/write-policy.yaml' }),
      it('Filing & linking rules', '#/filing', 'Where each artifact lands, and the links that keep it findable later', 'view', 'check',
        { policyPath: 'governance/write-back-contract.md' }),
    ],
  },
  {
    key: 'ui',
    title: 'OS user interface',
    hint: 'The surfaces people read the OS through — this console, the documentation site a team is sent, and the guides behind both.',
    items: [
      it('OS console', '#/home', 'This console — the friendly way into everything the repo holds', 'view', 'home',
        { policyPath: 'os-console', alt: { label: 'Browse files', path: 'os-console' } }),
      it('Documentation', '#/docs', 'The customer-facing documentation site a team is sent when it adopts the OS', 'view', 'doc',
        { policyPath: 'Documentation', alt: { label: 'Browse files', path: 'Documentation' } }),
      it('Admin guides', 'os-installation', 'Install, server-side admin setup, and the advanced Claude Code guides', 'dir', 'book'),
    ],
  },
];

function hrefFor(q) {
  if (q.kind === 'view') return q.target;
  if (q.kind === 'file') return `#/file?path=${encodeURIComponent(q.target)}`;
  return `#/library?path=${encodeURIComponent(q.target)}`;
}

/** The repo path a tile is judged by for the gated badge — null for pure routes. */
function policyTarget(q) {
  return q.policyPath || (q.kind === 'view' ? null : q.target);
}

export async function render(view) {
  view.replaceChildren();
  setCrumbs([{ label: 'System files' }]);

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('h1', {}, 'System files'),
    el('div', { class: 'sub' },
      'The OS itself, rather than what it knows. Most of this is gated — changing it changes how every future session behaves. 🔒 Gated = needs a human\'s approval.'),
  );

  // One bulk tier lookup for the whole page, like the Library does — badges are
  // decoration, so a failure leaves the tiles unbadged rather than empty.
  const targets = [...new Set(GROUPS.flatMap((g) => g.items).map(policyTarget).filter(Boolean))];
  const tiers = api.get(`/api/tiers?paths=${encodeURIComponent(targets.join('|'))}`).catch(() => ({}));

  const tileRefs = [];
  for (const group of GROUPS) {
    page.append(
      el('h2', { class: `group-head g-${group.key}` }, el('span', { class: 'group-dot' }), group.title),
      el('div', { class: 'hint', style: 'margin:-2px 0 10px' }, group.hint),
      el('div', { class: 'tiles quick' }, group.items.map((q) => {
        const href = hrefFor(q);
        const title = policyTarget(q) || q.name;
        const head = el('div', { class: 'row-t' }, icon(q.ico), el('span', { class: 'grow' }, q.name));
        const desc = el('div', { class: 'd' }, q.desc);
        const tile = q.alt
          ? el('div', { class: `tile g-${group.key} tile-dual`, title },
            el('a', { class: 'tile-main', href }, head),
            desc,
            el('a', {
              class: 'tile-alt',
              href: `#/library?path=${encodeURIComponent(q.alt.path)}`,
              title: `Browse ${q.alt.path} in the folder tree`,
            }, icon('folder'), q.alt.label))
          : el('a', { class: `tile g-${group.key}`, href, title }, head, desc);
        tileRefs.push({ target: policyTarget(q), tile });
        return tile;
      })),
    );
  }

  tiers.then((map) => {
    for (const { target, tile } of tileRefs) {
      if (map[target] !== 'gated' || !tile.isConnected) continue;
      const tag = gatedTag('gated', true);
      tag.classList.add('gate-corner');
      tile.append(tag);
    }
  });
}
