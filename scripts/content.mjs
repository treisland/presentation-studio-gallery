import { readdir, readFile, lstat, realpath } from 'node:fs/promises';
import path from 'node:path';

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function assert(condition, message) { if (!condition) throw new Error(message); }
export function validateMetadata(m, folder, categories) {
  assert(m && typeof m === 'object' && !Array.isArray(m), `${folder}: metadata must be an object`);
  assert(m.id === folder && slugPattern.test(m.id), `${folder}: id must match its lowercase folder slug`);
  for (const key of ['title', 'description', 'license']) assert(typeof m[key] === 'string' && m[key].trim() && m[key].length <= (key === 'description' ? 600 : 120), `${folder}: invalid ${key}`);
  assert(categories.includes(m.category), `${folder}: unknown category`);
  assert(['showcase', 'template'].includes(m.type), `${folder}: type must be showcase or template`);
  assert(m.author && typeof m.author.name === 'string' && m.author.name.trim() && m.author.name.length <= 120, `${folder}: author.name is required`);
  if (m.author.url) assert(/^https:\/\//.test(m.author.url) && new URL(m.author.url).protocol === 'https:', `${folder}: author URL must use HTTPS`);
  assert(Array.isArray(m.tags) && m.tags.length <= 12 && m.tags.every(t => typeof t === 'string' && t.trim() && t.length <= 40), `${folder}: invalid tags`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(m.added) && !Number.isNaN(Date.parse(m.added)) && new Date(m.added).toISOString().slice(0, 10) === m.added, `${folder}: added must be a real YYYY-MM-DD date`);
  assert(Array.isArray(m.previews) && m.previews.length > 0 && m.previews.length <= 100, `${folder}: previews are required`);
  assert(typeof m.deck === 'string' && /\.json$/.test(m.deck), `${folder}: deck must be a Studio JSON file`);
  assert(typeof m.cover === 'string', `${folder}: cover is required`);
  for (const file of [m.cover, ...m.previews]) assert(typeof file === 'string' && /\.(svg|png|webp|jpe?g)$/i.test(file), `${folder}: previews must be SVG/PNG/WebP/JPEG images`);
  for (const file of [m.cover, m.deck, ...m.previews]) assert(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(file), `${folder}: assets must be local filenames without directories`);
}

export function validateDeck(deck, folder) {
  assert([2, 3].includes(deck?.schemaVersion) && deck.kind === 'presentation-studio-project', `${folder}: expected a Studio schemaVersion 2 or 3 project`);
  assert(typeof deck.meta?.id === 'string' && deck.meta.id && Array.isArray(deck.state?.slides) && deck.state.slides.length > 0, `${folder}: missing project ID or slides`);
  const ids = deck.state.slides.map(s => s.id);
  assert(ids.every(id => typeof id === 'string' && id) && new Set(ids).size === ids.length, `${folder}: slide IDs must be unique`);
  // Shape validation is deliberately not a replacement for Studio's import validation.
  assert(deck.state.slides.every(s => typeof s.title === 'string' && Array.isArray(s.tree)), `${folder}: invalid slide shape`);
}

export function validateSvg(source, folder) {
  // Allow only passive vector shapes/text; never publish active or externally-loaded SVG content.
  assert(!/<!|<\?|\bon\w+\s*=|\b(?:href|src|style)\s*=|url\s*\(|@import/i.test(source), `${folder}: SVG must be passive and self-contained`);
  const allowed = new Set(['svg','g','rect','circle','ellipse','path','line','polyline','polygon','text','tspan','title','desc','defs','clipPath']);
  for (const match of source.matchAll(/<\/?([\w:-]+)/g)) assert(allowed.has(match[1]), `${folder}: unsupported SVG element ${match[1]}`);
  assert(source.trimStart().startsWith('<svg') && source.trimEnd().endsWith('</svg>'), `${folder}: invalid SVG`);
}

export async function loadContent(root) {
  const config = JSON.parse(await readFile(path.join(root, 'config.json'), 'utf8'));
  const base = path.join(root, 'presentations');
  const items = [];
  for (const entry of (await readdir(base, { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const folder = entry.name, dir = path.join(base, folder);
    const m = JSON.parse(await readFile(path.join(dir, 'metadata.json'), 'utf8'));
    validateMetadata(m, folder, config.categories);
    const files = [...new Set([m.cover, m.deck, ...m.previews])];
    for (const file of files) {
      const full = path.join(dir, file);
      assert((await lstat(full)).isFile() && !(await lstat(full)).isSymbolicLink(), `${folder}: ${file} must be a regular file`);
      assert(path.dirname(await realpath(full)) === await realpath(dir), `${folder}: asset escapes its folder`);
      assert((await lstat(full)).size <= 15 * 1024 * 1024, `${folder}: ${file} exceeds 15 MiB; optimize it first`);
      if (/\.svg$/i.test(file)) validateSvg(await readFile(full, 'utf8'), folder);
    }
    const deck = JSON.parse(await readFile(path.join(dir, m.deck), 'utf8'));
    validateDeck(deck, folder);
    assert(m.previews.length === deck.state.slides.length, `${folder}: provide one preview per slide`);
    items.push({ ...m, slideCount: deck.state.slides.length, files });
  }
  assert(new Set(items.map(m => m.id)).size === items.length, 'Duplicate presentation ID');
  return { config, items };
}
