// Set up this OS — four blocks, every signal derived live from repo state:
// business-context population per steering file, templates customization,
// the six integration surfaces, and the auto-sync switch.
import { api } from '/api.js';
import { el, pill, cmdChip, meter, setCrumbs, spinner, mdRender } from '/ui.js';

const fileLink = (path, label) => el('a', {
  class: 'btn small quiet', href: `#/file?path=${encodeURIComponent(path)}`, title: path,
}, label || 'Open');

export async function render(view) {
  view.append(spinner());
  const o = await api.get('/api/overview');
  view.replaceChildren();
  setCrumbs([{ label: 'Set up this OS' }]);

  const s = o.setup || { steering: [], templates: { items: [] }, integrations: { items: [], other: [] } };

  // page-level progress across the four blocks
  const rows = [
    ...s.steering.map((r) => r.state),
    ...s.integrations.items.map((r) => r.state),
    o.autoSync.on ? 'done' : 'todo',
  ];
  const done = rows.filter((x) => x === 'done').length;

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('div', { class: 'row wrap', style: 'margin-bottom:4px' },
      el('h1', { class: 'grow', style: 'margin:0' }, done === rows.length ? 'Setup — complete' : 'Set up this OS'),
      el('div', { style: 'width:220px' }, meter(done, rows.length)),
    ),
    el('div', { class: 'sub' },
      'Derived live from the repo — placeholders left, missing connections, the sync switch. Copy a command and run it in Claude Code; this page updates as the repo changes.'),
  );

  const split = el('div', { class: 'split' });
  page.append(split);
  const left = el('div', {});
  const right = el('div', {});
  split.append(left, right);

  // ---- 1 · business context population, per steering file -------------------
  const ctx = el('div', { class: 'card' },
    el('h3', {}, 'Business context — population status'),
    el('div', { class: 'hint' },
      'The steering files every strategic skill reads first. A file counts as populated when no bracketed placeholders or [GAP:] markers remain.'),
  );
  for (const r of s.steering) {
    ctx.append(el('div', { class: 'step' },
      pill(r.state),
      el('div', { class: 'body' },
        el('div', { class: 'title' }, r.label),
        el('div', { class: 'detail' }, r.detail)),
      r.exists ? fileLink(r.path) : cmdChip('/customize-os'),
    ));
  }
  left.append(ctx);

  // ---- 2 · templates customization ------------------------------------------
  const tpl = el('div', { class: 'card' },
    el('div', { class: 'row' },
      el('h3', { class: 'grow' }, 'Templates — customization'),
      el('a', { class: 'btn small quiet', href: '#/templates' }, 'Open templates')),
    el('div', { class: 'hint' },
      s.templates.phase
        ? `The /customize-os templates target reports: ${s.templates.phase}. House templates are derived from your real documents.`
        : 'No house templates derived yet — /customize-os templates derives them from 2–4 of your real documents. Until then skills use the SoftServe defaults below.'),
  );
  for (const t of s.templates.items) {
    tpl.append(el('div', { class: 'step' },
      pill(s.templates.phase && /installed|complete/i.test(s.templates.phase) ? 'done' : 'todo'),
      el('div', { class: 'body' },
        el('div', { class: 'title' }, t.title),
        el('div', { class: 'detail' }, t.desc || t.name)),
      fileLink(t.path),
    ));
  }
  tpl.append(el('div', { class: 'step' },
    el('div', {}), el('div', { class: 'body' }), cmdChip('/customize-os templates')));
  left.append(tpl);

  // ---- 3 · integrations ------------------------------------------------------
  const integ = el('div', { class: 'card' },
    el('h3', {}, 'Integrations'),
    el('div', { class: 'hint' },
      'Live connections skills read instead of exports. Each is optional; connect them one at a time, whenever ready.'),
  );
  for (const r of s.integrations.items) {
    // command chip goes under the text — a third column would crush the narrow card
    integ.append(el('div', { class: 'step' },
      pill(r.state),
      el('div', { class: 'body' },
        el('div', { class: 'title' }, r.label),
        el('div', { class: 'detail' }, r.detail),
        r.state === 'done' ? null : el('div', { style: 'margin-top:4px' }, cmdChip(r.command))),
    ));
  }
  if (s.integrations.other && s.integrations.other.length) {
    integ.append(el('div', { class: 'hint', style: 'margin-top:6px' },
      `Also connected: ${s.integrations.other.join(', ')}.`));
  }
  right.append(integ);

  // ---- 4 · auto-sync ---------------------------------------------------------
  right.append(el('div', { class: 'card' },
    el('h3', {}, 'Auto-sync'),
    el('div', { class: 'step' },
      pill(o.autoSync.on ? 'done' : 'todo'),
      el('div', { class: 'body' },
        el('div', { class: 'title' }, o.autoSync.on ? `On — ${o.autoSync.mode} mode` : 'Off'),
        el('div', { class: 'detail' }, o.autoSync.label || '')),
      o.autoSync.on ? null : cmdChip('/auto-sync on direct'),
    ),
  ));

  // ---- customization program status (the resume point) ----------------------
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
