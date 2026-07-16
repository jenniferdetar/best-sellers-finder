import { useEffect, useMemo, useState } from 'react';
import ItemCard from './components/ItemCard.jsx';
import { fetchCharts, fetchHistoryDates, fetchSnapshot } from './lib/api.js';
import './App.css';

const CATEGORIES = ['All', 'Apps', 'Music', 'Movies', 'Books', 'Games'];

function groupByChart(items) {
  const groups = new Map();
  for (const item of items) {
    const key = `${item.category} · ${item.chart}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

export default function App() {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [previousRanks, setPreviousRanks] = useState(new Map());
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError(null);

    fetchCharts(category === 'All' ? undefined : category)
      .then((data) => {
        if (cancelled) return;
        setItems(data.items || []);
        setUpdatedAt(data.updatedAt || null);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { dates } = await fetchHistoryDates();
        const today = new Date().toISOString().slice(0, 10);
        const previousDate = dates.filter((d) => d !== today).at(-1);
        if (!previousDate) return;
        const { items: snapshotItems } = await fetchSnapshot(previousDate);
        if (cancelled) return;
        setPreviousRanks(new Map(snapshotItems.map((i) => [i.id, i.rank])));
      } catch {
        // Trend data is best-effort; charts still work without it.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? items.filter((i) => i.name.toLowerCase().includes(q) || i.subtitle?.toLowerCase().includes(q))
      : items;
    return groupByChart(filtered);
  }, [items, query]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Best Sellers Finder</h1>
        <p className="app-subtitle">
          Live top charts from public, no-signup sources — Apple (apps, music, movies, books) and Steam (games).
        </p>
      </header>

      <nav className="category-tabs" aria-label="Category">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={c === category ? 'tab tab-active' : 'tab'}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </nav>

      <div className="search-row">
        <input
          type="search"
          placeholder="Search this category…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search"
        />
        {updatedAt && <span className="updated-at">Updated {new Date(updatedAt).toLocaleString()}</span>}
      </div>

      {status === 'loading' && <p className="status-message">Loading charts…</p>}
      {status === 'error' && (
        <p className="status-message status-error">
          Couldn&apos;t load charts ({error}). If you&apos;re running <code>vite dev</code> without{' '}
          <code>vercel dev</code>, the <code>/api</code> routes won&apos;t be available locally.
        </p>
      )}
      {status === 'ready' && filteredGroups.size === 0 && <p className="status-message">No items match your search.</p>}

      {status === 'ready' &&
        [...filteredGroups.entries()].map(([groupKey, groupItems]) => (
          <section key={groupKey} className="chart-section">
            <h2>{groupKey}</h2>
            <ul className="item-list">
              {groupItems.map((item) => (
                <ItemCard key={item.id} item={item} previousRank={previousRanks.get(item.id)} />
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
