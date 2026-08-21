// Activity — recent repo changes as a friendly timeline, plus what's uncommitted
// right now (concurrent sessions are a reality here).
import { api } from '/api.js';
import { el, pill, timeAgo, setCrumbs, spinner } from '/ui.js';

const PREFIX_PILL = {
  context: ['info', 'context'], console: ['gate', 'console'], gated: ['gate', 'gated'],
  feat: ['ok', 'feat'], fix: ['warn', 'fix'], docs: ['plain', 'docs'], chore: ['plain', 'chore'],
};

export async function render(view) {
  view.append(spinner());
  const d = await api.get('/api/activity?limit=150');
  view.replaceChildren();
  setCrumbs([{ label: 'Activity' }]);

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('h1', {}, 'Activity'),
    el('div', { class: 'sub' }, 'Everything that changed in the wiki, newest first. Filter by area to follow one part of the OS.'),
  );

  // uncommitted
  if (d.status.uncommitted.length) {
    page.append(el('div', { class: 'card', style: 'border-color:var(--warn-ink)' },
      el('div', { class: 'row' },
        el('h3', { class: 'grow' }, `Uncommitted right now (${d.status.uncommitted.length})`),
        el('span', { class: 'tag' }, `branch ${d.status.branch}`)),
      el('div', { class: 'hint' }, 'Work in flight — possibly a Claude session mid-turn. The console commits its own saves immediately, so these are someone else\'s.'),
      el('div', {}, d.status.uncommitted.slice(0, 20).map((u) => el('div', { class: 'art-row' },
        el('span', { class: 'fstat' }, u.xy),
        el('span', { class: 'val grow path', style: 'color:var(--ink-2)' }, u.path),
        el('span', { class: 'tag' }, u.area)))),
    ));
  }

  // filters
  const areas = [...new Set(d.commits.flatMap((c) => c.files.map((f) => f.area)))].sort();
  let areaFilter = null;
  const chips = el('div', { class: 'chips', style: 'margin:16px 0 4px' });
  const allChip = el('button', { class: 'chip on', onclick: () => set(null, allChip) }, 'All areas');
  chips.append(allChip);
  for (const a of areas) {
    const c = el('button', { class: 'chip', onclick: () => set(a, c) }, a);
    chips.append(c);
  }
  const timeline = el('div', {});
  page.append(chips, timeline);

  function set(a, chipEl) {
    areaFilter = a;
    chips.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
    chipEl.classList.add('on');
    draw();
  }

  function draw() {
    timeline.replaceChildren();
    const commits = d.commits.filter((c) => !areaFilter || c.files.some((f) => f.area === areaFilter));
    let lastDay = null;
    let dayBox = null;
    for (const c of commits) {
      const day = (c.date || '').slice(0, 10);
      if (day !== lastDay) {
        lastDay = day;
        timeline.append(el('div', { class: 'day-head' }, humanDay(day)));
        dayBox = el('div', { class: 'card', style: 'padding:6px 8px' });
        timeline.append(dayBox);
      }
      const [cls, label] = PREFIX_PILL[c.prefix] || ['plain', c.prefix || '·'];
      const files = c.files.filter((f) => !areaFilter || f.area === areaFilter);
      const fileList = el('ul', { class: 'commit-files', style: 'display:none' },
        files.slice(0, 40).map((f) => el('li', {},
          el('span', { class: 'fstat' }, f.status),
          el('a', { class: 'path', style: 'color:var(--accent-ink)', href: `#/file?path=${encodeURIComponent(f.path)}` }, f.path),
          el('span', { class: 'tag' }, f.area))));
      const sum = el('div', {
        class: 'files-sum',
        onclick: () => { fileList.style.display = fileList.style.display === 'none' ? '' : 'none'; },
      }, `${files.length} file${files.length === 1 ? '' : 's'} · ${[...new Set(files.map((f) => f.area))].slice(0, 5).join(', ')}`);
      dayBox.append(el('div', { class: 'commit' },
        el('span', { class: 'time' }, (c.date || '').slice(11, 16)),
        el('span', { class: 'badge' }, el('span', { class: `pill ${cls}` }, label)),
        el('div', { class: 'msg grow' },
          el('div', { class: 'subject' }, c.subject.replace(/^[a-z]+(\([^)]*\))?!?:\s*/i, '')),
          sum, fileList),
        el('span', { class: 'tag', title: c.author }, c.sha),
      ));
    }
    if (!commits.length) timeline.append(el('div', { class: 'empty' }, 'No commits match.'));
  }

  page.append(el('div', { class: 'card', style: 'margin-top:18px' },
    el('div', { class: 'row' },
      el('h3', { class: 'grow' }, 'Ingestion ledger'),
      el('a', { class: 'btn small', href: `#/file?path=${encodeURIComponent(d.ledger.path)}` }, 'Open')),
    el('div', { class: 'hint', style: 'margin:0' },
      `${d.ledger.count} artifact${d.ledger.count === 1 ? '' : 's'} folded into the wiki so far (transcripts, documents, threads processed by /context-update and /process-meeting).`),
  ));

  draw();
}

function humanDay(day) {
  if (!day) return '—';
  const today = new Date().toISOString().slice(0, 10);
  const yest = new Date(Date.now() - 86400e3).toISOString().slice(0, 10);
  if (day === today) return 'Today';
  if (day === yest) return 'Yesterday';
  return day;
}
