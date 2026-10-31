/**
 * Generates /privacy/, /terms/, /disclaimer/ and /data-sources/ from the app's legal text,
 * so the website and the app always say the same thing. Also refreshes the asset versions on every page.
 *
 *   npx tsx scripts/build-legal.ts
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
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

// The form is the page's main action, so it sits straight after each language's introduction.
const DELETE_FORM = `<form class="delete-form" novalidate>
      <h2><span lang="id">Hapus akun sekarang</span><span lang="en">Delete your account now</span></h2>
      <div data-step="email">
        <label for="del-email"><span lang="id">Email akun Anda</span><span lang="en">Your account email</span></label>
        <input id="del-email" type="email" autocomplete="email" inputmode="email" required />
        <button type="submit" class="btn btn-gold"><span lang="id">Kirim kode</span><span lang="en">Send code</span></button>
      </div>
      <div data-step="code" hidden>
        <p><span lang="id">Jika akun ini ada, kami telah mengirim kode 6 angka ke email tersebut. Berlaku 10 menit.</span><span lang="en">If this account exists, we have sent a 6-digit code to that email. It lasts 10 minutes.</span></p>
        <label for="del-code"><span lang="id">Kode</span><span lang="en">Code</span></label>
        <input id="del-code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required />
        <button type="submit" class="btn btn-danger"><span lang="id">Hapus akun saya secara permanen</span><span lang="en">Permanently delete my account</span></button>
      </div>
      <div data-step="done" hidden>
        <p><b><span lang="id">Akun Anda telah dihapus.</span><span lang="en">Your account has been deleted.</span></b></p>
      </div>
      <p class="form-error" role="alert" hidden></p>
    </form>`;

function withDeleteForm(slug: string, main: string): string {
  if (slug !== 'delete-account') return main;
  let n = 0;
  return main.replace(/<p class="intro">[\s\S]*?<\/p>/g, (intro) => intro + DELETE_FORM.replace(/del-/g, n++ ? 'del-en-' : 'del-id-'));
}

// Browsers keep these files for hours, so each link carries a fingerprint of the file's contents.
const fingerprint = (files: string[]) => {
  const hash = createHash('sha256');
  for (const file of files) hash.update(readFileSync(file));
  return hash.digest('hex').slice(0, 10);
};
const shots = readdirSync(path.join(site, 'shots'), { recursive: true, withFileTypes: true })
  .filter((f) => f.isFile())
  .map((f) => path.join(f.parentPath, f.name))
  .sort();
const stamped = readFileSync(path.join(site, 'index.html'), 'utf8')
  .replace(/\/(styles\.css|site\.js)(\?v=[^"]*)?"/g, (_, file: string) => `/${file}?v=${fingerprint([path.join(site, file)])}"`)
  .replace(/<html\b([^>]*?)(\s+data-shots="[^"]*")?>/, (_, attrs: string) => `<html${attrs} data-shots="${fingerprint(shots)}">`);
writeFileSync(path.join(site, 'index.html'), stamped);

const index = stamped;
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
  const page = (head + withDeleteForm(slug, main) + foot)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(en.title)} — Sahamity</title>`)
    .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="https://sahamity.com/${slug}/"`)
    // No first-visit picker on legal pages; nav section links point home.
    .replace(/<div class="langpick"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, '')
    .replace(/href="#(markets|how|tour|pricing|download)"/g, 'href="/#$1"');
  mkdirSync(path.join(site, slug), { recursive: true });
  writeFileSync(path.join(site, slug, 'index.html'), page);
  console.log(`wrote /${slug}/`);
}
