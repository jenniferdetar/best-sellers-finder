import fs from 'node:fs/promises';
import path from 'node:path';

const HISTORY_DIR = path.join(process.cwd(), 'data', 'history');

async function listDates() {
  try {
    const files = await fs.readdir(HISTORY_DIR);
    return files
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''))
      .sort();
  } catch {
    return [];
  }
}

async function readSnapshot(date) {
  try {
    const raw = await fs.readFile(path.join(HISTORY_DIR, `${date}.json`), 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  try {
    const dates = await listDates();
    const { date, id, days } = req.query;

    if (id) {
      const n = Math.max(1, Math.min(365, Number(days) || 30));
      const recentDates = dates.slice(-n);
      const series = [];
      for (const d of recentDates) {
        const snapshot = await readSnapshot(d);
        const entry = snapshot.find((item) => item.id === id);
        if (entry) series.push({ date: d, rank: entry.rank, price: entry.price ?? null });
      }
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).json({ id, series });
    }

    if (date) {
      const snapshot = await readSnapshot(String(date));
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).json({ date, items: snapshot });
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ dates });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read history', detail: String(err?.message || err) });
  }
}
