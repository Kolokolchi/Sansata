import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('src/assets/saf-brochures', { recursive: true });
const documents = [
  { id: 'residential', title: 'Жилой комплекс', source: 'https://repos.masnaget.digital/sg/pres/saf_avenue.pdf', file: 'c2f507530239ebe7.pdf', pages: 35 },
  { id: 'commercial', title: 'Коммерческие помещения', source: 'https://repos.masnaget.digital/sg/pres/safcomm.pdf', file: 'ee4e70255367198c.pdf', pages: 31 },
];
for (const document of documents) {
  execFileSync('pdftoppm', ['-scale-to', '1800', '-jpeg', '-jpegopt', 'quality=88', `src/assets/saf-avenue/${document.file}`, `src/assets/saf-brochures/${document.id}`]);
  console.log(`Rendered ${document.id}: ${document.pages} pages`);
}
await writeFile('src/data/saf-brochures.json', JSON.stringify(documents, null, 2)+'\n');
