# Content tooling

Bun scripts that manage the question bank (`data/wizzit.db`, SQLite) and export daily sets
as static JSON for the app. Nothing here runs in production.

## Workflow

```sh
bun run import:opentdb   # pull general-knowledge questions (slow: API allows 1 req / 5 s)
bun run import:opentriviaqa <path-to-checkout>   # git clone --depth 1 https://github.com/uberspot/OpenTriviaQA
bun run seed             # upsert our practical-math questions from questions/*.ts
bun run schedule         # fill the next 14 days that don't have a set yet
bun run export           # write ../app/public/daily/YYYY-MM-DD.json from today on
bun run stats            # what's left in the bank, how far ahead we're scheduled
bun run reject 123 456   # never use these questions; swaps them out of future days
```

`schedule` takes `[days] [startDate]`, e.g. `bun run schedule 30`.

## Server (flags + admin)

```sh
ADMIN_TOKEN=$(openssl rand -hex 32) APP_ORIGINS=https://your-app.pages.dev bun run serve
```

- `POST /api/flags`: anonymous player flags (validated, rate limited, CORS-restricted).
- `/admin`: review flagged questions; reject / edit / dismiss. Rejecting or editing re-exports
  the daily files; deploy to Pages afterwards to publish.
- Listens on `127.0.0.1:8787` by default for the Cloudflare Tunnel. Put `/admin` behind
  Cloudflare Access too. Other env vars: `PORT`, `HOST`, `EXPORT_DIR`, `WIZZIT_DB` (use a copy
  of the database for testing).
- The app reads the API location from `VITE_API_URL` at build time; in dev, Vite proxies
  `/api` to the local server.

## Rules

- 10 questions per day: 3 practical math + 7 general knowledge, spread across categories.
- A question is used on at most one day, ever.
- Keep at least 7 days scheduled and exported ahead (the app prefetches a week).
- Practical-math `ref`s are permanent ids: edit text in place, never rename a ref.
- Every question must be answerable in 10 seconds.

## Licensing

- `opentdb` questions: [Open Trivia DB](https://opentdb.com), CC BY-SA 4.0. Credit them in the app.
  Edited versions must stay CC BY-SA.
- `opentriviaqa` questions: [OpenTriviaQA](https://github.com/uberspot/OpenTriviaQA), CC BY-SA 4.0. Same terms.
  Only the `animals` and `science-technology` categories are imported; quality is uneven, so
  review new imports and `reject` the weak ones before running `schedule`.
- `original` questions (`questions/*.ts`): ours. Facts come from public-domain US government
  sources where possible (USDA, NIST, OSHA, NOAA/NWS, USGS); the sources are listed at the top
  of each file.

## Review standard

Keep: common knowledge, and "huh, I didn't know that" facts worth learning (a group of crows is
a murder; an octopus has three hearts). Reject: specialist trivia, exact dates/numbers nobody
could know, niche pop culture, outdated "as of" facts, duplicates, and anything wrong.
