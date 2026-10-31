// Real app screenshots for the website: node shoot.mjs <lang> <name> <path> [scrollToText] [extraScroll]
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';
const [lang, name, route, scrollText, extra = '0', clickText = '', hideText = '', demo = 'on', height = '844'] = process.argv.slice(2);
const theme = process.env.THEME ?? 'dark';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const tokens = JSON.parse(readFileSync('tokens.json', 'utf8'));
await fetch('http://localhost:18080/v1/me/preferences', { method: 'PATCH', headers: { 'content-type': 'application/json', authorization: `Bearer ${tokens.accessToken}` }, body: JSON.stringify({ language: lang, theme }) });
await fetch('http://localhost:18080/v1/dev/demo-pro', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${tokens.accessToken}` }, body: JSON.stringify({ enabled: demo === 'on' }) });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--hide-scrollbars'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
await page.goto('http://localhost:19006/', { waitUntil: 'domcontentloaded' });
await page.evaluate((t) => localStorage.setItem('sahamity.session.v1', JSON.stringify(t)), tokens);
await page.goto('http://localhost:19006' + route, { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise((r) => setTimeout(r, 3500));
const byText = (txt) => page.evaluateHandle((t) => [...document.querySelectorAll('div,span,h1,h2,h3')].find((d) => d.childElementCount === 0 && d.textContent.trim().toLowerCase() === t.toLowerCase()), txt);
if (clickText) {
  const h = await byText(clickText);
  const box = await h.asElement()?.boundingBox();
  if (!box) throw new Error('click text not found: ' + clickText);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await new Promise((r) => setTimeout(r, 4000));
}
if (hideText) {
  // Remove development-only cards (demo mode) so the shot matches the production app.
  await page.evaluate((t) => {
    for (const label of t.split('|')) {
      const el = [...document.querySelectorAll('div,span,h1,h2,h3')].find((d) => d.childElementCount === 0 && d.textContent.trim().startsWith(label));
      if (!el) throw new Error('hide text not found: ' + label);
      let card = el;
      while (card.parentElement && card.parentElement.getBoundingClientRect().width <= card.getBoundingClientRect().width + 100 && card.parentElement.children.length === 1) card = card.parentElement;
      card = el.parentElement; while (card && getComputedStyle(card).borderTopLeftRadius === '0px') card = card.parentElement;
      card.style.display = 'none';
    }
  }, hideText);
  await new Promise((r) => setTimeout(r, 500));
}
let clip;
if (scrollText) {
  // Tall viewport renders the whole screen; crop one phone-height window starting at the heading.
  await page.setViewport({ width: 390, height: 5600, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await wait(2500);
  const y = await page.evaluate((txt) => {
    const el = [...document.querySelectorAll('div,span,h1,h2,h3')].find((d) => d.childElementCount === 0 && d.textContent.trim().toLowerCase() === txt.toLowerCase());
    if (!el) throw new Error('text not found: ' + txt);
    return el.getBoundingClientRect().top + window.scrollY;
  }, scrollText);
  if (height === 'card') {
    // Exact bounds of the card that follows the heading (the app's own component).
    clip = await page.evaluate((txt) => {
      const h = [...document.querySelectorAll('div,span,h1,h2,h3')].find((d) => d.childElementCount === 0 && d.textContent.trim().toLowerCase() === txt.toLowerCase());
      let a = h;
      while (a) {
        let sib = a.nextElementSibling;
        if (sib && sib.getBoundingClientRect().height > 60 && parseFloat(getComputedStyle(sib).borderTopLeftRadius) <= 8) {
          sib = [sib, ...sib.querySelectorAll('div')].find((d) => parseFloat(getComputedStyle(d).borderTopLeftRadius) > 8 && d.getBoundingClientRect().width >= 300) ?? sib;
        }
        if (sib && parseFloat(getComputedStyle(sib).borderTopLeftRadius) > 8 && sib.getBoundingClientRect().height > 60) {
          const r = sib.getBoundingClientRect();
          return { x: r.left, y: r.top + window.scrollY, width: r.width, height: r.height, radius: getComputedStyle(sib).borderTopLeftRadius };
        }
        a = a.parentElement;
      }
      throw new Error('card not found after ' + txt);
    }, scrollText);
    console.log('card radius', clip.radius, 'size', Math.round(clip.width), 'x', Math.round(clip.height));
    delete clip.radius;
  } else clip = { x: 0, y: Math.max(0, y - 36 + Number(extra)), width: 390, height: Number(height) };
}
await page.screenshot({ path: `out/${name}-${lang}.webp`, type: 'webp', quality: 90, ...(clip ? { clip } : {}) });
await browser.close();
console.log('saved', name, lang);
