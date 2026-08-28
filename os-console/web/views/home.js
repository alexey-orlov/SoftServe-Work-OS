// Home — the OS at a glance: live counts, setup progress widget, activity
// leaders, pins and recents. The full setup checklist lives in #/setup.
import { api, getState } from '/api.js';
import { el, meter, timeAgo, setCrumbs, spinner, icon } from '/ui.js';
import { currentModeLabel } from '/views/autosync.js';

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
        o.product.name ? o.product.line : 'The shared knowledge base, seen from above.'),
    ),
    el('div', { class: 'row' },
      el('span', { class: `pill ${o.autoSync.on ? 'ok' : 'todo'}` },
        `Auto-sync: ${currentModeLabel(o.autoSync).toLowerCase()}`),
      o.git.dirty ? el('span', { class: 'tag' }, `${o.git.dirty} change${o.git.dirty > 1 ? 's' : ''} not yet shared`) : null,
    ),
  ));

  // stat tiles — the proposed count arrives async (it may shell the platform CLI)
  const prTileN = el('div', { class: 'n' }, '…');
  page.append(el('div', { class: 'tiles', style: 'margin-bottom:14px' },
    tile(o.counts.initiatives, 'Active initiatives', '#/initiatives'),
    tile(o.counts.accounts, 'Customer accounts', '#/library?path=product-development%2Fproduct%2Fcustomers%2Faccounts'),
    tile(o.counts.mcps, 'Tools connected', '#/setup?tab=integrations'),
    tile(o.counts.learnings, 'Team learnings', '#/learnings'),
    el('a', { class: 'tile', href: '#/proposed' }, prTileN, el('div', { class: 't' }, 'Proposed changes')),
  ));

  const split = el('div', { class: 'split' });
  page.append(split);
  const left = el('div', {});
  const right = el('div', {});
  split.append(left, right);

  // setup progress widget — the checklist itself lives in #/setup
  const doneAll = o.progress.done === o.progress.total;
  left.append(el('div', { class: 'card' },
    el('div', { class: 'row', style: 'margin-bottom:8px' },
      el('h3', { class: 'grow' }, 'Set up this OS'),
      doneAll ? el('span', { class: 'pill ok' }, 'Complete') : null),
    meter(o.progress.done, o.progress.total, `${o.progress.done} of ${o.progress.total} steps completed`),
    el('div', { class: 'row', style: 'margin-top:12px' },
      el('div', { class: 'hint grow', style: 'margin:0' },
        doneAll ? 'Everything checks out.' : 'Every remaining step is guided — most run in Claude Code, and the switches can be flipped right on the Setup page.'),
      el('a', { class: 'btn small', href: '#/setup' }, doneAll ? 'Review' : 'Continue setup'),
    ),
  ));

  // Activity leaders — humans, by changes each person authored; loads async
  const leadersHint = 'People only (bots filtered), by changes landed on the shared workspace — credited to whoever made the change, not who approved it.';
  const leadersCard = el('div', { class: 'card' },
    el('h3', {}, 'Most active'),
    el('div', { class: 'hint' }, leadersHint),
    el('div', { class: 'spin', style: 'padding:14px' }, 'Reading the history…'),
  );
  left.append(leadersCard);

  // pinned + recents + latest change
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
          el('a', { class: 'grow trunc', href: `#/file?path=${encodeURIComponent(r.path)}` },
            r.title || r.path.split('/').pop()),
        )),
    ));
  }
  right.append(el('div', { class: 'card' },
    el('h3', {}, 'Latest change'),
    o.git.lastCommit
      ? el('div', {},
        el('div', { style: 'font-weight:550' }, o.git.lastCommit.subject),
        el('div', { class: 'hint', style: 'margin:4px 0 0' }, timeAgo(o.git.lastCommit.date)),
        el('a', { class: 'btn small', href: '#/activity', style: 'margin-top:10px' }, 'All activity'))
      : el('div', { class: 'hint' }, 'No changes yet.'),
  ));

  // async fills (never block first paint; ignore failures — tiles stay honest)
  api.get('/api/proposed').then((d) => {
    prTileN.textContent = d.prs.available ? String(d.prs.items.length) : '—';
    if (!d.prs.available) prTileN.title = d.prs.note || '';
  }).catch(() => { prTileN.textContent = '—'; });

  api.get('/api/leaders').then((L) => {
    const body = [];
    if (!L.available) {
      body.push(el('div', { class: 'hint', style: 'margin:0' }, L.note || 'History not available.'));
    } else if (!L.week.length && !L.month.length) {
      body.push(el('div', { class: 'hint', style: 'margin:0' }, 'No changes landed in the last 30 days.'));
    } else {
      body.push(el('div', { class: 'grid cols-2' },
        leaderCol('This week', L.week),
        leaderCol('This month', L.month)));
    }
    leadersCard.replaceChildren(
      el('h3', {}, 'Most active'),
      el('div', { class: 'hint' }, leadersHint),
      ...body);
  }).catch(() => {
    leadersCard.querySelector('.spin').textContent = 'Leaderboard unavailable.';
  });
}

function leaderCol(title, rows) {
  return el('div', {},
    el('div', { class: 'subgroup', style: 'margin-top:2px' }, title),
    rows.length
      ? el('div', {}, rows.map((r, i) => el('div', { class: 'leader' },
        el('span', { style: 'color:var(--muted); width:16px' }, `${i + 1}.`),
        el('span', {}, r.login),
        el('span', { class: 'n' }, String(r.count)))))
      : el('div', { class: 'hint', style: 'margin:0' }, 'No changes.'));
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
    el('a', { class: 'grow trunc', href: target }, label));
}
