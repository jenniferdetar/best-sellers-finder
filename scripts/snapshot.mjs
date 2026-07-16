import fs from 'node:fs/promises';
import path from 'node:path';
import { fetchAllCharts } from '../lib/sources.mjs';

const today = new Date().toISOString().slice(0, 10);

const { items } = await fetchAllCharts({ country: 'us' });

if (items.length === 0) {
  console.error('No items fetched from any source — skipping snapshot write to avoid overwriting good data with an empty one.');
  process.exit(1);
}

const slim = items.map((item) => ({
  id: item.id,
  source: item.source,
  chart: item.chart,
  category: item.category,
  rank: item.rank,
  name: item.name,
  price: item.price,
}));

const dir = path.join(process.cwd(), 'data', 'history');
await fs.mkdir(dir, { recursive: true });
await fs.writeFile(path.join(dir, `${today}.json`), JSON.stringify(slim, null, 2));

console.log(`Wrote snapshot for ${today}: ${slim.length} items across ${new Set(slim.map((i) => i.category)).size} categories`);
