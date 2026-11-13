import { writeFile } from 'node:fs/promises';
const domain = (process.env.PAGES_DOMAIN || '').trim();
if (domain) {
  if (domain.length > 253 || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(domain)) throw new Error('PAGES_DOMAIN must be a hostname without scheme or path');
  await writeFile(new URL('../dist/CNAME', import.meta.url), domain + '\n');
}
