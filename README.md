# Best Selling Books

A ranked, searchable view of best-selling books, pulled live from Apple's
Marketing Tools RSS feed — a public source that requires no API key or
signup (Books: Top Free, Top Paid).

Rank changes and trend sparklines are computed from a daily history of
snapshots stored as JSON in `data/history/`.

## How it works

- `lib/sources.mjs` — fetches and normalizes items from Apple's Books
  charts into a common shape (`id`, `source`, `chart`, `category`, `rank`,
  `name`, `subtitle`, `url`, `image`, `price`).
- `api/charts.js` — Vercel serverless function serving live current charts
  (`GET /api/charts`).
- `api/history.js` — serves historical snapshots for rank-change badges and
  sparklines (`GET /api/history`, `?date=YYYY-MM-DD`, or `?id=...&days=30`).
- `scripts/snapshot.mjs` — fetches current charts and writes
  `data/history/YYYY-MM-DD.json`. Run daily by
  `.github/workflows/snapshot.yml`, which commits the new file back to the
  repo so history accumulates for free with no external database.
- `src/` — the React (Vite) frontend: search/filter, ranked list, and
  per-item trend sparklines.

More sources (e.g. Etsy, eBay, Amazon, or re-adding apps/music/movies/games)
can be added later as additional adapters in `lib/sources.mjs`.

## Local development

Frontend only (no `/api` routes):

```
npm install
npm run dev
```

Full stack, including the `/api` routes (requires the [Vercel CLI](https://vercel.com/docs/cli)):

```
npm install -g vercel
vercel dev
```

## Deployment

Deploy to Vercel by importing this repository — `vercel.json` already
configures the build. No environment variables are required since the
source is public and unauthenticated.

The GitHub Action in `.github/workflows/snapshot.yml` needs no secrets; it
uses the default `GITHUB_TOKEN` to commit daily snapshots.

## Note on network access during development

This project's data source (`rss.applemarketingtools.com`) was designed and
coded against its publicly documented response shape, but could not be
live-tested from within the sandboxed environment that generated this repo
(its outbound network is allowlisted and blocks arbitrary hosts). Verify the
API response once deployed — `lib/sources.mjs` fails a single chart
gracefully (logs and returns an empty list) so a schema drift won't break
the whole app.
