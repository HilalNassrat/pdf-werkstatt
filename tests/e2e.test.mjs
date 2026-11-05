// End-to-end tests with Playwright (Chromium). Run: npm test
// Needs Playwright: `npm i -D playwright && npx playwright install chromium` (or set PLAYWRIGHT_PATH / CHROME_PATH).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { serve } from './server.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FX = join(ROOT, 'tests', 'fixtures');
const { chromium } = await import(process.env.PLAYWRIGHT_PATH || 'playwright');
// Load the vendored pdf-lib (UMD build) to check the PDFs the app produces.
const libCtx = vm.createContext({ TextEncoder, TextDecoder, Uint8Array, ArrayBuffer, DataView, Promise, setTimeout, console });
vm.runInContext(await readFile(join(ROOT, 'vendor', 'pdf-lib.min.js'), 'utf8'), libCtx);
const PDFLib = libCtx.PDFLib;

let server, browser;
before(async () => {
  server = await serve(ROOT);
  browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
});
after(async () => { await browser?.close(); server?.close(); });

async function open(hash = '', viewport = { width: 1440, height: 900 }) {
  const page = await browser.newPage({ viewport, acceptDownloads: true });
  const problems = [];
  page.on('pageerror', e => problems.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  page.on('request', r => { if (!r.url().startsWith(server.url) && !/^(blob|data):/.test(r.url())) problems.push('third-party request: ' + r.url()); });
  await page.goto(server.url + (hash ? '#' + hash : ''));
  await page.waitForFunction(() => window.PDFLib && window.pdfjsLib);
  return { page, problems };
}
const upload = (page, ...names) => page.locator('.drop input[type=file]').setInputFiles(names.map(n => join(FX, n)));
async function download(page) {
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Herunterladen' }).click()]);
  return readFile(await dl.path());
}
// Builds a test PDF inside the page (uses the app's own pdf-lib).
async function bigPdf(page, n) {
  return Buffer.from(await page.evaluate(async n => {
    const d = await PDFLib.PDFDocument.create();
    for (let i = 0; i < n; i++) d.addPage([595, 842]).drawText('Seite ' + (i + 1), { x: 50, y: 780, size: 24 });
    return Array.from(await d.save());
  }, n));
}

test('Startseite: alle Werkzeuge, keine Fehler, keine Anfragen an Dritte', async () => {
  const { page, problems } = await open();
  assert.equal(await page.locator('.tool-card').count(), 11);
  await page.keyboard.press('Tab'); // brand button is focusable
  assert.equal(await page.evaluate(() => document.activeElement.id), 'brand');
  assert.deepEqual(problems, []);
  await page.close();
});

test('Zusammenfügen: zwei PDFs → 5 Seiten, Reihenfolge per Tastatur', async () => {
  const { page, problems } = await open('merge');
  await upload(page, 'a.pdf', 'b.pdf');
  await page.locator('.thumb[data-id]').nth(1).waitFor();
  await page.locator('.thumb[data-id]').first().focus();
  await page.keyboard.press('Alt+ArrowRight');
  assert.match(await page.locator('.thumb[data-id]').first().textContent(), /b\.pdf/);
  await page.getByRole('button', { name: 'PDFs zusammenfügen' }).click();
  const out = await PDFLib.PDFDocument.load(await download(page));
  assert.equal(out.getPageCount(), 5);
  assert.deepEqual(problems, []);
  await page.close();
});

test('Verschlüsselte PDF (Passwort): Passwort-Dialog, Bearbeiten wird sauber abgelehnt', async () => {
  const { page } = await open('split');
  await upload(page, 'enc-user.pdf');
  const dlg = page.getByRole('dialog', { name: 'Passwort erforderlich' });
  await dlg.waitFor();
  await page.getByRole('textbox', { name: 'Passwort' }).fill('falsch'); await page.keyboard.press('Enter');
  await page.getByText('Das Passwort stimmt nicht').waitFor();
  await page.getByRole('textbox', { name: 'Passwort' }).fill('geheim'); await page.keyboard.press('Enter');
  await page.locator('.toast', { hasText: 'verschlüsselt' }).waitFor();
  await page.close();
});

test('Verschlüsselte PDF: „PDF in Bilder“ funktioniert nach Passworteingabe', async () => {
  const { page, problems } = await open('pdf2img');
  await upload(page, 'enc-user.pdf');
  await page.getByRole('textbox', { name: 'Passwort' }).fill('geheim'); await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'In Bilder umwandeln' }).click();
  const zip = await download(page);
  assert.equal(zip.subarray(0, 2).toString(), 'PK');
  assert.deepEqual(problems, []);
  await page.close();
});

test('Rechte-geschützte PDF (nur Owner-Passwort) wird beim Laden erkannt', async () => {
  const { page } = await open('organize');
  await upload(page, 'enc-owner.pdf');
  await page.locator('.toast', { hasText: 'verschlüsselt' }).waitFor();
  assert.equal(await page.locator('.drop').count(), 1);
  await page.close();
});

test('Kaputte Datei und Nicht-PDF: verständliche Meldung statt Absturz', async () => {
  const { page } = await open('watermark');
  await upload(page, 'notpdf.pdf');
  await page.locator('.toast', { hasText: 'keine gültige PDF' }).waitFor();
  await page.close();
});

test('Große PDF (400 Seiten): Teilen bleibt flott, Vorschaubilder werden lazy gerendert', async () => {
  const { page, problems } = await open('split');
  const t0 = Date.now();
  await page.locator('.drop input[type=file]').setInputFiles({ name: 'gross.pdf', mimeType: 'application/pdf', buffer: await bigPdf(page, 400) });
  await page.locator('.thumb[data-i="399"]').waitFor({ state: 'attached' });
  await page.waitForTimeout(1500);
  const rendered = await page.locator('.thumb canvas').count();
  assert.ok(rendered < 120, `nur sichtbare Seiten rendern (gerendert: ${rendered})`);
  await page.locator('input[type=text].input').fill('1-200, 201-');
  await page.getByRole('button', { name: 'PDF teilen' }).click();
  const zip = await download(page);
  assert.equal(zip.subarray(0, 2).toString(), 'PK');
  assert.ok(Date.now() - t0 < 30000);
  assert.deepEqual(problems, []);
  await page.close();
});

test('Verkleinern: eigene Qualität', async () => {
  const { page, problems } = await open('compress');
  await upload(page, 'a.pdf');
  await page.getByText('Eigene Einstellung').click();
  await page.getByRole('slider', { name: /Auflösung/ }).fill('60');
  await page.getByRole('button', { name: 'PDF verkleinern' }).click();
  await page.getByRole('dialog').waitFor();
  const out = await PDFLib.PDFDocument.load(await download(page));
  assert.equal(out.getPageCount(), 3);
  assert.deepEqual(problems, []);
  await page.close();
});

test('Handy (390 px): kein horizontales Scrollen auf Start und im Editor', async () => {
  const { page, problems } = await open('', { width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.goto(server.url + '#edit'); await upload(page, 'a.pdf');
  await page.locator('.epage').first().waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  assert.deepEqual(problems, []);
  await page.close();
});

test('Offline: nach dem ersten Besuch funktioniert die App ohne Netz', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(server.url);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); await page.evaluate(() => navigator.serviceWorker.ready);
  await ctx.setOffline(true);
  await page.goto(server.url + '#merge');
  await page.waitForFunction(() => window.PDFLib && window.pdfjsLib);
  await page.locator('.drop input[type=file]').setInputFiles([join(FX, 'a.pdf'), join(FX, 'b.pdf')]);
  await page.locator('.thumb canvas').first().waitFor();
  await ctx.close();
});

test('Beschädigte PDF: keine Script-Fehler', async () => {
  const { page, problems } = await open('merge');
  await upload(page, 'broken.pdf', 'a.pdf');
  await page.waitForTimeout(1500);
  assert.deepEqual(problems.filter(p => p.startsWith('pageerror')), []);
  await page.close();
});

test('Bearbeiten: Text einfügen und speichern', async () => {
  const { page, problems } = await open('edit');
  await upload(page, 'a.pdf');
  const pg = page.locator('.epage').first(); await pg.waitFor();
  await page.getByRole('button', { name: 'Text' }).click();
  await pg.click({ position: { x: 100, y: 120 } });
  await page.keyboard.type('Hallo Prüfung');
  await page.getByRole('button', { name: 'Speichern' }).click();
  const out = await download(page);
  assert.equal((await PDFLib.PDFDocument.load(out)).getPageCount(), 3);
  assert.deepEqual(problems, []);
  await page.close();
});

for (const [tool, btn] of [['watermark', 'Wasserzeichen anwenden'], ['numbers', 'Seitenzahlen einfügen'], ['rotate', 'Gedreht speichern']]) {
  test(`${tool}: Ergebnis lässt sich laden`, async () => {
    const { page, problems } = await open(tool);
    await upload(page, 'a.pdf');
    await page.getByRole('button', { name: btn }).click();
    assert.equal((await PDFLib.PDFDocument.load(await download(page))).getPageCount(), 3);
    assert.deepEqual(problems, []);
    await page.close();
  });
}
