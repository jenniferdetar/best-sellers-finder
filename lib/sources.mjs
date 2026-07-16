// Public, no-auth-required "best selling / top charts" sources.
//
// Apple Marketing Tools RSS feeds: https://rss.applemarketingtools.com
// Steam featured categories:       https://store.steampowered.com/api/featuredcategories
//
// Both are publicly documented/used endpoints that require no API key.

const APPLE_CHARTS = [
  { category: 'Apps', chart: 'top-free', feedType: 'apps', feedName: 'top-free', resultKey: 'apps' },
  { category: 'Apps', chart: 'top-paid', feedType: 'apps', feedName: 'top-paid', resultKey: 'apps' },
  { category: 'Music', chart: 'most-played', feedType: 'music', feedName: 'most-played', resultKey: 'songs' },
  { category: 'Movies', chart: 'top-movies', feedType: 'movies', feedName: 'top-movies', resultKey: 'movies' },
  { category: 'Books', chart: 'top-free', feedType: 'books', feedName: 'top-free', resultKey: 'books' },
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

async function fetchSteamTopSellers(country) {
  const url = `https://store.steampowered.com/api/featuredcategories?cc=${country}&l=en`;
  const data = await fetchJson(url);
  const items = data?.top_sellers?.items ?? [];
  return items.map((item, i) => {
    const priceValue = typeof item.final_price === 'number' ? item.final_price / 100 : null;
    const currency = item.currency ?? null;
    return {
      id: makeId('Games', 'top-sellers', item.id ?? i),
      source: 'steam',
      chart: 'top-sellers',
      category: 'Games',
      rank: i + 1,
      name: item.name ?? 'Untitled',
      subtitle: item.discounted ? `${item.discount_percent}% off` : '',
      url: item.id ? `https://store.steampowered.com/app/${item.id}` : null,
      image: item.header_image ?? item.large_capsule_image ?? null,
      priceValue,
      price: priceValue != null && priceValue === 0 ? 'Free' : priceValue != null ? formatPrice(priceValue, currency) : null,
      currency,
    };
  });
}

function formatPrice(value, currency) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

// Fetches every chart, tolerating individual source failures so one flaky
// upstream doesn't take down the whole response.
export async function fetchAllCharts({ country = 'us', category, limit = 25 } = {}) {
  const jobs = [];

  for (const def of APPLE_CHARTS) {
    if (category && def.category.toLowerCase() !== category.toLowerCase()) continue;
    jobs.push(
      fetchAppleChart(def, country, limit).catch((err) => {
        console.error(`apple ${def.chart} failed:`, err.message);
        return [];
      })
    );
  }

  if (!category || category.toLowerCase() === 'games') {
    jobs.push(
      fetchSteamTopSellers(country).catch((err) => {
        console.error('steam top-sellers failed:', err.message);
        return [];
      })
    );
  }

  const results = await Promise.all(jobs);
  const items = results.flat();

  return {
    items,
    updatedAt: new Date().toISOString(),
    categories: [...new Set(APPLE_CHARTS.map((d) => d.category).concat('Games'))],
  };
}
