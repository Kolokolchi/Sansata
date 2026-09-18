import { readFile, mkdir, writeFile } from 'node:fs/promises';

const html = await readFile('dist/index.html', 'utf8');
const project = JSON.parse(await readFile('src/data/shattyq.json', 'utf8'));
const editorial = JSON.parse(await readFile('src/data/editorial.json', 'utf8'));

const routes = [
  'parametric-search',
  'visual',
  'visual/free',
  'favorite',
  'tour',
  'cloud-tour',
  'audiogid',
  'mortgage',
  'how-to-buy',
  'finishing',
  'location',
  'progress',
  'documents',
  'akcii',
  'news',
  'contacts',
  'privacy',
  'policy',
  ...[1, 2].flatMap((section) => [
    `visual/section/${section}`,
    ...Array.from({ length: 9 }, (_, index) => `visual/section/${section}/floor/${index + 1}`)
  ]),
  ...project.plans.map((plan) => `flat/${plan.id}`),
  ...project.plans.map((plan) => `flat-classic/${plan.id}`),
  ...editorial.promos.map((item) => `akcii/${item.id}`),
  ...editorial.news.map((item) => `news/${item.id}`)
];

for (const route of routes) {
  await mkdir(`dist/${route}`, { recursive: true });
  await writeFile(`dist/${route}/index.html`, html);
}

await writeFile('dist/404.html', html);
await writeFile('dist/.nojekyll', '');
console.log(`Generated static entrypoints for ${routes.length} routes.`);
