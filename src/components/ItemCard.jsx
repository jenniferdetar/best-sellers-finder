import { useState } from 'react';
import Sparkline from './Sparkline.jsx';
import { fetchItemHistory } from '../lib/api.js';

function RankChange({ current, previous }) {
  if (previous == null) return <span className="rank-change rank-new">New</span>;
  const delta = previous - current;
  if (delta === 0) return <span className="rank-change rank-flat">—</span>;
  if (delta > 0) return <span className="rank-change rank-up">▲ {delta}</span>;
  return <span className="rank-change rank-down">▼ {Math.abs(delta)}</span>;
}

export default function ItemCard({ item, previousRank }) {
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  async function toggleExpanded() {
    const next = !expanded;
    setExpanded(next);
    if (next && history === null && !loadingHistory) {
      setLoadingHistory(true);
      try {
        const data = await fetchItemHistory(item.id, 30);
        setHistory(data.series || []);
      } catch {
        setHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    }
  }

  return (
    <li className="item-card">
      <button className="item-card-main" onClick={toggleExpanded} aria-expanded={expanded}>
        <span className="item-rank">{item.rank}</span>
        {item.image ? (
          <img className="item-image" src={item.image} alt="" loading="lazy" />
        ) : (
          <span className="item-image item-image-placeholder" aria-hidden="true" />
        )}
        <span className="item-meta">
          <span className="item-name">{item.name}</span>
          {item.subtitle ? <span className="item-subtitle">{item.subtitle}</span> : null}
        </span>
        {item.price ? <span className="item-price">{item.price}</span> : null}
        <RankChange current={item.rank} previous={previousRank} />
      </button>

      {expanded && (
        <div className="item-detail">
          {loadingHistory ? (
            <span className="item-detail-loading">Loading trend…</span>
          ) : (
            <Sparkline series={history} />
          )}
          {item.url && (
            <a className="item-link" href={item.url} target="_blank" rel="noreferrer">
              View source ↗
            </a>
          )}
        </div>
      )}
    </li>
  );
}
