# Best Sellers Finder

A ranked, searchable view of "best selling" / top charts, pulled live from
public sources that require no API key or signup:

- **Apple Marketing Tools RSS** — Apps (top free / top paid), Music (most
  played), Movies (top movies), Books (top free / top paid)
- **Steam featured categories** — Top Sellers (games)

Rank changes and trend sparklines are computed from a daily history of
snapshots stored as JSON in `data/history/`.

## How it works

- `lib/sources.mjs` — fetches and normalizes items from each source into a
  common shape (`id`, `source`, `chart`, `category`, `rank`, `name`,
  `subtitle`, `url`, `image`, `price`).
- `api/charts.js` — Vercel serverless function serving live current charts
  (`GET /api/charts?category=Apps`).
- `api/history.js` — serves historical snapshots for rank-change badges and
  sparklines (`GET /api/history`, `?date=YYYY-MM-DD`, or `?id=...&days=30`).
- `scripts/snapshot.mjs` — fetches current charts and writes
  `data/history/YYYY-MM-DD.json`. Run daily by
  `.github/workflows/snapshot.yml`, which commits the new file back to the
  repo so history accumulates for free with no external database.
- `src/` — the React (Vite) frontend: category tabs, search/filter, ranked
  list, and per-item trend sparklines.

## Planned: Amazon as a general-merchandise source

Amazon's Product Advertising API (PA-API 5.0) is planned as a future
adapter, covering general merchandise categories (Electronics, Toys, Home,
etc.) that the current sources don't reach. This requires an approved
Amazon Associates account and PA-API credentials (Access Key, Secret Key,
Partner Tag) — once those exist, add them as Vercel environment variables
and a corresponding adapter goes into `lib/sources.mjs` following the same
pattern as the Apple/Steam adapters. Note Amazon requires 3 qualifying
affiliate sales within 180 days of approval to keep PA-API access active.

Other sources (e.g. Etsy, eBay) can be added the same way once you have API
credentials for them.

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
configures the build. No environment variables are required for the
current sources since they're public and unauthenticated (Amazon, once
added, will need PA-API credentials as environment variables).

The GitHub Action in `.github/workflows/snapshot.yml` needs no secrets; it
uses the default `GITHUB_TOKEN` to commit daily snapshots.

## Note on network access during development

This project's data sources (`rss.applemarketingtools.com`,
`store.steampowered.com`) were designed and coded against their publicly
documented response shapes, but could not be live-tested from within the
sandboxed environment that generated this repo (its outbound network is
allowlisted and blocks arbitrary hosts). Verify the API responses once
deployed — `lib/sources.mjs` fails a single source gracefully (logs and
returns an empty list for that chart) so a schema drift in one source won't
break the others.
