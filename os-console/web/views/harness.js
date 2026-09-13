// OS harness — the OS's own machinery, in the Library's tile language but on its
// own page under Manage. The split from Library is the subject, not the style —
// Library holds what the team KNOWS, this page holds what makes the OS BEHAVE.
// Two tabs over three groups: the rules that decide how a session behaves, and
// the surfaces people read the OS through.
import { api } from '/api.js';
import { el, icon, setCrumbs, gatedTag, tabBar, activeTab } from '/ui.js';

const TOOLCHAIN = 'product-development/toolchain.yaml';

// Same tile vocabulary as the Library: 'file' | 'dir' → a repo path, 'view' → a
// console route used as-is (policyPath is the repo path behind it, for the gated
// badge). `acts` makes the tile an action-row card instead of one big link.
function it(name, target, desc, kind, ico, opts = {}) {
  return { name, target, desc, kind, ico, ...opts };
}

/** One button in an action-row card — `primary` marks the default destination. */
function act(label, href, ico = null, primary = false) {
  return { label, href, ico, primary };
}

const GROUPS = [
  {
    // What an agent can DO, kept apart from what it is told: these two are the
    // team's own capability surface, and both open pages of their own.
    key: 'skills',
    title: 'Skills and agents',
    hint: 'The work the team has taught the OS to do, and the reviewers it can put on a draft.',
    items: [
      it('Skills', '#/skills', 'The team\'s guided programs, mapped to the product workflow', 'view', 'zap',
        { policyPath: '.claude/skills' }),
      it('Agents', '.claude/agents', 'Reviewer personas and subagent definitions', 'dir', 'target'),
    ],
  },
  {
    key: 'agents',
    title: 'Agent setup',
    hint: 'What steers the agents, what runs on its own, what they remember, what they are connected to, and where they are told they are.',
    // Five tiles, and `rows-of-three` breaks them 3+2 at full width rather than
    // leaving a four-and-one row — see .tiles.quick.rows-of-three.
    rowsOfThree: true,
    items: [
      it('CLAUDE.md', 'CLAUDE.md', 'The root steering file every session loads first', 'file', 'file'),
      it('Hooks', '#/hooks', 'Session automation — the briefing, the write guard, auto-sync, and what switches them on', 'view', 'refresh',
        { policyPath: '.claude/hooks' }),
      it('Team memory', '#/learnings', 'Rules the team taught the agents, injected at every session start', 'view', 'bulb',
        { policyPath: '.claude/team-learnings.md' }),
      it('Integrations', TOOLCHAIN, 'Which tool each workflow surface uses, and what is connected', 'file', 'external'),
      it('Agent navigation', '#/navigation', 'Every folder that briefs an agent working inside it, and the file that does the briefing', 'view', 'compass',
        { policyPath: 'CLAUDE.md' }),
    ],
  },
  {
    key: 'gov',
    title: 'Governance',
    hint: 'Who may change what, and how every artifact stays findable after it is written.',
    items: [
      it('Gated files', '#/gated', 'What is protected and needs a person\'s approval before it changes', 'view', 'shield',
        { policyPath: 'governance/write-policy.yaml' }),
      it('Filing & linking rules', '#/filing', 'Where each artifact lands, and the links that keep it findable later', 'view', 'check',
        { policyPath: 'governance/write-back-contract.md' }),
    ],
  },
  {
    key: 'ui',
    title: 'OS user interface',
    hint: 'The surfaces people read the OS through — this console, the documentation site a team is sent, and the guides behind both.',
    // Every tile here is the action-row card: each of these has a page to read
    // and a folder behind it, and a clickable card with a button inside would be
    // two affordances in one component.
    items: [
      it('OS console', 'os-console', 'This console — the friendly way into everything the repo holds', 'dir', 'home',
        { acts: [act('Open', '#/home', null, true), act('Browse files', '#/library?path=os-console', 'folder')] }),
      it('Documentation', 'Documentation', 'The customer-facing documentation site a team is sent when it adopts the OS', 'dir', 'doc',
        { acts: [act('Open', '#/docs', null, true), act('Browse files', '#/library?path=Documentation', 'folder')] }),
      it('Admin guides', 'os-installation', 'Install, server-side admin setup, and the advanced Claude Code guides', 'dir', 'book',
        { acts: [act('Browse files', '#/library?path=os-installation', 'folder', true)] }),
    ],
  },
];

/** A group's own one-line scope, for the tab that holds it alone. */
const hintOf = (key) => GROUPS.find((g) => g.key === key).hint;

// Two tabs over the three groups, each row [id, label, group keys, one-line hint].
// Same rules as the Library: a tab holding a single group prints no group
// heading — the tab already carries that name — and so it carries that group's
// own line as its hint rather than restating it.
const TABS = [
  ['rules', 'Agents & rules', ['skills', 'agents', 'gov'],
    'What steers the agents and what governs the repo — the rules that decide how every session behaves.'],
  ['ui', 'OS user interface', ['ui'], hintOf('ui')],
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

export async function render(view, params) {
  view.replaceChildren();
  setCrumbs([{ label: 'OS harness' }]);

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('h1', {}, 'OS harness'),
    el('div', { class: 'sub' },
      'The OS itself, rather than what it knows. Most of this is gated — changing it changes how every future session behaves. 🔒 Gated = needs a human\'s approval.'),
  );

  // One bulk tier lookup for the whole page, like the Library does — not one per
  // tab, so switching tabs never re-fetches and never flashes an unbadged tile.
  // Badges are decoration, so a failure leaves the tiles unbadged rather than empty.
  const targets = [...new Set(GROUPS.flatMap((g) => g.items).map(policyTarget).filter(Boolean))];
  const tiers = api.get(`/api/tiers?paths=${encodeURIComponent(targets.join('|'))}`).catch(() => ({}));

  const content = el('div', {});
  let active = activeTab(params, TABS);
  page.append(
    tabBar({
      route: 'harness',
      tabs: TABS.map(([id, label]) => [id, label]),
      active,
      onSelect: (id) => { active = id; draw(); },
    }),
    content,
  );

  function draw() {
    content.replaceChildren();
    const [, , keys, hint] = TABS.find(([id]) => id === active);
    const groups = keys.map((k) => GROUPS.find((g) => g.key === k)).filter(Boolean);
    content.append(el('div', { class: 'hint', style: 'margin:-4px 0 4px' }, hint));

    const tileRefs = [];
    for (const group of groups) {
      // A lone group is already named by the tab it sits in.
      if (groups.length > 1) {
        content.append(
          el('h2', { class: `group-head g-${group.key}` }, el('span', { class: 'group-dot' }), group.title),
          el('div', { class: 'hint', style: 'margin:-2px 0 10px' }, group.hint),
        );
      } else {
        content.append(el('div', { style: 'height:10px' }));
      }
      const grid = `tiles quick${group.rowsOfThree ? ' rows-of-three' : ''}`;
      content.append(el('div', { class: grid }, group.items.map((q) => {
        const title = policyTarget(q) || q.name;
        const head = el('div', { class: 'row-t' }, icon(q.ico), el('span', { class: 'grow' }, q.name));
        const desc = el('div', { class: 'd' }, q.desc);
        const tile = q.acts
          ? el('div', { class: `tile acts g-${group.key}`, title }, head, desc,
            el('div', { class: 'row acts-row' }, q.acts.map((a) =>
              el('a', { class: `btn small ${a.primary ? 'primary' : 'quiet'}`, href: a.href },
                a.ico ? icon(a.ico) : null, a.label))))
          : el('a', { class: `tile g-${group.key}`, href: hrefFor(q), title }, head, desc);
        tileRefs.push({ target: policyTarget(q), tile });
        return tile;
      })));
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
  draw();
}
