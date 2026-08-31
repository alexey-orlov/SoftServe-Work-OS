// Docs adapter — the customer-facing documentation as a black box. The ONLY
// contract with Documentation/ is the built site file and its public hash
// routes (#/section/article); nothing here reads content.js internals, and the
// console never writes docs (/docs-update is the one writer).
import * as repo from '../repo.js';

export const SITE = 'Documentation/work-os-docs.html';
const SRC = ['Documentation/src/content.js', 'Documentation/src/build.js'];

export function build() {
  const st = repo.statOrNull(SITE);
  if (st === null) return { exists: false, path: SITE };
  const html = repo.readText(SITE);

  // Section tabs are static markup in the built site — derive the nav from them;
  // fall back to the two known sections if the markup ever changes shape.
  const sections = [];
  const seen = new Set();
  for (const m of html.matchAll(/<a class="tab" data-section="([a-z0-9_-]+)" href="(#\/[^"]*)"[^>]*>([^<]+)<\/a>/g)) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    sections.push({ id: m[1], href: m[2], title: m[3].trim() });
  }
  if (!sections.length) {
    sections.push({ id: 'overview', href: '#/overview', title: 'Overview' });
    sections.push({ id: 'setup', href: '#/setup', title: 'Setup' });
  }

  const srcStats = SRC.map((p) => repo.statOrNull(p));
  const srcMtimeMs = Math.max(0, ...srcStats.filter(Boolean).map((s) => repo.mtimeMs(s)));
  const title = html.match(/<title>([^<]*)<\/title>/);
  return {
    exists: true,
    path: SITE,
    title: title ? title[1] : 'Documentation',
    sections,
    // 1s slack: the build writes the site moments after reading the source.
    stale: srcMtimeMs > repo.mtimeMs(st) + 1000,
    builtMtimeMs: repo.mtimeMs(st),
    srcMtimeMs,
  };
}
