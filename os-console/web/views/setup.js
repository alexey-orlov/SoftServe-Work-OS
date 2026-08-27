// Set up this OS — five tabs (Business context / Templates / Integrations /
// Auto-sync / Demo data), overall progress + per-tab counters, every signal
// read live from the team's files. The guided-way strip spans the page (it
// concerns the whole setup, not one tab); the Integrations tab is the full
// table: type, purpose, system used (editable until live), status, comment,
// actions. The Auto-sync tab renders the same modes component as the
// Auto-sync page, so the two never drift.
import { api } from '/api.js';
import { el, icon, pill, cmdChip, meter, setCrumbs, spinner, toast, modal, promptModal, LITE, liteLock, staleServerCard } from '/ui.js';
import { buildModesCard, currentModeLabel } from '/views/autosync.js';

const TABS = [
  ['business', 'Business context'],
  ['templates', 'Templates'],
  ['integrations', 'Integrations'],
  ['autosync', 'Auto-sync'],
  ['demo', 'Demo data'],
];

export async function render(view, params) {
  view.append(spinner());
  const o = await api.get('/api/overview');
  view.replaceChildren();
  setCrumbs([{ label: 'Set up this OS' }]);

  if (!o.setup || !o.setup.tabs) {
    view.append(el('div', { class: 'page' }, el('h1', {}, 'Set up this OS'), staleServerCard()));
    return;
  }
  const tabs = o.setup.tabs;
  const prog = o.progress || { done: 0, total: 0 };

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('div', { class: 'row wrap', style: 'margin-bottom:4px' },
      el('h1', { class: 'grow', style: 'margin:0' }, prog.done === prog.total ? 'Setup — complete' : 'Set up this OS'),
      el('div', { style: 'width:220px' }, meter(prog.done, prog.total)),
    ),
    el('div', { class: 'sub' },
      'Everything here is read live from your team\'s files — it updates as things change.'),
    guidedStrip(o),
  );

  const tabBar = el('div', { class: 'tabs' });
  const content = el('div', {});
  page.append(tabBar, content);

  let active = params.get('tab') || 'business';
  if (!TABS.some(([id]) => id === active)) active = 'business';

  function tabButton(id, label) {
    const t = tabs[id] || {};
    const counter = 'total' in t ? `${t.done}/${t.total}` : (id === 'demo' ? (t.present ? '1' : '0') : '');
    const btn = el('button', {
      class: `tab ${id === active ? 'on' : ''}`,
      onclick: () => {
        active = id;
        history.replaceState(null, '', `#/setup?tab=${id}`);
        tabBar.querySelectorAll('.tab').forEach((b) => b.classList.remove('on'));
        btn.classList.add('on');
        draw();
      },
    }, label, counter ? el('span', { class: 'count' }, counter) : null);
    return btn;
  }
  for (const [id, label] of TABS) tabBar.append(tabButton(id, label));

  function draw() {
    content.replaceChildren();
    if (active === 'business') drawBusiness(content, tabs.business);
    else if (active === 'templates') drawTemplates(content, tabs.templates);
    else if (active === 'integrations') drawIntegrations(content, tabs.integrations);
    else if (active === 'autosync') drawAutosync(content, tabs.autosync);
    else drawDemo(content, tabs.demo);
  }
  draw();
}

// ---- the guided-way strip — one line, spans the page -------------------------

function guidedStrip(o) {
  if (o.customization) {
    return el('div', { class: 'setup-banner' },
      icon('compass'),
      el('span', { class: 'grow' },
        el('b', {}, 'Guided setup in progress'), ' — pick up where you left off, or check what\'s already done.'),
      el('a', { class: 'btn small quiet', href: `#/file?path=${encodeURIComponent(o.customization.path)}` }, 'Open status'),
      cmdChip('/customize-os continue'),
    );
  }
  return el('div', { class: 'setup-banner' },
    icon('compass'),
    el('span', { class: 'grow' },
      el('b', {}, 'New here?'), ' One guided conversation in Claude Code walks through all of this in order and keeps its own progress.'),
    cmdChip('/customize-os'),
  );
}

// ---- business context -------------------------------------------------------

function tidyDetail(s) {
  return (s || '')
    .replace(' / GAP markers', '')
    .replace('Populated — no placeholders left.', 'Complete — nothing left to fill in.');
}

function drawBusiness(box, tab) {
  const card = el('div', { class: 'card' },
    el('h3', {}, 'How filled-in your context is'),
    el('div', { class: 'hint' },
      'The files every strategic skill reads first. A file is complete when nothing is left as a placeholder.'),
  );
  for (const r of (tab && tab.items) || []) {
    card.append(el('div', { class: 'step' },
      pill(r.state),
      el('div', { class: 'body' },
        el('div', { class: 'title' }, r.label),
        el('div', { class: 'detail' }, tidyDetail(r.detail))),
      r.exists
        ? el('a', { class: 'btn small quiet', href: `#/file?path=${encodeURIComponent(r.path)}`, title: r.path }, 'Open')
        : cmdChip('/customize-os'),
    ));
  }
  box.append(card);
}

// ---- templates --------------------------------------------------------------

function tidyTemplateTitle(s) {
  return (s || '').replace(/\[|\]/g, '');
}
function tidyTemplateDesc(s) {
  // one plain sentence — the routing detail ("copies go to …") is for agents
  return (s || '').split(';')[0].replace(/scaffold$/i, 'scaffold.');
}

function drawTemplates(box, tab) {
  const done = tab && tab.customized;
  const card = el('div', { class: 'card' },
    el('div', { class: 'row' },
      el('h3', { class: 'grow' }, 'Document templates'),
      done ? pill('done', 'Customized') : pill('todo', 'Defaults'),
      el('a', { class: 'btn small quiet', href: '#/templates' }, 'Open templates')),
    el('div', { class: 'hint' },
      done
        ? `Your house formats are in — derived from your own documents (program reports: ${tab.phase}).`
        : el('span', {}, 'The blank documents skills start from. They work as shipped; deriving your house formats from 2–4 of your real documents makes every future document look like yours: ', cmdChip('/customize-os templates'))),
  );
  const grid = el('div', { class: 'tiles', style: 'margin-top:10px' });
  for (const t of (tab && tab.items) || []) {
    grid.append(el('a', { class: 'tile', href: `#/file?path=${encodeURIComponent(t.path)}`, title: t.path },
      el('div', { class: 'row-t' }, icon('file'), el('span', { class: 'grow' }, tidyTemplateTitle(t.title))),
      el('div', { class: 'd' }, tidyTemplateDesc(t.desc || t.name))));
  }
  card.append(grid);
  box.append(card);
}

// ---- integrations -----------------------------------------------------------

const STATUS_PILLS = {
  live: ['ok', 'Connected'],
  files: ['info', 'File-based'],
  planned: ['warn', 'Planned'],
  todo: ['todo', 'Not set up'],
};

function drawIntegrations(box, tab) {
  const rows = (tab && tab.rows) || [];
  const card = el('div', { class: 'card' },
    el('h3', {}, 'Integrations'),
    el('div', { class: 'hint' },
      'Every connection is optional — each row has a way of working with plain files out of the box. Type the tool you plan to use under "System used"; once a real connection is live, the field locks to the connected tool.'),
  );
  const table = el('table', { class: 'integrations' },
    el('thead', {}, el('tr', {},
      el('th', {}, 'Integration'), el('th', {}, 'Purpose'), el('th', {}, 'System used'),
      el('th', {}, 'Status'), el('th', {}, 'Comment'), el('th', {}, 'Actions'))),
  );
  const tbody = el('tbody', {});
  table.append(tbody);
  for (const r of rows) tbody.append(integrationRow(r));
  card.append(el('div', { class: 'table-scroll' }, table));
  if (tab && tab.other && tab.other.length) {
    card.append(el('div', { class: 'hint', style: 'margin-top:8px' },
      `Also connected (not tied to a row above): ${tab.other.join(', ')}.`));
  }
  box.append(card);
}

function integrationRow(r) {
  const [cls, label] = STATUS_PILLS[r.status] || ['plain', r.status];

  let sysCell;
  if (!r.systemEditable) {
    sysCell = r.status === 'live'
      ? el('span', { class: 'sys-locked', title: 'Locked — a live connection names the real system' }, icon('lock'), r.system || '—')
      : el('span', { style: 'color:var(--muted)' }, '—');
  } else {
    const input = el('input', {
      class: 'system', value: r.system || '', placeholder: r.example || 'tool name',
      title: 'The tool you plan to use here — becomes the team\'s recorded plan when you save (this is your approval)',
    });
    const save = async () => {
      const v = input.value.trim();
      if (v === (r.system || '')) return;
      try {
        const res = await api.post('/api/toolchain', { surface: r.key, system: v });
        toast(`Saved — ${r.type}: ${v || 'cleared'}${res.commit.committed ? ' ✓' : ''}`);
        window.dispatchEvent(new Event('console:saved'));
      } catch (e) { toast(e.message, 'err'); input.value = r.system || ''; }
    };
    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
    sysCell = LITE ? liteLock(input) : input;
  }

  const acts = el('div', { class: 'acts' });
  for (const a of r.actions || []) {
    let btn;
    if (a.kind === 'prompt') {
      btn = el('button', {
        class: 'btn small',
        onclick: () => promptModal({
          title: `${a.label} — ${r.type}`,
          prompt: a.prompt,
          instruction: 'Open Claude Code, start a session in this Work OS folder, paste this prompt and follow the guided setup there:',
        }),
      }, a.label);
    } else {
      btn = el('button', {
        class: 'btn small quiet',
        onclick: () => filesModal(r, a),
      }, a.label);
      if (LITE) btn = liteLock(btn);
    }
    acts.append(btn);
  }

  return el('tr', {},
    el('td', { style: 'font-weight:600' }, r.type),
    el('td', { class: 'purpose' }, r.purpose),
    el('td', {}, sysCell),
    el('td', {}, el('span', { class: `pill ${cls}` }, label)),
    el('td', { class: 'comment' }, r.comment),
    el('td', {}, acts),
  );
}

function filesModal(r, a) {
  modal({
    title: `Use file storage — ${r.type}`,
    body: el('div', {},
      el('div', { style: 'font-size:13.5px; margin-bottom:8px' },
        'Records working with plain files as this team\'s standing choice, so skills work that way without asking — deliberate, not a downgrade.'),
      el('div', { class: 'hint' }, r.comment),
      el('div', { class: 'hint', style: 'margin-top:6px' },
        'This click is your approval; connect the real tool any time to change it.'),
    ),
    actions: [{
      label: 'Use file storage', kind: 'primary',
      onclick: async (close) => {
        const res = await api.post('/api/toolchain', { surface: r.key, approach: a.approach });
        toast(`${r.type}: file-based${res.commit.committed ? ' ✓' : ''}`);
        window.dispatchEvent(new Event('console:saved'));
        close();
        location.reload();
      },
    }],
  });
}

// ---- auto-sync — the same modes component as the Auto-sync page -------------

async function drawAutosync(box, tab) {
  const holder = el('div', {}, spinner());
  box.append(holder);
  try {
    const d = await api.get('/api/governance');
    holder.replaceChildren(
      el('div', { class: 'row', style: 'margin:2px 0 12px' },
        el('span', { class: `pill ${d.autoSync.on ? 'ok' : 'todo'}` }, currentModeLabel(d.autoSync)),
        el('span', { class: 'grow' }),
        el('a', { class: 'btn small quiet', href: '#/autosync' }, 'Open the full page')),
      buildModesCard(d),
    );
  } catch (e) {
    holder.replaceChildren(el('div', { class: 'card' }, el('div', { class: 'hint' }, e.message)));
  }
}

// ---- demo data --------------------------------------------------------------

function drawDemo(box, tab) {
  const t = tab || {};
  box.append(el('div', { class: 'card' },
    el('div', { class: 'row' },
      el('h3', { class: 'grow' }, 'Demo data'),
      el('span', { class: `pill ${t.present ? 'info' : 'plain'}` }, t.present ? 'Present' : 'None')),
    el('div', { class: 'hint' }, t.detail || ''),
    el('div', { class: 'hint', style: 'margin:10px 0 6px' },
      t.present
        ? 'Everything synthetic is recorded in a manifest; removal reverses it exactly:'
        : 'Optional: a small, clearly marked set of realistic example content for demos — generated through the same pipeline real work uses, removable in one step. Not counted in setup progress:'),
    el('div', { class: 'chips' },
      t.present ? cmdChip('/demo-data status') : null,
      t.present ? cmdChip('/demo-data remove') : cmdChip('/demo-data'),
    ),
    t.present ? el('div', { style: 'margin-top:8px' },
      el('a', { class: 'btn small quiet', href: `#/file?path=${encodeURIComponent(t.path)}` }, 'Open manifest')) : null,
  ));
}
