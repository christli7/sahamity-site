/**
 * Generates /privacy/, /terms/, /disclaimer/ and /data-sources/ from the app's legal text,
 * so the website and the app always say the same thing.
 *
 *   npx tsx scripts/build-legal.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEGAL_CONTACT, LEGAL_DOCS, LEGAL_UPDATED, legalDocument, type LegalDocument } from '../../mobile/src/legal/content';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const linkify = (s: string) =>
  esc(s).replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, (m) => `<a href="mailto:${m}">${m}</a>`);

function body(doc: LegalDocument): string {
  const sections = doc.sections.map((sec) => {
    const parts: string[] = [];
    let bullets: string[] = [];
    const flush = () => {
      if (bullets.length) parts.push(`<ul>${bullets.map((b) => `<li>${linkify(b)}</li>`).join('')}</ul>`);
      bullets = [];
    };
    for (const p of sec.body) {
      if (p.startsWith('• ')) bullets.push(p.slice(2));
      else { flush(); parts.push(`<p>${linkify(p)}</p>`); }
    }
    flush();
    return `<div class="card"><h2>${esc(sec.heading)}</h2>${parts.join('')}</div>`;
  });
  return `<p class="intro">${linkify(doc.intro)}</p>${sections.join('\n')}`;
}

const index = readFileSync(path.join(site, 'index.html'), 'utf8');
const head = index.slice(0, index.indexOf('<main>'));
const foot = index.slice(index.indexOf('</main>') + '</main>'.length);

for (const slug of LEGAL_DOCS) {
  const en = legalDocument(slug, 'en');
  const id = legalDocument(slug, 'id');
  const main = `<main class="legal"><div class="wrap">
    <span class="kicker">Sahamity</span>
    <div lang="id"><h1>${esc(id.title)}</h1><p class="updated">Terakhir diperbarui ${LEGAL_UPDATED} · ${linkify(LEGAL_CONTACT)}</p>${body(id)}</div>
    <div lang="en"><h1>${esc(en.title)}</h1><p class="updated">Last updated ${LEGAL_UPDATED} · ${linkify(LEGAL_CONTACT)}</p>${body(en)}</div>
  </div></main>`;
  const page = (head + main + foot)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(en.title)} — Sahamity</title>`)
    .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="https://sahamity.com/${slug}/"`)
    // No first-visit picker on legal pages; nav section links point home.
    .replace(/<div class="langpick"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, '')
    .replace(/href="#(markets|how|tour|pricing|download)"/g, 'href="/#$1"');
  mkdirSync(path.join(site, slug), { recursive: true });
  writeFileSync(path.join(site, slug, 'index.html'), page);
  console.log(`wrote /${slug}/`);
}
