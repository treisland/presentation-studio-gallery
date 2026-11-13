import { mkdir, rm, cp, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadContent } from './content.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const { config, items } = await loadContent(root);
const out = path.join(root, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const name of ['index.html', 'styles.css', 'app.js', 'theme.js']) await cp(path.join(root, 'src', name), path.join(out, name));
await cp(path.join(root, 'assets'), path.join(out, 'assets'), { recursive: true });
for (const item of items) {
  const dir = path.join(out, 'presentations', item.id);
  await mkdir(dir, { recursive: true });
  for (const name of item.files) await cp(path.join(root, 'presentations', item.id, name), path.join(dir, name));
}
await writeFile(path.join(out, 'catalog.json'), JSON.stringify({ config, items: items.map(({ files, ...m }) => m) }, null, 2));
await writeFile(path.join(out, '.nojekyll'), '');
// Hash-based detail routes work without a Pages rewrite or domain-specific base path.
await writeFile(path.join(out, '404.html'), await readFile(path.join(out, 'index.html')));
console.log(`Built ${items.length} presentations into dist/`);
