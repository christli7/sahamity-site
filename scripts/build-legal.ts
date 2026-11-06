/**
 * Generates /privacy/, /terms/, /disclaimer/ and /data-sources/ from the app's legal text,
 * so the website and the app always say the same thing, and /support/ from support-content.ts.
 * Also refreshes the asset versions on every page and writes sitemap.xml and robots.txt.
 *
 *   npx tsx scripts/build-legal.ts
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEGAL_CONTACT, LEGAL_DOCS, LEGAL_UPDATED, legalDocument, type LegalDocument } from '../../mobile/src/legal/content';
import { SUPPORT_EMAIL, support } from './support-content';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const linkify = (s: string) =>
  esc(s).replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, (m) => `<a href="mailto:${m}">${m}</a>`);

// The support page also links web addresses.
const linkifyAll = (s: string) =>
  linkify(s).replace(/https:\/\/[^\s<]+?(?=[.,;)]?(\s|$))/g, (m) => `<a href="${m}">${m.replace(/^https:\/\//, '')}</a>`);

function body(doc: LegalDocument, link = linkify): string {
  const sections = doc.sections.map((sec) => {
    const parts: string[] = [];
    let bullets: string[] = [];
    const flush = () => {
      if (bullets.length) parts.push(`<ul>${bullets.map((b) => `<li>${link(b)}</li>`).join('')}</ul>`);
      bullets = [];
    };
    for (const p of sec.body) {
      if (p.startsWith('• ')) bullets.push(p.slice(2));
      else { flush(); parts.push(`<p>${link(p)}</p>`); }
    }
    flush();
    return `<div class="card"><h2>${esc(sec.heading)}</h2>${parts.join('')}</div>`;
  });
  return `<p class="intro">${link(doc.intro)}</p>${sections.join('\n')}`;
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
  // Link previews are cached by URL (Facebook, X, WhatsApp), so a new image needs a new address.
  .replace(/\/og-image\.jpg(\?v=[^"]*)?"/g, () => `/og-image.jpg?v=${fingerprint([path.join(site, 'og-image.jpg')])}"`)
  .replace(/<html\b([^>]*?)(\s+data-shots="[^"]*")?>/, (_, attrs: string) => `<html${attrs} data-shots="${fingerprint(shots)}">`);
writeFileSync(path.join(site, 'index.html'), stamped);

const index = stamped;
const head = index.slice(0, index.indexOf('<main>'));
const foot = index.slice(index.indexOf('</main>') + '</main>'.length);

const attr = (s: string) => esc(s).replace(/"/g, '&quot;');
// A search snippet of at most 155 characters: whole sentences when they fit, else cut at a word.
const snippet = (s: string) => {
  if (s.length <= 155) return s;
  const sentences = s.slice(0, 155).match(/^.*[.!?](?=\s)/)?.[0];
  return sentences && sentences.length >= 70 ? sentences : `${s.slice(0, 152).replace(/\s+\S*$/, '')}…`;
};

/** Gives a page built from the home page's head its own title, address and description. */
function subpage(html: string, slug: string, title: string, description: string): string {
  const url = `https://sahamity.com/${slug}/`;
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${attr(description)}"`)
    .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${attr(title)}"`)
    .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${attr(description)}"`)
    .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${url}"`)
    .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${url}"`)
    // The site and app details describe the home page only.
    .replace(/\s*<script type="application\/ld\+json" id="ld-home">[\s\S]*?<\/script>/, '')
    // No first-visit picker on these pages; nav section links point home.
    .replace(/<div class="langpick"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, '')
    .replace(/href="#(markets|how|tour|terminal|pricing|download)"/g, 'href="/#$1"');
}

for (const slug of LEGAL_DOCS) {
  const en = legalDocument(slug, 'en');
  const id = legalDocument(slug, 'id');
  const main = `<main class="legal"><div class="wrap">
    <span class="kicker">Sahamity</span>
    <div lang="id"><h1>${esc(id.title)}</h1><p class="updated">Terakhir diperbarui ${LEGAL_UPDATED} · ${linkify(LEGAL_CONTACT)}</p>${body(id)}</div>
    <div lang="en"><h1>${esc(en.title)}</h1><p class="updated">Last updated ${LEGAL_UPDATED} · ${linkify(LEGAL_CONTACT)}</p>${body(en)}</div>
  </div></main>`;
  const page = subpage(head + withDeleteForm(slug, main) + foot, slug, `${en.title} — Sahamity`, snippet(en.intro));
  mkdirSync(path.join(site, slug), { recursive: true });
  writeFileSync(path.join(site, slug, 'index.html'), page);
  console.log(`wrote /${slug}/`);
}

// Support: contact card first, then the answers.
const supportLang = (lang: 'en' | 'id') => {
  const d = support[lang];
  const contact = `<div class="card support-contact"><h2>${esc(d.contact)}</h2><p>${esc(d.reply)}</p><a class="btn btn-gold" href="mailto:${SUPPORT_EMAIL}?subject=Sahamity%20support">${esc(d.button)}</a></div>`;
  return `<div lang="${lang}"><h1>${esc(d.title)}</h1>${body(d, linkifyAll).replace('</p>', `</p>${contact}`)}</div>`;
};
const supportPage = subpage(
  head + `<main class="legal"><div class="wrap">
    <span class="kicker">Sahamity</span>
    ${supportLang('id')}
    ${supportLang('en')}
  </div></main>` + foot,
  'support',
  'Support — Sahamity',
  'Help with Sahamity: subscriptions, restoring Pro, signing in, notifications, your account and how to contact us.',
);
mkdirSync(path.join(site, 'support'), { recursive: true });
writeFileSync(path.join(site, 'support', 'index.html'), supportPage);
console.log('wrote /support/');

// Search engines: every page (submitted in Search Console), and robots.txt pointing to it.
// Cloudflare puts its content-signal notes on top of this robots.txt.
const urls = ['', ...LEGAL_DOCS.map((slug) => `${slug}/`), 'support/'];
const entries = urls.map((u) => `  <url><loc>https://sahamity.com/${u}</loc></url>`).join('\n');
writeFileSync(
  path.join(site, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`,
);
writeFileSync(path.join(site, 'robots.txt'), 'User-agent: *\nAllow: /\n\nSitemap: https://sahamity.com/sitemap.xml\n');
console.log(`wrote /sitemap.xml (${urls.length} pages) and /robots.txt`);
