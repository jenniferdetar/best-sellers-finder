import { fetchAllCharts } from '../lib/sources.mjs';

export default async function handler(req, res) {
  try {
    const country = String(req.query.country || 'us').toLowerCase();
    const data = await fetchAllCharts({ country });
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch charts', detail: String(err?.message || err) });
  }
}
