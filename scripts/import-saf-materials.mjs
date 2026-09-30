import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { extname } from 'node:path';

// Only public, explicitly observed media URLs. Never store page HTML or widget credentials.
const source = JSON.parse(await readFile('docs/saf-materials-source.json', 'utf8'));
const catalog = JSON.parse(await readFile('src/data/saf-plans.json', 'utf8'));
const directory = 'src/assets/saf-avenue';
await mkdir(directory, { recursive: true });
const urls = [...new Set([...source.assets, ...source.brochures.map(item => item.url), ...catalog.plans.map(item => item.image)])];
const assets = [];
let cursor = 0;
async function download(url) {
  const parsed = new URL(url);
  if (!['static.tildacdn.pro', 'repos.masnaget.digital', 'pb4678.profitbase.ru'].includes(parsed.hostname) || parsed.search) throw new Error('Unexpected media source');
  const extension = extname(parsed.pathname).toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.svg', '.pdf'].includes(extension)) throw new Error('Unexpected media format');
  const file = `${createHash('sha256').update(url).digest('hex').slice(0, 16)}${extension}`;
  let bytes;
  try { bytes = await readFile(`${directory}/${file}`); } catch {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(90000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (!/image|pdf|octet-stream/.test(response.headers.get('content-type') || '')) throw new Error('Unexpected content type');
        bytes = Buffer.from(await response.arrayBuffer());
        if (!bytes.length || (extension === '.pdf' && bytes.subarray(0, 5).toString() !== '%PDF-')) throw new Error('Invalid media');
        await writeFile(`${directory}/${file}`, bytes);
        break;
      } catch (error) { if (attempt === 2) throw error; }
    }
  }
  assets.push({ source: url, file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
await Promise.all(Array.from({ length: 5 }, async () => {
  while (cursor < urls.length) {
    const index = cursor++;
    await download(urls[index]);
    if ((index + 1) % 25 === 0) console.log(`Imported ${index + 1}/${urls.length}`);
  }
}));
assets.sort((a, b) => a.source.localeCompare(b.source));
await writeFile('src/data/saf-materials.json', JSON.stringify({ source: source.source, capturedAt: source.capturedAt, brochures: source.brochures, sections: source.sections, assets }, null, 2) + '\n');
console.log(JSON.stringify({ files: assets.length, bytes: assets.reduce((sum, item) => sum + item.bytes, 0) }));
