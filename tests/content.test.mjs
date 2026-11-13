import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadContent, validateMetadata, validateDeck, validateSvg } from '../scripts/content.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const { config, items } = await loadContent(root);
test('all published content is valid', () => {
  assert.ok(items.length > 0);
  for (const item of items) assert.ok(config.categories.includes(item.category));
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
