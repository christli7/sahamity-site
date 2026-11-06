/**
 * Renders the link preview image (og-image.jpg, 1200×630) from og-image.html and the site's screenshots.
 * Needs the local site served on :4173 (the `site` preview) and puppeteer-core:
 *   node apps/site/scripts/make-og.mjs            (run from a folder with puppeteer-core installed, or set NODE_PATH)
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(path.join(process.cwd(), 'x.js'));
const puppeteer = require('puppeteer-core');
const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await p.goto('http://localhost:4173/scripts/og-image.html', { waitUntil: 'networkidle0' });
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: path.join(site, 'og-image.jpg'), type: 'jpeg', quality: 90 });
await b.close();
console.log('wrote og-image.jpg');
