// Auto-sync — a component module, not a page: the Setup page's Auto-sync tab
// is its one home (the old #/autosync deep links redirect there). Written for
// a PM, not a git user. Mode selection uses the plan-selector pattern: each
// mode is a card, the current one highlighted, the action always in the same
// top-right slot. The server performs the same flip the /auto-sync program
// does (same switches, same guards); every failure shows a plain-language
// reason and hands off to Claude Code.
import { api } from '/api.js';
import { el, pill, toast, modal, promptModal, cmdChip, LITE, liteLock } from '/ui.js';

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

// The full Auto-sync tab content: modes + what stays gated + the technical appendix.
export function renderAutosync(box, d) {
  const a = d.autoSync;
  const current = a.on ? a.mode : 'off';

  const card = el('div', { class: 'card' },
    el('h3', {}, 'Auto-sync'),
    el('div', { class: 'hint' },
      'Decides whether the work you and Claude produce reaches the team by itself, and how. Gated files — the protected ones — always wait for a person.'
      + (LITE ? ' Switching needs the full console, or ask Claude in Claude Code.'
        : ' One click switches — the console saves the change and shares it when it can; if a step needs an admin, it hands you the exact next step.')));
  for (const m of MODES) {
    const isCurrent = m.id === current;
    let action;
    if (isCurrent) {
      action = pill('done', 'Current');
    } else {
      action = el('button', { class: 'btn small', onclick: () => switchModal(m, d) }, 'Switch to this');
      if (LITE) liteLock(action, 'Switching needs the full console — or copy /auto-sync into Claude Code');
    }
    card.append(el('div', { class: `mode-card ${isCurrent ? 'current' : ''}` },
      el('div', { class: 'row', style: 'margin-bottom:4px' },
        el('span', { style: 'font-weight:650; font-size:14px' }, m.title),
        m.tag ? el('span', { class: 'tag', title: 'what Claude Code calls this mode' }, m.tag) : null,
        el('span', { class: 'grow' }),
        action),
      el('div', { style: 'font-size:13px; color:var(--ink-2)' }, m.what),
      el('div', { style: 'font-size:12.5px; color:var(--muted); margin-top:4px' }, m.fit),
    ));
  }
  if (LITE) {
    card.append(el('div', { class: 'hint', style: 'margin-top:8px' },
      'From Claude Code instead: ', cmdChip('/auto-sync on direct'), ' ', cmdChip('/auto-sync on pr'), ' ', cmdChip('/auto-sync off')));
  }
  box.append(card);

  box.append(el('div', { class: 'card' },
    el('h3', {}, 'What stays gated'),
    el('div', { class: 'hint' },
      `Whatever the mode, the ${d.gated.length} gated rules hold: those files change only with a person's yes, and are never shared without one. `,
      el('a', { href: '#/governance' }, 'Manage the list'), '.'),
  ));

  box.append(el('div', { class: 'card' },
    el('h3', {}, 'For the curious'),
    el('details', {},
      el('summary', { style: 'cursor:pointer; font-size:12.5px; color:var(--muted); padding:4px 0' }, 'Technical details — safe to ignore'),
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

// Old #/autosync deep links land on the Setup tab.
export async function render() {
  location.replace('#/setup?tab=autosync');
}

function friendlyPushNote(note) {
  if (/\/propose/.test(note)) {
    return 'The switch is saved on your computer. Because the settings file is gated, it reaches the team once an admin approves it — ask Claude to finish:';
  }
  if (/no origin/.test(note)) {
    return 'The switch is saved on your computer. There is no shared workspace connected yet, so there is nothing more to do until one exists. To review in Claude Code:';
  }
  return `The switch is saved on your computer, but sharing it hit a snag (${note}). Ask Claude to finish:`;
}

function switchModal(m, d) {
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
