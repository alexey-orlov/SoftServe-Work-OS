// Proposed changes — everything waiting for a human, in one queue: open pull
// requests, the gated-change proposals inbox, health reports, weekly reviews.
import { api } from '/api.js';
import { el, icon, timeAgo, setCrumbs, spinner, cmdChip, toast } from '/ui.js';

export async function render(view) {
  view.append(spinner());
  const d = await api.get('/api/proposed');
  view.replaceChildren();
  setCrumbs([{ label: 'Proposed changes' }]);

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('h1', {}, 'Proposed changes'),
    el('div', { class: 'sub' },
      'What is waiting for a person: pull requests to review (gated files reach main only through an admin\'s approval), proposals filed by runs that could not ask, and the periodic reports worth reading.'),
  );

  const split = el('div', { class: 'split' });
  page.append(split);
  const left = el('div', {});
  const right = el('div', {});
  split.append(left, right);

  // pull requests
  const p = d.prs;
  const prCard = el('div', { class: 'card' },
    el('div', { class: 'row' },
      el('h3', { class: 'grow' }, `Pull requests waiting (${p.available ? p.items.length : '—'})`),
      p.provider !== 'none' ? el('span', { class: 'tag' }, p.provider) : null,
      el('button', {
        class: 'btn small quiet', title: 'Re-check now (list is cached for 5 minutes)',
        onclick: async (e) => {
          e.currentTarget.disabled = true;
          try { await api.get('/api/proposed?refresh=1'); location.reload(); }
          catch (err) { toast(err.message, 'err'); e.currentTarget.disabled = false; }
        },
      }, icon('refresh'), 'Re-check'),
    ),
    el('div', { class: 'hint' },
      'Open PRs on the shared repository — with a pull-request-only main, gated changes sit here until an OS-admin approves.'),
  );
  if (!p.available) {
    prCard.append(el('div', { class: 'empty' }, p.note || 'PR listing unavailable.'));
  } else if (!p.items.length) {
    prCard.append(el('div', { class: 'empty' }, 'Nothing waiting — everyday work self-merges; gated changes arrive via /propose.'));
  } else {
    for (const pr of p.items) {
      prCard.append(el('div', { class: 'art-row' },
        el('span', { class: 'val grow' },
          pr.url
            ? el('a', { href: pr.url, target: '_blank', rel: 'noopener' }, `#${pr.number} ${pr.title} `, icon('external'))
            : el('span', {}, `#${pr.number} ${pr.title}`),
          pr.draft ? el('span', { class: 'tag', style: 'margin-left:6px' }, 'draft') : null),
        el('span', { class: 'tag', title: 'author' }, pr.author),
        el('span', { style: 'color:var(--muted); font-size:12px; white-space:nowrap' }, timeAgo(pr.createdAt)),
      ));
    }
  }
  left.append(prCard);

  // proposals inbox
  left.append(el('div', { class: 'card' },
    el('h3', {}, `Proposals inbox (${d.proposals.length})`),
    el('div', { class: 'hint' }, 'Gated changes filed by runs that could not ask (headless, scheduled). Apply or reject, then delete.'),
    d.proposals.length
      ? el('div', {}, d.proposals.map((pr) => el('div', { class: 'art-row' },
        el('a', { class: 'val grow', href: `#/file?path=${encodeURIComponent(pr.path)}` }, pr.title),
        el('span', { class: 'tag' }, timeAgo(pr.mtimeMs)))))
      : el('div', { class: 'empty' }, 'Nothing waiting.'),
  ));

  // health reports
  right.append(el('div', { class: 'card' },
    el('h3', {}, `Health reports (${d.health.length})`),
    el('div', { class: 'hint' }, 'Dated /wiki-lint results — what drifted and what was fixed.'),
    d.health.length
      ? el('div', {}, d.health.slice(0, 8).map((h) => el('div', { class: 'art-row' },
        el('a', { class: 'val grow', href: `#/file?path=${encodeURIComponent(h.path)}` }, h.name),
        el('span', { class: 'tag' }, timeAgo(h.mtimeMs)))))
      : el('div', { class: 'hint', style: 'margin:0' }, 'No report yet — ', cmdChip('/wiki-lint')),
  ));

  // weekly reviews
  right.append(el('div', { class: 'card' },
    el('h3', {}, `Weekly reviews (${d.weeklyReports.length})`),
    el('div', { class: 'hint' }, 'Plan-vs-actual rollups written by /weekly-review.'),
    d.weeklyReports.length
      ? el('div', {}, d.weeklyReports.map((w) => el('div', { class: 'art-row' },
        el('a', { class: 'val grow', href: `#/file?path=${encodeURIComponent(w.path)}` }, w.name),
        el('span', { class: 'tag' }, timeAgo(w.mtimeMs)))))
      : el('div', { class: 'hint', style: 'margin:0' }, 'None yet — ', cmdChip('/weekly-review')),
  ));
}
