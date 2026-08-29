// Skills — the team's guided programs, three projections over the same set:
// mapped against the product workflow (default), grouped by use-case block,
// and alphabetical. Every projection opens the same skill card — description,
// copy-the-command, the SKILL.md behind it.
import { api } from '/api.js';
import { el, icon, setCrumbs, spinner, modal, cmdChip, staleServerCard } from '/ui.js';

// ---- the workflow mapping (a presentation concern, like the Library's QUICK) --
// Stages run left to right in the order the work happens; the solid spine is the
// canonical chain from product/handbook/de-risk-a-bet.md. Skills not named in
// STAGE_OF fall back by their group, so a new skill always lands somewhere.

const STAGES = [
  { key: 'strategy', title: 'Strategy & ideas', hint: 'Direction, metrics thinking, what deserves a bet' },
  { key: 'discovery', title: 'Discovery', hint: 'Evidence from users, the market and the warehouse' },
  { key: 'definition', title: 'Definition', hint: 'From idea to challenged, buildable contracts' },
  { key: 'prototype', title: 'Prototype', hint: 'Make it visible before building it' },
  { key: 'build', title: 'Handoff & build', hint: 'Tickets, first code, what the code does today' },
  { key: 'launch', title: 'Launch & learn', hint: 'Rehearse, plan, gate the ship, read the results' },
];

const BANDS = [
  { key: 'everyday', title: 'Every day', hint: 'Meetings, decisions, comms and planning — runs alongside every stage' },
  { key: 'os', title: 'Keep the OS healthy', hint: 'Setup, connections and governance — the system behind the workflow' },
];

// The spine — the main path a feature travels (filled chips).
const MAIN = new Set(['prd-draft', 'jobs-breakdown', 'job-spec-draft', 'create-tickets', 'launch-checklist', 'feature-launch-gate']);

// Explicit stage overrides; everything else falls back by group.
const STAGE_OF = {
  'assumption-map': 'strategy',
  'write-prod-strategy': 'strategy',
  'strategy-sprint': 'strategy',
  'define-north-star': 'strategy',
  'metrics-framework': 'strategy',
  'prioritize-requests': 'strategy',
  'expansion-strategy': 'discovery',
  'journey-map': 'discovery',
  'pre-mortem': 'launch',
  'launch-checklist': 'launch',
  'feature-results': 'launch',
  'feature-launch-gate': 'launch',
  'context-update': 'everyday',
};
const GROUP_STAGE = {
  'communication-ops': 'everyday',
  'definition': 'definition',
  'delivery': 'build',
  'discovery-market': 'discovery',
  'discovery-customers': 'discovery',
  'discovery-analytics': 'discovery',
  'prototyping': 'prototype',
  'os-admin': 'os',
};

// Curated order inside each stage (spine first, then the narrative); unlisted
// skills append alphabetically.
const ORDER = {
  strategy: ['write-prod-strategy', 'strategy-sprint', 'define-north-star', 'metrics-framework', 'assumption-map', 'prioritize-requests'],
  discovery: ['interview-guide', 'user-research-synthesis', 'journey-map', 'competitor-analysis', 'retention-analysis', 'activation-analysis', 'expansion-strategy'],
  definition: ['prd-draft', 'jobs-breakdown', 'job-spec-draft', 'prd-challenge', 'job-spec-challenge', 'red-team', 'impact-sizing', 'feature-metrics', 'experiment-decision', 'experiment-metrics'],
  prototype: ['prototype', 'napkin-sketch', 'prototype-challenge', 'prototype-feedback'],
  build: ['create-tickets', 'pm-handoff', 'code-first-draft', 'code-qa'],
  launch: ['launch-checklist', 'feature-launch-gate', 'pre-mortem', 'feature-results'],
  everyday: ['process-meeting', 'context-update', 'decision-doc', 'decision-log-entry', 'meeting-agenda', 'meeting-feedback', 'slack-message', 'status-update', 'daily-plan', 'weekly-plan', 'weekly-review', 'portfolio-pulse'],
  os: ['customize-os', 'connect-mcps', 'connect-code', 'auto-sync', 'propose', 'wiki-lint', 'session-retro', 'docs-update', 'demo-data'],
};

const GROUP_ORDER = ['communication-ops', 'definition', 'delivery', 'discovery-market', 'discovery-customers', 'discovery-analytics', 'prototyping', 'os-admin'];

function stageOf(s) {
  return STAGE_OF[s.name] || GROUP_STAGE[s.group] || 'os';
}

function stageSort(list, key) {
  const order = ORDER[key] || [];
  return [...list].sort((a, b) => {
    const ma = MAIN.has(a.name) ? 0 : 1;
    const mb = MAIN.has(b.name) ? 0 : 1;
    if (ma !== mb) return ma - mb;
    const ia = order.indexOf(a.name); const ib = order.indexOf(b.name);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== ib) return ia === -1 ? 1 : -1;
    return a.name.localeCompare(b.name);
  });
}

// ---- the skill card — one interaction pattern for all three views -----------

function skillCard(s, groups) {
  const g = groups[s.group];
  let m = null;
  const fileLink = el('a', {
    class: 'btn small quiet', href: `#/file?path=${encodeURIComponent(s.path)}`,
    onclick: () => { if (m) m.close(); },
  }, icon('file'), 'Open the skill file');
  m = modal({
    title: `/${s.name}`,
    body: el('div', {},
      g ? el('div', { class: 'hint', style: 'margin-bottom:10px' }, `${g[0]} — ${g[1]}.`) : null,
      el('div', { style: 'font-size:13px; line-height:1.6; max-height:300px; overflow-y:auto; margin-bottom:12px' }, s.description || s.summary || ''),
      s.hint ? el('div', { class: 'hint', style: 'margin-bottom:10px' }, `Arguments: ${s.hint}`) : null,
      el('div', { class: 'row wrap' },
        cmdChip(`/${s.name}`),
        el('span', { class: 'grow' }),
        fileLink),
      el('div', { class: 'hint', style: 'margin-top:10px' },
        'Runs as a guided program in Claude Code — copy the command and paste it there.'),
    ),
  });
}

function chip(s, groups) {
  return el('button', {
    class: `wf-skill${MAIN.has(s.name) ? ' main' : ''}`,
    title: s.summary || s.name,
    onclick: () => skillCard(s, groups),
  }, `/${s.name}`);
}

// ---- views -------------------------------------------------------------------

function viewSwitch(mode) {
  const opt = (id, label) => el('a', { class: mode === id ? 'on' : '', href: `#/skills?v=${id}` }, label);
  return el('div', { class: 'view-switch', role: 'group', 'aria-label': 'Skills view' },
    opt('workflow', 'By workflow'), opt('groups', 'By group'), opt('az', 'A–Z'));
}

function renderWorkflow(page, skills, groups) {
  page.append(el('div', { class: 'wf-legend' },
    el('span', {}, el('span', { class: 'sw main' }), 'the main path a feature travels'),
    el('span', {}, el('span', { class: 'sw supp' }), 'supporting — pull in when the stage needs it'),
    el('span', {}, 'Click any skill for what it does and the command to copy.'),
  ));

  const byStage = {};
  for (const s of skills) (byStage[stageOf(s)] = byStage[stageOf(s)] || []).push(s);

  const grid = el('div', { class: 'wf-grid' });
  for (const st of STAGES) {
    const list = stageSort(byStage[st.key] || [], st.key);
    grid.append(el('div', { class: 'wf-col' },
      el('div', { class: 'wf-stage' }, st.title, el('span', { class: 'n' }, String(list.length))),
      el('div', { class: 'wf-hint' }, st.hint),
      list.map((s) => chip(s, groups)),
    ));
  }
  page.append(el('div', { class: 'wf-wrap' }, grid));

  for (const b of BANDS) {
    const list = stageSort(byStage[b.key] || [], b.key);
    if (!list.length) continue;
    page.append(el('div', { class: 'wf-band' },
      el('div', { class: 'wf-band-head' }, `${b.title} · ${list.length}`),
      el('div', { class: 'wf-band-hint' }, b.hint),
      el('div', {}, list.map((s) => chip(s, groups))),
    ));
  }
}

function renderGroups(page, skills, groups) {
  const byGroup = {};
  for (const s of skills) (byGroup[s.group] = byGroup[s.group] || []).push(s);
  const keys = [...GROUP_ORDER.filter((k) => byGroup[k]), ...Object.keys(byGroup).filter((k) => !GROUP_ORDER.includes(k)).sort()];
  for (const key of keys) {
    const g = groups[key] || [key, ''];
    const list = byGroup[key].sort((a, b) => a.name.localeCompare(b.name));
    page.append(
      el('h2', { class: 'group-head g-system' }, el('span', { class: 'group-dot' }), g[0],
        el('span', { class: 'area-count' }, `${list.length} ${list.length === 1 ? 'skill' : 'skills'}`)),
      g[1] ? el('div', { class: 'hint', style: 'margin:2px 0 10px' }, `${g[1]}.`) : el('div', { style: 'height:10px' }),
      el('div', { class: 'tiles', style: 'grid-template-columns:repeat(auto-fill, minmax(230px, 1fr))' },
        list.map((s) => el('a', {
          class: 'tile g-system', role: 'button', tabindex: '0',
          onclick: () => skillCard(s, groups),
          onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skillCard(s, groups); } },
        },
        el('div', { class: 'row-t' }, el('span', { class: 'skill-cmd' }, `/${s.name}`)),
        el('div', { class: 'd', style: 'display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden' }, s.summary)))),
    );
  }
}

function renderAz(page, skills, groups) {
  const table = el('table', { class: 'data' },
    el('thead', {}, el('tr', {}, el('th', {}, 'Command'), el('th', {}, 'What it does'), el('th', {}, 'Group'))));
  const tbody = el('tbody', {});
  table.append(tbody);
  for (const s of skills) {
    const g = groups[s.group];
    tbody.append(el('tr', { class: 'click', onclick: () => skillCard(s, groups) },
      el('td', { style: 'white-space:nowrap' }, el('span', { class: 'skill-cmd' }, `/${s.name}`)),
      el('td', { style: 'color:var(--ink-2)' },
        el('span', { style: 'display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden' }, s.summary)),
      el('td', { style: 'white-space:nowrap' }, el('span', { class: 'tag skill-group-tag' }, g ? g[0] : s.group)),
    ));
  }
  page.append(el('div', { class: 'card scroll-x', style: 'padding:6px 10px' }, table));
}

export async function render(view, params) {
  view.append(spinner());
  let d;
  try {
    d = await api.get('/api/skills');
  } catch (e) {
    view.replaceChildren();
    setCrumbs([{ label: 'Library', href: '#/library' }, { label: 'Skills' }]);
    view.append(el('div', { class: 'page' }, el('h1', {}, 'Skills'), staleServerCard()));
    return;
  }
  view.replaceChildren();
  setCrumbs([{ label: 'Library', href: '#/library' }, { label: 'Skills' }]);

  const mode = ['workflow', 'groups', 'az'].includes(params.get('v')) ? params.get('v') : 'workflow';
  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('div', { class: 'row wrap', style: 'margin-bottom:4px' },
      el('h1', { class: 'grow', style: 'margin:0' }, 'Skills'),
      viewSwitch(mode)),
    el('div', { class: 'sub' },
      `The team's ${d.skills.length} guided programs — /-commands you run in Claude Code, each carrying this Work OS's context. Three ways in: where each runs in the product workflow, by use-case group, or A–Z.`),
  );

  if (!d.skills.length) {
    page.append(el('div', { class: 'card' }, el('div', { class: 'empty' }, 'No skills found in .claude/skills/.')));
    return;
  }
  if (mode === 'workflow') renderWorkflow(page, d.skills, d.groups);
  else if (mode === 'groups') renderGroups(page, d.skills, d.groups);
  else renderAz(page, d.skills, d.groups);
}
