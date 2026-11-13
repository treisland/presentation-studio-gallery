import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { readFile, mkdir, writeFile, cp, access, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugPattern, validateDeck, assert } from './content.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(await readFile(path.join(root, 'config.json'), 'utf8'));
const rl = createInterface({ input: stdin, output: stdout });
try {
  const ask = async (q, fallback = '') => (await rl.question(`${q}${fallback ? ` [${fallback}]` : ''}: `)).trim() || fallback;
  const title = await ask('Title');
  const suggestion = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const id = await ask('Permanent ID / folder slug', suggestion); assert(slugPattern.test(id), 'Use a lowercase hyphenated slug');
  const destination = path.join(root, 'presentations', id);
  let exists = false; try { await access(destination); exists = true; } catch {}
  assert(!exists, 'That presentation ID already exists; choose another or edit it in place');
  const description = await ask('Short description');
  console.log(`Categories: ${config.categories.join(', ')}`);
  const category = await ask('Category'); assert(config.categories.includes(category), 'Choose an exact category from the list');
  const type = await ask('Type: showcase or template', 'template'); assert(['showcase','template'].includes(type), 'Invalid type');
  const tags = (await ask('Tags, separated by commas')).split(',').map(t => t.trim()).filter(Boolean);
  const author = { name: await ask('Author name') }; const url = await ask('Author HTTPS URL (optional)'); if (url) author.url = url;
  const license = await ask('Content license (only choose a license you can grant)', 'Apache-2.0');
  const deckPath = path.resolve(await ask('Path to an exported Studio JSON'));
  const deck = JSON.parse(await readFile(deckPath, 'utf8')); validateDeck(deck, id);
  const previewDir = path.resolve(await ask('Directory of slide previews (01.png, 02.png, etc.; alphabetical order)'));
  const { readdir } = await import('node:fs/promises');
  const previews = (await readdir(previewDir)).filter(f => /\.(png|webp|jpe?g|svg)$/i.test(f)).sort();
  assert(previews.length === deck.state.slides.length, `Expected ${deck.state.slides.length} preview images`);
  const metadata = { id, title, description, category, tags, type, author, license, added: new Date().toISOString().slice(0,10), cover: previews[0], deck: 'presentation.json', previews };
  const { validateMetadata, validateSvg } = await import('./content.mjs');
  validateMetadata(metadata, id, config.categories);
  for (const file of previews) { const stat = await lstat(path.join(previewDir,file)); assert(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 15 * 1024 * 1024, `Invalid or oversized image: ${file}`); if (file.endsWith('.svg')) validateSvg(await readFile(path.join(previewDir,file),'utf8'), id); }
  await mkdir(destination);
  await cp(deckPath, path.join(destination, 'presentation.json'));
  for (const file of previews) await cp(path.join(previewDir, file), path.join(destination, file));
  await writeFile(path.join(destination, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n');
  console.log(`Added presentations/${id}. Run npm run check and inspect the preview before opening a pull request.`);
} catch (error) { console.error(error.message); process.exitCode = 1; } finally { rl.close(); }
