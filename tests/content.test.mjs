import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent, validateMetadata, validateDeck, validateSvg } from '../scripts/content.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const { config, items } = await loadContent(root);
test('all published content is valid', () => {
  assert.ok(items.length > 0);
  for (const item of items) assert.ok(config.categories.includes(item.category));
});

test('loads selected previews independently of the native slide count', async t => {
  const temp = await mkdtemp(path.join(tmpdir(),'gallery-previews-'));
  t.after(async () => {
    assert.equal(path.dirname(temp),path.resolve(tmpdir()));
    await rm(temp,{recursive:true,force:true});
  });
  const item = items[0], folder = path.join(temp,'presentations',item.id);
  await mkdir(folder,{recursive:true});
  await writeFile(path.join(temp,'config.json'),JSON.stringify(config));
  for (const file of item.files) await cp(path.join(root,'presentations',item.id,file),path.join(folder,file));
  for (const count of [1,2]) {
    await writeFile(path.join(folder,'metadata.json'),JSON.stringify({...item,previews:item.previews.slice(0,count)}));
    const {items:loaded} = await loadContent(temp);
    assert.equal(loaded[0].previews.length,count);
    assert.equal(loaded[0].slideCount,item.slideCount);
  }
  assert.throws(() => validateMetadata({...item,previews:[]},item.id,config.categories),/previews are required/);
});
test('rejects unsafe paths, URLs, unknown categories and invalid dates', () => {
  for (const patch of [{ deck:'../secret.json' },{cover:'https://example.com/a.svg'},{ category:'Unknown' },{added:'2026-02-30'},{author:{name:'Someone',url:'javascript:alert(1)'}},{type:'upload'}]) {
    assert.throws(() => validateMetadata({ ...items[0], ...patch }, items[0].id, config.categories));
  }
});
test('rejects active SVG content', () => {
  for (const svg of ['<svg><script>alert(1)</script></svg>','<svg onload="alert(1)"></svg>','<svg><image href="https://example.com"/></svg>','<svg><foreignObject/></svg>','<!DOCTYPE svg><svg></svg>']) assert.throws(() => validateSvg(svg, 'test'));
  assert.doesNotThrow(() => validateSvg('<svg><rect width="10" height="10"/><text>Safe</text></svg>', 'test'));
});
test('rejects duplicate slide IDs and unsupported project formats', async () => {
  const deck = JSON.parse(await readFile(new URL(`../presentations/${items[0].id}/${items[0].deck}`, import.meta.url),'utf8'));
  const duplicate = structuredClone(deck); duplicate.state.slides[1].id = duplicate.state.slides[0].id;
  assert.throws(() => validateDeck(duplicate, 'test'));
  assert.throws(() => validateDeck({ ...deck, schemaVersion:999 }, 'test'));
  assert.doesNotThrow(() => validateDeck({ ...deck, schemaVersion:3 }, 'test'));
});
