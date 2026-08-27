// Auto-sync — written for a PM, not a git user: what gets shared with the team
// by itself, what waits for a person, and a one-click switch. The server
// performs the same flip the /auto-sync program does (same switches, same
// guards); every failure shows a plain-language reason and hands off to
// Claude Code. Light mode shows everything but locks the switch.
// buildModesCard is shared with the Setup page's Auto-sync tab.
import { api } from '/api.js';
import { el, pill, setCrumbs, spinner, toast, modal, promptModal, cmdChip, LITE, liteLock } from '/ui.js';

const MODES = [
  {
    id: 'off', title: 'Off — share by hand', tag: null,
    what: 'Nothing is shared automatically. Your and Claude\'s work stays on your computer until you ask Claude to share it with the team.',
    fit: 'Fine while you are still setting the Work OS up, or if you want to look everything over before the team sees it.',
  },
  {
    id: 'direct', title: 'On — shared right away', tag: 'direct',
    what: 'Every time Claude finishes a piece of work, the everyday files reach the whole team automatically — usually within a minute. Gated files are the exception: they wait for you to release them on purpose, so nothing important changes without a person behind it.',
    fit: 'Best for small teams that want zero ceremony — everyone always sees the latest.',
  },
  {
    id: 'pr', title: 'On — through approvals', tag: 'pr',
    what: 'Everyday work still reaches the team by itself, in small recorded batches. Gated files travel only through an approval request that a Work OS admin signs off — the platform enforces it, not good intentions.',
    fit: 'Best when your shared workspace is set to require approvals — the usual choice for larger teams.',
  },
];

export function currentModeLabel(a) {
  if (!a.on) return 'Off';
  return a.mode === 'pr' ? 'On — through approvals' : 'On — shared right away';
}

// The modes list with the switch — one component, used by this page and the
// Setup › Auto-sync tab so the two never drift.
export function buildModesCard(d) {
  const a = d.autoSync;
  const current = a.on ? a.mode : 'off';
  const card = el('div', { class: 'card' },
    el('h3', {}, 'Modes'),
    el('div', { class: 'hint' },
      LITE ? 'Switching needs the full console — or ask Claude in Claude Code.'
        : 'One click switches — the console saves the change and shares it when it can; if a step needs an admin, it hands you the exact next step.'));
  for (const m of MODES) {
    const isCurrent = m.id === current;
    const btn = el('button', {
      class: 'btn small primary',
      onclick: () => switchModal(m, d),
    }, 'Switch to this');
    card.append(el('div', { class: 'step' },
      isCurrent ? pill('done', 'Now') : null,
      el('div', { class: 'body', style: isCurrent ? '' : 'padding-left:0' },
        el('div', { class: 'title' }, m.title,
          m.tag ? el('span', { class: 'tag', style: 'margin-left:8px', title: `what Claude Code calls this mode` }, m.tag) : null),
        el('div', { class: 'detail' }, m.what),
        el('div', { class: 'detail', style: 'margin-top:3px; color:var(--muted)' }, m.fit)),
      isCurrent ? null : (LITE ? liteLock(btn, 'Switching needs the full console — or copy /auto-sync into Claude Code') : btn),
    ));
  }
  if (LITE) {
    card.append(el('div', { class: 'hint', style: 'margin-top:8px' },
      'From Claude Code instead: ', cmdChip('/auto-sync on direct'), ' ', cmdChip('/auto-sync on pr'), ' ', cmdChip('/auto-sync off')));
  }
  return card;
}

export async function render(view) {
  view.append(spinner());
  const d = await api.get('/api/governance');
  view.replaceChildren();
  setCrumbs([{ label: 'Auto-sync' }]);

  const a = d.autoSync;

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('div', { class: 'row wrap', style: 'margin-bottom:4px' },
      el('h1', { class: 'grow', style: 'margin:0' }, 'Auto-sync'),
      el('span', { class: `pill ${a.on ? 'ok' : 'todo'}` }, currentModeLabel(a))),
    el('div', { class: 'sub' },
      'Auto-sync decides whether the work you and Claude produce reaches the team by itself, and how. Gated files — the protected ones — always wait for a person; auto-sync never shares those on its own.'),
  );

  const split = el('div', { class: 'split' });
  page.append(split);
  const left = el('div', {});
  const right = el('div', {});
  split.append(left, right);

  left.append(buildModesCard(d));

  right.append(el('div', { class: 'card' },
    el('h3', {}, 'What stays protected'),
    el('div', { class: 'hint' },
      `Whatever the mode, the ${d.gated.length} gated rules hold: those files change only with a person's yes, and are never shared without one. `,
      el('a', { href: '#/governance' }, 'Manage the list'), '.'),
  ));

  right.append(el('div', { class: 'card' },
    el('h3', {}, 'For the curious'),
    el('div', { class: 'hint' }, 'The plumbing behind the switch — safe to ignore.'),
    el('details', {},
      el('summary', { style: 'cursor:pointer; font-size:12.5px; color:var(--muted); padding:4px 0' }, 'Technical details'),
      el('dl', { class: 'kv' },
        el('dt', {}, 'Strategy'), el('dd', {}, a.strategy),
        el('dt', {}, 'Push to origin'), el('dd', {}, a.push ? 'yes' : 'no'),
        el('dt', {}, 'Target branch'), el('dd', {}, a.targetBranch),
        el('dt', {}, 'Commit scope'), el('dd', {}, a.scope),
        el('dt', {}, 'Message prefix'), el('dd', {}, a.messagePrefix)),
      el('div', { class: 'hint' }, 'Claude Code equivalents: ', cmdChip('/auto-sync status')),
    ),
  ));
}

function friendlyPushNote(note) {
  if (/\/propose/.test(note)) {
    return 'The switch is saved on your computer. Because the settings file is protected, it reaches the team once an admin approves it — ask Claude to finish:';
  }
  if (/no origin/.test(note)) {
    return 'The switch is saved on your computer. There is no shared workspace connected yet, so there is nothing more to do until one exists. To review in Claude Code:';
  }
  return `The switch is saved on your computer, but sharing it hit a snag (${note}). Ask Claude to finish:`;
}

function switchModal(m, d) {
  const a = d.autoSync;
  const consequences = {
    off: 'From the next piece of work on, nothing is shared automatically — work stays on your computer until you ask Claude to share it.',
    direct: 'From the next piece of work on, everyday files reach the team by themselves; gated files wait for you.',
    pr: 'From the next piece of work on, everyday files reach the team in small recorded batches; gated files wait for an admin\'s approval. Fully enforced when your shared workspace requires approvals.',
  };
  modal({
    title: `Switch auto-sync — ${m.title}`,
    body: el('div', {},
      el('div', { style: 'font-size:13.5px; margin-bottom:8px' }, m.what),
      el('div', { class: 'hint' }, consequences[m.id]),
      el('div', { class: 'hint', style: 'margin-top:6px' },
        'This changes one gated settings file — this click is your approval. The console saves it and shares it when it can.'),
    ),
    actions: [{
      label: 'Switch', kind: 'primary',
      onclick: async (close) => {
        const r = await api.post('/api/autosync', { mode: m.id });
        close();
        if (!r.ok) {
          modal({
            title: 'Not switched — needs attention first',
            body: el('div', {},
              el('div', { class: 'hint', style: 'margin-bottom:6px' },
                r.blocked ? 'Something needs sorting out before the switch:' : 'What went wrong:'),
              ...(r.reasons || ['Unknown failure']).map((x) => el('div', { class: 'step' }, pill('todo', '!'), el('div', { class: 'body' }, el('div', { class: 'detail' }, x)))),
              el('div', { class: 'hint', style: 'margin-top:8px' }, 'Easiest fix — ask Claude:'),
              el('div', { class: 'chips' }, cmdChip(`/auto-sync ${m.id === 'off' ? 'off' : `on ${m.id}`}`)),
            ),
          });
          return;
        }
        const pushPending = r.push && !r.push.pushed;
        toast(`Auto-sync: ${currentModeLabel(r.autoSync)}`);
        window.dispatchEvent(new Event('console:saved'));
        if (pushPending) {
          promptModal({
            title: 'Switched — one more step',
            prompt: `/auto-sync ${m.id === 'off' ? 'off' : `on ${m.id}`}`,
            instruction: friendlyPushNote(r.push.note),
          });
        } else {
          setTimeout(() => location.reload(), 400);
        }
      },
    }],
  });
}
