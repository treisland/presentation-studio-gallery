import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { startServer } from '../scripts/serve.mjs';
import { loadContent } from '../scripts/content.mjs';
import { fileURLToPath } from 'node:url';
const { items } = await loadContent(fileURLToPath(new URL('../', import.meta.url)));
const matches = (item, term) => [item.title,item.description,item.author.name,item.category,...item.tags].join(' ').toLowerCase().includes(term.toLowerCase());

test('gallery browsing, filters, themes, details, downloads and mobile layout', async () => {
  const server = await startServer(0);
  let browser;
  try { browser = await chromium.launch({ headless:true }); }
  catch (error) { await new Promise(resolve => server.close(resolve)); throw error; }
  const base = `http://127.0.0.1:${server.address().port}`;
  const page = await browser.newPage({ viewport:{width:1440,height:1100}, colorScheme:'light' });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(base); await page.locator('.card').first().waitFor();
    assert.equal(await page.locator('.card').count(),items.length);
    const cover = await page.locator('.cover').first().boundingBox();
    assert.ok(Math.abs(cover.width / cover.height - 16 / 9) < .02, 'covers keep their slide aspect ratio');
    assert.equal(await page.getByRole('link',{ name:'Docs',exact:false }).first().getAttribute('href'),'https://docs.pres-studio.com');
    await page.getByRole('button',{name:'Education',exact:true}).click(); assert.equal(await page.locator('.card').count(),items.filter(i => i.category === 'Education').length);
    await page.getByRole('button',{name:'All presentations',exact:true}).click();
    await page.getByRole('searchbox').fill('facilitation'); assert.equal(await page.locator('.card').count(),items.filter(i => matches(i,'facilitation')).length);
    await page.getByRole('searchbox').fill('no-such-presentation'); assert.equal(await page.locator('#empty').isVisible(),true);
    await page.getByRole('button',{name:'Clear filters'}).click();
    await page.getByRole('combobox',{name:'Presentation type'}).selectOption('showcase'); assert.equal(await page.locator('.card').count(),items.filter(i => i.type === 'showcase').length);
    await page.getByRole('combobox',{name:'Presentation type'}).selectOption('all');
    await page.getByRole('combobox',{name:'Color theme'}).selectOption('dark');
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    await page.reload(); await page.locator('.card').first().waitFor(); assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    await mkdir('test-results',{recursive:true}); await page.screenshot({path:'test-results/gallery-dark.png',fullPage:true});
    await page.getByRole('combobox',{name:'Color theme'}).selectOption('system');
    await page.emulateMedia({colorScheme:'dark'}); await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    await page.emulateMedia({colorScheme:'light'}); await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
    await page.screenshot({path:'test-results/gallery-light.png',fullPage:true});
    await page.locator('.card a').first().click(); await page.locator('#detail-title').waitFor();
    await page.goto(`${base}/#presentation/better-way-to-launch`); await page.locator('#detail-title').waitFor();
    assert.match(await page.locator('#slide-status').textContent(),/Slide 1 of 4/);
    await page.getByRole('button',{name:'Next',exact:false}).click(); assert.match(await page.locator('#slide-status').textContent(),/Slide 2 of 4/);
    const [download] = await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Download Studio JSON'}).click()]);
    assert.equal(download.suggestedFilename(),'presentation.json');
    const detailUrl = page.url(); await page.reload(); await page.locator('#detail-title').waitFor(); assert.equal(page.url(),detailUrl);
    await page.screenshot({path:'test-results/detail.png',fullPage:true});
    await page.getByRole('link',{name:'Back to the collection'}).click();
    await page.setViewportSize({width:390,height:844});
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({path:'test-results/gallery-mobile.png',fullPage:true});
    await page.goto(`${base}/?q=AI&type=template`); await page.locator('.card').first().waitFor(); assert.equal(await page.locator('.card').count(),items.filter(i => matches(i,'AI') && i.type === 'template').length);
    await page.goto(`${base}/#presentation/missing`); await page.getByRole('heading',{name:'Presentation not found.'}).waitFor();
    // Asset URLs resolve relative to a project Pages prefix as well as a custom-domain root.
    await page.route('**/presentation-studio-gallery/**', route => {
      const url = new URL(route.request().url()); url.pathname = url.pathname.replace('/presentation-studio-gallery',''); return route.continue({url:url.href});
    });
    await page.goto(`${base}/presentation-studio-gallery/`); await page.locator('.card').first().waitFor(); assert.equal(await page.locator('.card').count(),items.length);
    assert.deepEqual(errors,[]);
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
});
