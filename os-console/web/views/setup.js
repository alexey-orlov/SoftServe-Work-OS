// Set up this OS — the full setup checklist, moved out of Home (Home keeps a
// compact progress widget). Every signal derived live from repo state.
import { api } from '/api.js';
import { el, pill, cmdChip, meter, setCrumbs, spinner, mdRender } from '/ui.js';

export async function render(view) {
  view.append(spinner());
  const o = await api.get('/api/overview');
  view.replaceChildren();
  setCrumbs([{ label: 'Set up this OS' }]);

  const page = el('div', { class: 'page' });
  view.append(page);

  const doneAll = o.progress.done === o.progress.total;
  page.append(
    el('div', { class: 'row wrap', style: 'margin-bottom:4px' },
      el('h1', { class: 'grow', style: 'margin:0' }, doneAll ? 'Setup — complete' : 'Set up this OS'),
      el('div', { style: 'width:220px' }, meter(o.progress.done, o.progress.total)),
    ),
    el('div', { class: 'sub' },
      'Derived live from the repo — placeholders left, undecided choices, missing state files. Copy a command and run it in Claude Code; this page updates as the repo changes.'),
  );

  const split = el('div', { class: 'split' });
  page.append(split);
  const left = el('div', {});
  const right = el('div', {});
  split.append(left, right);

  const steps = el('div', { class: 'card' });
  for (const s of o.steps) {
    steps.append(el('div', { class: 'step' },
      pill(s.state),
      el('div', { class: 'body' },
        el('div', { class: 'title' }, s.title),
        el('div', { class: 'detail' }, s.detail)),
      s.command && s.state !== 'done' ? cmdChip(s.command) : null,
    ));
  }
  left.append(steps);

  // toolchain — the org's standing choices, one per workflow surface
  const SURFACE_LABELS = {
    prototyping: ['Prototyping', 'Where prototypes get their design grounding'],
    'user-research': ['User research', 'Where research and meeting records come from'],
  };
  if (o.toolchain && o.toolchain.length) {
    const tcCard = el('div', { class: 'card' },
      el('div', { class: 'row' },
        el('h3', { class: 'grow' }, 'Toolchain — standing choices'),
        el('a', {
          class: 'btn small quiet', href: `#/file?path=${encodeURIComponent('product-development/toolchain.yaml')}`,
          title: 'The registry behind this block (gated)',
        }, 'toolchain.yaml')),
      el('div', { class: 'hint' },
        'One choice per workflow surface — skills route by these instead of re-asking. Re-running the /customize-os target changes a choice the same way it was made.'),
    );
    for (const t of o.toolchain) {
      const [label, sub] = SURFACE_LABELS[t.surface] || [t.surface, ''];
      tcCard.append(el('div', { class: 'step' },
        t.decided ? pill('done') : pill('todo'),
        el('div', { class: 'body' },
          el('div', { class: 'title' }, label, ' — ',
            el('span', { style: t.decided ? 'color:var(--accent-ink)' : 'color:var(--muted); font-weight:480' }, t.choice)),
          el('div', { class: 'detail' },
            sub,
            t.decidedDate ? ` · decided ${t.decidedDate}` : '',
            t.notes ? ` · ${t.notes}` : '',
            t.params ? ` · ${Object.entries(t.params).map(([k, v]) => `${k}: ${v}`).join(', ')}` : '')),
        cmdChip(t.command),
      ));
    }
    left.append(tcCard);
  }

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
