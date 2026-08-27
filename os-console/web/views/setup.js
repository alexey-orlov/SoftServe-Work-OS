// Set up this OS — five tabs (Business context / Templates / Integrations /
// Auto-sync / Demo data), overall progress + per-tab counters, every signal
// derived live from repo state. The Integrations tab is the full table: type,
// purpose, system used (editable until live), status, comment, actions.
import { api } from '/api.js';
import { el, icon, pill, cmdChip, meter, setCrumbs, spinner, mdRender, toast, modal, promptModal, LITE, liteLock, staleServerCard } from '/ui.js';
// (icon is used for the lock on live systems and the Auto-sync link)

const fileLink = (path, label) => el('a', {
  class: 'btn small quiet', href: `#/file?path=${encodeURIComponent(path)}`, title: path,
}, label || 'Open');

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
    setCrumbs([{ label: 'Set up this OS' }]);
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
      'Derived live from the repo — placeholders left, missing connections, the sync switch. This page updates as the repo changes.'),
  );

  const tabBar = el('div', { class: 'tabs' });
  const content = el('div', {});
  page.append(tabBar, content);

  let active = params.get('tab') || 'business';
  if (!TABS.some(([id]) => id === active)) active = 'business';

  function tabButton(id, label) {
    const t = tabs[id] || {};
    const counter = 'total' in t ? `${t.done}/${t.total}` : (id === 'demo' ? (t.present ? '1' : '–') : '');
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
    if (active === 'business') drawBusiness(content, tabs.business, o);
    else if (active === 'templates') drawTemplates(content, tabs.templates);
    else if (active === 'integrations') drawIntegrations(content, tabs.integrations);
    else if (active === 'autosync') drawAutosync(content, tabs.autosync);
    else drawDemo(content, tabs.demo);
  }
  draw();
}

// ---- business context -------------------------------------------------------

function drawBusiness(box, tab, o) {
  const split = el('div', { class: 'split' });
  box.append(split);
  const left = el('div', {});
  const right = el('div', {});
  split.append(left, right);

  const ctx = el('div', { class: 'card' },
    el('h3', {}, 'Population status'),
    el('div', { class: 'hint' },
      'The steering files every strategic skill reads first. A file counts as populated when no bracketed placeholders or [GAP:] markers remain.'),
  );
  for (const r of (tab && tab.items) || []) {
    ctx.append(el('div', { class: 'step' },
      pill(r.state),
      el('div', { class: 'body' },
        el('div', { class: 'title' }, r.label),
        el('div', { class: 'detail' }, r.detail)),
      r.exists ? fileLink(r.path) : cmdChip('/customize-os'),
    ));
  }
  left.append(ctx);

  if (o.customization) {
    right.append(el('div', { class: 'card' },
      el('div', { class: 'row' },
        el('h3', { class: 'grow' }, 'Customization program'),
        el('a', { class: 'btn small', href: `#/file?path=${encodeURIComponent(o.customization.path)}` }, 'Open full status')),
      el('div', { class: 'hint' }, 'Where /customize-os left off.'),
      mdRender(o.customization.text, o.customization.path),
    ));
  } else {
    right.append(el('div', { class: 'card' },
      el('h3', {}, 'The guided way'),
      el('div', { class: 'hint', style: 'margin-bottom:8px' },
        'One program walks all of this in order — context, initiatives, naming, templates, sync mode — and keeps its own resumable status:'),
      cmdChip('/customize-os'),
    ));
  }
}

// ---- templates --------------------------------------------------------------

function drawTemplates(box, tab) {
  const card = el('div', { class: 'card' },
    el('div', { class: 'row' },
      el('h3', { class: 'grow' }, 'Templates — customization'),
      el('a', { class: 'btn small quiet', href: '#/templates' }, 'Open templates')),
    el('div', { class: 'hint' },
      tab && tab.phase
        ? `The /customize-os templates target reports: ${tab.phase}. House templates are derived from your real documents.`
        : 'No house templates derived yet — /customize-os templates derives them from 2–4 of your real documents. Until then skills use the defaults below.'),
  );
  for (const t of (tab && tab.items) || []) {
    card.append(el('div', { class: 'step' },
      pill(tab.customized ? 'done' : 'todo'),
      el('div', { class: 'body' },
        el('div', { class: 'title' }, t.title),
        el('div', { class: 'detail' }, t.desc || t.name)),
      fileLink(t.path),
    ));
  }
  card.append(el('div', { class: 'step' },
    el('div', {}), el('div', { class: 'body' }), cmdChip('/customize-os templates')));
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
      'Each connection is optional — every surface has a file route that works out of the box. '
      + '"System used" is the plan until a real connection exists; once one is live the field locks to the connected tool. '
      + 'Connections are set up in Claude Code (the action buttons hand you the prompt); file storage is recorded right here.'),
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
      `Also connected (no standing surface): ${tab.other.join(', ')}.`));
  }
  box.append(card);
}

function integrationRow(r) {
  const [cls, label] = STATUS_PILLS[r.status] || ['plain', r.status];

  let sysCell;
  if (!r.systemEditable) {
    sysCell = el('span', { class: 'sys-locked', title: 'Locked — a live connection names the real system' },
      icon('lock'), r.system || '—');
  } else {
    const input = el('input', {
      class: 'system', value: r.system || '', placeholder: 'e.g. Jira',
      title: 'The tool you plan to use here — saved to toolchain.yaml (gated; saving is your approval)',
    });
    const save = async () => {
      const v = input.value.trim();
      if (v === (r.system || '')) return;
      try {
        const res = await api.post('/api/toolchain', { surface: r.key, system: v });
        toast(`Saved — ${r.type}: ${v || 'cleared'}${res.commit.committed ? ` · committed ${res.commit.sha}` : ''}`);
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
          instruction: 'Open Claude Code (the desktop app or `claude` in a terminal), start a session in this repository, paste this prompt and follow the guided setup there:',
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
    el('td', { style: 'font-weight:600; white-space:nowrap' }, r.type),
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
        'Records the file route as this team\'s standing choice, so skills use it without asking — a deliberate way of working, not a downgrade.'),
      el('div', { class: 'hint' }, r.comment),
      el('div', { class: 'hint', style: 'margin-top:6px' },
        'Written to product-development/toolchain.yaml (gated — this click is your approval). Change it any time by connecting the real tool.'),
    ),
    actions: [{
      label: 'Use file storage', kind: 'primary',
      onclick: async (close) => {
        const res = await api.post('/api/toolchain', { surface: r.key, approach: a.approach });
        toast(`${r.type}: file-based${res.commit.committed ? ` · committed ${res.commit.sha}` : ''}`);
        window.dispatchEvent(new Event('console:saved'));
        close();
        location.reload();
      },
    }],
  });
}

// ---- auto-sync --------------------------------------------------------------

function drawAutosync(box, tab) {
  const a = (tab && tab.summary) || {};
  box.append(el('div', { class: 'card' },
    el('div', { class: 'row' },
      el('h3', { class: 'grow' }, 'Auto-sync'),
      el('span', { class: `pill ${a.on ? 'ok' : 'todo'}` }, a.on ? `On — ${a.mode}` : 'Off')),
    el('div', { class: 'hint' }, a.label || ''),
    el('div', { class: 'hint', style: 'margin-top:10px' },
      'The full explanation and the mode switch live on their own page:'),
    el('a', { class: 'btn small', href: '#/autosync' }, icon('refresh'), 'Open Auto-sync'),
  ));
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
        ? 'Everything synthetic is recorded in the manifest; removal reverses it exactly:'
        : 'Synthetic, internally consistent demo content — an approved scenario run through the real pipeline. Optional; not counted in setup progress:'),
    el('div', { class: 'chips' },
      t.present ? cmdChip('/demo-data status') : null,
      t.present ? cmdChip('/demo-data remove') : cmdChip('/demo-data'),
    ),
    t.present ? el('div', { style: 'margin-top:8px' },
      el('a', { class: 'btn small quiet', href: `#/file?path=${encodeURIComponent(t.path)}` }, 'Open manifest')) : null,
  ));
}
