// Team learnings — the cross-cutting agent rules injected at every session start.
import { api } from '/api.js';
import { el, icon, toast, timeAgo, setCrumbs, spinner, meter, tierPill, LITE, liteLock } from '/ui.js';

export async function render(view) {
  view.append(spinner());
  const d = await api.get('/api/learnings');
  view.replaceChildren();
  setCrumbs([{ label: 'Learnings' }]);

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('h1', {}, 'Team learnings'),
    el('div', { class: 'sub' },
      'Rules for how agents must behave in this repo — corrections that should never recur. Injected into every session start, so the list is a context tax: keep it short, prune the weakest when adding.'),
  );

  if (!d.exists) {
    page.append(el('div', { class: 'card' }, el('div', { class: 'empty' }, `${d.path} is missing.`)));
    return;
  }

  const split = el('div', { class: 'split' });
  page.append(split);
  const left = el('div', {});
  const right = el('div', {});
  split.append(left, right);

  const listCard = el('div', { class: 'card' },
    el('div', { class: 'row', style: 'margin-bottom:6px' },
      el('h3', { class: 'grow' }, `Entries (${d.entries.length})`),
      d.seedNote ? el('span', { class: 'tag' }, 'still the seed examples') : null),
  );
  if (!d.entries.length) listCard.append(el('div', { class: 'empty' }, 'No entries yet.'));
  for (const e of d.entries) {
    listCard.append(el('div', { class: 'learning' },
      el('span', { class: 'date' }, e.date || '—'),
      el('div', { class: 'grow' }, e.text)));
  }
  left.append(listCard);

  // add form
  const input = el('textarea', { rows: 2, placeholder: 'One line: the rule, plus (why) if not obvious. Generalize to the root cause, not the instance.' });
  right.append(el('div', { class: 'card' },
    el('div', { class: 'row', style: 'margin-bottom:8px' }, el('h3', { class: 'grow' }, 'Add a learning'), tierPill('gated')),
    el('div', { class: 'field' }, input),
    el('div', { class: 'hint' }, 'Appends a dated entry and commits — the gated save is your approval. Near the cap? Prune the weakest entry first (Edit raw).'),
    el('div', { class: 'row' },
      (() => {
        const b = el('button', {
          class: 'btn primary', onclick: async (ev) => {
            const btn = ev.currentTarget;
            btn.disabled = true;
            try {
              const r = await api.post('/api/learnings', { text: input.value });
              toast('Added ✓');
              window.dispatchEvent(new Event('console:saved'));
              location.reload();
            } catch (e) { toast(e.message, 'err'); btn.disabled = false; }
          },
        }, icon('plus'), 'Add entry');
        return LITE ? liteLock(b) : b;
      })(),
      el('a', { class: 'btn', href: `#/edit?path=${encodeURIComponent(d.path)}` }, icon('edit'), 'Edit raw'),
    ),
  ));

  right.append(el('div', { class: 'card' },
    el('h3', {}, 'Context budget'),
    meter(Math.min(d.entries.length, d.capLines), d.capLines, `${d.entries.length} of ~${d.capLines}`),
    el('div', { class: 'hint', style: 'margin:10px 0 0' },
      'The file\'s own hard cap. Skill-specific rules belong in that skill\'s self-check, not here — this list is for cross-cutting rules only.'),
  ));
}
