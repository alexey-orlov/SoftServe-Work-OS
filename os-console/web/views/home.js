// Home — setup & health dashboard. Every signal derived from repo state.
import { api, getState } from '/api.js';
import { el, pill, cmdChip, meter, timeAgo, setCrumbs, spinner, mdRender, icon } from '/ui.js';

export async function render(view) {
  view.append(spinner());
  const o = await api.get('/api/overview');
  view.replaceChildren();
  setCrumbs([{ label: 'Home' }]);

  const page = el('div', { class: 'page' });
  view.append(page);

  // hero
  page.append(el('div', { class: 'row wrap', style: 'margin-bottom:18px' },
    el('div', { class: 'grow' },
      el('h1', {}, o.product.name ? `${o.product.name} — Team OS` : 'Your Work OS'),
      el('div', { class: 'sub', style: 'margin:0' },
        o.product.name ? o.product.line : 'The shared knowledge base, seen from above. Finish setup below — each step is a guided program you run in Claude Code.'),
    ),
    el('div', { class: 'row' },
      el('span', { class: `pill ${o.autoSync.on ? 'ok' : 'todo'}`, title: o.autoSync.label },
        o.autoSync.on ? `Auto-sync: ${o.autoSync.mode}` : 'Auto-sync off'),
      el('span', { class: 'tag' }, `${o.git.branch}${o.git.dirty ? ` · ${o.git.dirty} uncommitted` : ''}`),
    ),
  ));

  // stat tiles
  page.append(el('div', { class: 'tiles', style: 'margin-bottom:14px' },
    tile(o.counts.initiatives, 'Active initiatives', '#/initiatives'),
    tile(o.counts.accounts, 'Customer accounts', '#/library?path=product-development%2Fproduct%2Fcustomers%2Faccounts'),
    tile(o.counts.mcps, 'Tools connected', '#/governance'),
    tile(o.counts.learnings, 'Team learnings', '#/learnings'),
    tile(o.counts.proposals, 'Proposals waiting', '#/governance'),
  ));

  const split = el('div', { class: 'split' });
  page.append(split);
  const left = el('div', {});
  const right = el('div', {});
  split.append(left, right);

  // setup card
  const doneAll = o.progress.done === o.progress.total;
  const setup = el('div', { class: 'card' },
    el('div', { class: 'row', style: 'margin-bottom:10px' },
      el('h3', { class: 'grow' }, doneAll ? 'Setup — complete' : 'Set up this OS'),
      meter(o.progress.done, o.progress.total),
    ),
    el('div', { class: 'hint' }, 'Derived live from the repo — placeholders left, undecided choices, missing state files. Copy a command and run it in Claude Code; this page updates as the repo changes.'),
  );
  for (const s of o.steps) {
    setup.append(el('div', { class: 'step' },
      pill(s.state),
      el('div', { class: 'body' },
        el('div', { class: 'title' }, s.title),
        el('div', { class: 'detail' }, s.detail)),
      s.command && s.state !== 'done' ? cmdChip(s.command) : null,
    ));
  }
  left.append(setup);

  if (o.customization) {
    left.append(el('div', { class: 'card' },
      el('div', { class: 'row' },
        el('h3', { class: 'grow' }, 'Customization program'),
        el('a', { class: 'btn small', href: `#/file?path=${encodeURIComponent(o.customization.path)}` }, 'Open full status')),
      el('div', { class: 'hint' }, 'Where /customize-os left off.'),
      mdRender(o.customization.text, o.customization.path),
    ));
  }

  // pinned + recents
  const st = getState();
  if (st.pins.length) {
    right.append(el('div', { class: 'card' },
      el('h3', {}, 'Pinned'),
      ...st.pins.slice(0, 10).map((p) => pinRow(p)),
    ));
  }
  if (st.recents.length) {
    right.append(el('div', { class: 'card' },
      el('h3', {}, 'Recently opened'),
      ...st.recents.slice(0, 9).map((r) =>
        el('div', { class: 'row', style: 'padding:4px 0; min-width:0' },
          icon('file'),
          el('a', { class: 'grow', href: `#/file?path=${encodeURIComponent(r.path)}`, style: 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap' },
            r.title || r.path.split('/').pop()),
        )),
    ));
  }
  right.append(el('div', { class: 'card' },
    el('h3', {}, 'Last commit'),
    o.git.lastCommit
      ? el('div', {},
        el('div', { style: 'font-weight:550' }, o.git.lastCommit.subject),
        el('div', { class: 'hint', style: 'margin:4px 0 0' }, `${o.git.lastCommit.sha} · ${timeAgo(o.git.lastCommit.date)}`),
        el('a', { class: 'btn small', href: '#/activity', style: 'margin-top:10px' }, 'All activity'))
      : el('div', { class: 'hint' }, 'No history.'),
  ));
}

function tile(n, label, href) {
  return el('a', { class: 'tile', href },
    el('div', { class: 'n' }, String(n)),
    el('div', { class: 't' }, label));
}

function pinRow(p) {
  const isInit = p.startsWith('initiative:');
  const target = isInit ? `#/initiative?slug=${encodeURIComponent(p.slice(11))}` : `#/file?path=${encodeURIComponent(p)}`;
  const label = isInit ? p.slice(11) : p.split('/').pop();
  return el('div', { class: 'row', style: 'padding:4px 0' },
    icon(isInit ? 'flag' : 'file'),
    el('a', { class: 'grow', href: target, style: 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }, label));
}
