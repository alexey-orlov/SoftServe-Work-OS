'use strict';
// Docs adapter — the customer-facing documentation as a black box. The ONLY
// contract with Documentation/ is the built site file and its public hash
// routes (#/section/article); nothing here reads content.js internals, and the
// console never writes docs (/docs-update is the one writer).
const repo = require('../repo');

const SITE = 'Documentation/work-os-docs.html';
const SRC = ['Documentation/src/content.js', 'Documentation/src/build.js'];

function build() {
  const st = repo.statOrNull(SITE);
  if (!st) return { exists: false, path: SITE };
  const html = repo.readText(SITE);

  // Section tabs are static markup in the built site — derive the nav from them;
  // fall back to the two known sections if the markup ever changes shape.
  const sections = [];
  const seen = new Set();
  const re = /<a class="tab" data-section="([a-z0-9_-]+)" href="(#\/[^"]*)"[^>]*>([^<]+)<\/a>/g;
  let m;
  while ((m = re.exec(html))) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    sections.push({ id: m[1], href: m[2], title: m[3].trim() });
  }
  if (!sections.length) {
    sections.push({ id: 'overview', href: '#/overview', title: 'Overview' },
      { id: 'setup', href: '#/setup', title: 'Setup' });
  }

  const srcMtimeMs = Math.max(0, ...SRC.map((p) => repo.statOrNull(p)).filter(Boolean).map((s) => s.mtimeMs));
  return {
    exists: true,
    path: SITE,
    title: (html.match(/<title>([^<]*)<\/title>/) || [])[1] || 'Documentation',
    sections,
    // 1s slack: the build writes the site moments after reading the source.
    stale: srcMtimeMs > st.mtimeMs + 1000,
    builtMtimeMs: st.mtimeMs,
    srcMtimeMs,
  };
}

module.exports = { build, SITE };
