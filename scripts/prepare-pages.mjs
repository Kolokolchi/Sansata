import { readFile, mkdir, writeFile } from 'node:fs/promises';

const html = await readFile('dist/index.html', 'utf8');
const catalog = JSON.parse(await readFile('src/data/saf-plans.json', 'utf8'));
const stock = JSON.parse(await readFile('src/data/saf-stock-snapshot.json', 'utf8'));
const routes = new Set([
  'projects', 'saf', 'saf/visual', 'saf/chessboard', 'saf/stock', 'saf/materials',
  'tour', 'visual', 'sandbox/greybox-tour', 'sandbox/zems-tour'
]);

for (const apartment of stock.observations) {
  if (apartment.kind !== 'residential') continue;
  if (!/^saf-observation-[\w-]+$/.test(apartment.id) || !/^[1-7]$/.test(apartment.section) || !Number.isInteger(apartment.floor)) {
    throw new Error('Invalid public apartment route');
  }
  routes.add(`saf/apartment/${apartment.id}`);
  routes.add(`saf/visual/block/${apartment.section}`);
  routes.add(`saf/visual/block/${apartment.section}/floor/${apartment.floor}`);
}

for (const plan of catalog.plans) {
  const place = /^KV-P([1-7])-(E\d+|T\d+)-S\d+$/.exec(plan.code);
  if (!place) throw new Error(`Invalid public plan code: ${plan.code}`);
  routes.add(`saf/visual/block/${place[1]}`);
  routes.add(`saf/visual/block/${place[1]}/level/${place[2]}`);
  routes.add(`saf/plan/${plan.code}`);
}

for (const route of routes) {
  await mkdir(`dist/${route}`, { recursive: true });
  await writeFile(`dist/${route}/index.html`, html);
}

await writeFile('dist/404.html', html);
await writeFile('dist/.nojekyll', '');
console.log(`Generated static entrypoints for ${routes.size} routes.`);
