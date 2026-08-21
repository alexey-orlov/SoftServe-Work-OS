// Editor — split markdown editor with tier awareness. Saving commits immediately
// (console: prefix). For gated files the save itself is the human approval; the
// bar says so instead of interrupting with a second dialog.
import { api } from '/api.js';
import { el, icon, tierPill, mdRender, toast, setCrumbs, spinner, modal } from '/ui.js';

export async function render(view, params) {
  const path = params.get('path') || '';
  const isNew = params.get('new') === '1';
  view.append(spinner());

  let f = { path, content: '', mtimeMs: null, tier: 'auto', tierNote: null, isText: true };
  if (!isNew) {
    try { f = await api.get(`/api/file?path=${encodeURIComponent(path)}`); }
    catch (e) {
      view.replaceChildren(el('div', { class: 'page' }, el('div', { class: 'card' }, el('h3', {}, 'Cannot edit'), el('div', { class: 'hint' }, e.message))));
      return;
    }
    if (!f.isText) {
      view.replaceChildren(el('div', { class: 'page' }, el('div', { class: 'card' }, el('div', { class: 'empty' }, 'Not a text file.'))));
      return;
    }
  }
  view.replaceChildren();
  setCrumbs([{ label: 'Editor' }, { label: path.split('/').pop() }]);

  let baseMtimeMs = f.mtimeMs;
  let dirty = false;
  let mode = path.endsWith('.md') ? 'split' : 'edit';

  const ta = el('textarea', { spellcheck: 'false' });
  ta.value = f.content || '';
  const preview = el('div', { class: 'editor-preview' });
  const dirtyDot = el('span', { class: 'dirty-dot', style: 'display:none' });
  const saveBtn = el('button', { class: 'btn primary small', onclick: save }, 'Save', el('span', { class: 'mono', style: 'opacity:.7;font-size:10px' }, '⌘S'));

  const gatedNote = f.tier === 'gated'
    ? el('span', { class: 'hint', style: 'margin:0' }, 'Gated steering file — saving from the console is your approval.')
    : null;

  const bar = el('div', { class: 'editor-bar' },
    el('a', { class: 'btn quiet small', href: `#/file?path=${encodeURIComponent(path)}` }, icon('back'), 'Back'),
    el('span', { class: 'path grow' }, path, ' ', dirtyDot),
    tierPill(f.tier),
    gatedNote,
    modeBtn('edit', 'Edit'), modeBtn('split', 'Split'), modeBtn('preview', 'Preview'),
    saveBtn,
  );

  const body = el('div', { class: 'editor-body' }, ta, preview);
  view.append(el('div', { class: 'editor-page' }, bar, body));

  function modeBtn(m, label) {
    const b = el('button', { class: `btn quiet small mode-${m}`, onclick: () => { mode = m; applyMode(); } }, label);
    return b;
  }
  function applyMode() {
    ta.style.display = mode === 'preview' ? 'none' : '';
    preview.style.display = mode === 'edit' ? 'none' : '';
    bar.querySelectorAll('[class*="mode-"]').forEach((b) => {
      b.classList.toggle('primary', b.className.includes(`mode-${mode}`));
      b.classList.toggle('quiet', !b.className.includes(`mode-${mode}`));
    });
    if (mode !== 'edit') renderPreview();
  }
  let previewTimer = null;
  function renderPreview() {
    preview.replaceChildren(path.endsWith('.md')
      ? mdRender(ta.value, path)
      : el('pre', { class: 'raw', style: 'border:0;background:none;margin:0' }, ta.value));
  }
  ta.addEventListener('input', () => {
    if (!dirty) { dirty = true; dirtyDot.style.display = ''; }
    if (mode !== 'edit') { clearTimeout(previewTimer); previewTimer = setTimeout(renderPreview, 300); }
  });

  async function save() {
    try {
      const r = await api.put('/api/file', { path, content: ta.value, baseMtimeMs });
      baseMtimeMs = r.mtimeMs;
      dirty = false;
      dirtyDot.style.display = 'none';
      const bits = [r.commit.committed ? `committed ${r.commit.sha}` : r.commit.note,
        r.push.pushed ? r.push.note : null].filter(Boolean);
      toast(`Saved${r.tier === 'gated' ? ' (gated — your approval)' : ''} · ${bits.join(' · ')}`);
      window.dispatchEvent(new Event('console:saved'));
    } catch (e) {
      if (e.status === 409) return conflictModal();
      toast(e.message, 'err');
    }
  }

  function conflictModal() {
    modal({
      title: 'File changed on disk',
      body: el('div', {},
        el('p', {}, 'Someone — probably a Claude session — changed this file while you were editing. Your version was NOT saved.'),
        el('p', { class: 'hint' }, 'Reload to see the latest (your edits here are lost), or copy your text out first and merge by hand.')),
      actions: [
        { label: 'Keep editing', onclick: (close) => close() },
        { label: 'Reload latest', kind: 'primary', onclick: () => location.reload() },
      ],
    });
  }

  document.addEventListener('keydown', function onKey(e) {
    if (!document.body.contains(ta)) { document.removeEventListener('keydown', onKey); return; }
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); save(); }
  });

  applyMode();
  ta.focus();
}
