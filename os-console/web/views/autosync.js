// Auto-sync — what it is in plain language, the current mode, and a one-click
// switch. The server performs the same flip the /auto-sync skill does (same
// switches, same guards); every failure path shows the reason and hands off to
// Claude Code. Light mode shows everything but locks the switch.
import { api } from '/api.js';
import { el, pill, setCrumbs, spinner, toast, modal, promptModal, cmdChip, LITE, liteLock } from '/ui.js';

const MODES = [
  {
    id: 'off', title: 'Off',
    what: 'Nothing is committed or pushed automatically. You (or a Claude session, when you ask) commit and push by hand.',
    fit: 'Good while you are still setting the OS up, or if you prefer full manual control of git.',
  },
  {
    id: 'direct', title: 'On — direct',
    what: "After every working turn, everyday files are committed and pushed to the shared main branch automatically. Protected (gated) files are the exception: they are held back for you to land deliberately, so nothing important changes without a person behind it.",
    fit: 'Good for small teams where main is open — everyone sees everyone\'s work within minutes, no ceremony.',
  },
  {
    id: 'pr', title: 'On — pull requests',
    what: 'You work on your own branch. Everyday work flows to main through small pull requests that merge themselves; protected (gated) files reach main only through a pull request an OS admin approves.',
    fit: 'Good when main is set to pull-request-only on the server — the admin approval on protected files is enforced by the platform itself.',
  },
];

export async function render(view) {
  view.append(spinner());
  const d = await api.get('/api/governance');
  view.replaceChildren();
  setCrumbs([{ label: 'Auto-sync' }]);

  const a = d.autoSync;
  const current = a.on ? a.mode : 'off';

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('div', { class: 'row wrap', style: 'margin-bottom:4px' },
      el('h1', { class: 'grow', style: 'margin:0' }, 'Auto-sync'),
      el('span', { class: `pill ${a.on ? 'ok' : 'todo'}` }, a.on ? `On — ${a.mode}` : 'Off')),
    el('div', { class: 'sub' },
      'Auto-sync is the hands-off git flow: it decides whether the work Claude and the console produce lands in the shared repository by itself, and how. Protected (gated) files always need a person — auto-sync never lands those alone.'),
  );

  const split = el('div', { class: 'split' });
  page.append(split);
  const left = el('div', {});
  const right = el('div', {});
  split.append(left, right);

  // ---- the three modes, current one marked, switchable ----
  const modesCard = el('div', { class: 'card' },
    el('h3', {}, 'Modes'),
    el('div', { class: 'hint' },
      LITE ? 'Switching modes needs the full console (or /auto-sync in Claude Code).'
        : 'Switching applies the same change the /auto-sync program makes — one click, committed and pushed for you.'));
  for (const m of MODES) {
    const isCurrent = m.id === current;
    const btn = el('button', {
      class: `btn small ${isCurrent ? 'quiet' : 'primary'}`,
      disabled: isCurrent,
      onclick: () => switchModal(m, a),
    }, isCurrent ? 'Current mode' : `Switch to ${m.title.toLowerCase()}`);
    modesCard.append(el('div', { class: 'step' },
      isCurrent ? pill('done', 'Now') : el('span', { class: 'pill plain' }, ' '),
      el('div', { class: 'body' },
        el('div', { class: 'title' }, m.title),
        el('div', { class: 'detail' }, m.what),
        el('div', { class: 'detail', style: 'margin-top:3px; color:var(--muted)' }, m.fit)),
      LITE ? liteLock(btn, 'Switching modes needs the full console — or copy /auto-sync into Claude Code') : btn,
    ));
  }
  if (LITE) {
    modesCard.append(el('div', { class: 'hint', style: 'margin-top:8px' },
      'From Claude Code instead: ', cmdChip('/auto-sync on direct'), ' ', cmdChip('/auto-sync on pr'), ' ', cmdChip('/auto-sync off')));
  }
  left.append(modesCard);

  // ---- current detail ----
  right.append(el('div', { class: 'card' },
    el('h3', {}, 'Right now'),
    el('div', { class: 'hint' }, a.label),
    el('dl', { class: 'kv' },
      el('dt', {}, 'Push to origin'), el('dd', {}, a.push ? 'yes' : 'no'),
      el('dt', {}, 'Target branch'), el('dd', {}, a.targetBranch),
      el('dt', {}, 'Commit scope'), el('dd', {}, a.scope),
      el('dt', {}, 'Message prefix'), el('dd', {}, a.messagePrefix),
    ),
  ));

  right.append(el('div', { class: 'card' },
    el('h3', {}, 'What stays protected'),
    el('div', { class: 'hint' },
      `Whatever the mode, the ${d.gated.length} gated rules hold: those files change only with a person's yes, and automation never lands them on ${a.targetBranch} alone. `,
      el('a', { href: '#/governance' }, 'Manage the gated list'), '.'),
  ));
}

function switchModal(m, a) {
  const consequences = {
    off: 'Automatic commits and pushes stop. Work stays local until someone commits it.',
    direct: `Every turn will commit and push everyday work to ${a.targetBranch}. Gated files are held for a person.`,
    pr: `Everyday work will flow to ${a.targetBranch} via self-merging pull requests; gated files via /propose + admin approval. Requires ${a.targetBranch} to be pull-request-only on the server to be fully enforced.`,
  };
  modal({
    title: `Switch auto-sync — ${m.title}`,
    body: el('div', {},
      el('div', { style: 'font-size:13.5px; margin-bottom:8px' }, m.what),
      el('div', { class: 'hint' }, consequences[m.id]),
      el('div', { class: 'hint', style: 'margin-top:6px' },
        'This edits the settings block of governance/write-policy.yaml (a gated file — this click is your approval), commits, and pushes.'),
    ),
    actions: [{
      label: `Switch to ${m.title.toLowerCase()}`, kind: 'primary',
      onclick: async (close) => {
        const r = await api.post('/api/autosync', { mode: m.id });
        close();
        if (!r.ok) {
          // Guard-blocked or commit-failed — either way, show the reasons.
          modal({
            title: r.blocked ? 'Not switched — needs attention first' : 'Not switched — the change did not commit',
            body: el('div', {},
              el('div', { class: 'hint', style: 'margin-bottom:6px' },
                r.blocked ? 'The same guards the /auto-sync program applies:' : 'What went wrong:'),
              ...(r.reasons || ['Unknown failure']).map((x) => el('div', { class: 'step' }, pill('todo', '!'), el('div', { class: 'body' }, el('div', { class: 'detail' }, x)))),
              el('div', { class: 'hint', style: 'margin-top:8px' }, 'Sort it out in Claude Code instead:'),
              el('div', { class: 'chips' }, cmdChip(`/auto-sync ${m.id === 'off' ? 'off' : `on ${m.id}`}`)),
            ),
          });
          return;
        }
        const pushPending = r.push && !r.push.pushed;
        toast(`Auto-sync: ${r.autoSync.on ? `on (${r.autoSync.mode})` : 'off'}${pushPending ? ` — ${r.push.note}` : ''}`);
        window.dispatchEvent(new Event('console:saved'));
        if (pushPending) {
          // Leave the hand-off prompt on screen — no auto-reload over it; the
          // live-refresh loop catches the page up once the modal closes.
          promptModal({
            title: 'Switched locally — landing needs a hand',
            prompt: `/auto-sync ${m.id === 'off' ? 'off' : `on ${m.id}`}`,
            instruction: `The mode is switched and committed locally, but: ${r.push.note}. Run this in Claude Code to finish the landing:`,
          });
        } else {
          setTimeout(() => location.reload(), 400);
        }
      },
    }],
  });
}
