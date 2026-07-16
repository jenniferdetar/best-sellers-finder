// Tiny inline SVG sparkline of rank over time. Rank 1 is "best", so the
// y-axis is inverted (lower rank number draws higher on the chart).
export default function Sparkline({ series, width = 120, height = 32 }) {
  if (!series || series.length < 2) {
    return <span className="sparkline-empty">Not enough history yet</span>;
  }

  const ranks = series.map((p) => p.rank);
  const min = Math.min(...ranks);
  const max = Math.max(...ranks);
  const span = Math.max(1, max - min);
  const stepX = width / (series.length - 1);

  const points = series
    .map((p, i) => {
      const x = i * stepX;
      const y = span === 0 ? height / 2 : ((p.rank - min) / span) * (height - 4) + 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const first = series[0].rank;
  const last = series[series.length - 1].rank;
  const trend = last < first ? 'up' : last > first ? 'down' : 'flat';

  return (
    <svg
      className={`sparkline sparkline-${trend}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Rank trend from ${first} to ${last}`}
    >
      <polyline points={points} fill="none" strokeWidth="2" />
    </svg>
  );
}
