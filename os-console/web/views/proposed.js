// Proposed changes — two symmetric queues with actions:
//   From team members  = open pull requests by humans (approve+merge / reject
//                        with a comment posted to the PR / work on it in Claude Code)
//   Automatic          = the governance/proposals/ inbox + bot PRs (approve and
//                        work-on-it hand off to Claude Code; reject deletes the
//                        proposal with your comment in the commit message)
// GitHub tells us cheaply when the person cannot merge — buttons disable with
// the reason; everywhere else the console attempts the action and the git host
// stays the enforcer.
import { api } from '/api.js';
import { el, icon, timeAgo, setCrumbs, spinner, toast, modal, field, promptModal, gatedTag, LITE, liteLock, staleServerCard } from '/ui.js';

export async function render(view, params) {
  view.append(spinner());
  const d = await api.get('/api/proposed');
  view.replaceChildren();
  setCrumbs([{ label: 'Proposed changes' }]);
  if (!d.auto) {
    view.append(el('div', { class: 'page' }, el('h1', {}, 'Proposed changes'), staleServerCard()));
    return;
  }

  const page = el('div', { class: 'page' });
  view.append(page);

  const teamCount = d.prs.available ? d.prs.items.length : 0;
  const autoCount = d.auto.proposals.length + d.auto.botPrs.length;

  page.append(
    el('div', { class: 'row wrap', style: 'margin-bottom:4px' },
      el('h1', { class: 'grow', style: 'margin:0' }, 'Proposed changes'),
      (() => {
        const b = el('button', {
          class: 'btn small quiet', title: 'Re-check now (the list is cached for 5 minutes)',
          onclick: async (e) => {
            const btn = e.currentTarget; // null after the first await — capture now
            btn.disabled = true;
            try { await api.get('/api/proposed?refresh=1'); location.reload(); }
            catch (err) { toast(err.message, 'err'); btn.disabled = false; }
          },
        }, icon('refresh'), 'Re-check');
        return LITE ? liteLock(b, 'Snapshot — this data is as of the file\'s build') : b;
      })()),
    el('div', { class: 'sub' },
      'What is waiting for a person. Approving or rejecting acts on GitHub or Azure DevOps as you, with your own account — the platform still enforces who may approve what.'),
  );

  const tabBar = el('div', { class: 'tabs' });
  const content = el('div', {});
  page.append(tabBar, content);

  let active = params.get('tab') === 'auto' ? 'auto' : 'team';
  const tabDefs = [
    ['team', 'From team members', teamCount],
    ['auto', 'Automatic', autoCount],
  ];
  for (const [id, label, count] of tabDefs) {
    const btn = el('button', {
      class: `tab ${id === active ? 'on' : ''}`,
      onclick: () => {
        active = id;
        history.replaceState(null, '', `#/proposed?tab=${id}`);
        tabBar.querySelectorAll('.tab').forEach((b) => b.classList.remove('on'));
        btn.classList.add('on');
        draw();
      },
    }, label, el('span', { class: 'count' }, String(count)));
    tabBar.append(btn);
  }

  function draw() {
    content.replaceChildren();
    if (active === 'team') drawTeam(content, d);
    else drawAuto(content, d);
  }
  draw();
}

// ---- shared: PR row with actions -------------------------------------------

function cannotAct(perms) {
  if (LITE) return 'Read-only snapshot — run the full console to act on pull requests';
  if (perms && perms.canMerge === false) {
    return `Your ${perms.provider === 'azure' ? 'Azure' : 'git host'} account${perms.login ? ` (${perms.login})` : ''} cannot approve changes into this workspace — ask your OS admin`;
  }
  return null;
}

function prRow(pr, perms) {
  const blocked = cannotAct(perms);
  const mk = (label, cls, onclick, title) => {
    const b = el('button', { class: `btn small ${cls}`, onclick, title: title || '' }, label);
    if (blocked) { b.disabled = true; b.classList.add('locked'); b.title = blocked; }
    return b;
  };
  const isGated = /^gated:/i.test(pr.title || '');
  return el('div', { class: 'art-row' },
    el('span', { class: 'val grow' },
      pr.url
        ? el('a', { href: pr.url, target: '_blank', rel: 'noopener' }, `#${pr.number} ${pr.title} `, icon('external'))
        : el('span', {}, `#${pr.number} ${pr.title}`),
      pr.draft ? el('span', { class: 'tag', style: 'margin-left:6px' }, 'draft') : null,
      isGated ? el('span', { style: 'margin-left:6px' }, gatedTag('gated')) : null),
    el('span', { class: 'tag', title: 'author' }, pr.author),
    el('span', { style: 'color:var(--muted); font-size:12px; white-space:nowrap' }, timeAgo(pr.createdAt)),
    mk('Approve', 'primary', () => approvePrModal(pr, isGated),
      'Approve and accept the change, as you, with your own sign-in'),
    mk('Reject', '', () => rejectPrModal(pr), 'Close with a comment posted to the PR'),
    el('button', {
      class: 'btn small quiet', title: 'Hand this PR to Claude Code to adjust it with you',
      onclick: () => workOnPrModal(pr),
    }, 'Work on it'),
  );
}

function approvePrModal(pr, isGated) {
  modal({
    title: `Approve #${pr.number}`,
    body: el('div', {},
      el('div', { style: 'font-size:13.5px; margin-bottom:6px' }, pr.title),
      el('div', { class: 'hint' },
        'Posts your approval and brings the change in, using your own GitHub / Azure DevOps sign-in. '
        + (isGated ? 'This is a gated change — your approval must satisfy the admin rule; if it does not, the platform refuses and its message is shown here word for word.'
          : 'If the platform refuses (checks, reviews, permissions), its message is shown here word for word.')),
    ),
    actions: [{
      label: 'Approve', kind: 'primary',
      onclick: async (close) => {
        const r = await api.post('/api/pr/action', { number: pr.number, action: 'approve' });
        close();
        stepsModal(`#${pr.number} — approve`, r);
      },
    }],
  });
}

function rejectPrModal(pr) {
  const comment = el('textarea', { rows: 3, placeholder: 'Why this is rejected — posted on the pull request' });
  modal({
    title: `Reject #${pr.number}`,
    body: el('div', {},
      el('div', { style: 'font-size:13.5px; margin-bottom:6px' }, pr.title),
      field('Comment (required)', comment, 'Closes the PR and posts this comment on it, as you.'),
    ),
    actions: [{
      label: 'Reject & close', kind: '',
      onclick: async (close) => {
        if (!comment.value.trim()) { toast('A rejection needs a comment — it goes on the PR', 'err'); return false; }
        const r = await api.post('/api/pr/action', { number: pr.number, action: 'reject', comment: comment.value.trim() });
        close();
        stepsModal(`#${pr.number} — reject`, r);
      },
    }],
  });
}

function workOnPrModal(pr) {
  promptModal({
    title: `Work on #${pr.number} in Claude Code`,
    prompt: `Check out pull request #${pr.number} ("${pr.title}") in this repository and work on it with me — I want to review and adjust the proposed change before it lands. Start by summarizing what it changes and why.`,
  });
}

function stepsModal(title, r) {
  modal({
    title,
    body: el('div', {},
      ...r.steps.map((s) => el('div', { class: 'step' },
        el('span', { class: `pill ${s.ok ? 'ok' : 'err'}` }, s.ok ? '✓' : '✗'),
        el('div', { class: 'body' },
          el('div', { class: 'title' }, s.step),
          el('div', { class: 'detail' }, s.note || '')))),
      el('div', { class: 'hint', style: 'margin-top:8px' },
        r.ok ? '' : 'Partial — the failing step\'s message comes from GitHub / Azure DevOps, word for word.'),
    ),
    actions: [{ label: 'Done', kind: 'primary', onclick: (close) => { close(); location.reload(); } }],
  });
}

// ---- team tab ---------------------------------------------------------------

function drawTeam(box, d) {
  const p = d.prs;
  const card = el('div', { class: 'card' },
    el('div', { class: 'row' },
      el('h3', { class: 'grow' }, 'Waiting for a decision'),
      p.provider !== 'none' ? el('span', { class: 'tag' }, p.provider) : null),
    el('div', { class: 'hint' },
      'Open pull requests by people. Gated ones reach the team\'s shared version only through an approval that satisfies the admin rule.'),
  );
  if (d.permissions && d.permissions.canMerge === false) {
    card.append(el('div', { class: 'hint', style: 'margin-top:2px' },
      `Actions are disabled: ${cannotAct(d.permissions)}.`));
  }
  if (!p.available) {
    card.append(el('div', { class: 'empty' }, p.note || 'PR listing unavailable.'));
  } else if (!p.items.length) {
    card.append(el('div', { class: 'empty' }, 'Nothing waiting for a decision.'));
  } else {
    for (const pr of p.items) card.append(prRow(pr, d.permissions));
  }
  box.append(card);
}

// ---- automatic tab ----------------------------------------------------------

function drawAuto(box, d) {
  const props = d.auto.proposals;
  const card = el('div', { class: 'card' },
    el('h3', {}, 'Filed by automation'),
    el('div', { class: 'hint' },
      'Proposals from runs that could not ask (scheduled, background). Approve hands the exact apply job to Claude Code; reject deletes the proposal with your comment on record.'),
  );
  if (!props.length) {
    card.append(el('div', { class: 'empty' }, 'Nothing filed.'));
  }
  for (const pr of props) {
    const rejectBtn = el('button', { class: 'btn small', onclick: () => rejectProposalModal(pr) }, 'Reject');
    card.append(el('div', { class: 'art-row' },
      el('span', { class: 'val grow' },
        el('a', { href: `#/file?path=${encodeURIComponent(pr.path)}`, style: 'font-weight:600' }, pr.title),
        el('span', { class: 'mini' }, pr.intro || '')),
      el('span', { class: 'tag' }, timeAgo(pr.mtimeMs)),
      el('button', {
        class: 'btn small primary', title: 'Hand the apply job to Claude Code',
        onclick: () => promptModal({
          title: 'Apply this proposal in Claude Code',
          prompt: `Apply the proposal ${pr.path} exactly as it describes: read it, make the change it specifies (gated files will raise the approval prompt — that is expected), then delete the proposal file and confirm what changed.`,
        }),
      }, 'Approve'),
      LITE ? liteLock(rejectBtn) : rejectBtn,
      el('button', {
        class: 'btn small quiet', title: 'Discuss and adjust it in Claude Code first',
        onclick: () => promptModal({
          title: 'Work on this proposal in Claude Code',
          prompt: `Read the proposal ${pr.path} and work on it with me — I want to adjust the proposed change before applying it. Start by summarizing what it proposes and why.`,
        }),
      }, 'Work on it'),
    ));
  }
  box.append(card);

  if (d.auto.botPrs.length) {
    const botCard = el('div', { class: 'card' },
      el('h3', {}, `Pull requests by automation (${d.auto.botPrs.length})`),
      el('div', { class: 'hint' }, 'Opened by the system itself (automatic syncing, checks). They normally complete on their own — one lingering here may need a look.'),
    );
    for (const pr of d.auto.botPrs) botCard.append(prRow(pr, d.permissions));
    box.append(botCard);
  }
}

function rejectProposalModal(pr) {
  const comment = el('textarea', { rows: 3, placeholder: 'Why this is rejected — kept on record with the change' });
  modal({
    title: `Reject proposal`,
    body: el('div', {},
      el('div', { class: 'path', style: 'margin-bottom:8px' }, pr.path),
      field('Comment (required)', comment, 'Deletes the proposal; your comment stays on record with the change.'),
    ),
    actions: [{
      label: 'Reject & delete', kind: '',
      onclick: async (close) => {
        if (!comment.value.trim()) { toast('A rejection needs a comment for the record', 'err'); return false; }
        const r = await api.post('/api/proposals/reject', { path: pr.path, comment: comment.value.trim() });
        toast('Rejected — recorded ✓');
        window.dispatchEvent(new Event('console:saved'));
        close();
        location.reload();
      },
    }],
  });
}
