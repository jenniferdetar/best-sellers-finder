// Public, no-auth-required "best selling books" source.
//
// Apple Marketing Tools RSS feeds: https://rss.applemarketingtools.com
//
// A publicly documented/used endpoint that requires no API key.

const APPLE_CHARTS = [
  { category: 'Books', chart: 'top-free', feedType: 'books', feedName: 'top-free', resultKey: 'books' },
  { category: 'Books', chart: 'top-paid', feedType: 'books', feedName: 'top-paid', resultKey: 'books' },
];

const FETCH_TIMEOUT_MS = 8000;

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`${url} responded ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function makeId(category, chart, sourceId) {
  return `${category}:${chart}:${sourceId}`.toLowerCase().replace(/\s+/g, '-');
}

async function fetchAppleChart(def, country, limit) {
  const url = `https://rss.applemarketingtools.com/api/v2/${country}/${def.feedType}/${def.feedName}/${limit}/${def.resultKey}.json`;
  const data = await fetchJson(url);
  const results = data?.feed?.results ?? [];
  return results.map((r, i) => ({
    id: makeId(def.category, def.chart, r.id ?? r.url ?? `${def.chart}-${i}`),
    source: 'apple',
    chart: def.chart,
    category: def.category,
    rank: i + 1,
    name: r.name ?? 'Untitled',
    subtitle: r.artistName ?? '',
    url: r.url ?? null,
    image: r.artworkUrl100 ?? null,
    priceValue: null,
    price: null,
    currency: null,
  }));
}

// Fetches every chart, tolerating individual source failures so one flaky
// upstream doesn't take down the whole response.
export async function fetchAllCharts({ country = 'us', limit = 25 } = {}) {
  const jobs = APPLE_CHARTS.map((def) =>
    fetchAppleChart(def, country, limit).catch((err) => {
      console.error(`apple ${def.chart} failed:`, err.message);
      return [];
    })
  );

  const results = await Promise.all(jobs);
  const items = results.flat();

  return {
    items,
    updatedAt: new Date().toISOString(),
    categories: [...new Set(APPLE_CHARTS.map((d) => d.category))],
  };
}
