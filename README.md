# Wizzit

A 2-minute daily brain workout: 10 questions, 10 seconds each, the same set for everyone.
General knowledge mixed with everyday math you'll actually use: squaring a wall with the
3-4-5 rule, reading a compass, how compound interest grows, when lightning is too close.

No accounts and no tracking. Scores and streaks stay on the player's device.

## How it fits together

```
app/       Vue 3 + Vite player app (static; deploys to Cloudflare Pages)
content/   Bun tooling: question bank (SQLite), importers, scheduler, exporter,
           plus a small server for anonymous question flags and an admin page
shared/    TypeScript types shared by both
```

Each day's questions are exported as static JSON (`app/public/daily/YYYY-MM-DD.json`), so
gameplay never depends on a server. The server only collects player flags and hosts the
admin review page. See [plan.md](plan.md) for the design and [content/README.md](content/README.md)
for the content workflow.

## Getting started

Requires [Bun](https://bun.sh) 1.4+.

```sh
bun install
bun run restore          # build content/data/wizzit.db from content/data/questions.sql
bun run dev              # player app on http://localhost:5173
ADMIN_TOKEN=change-me bun run serve   # flags API + admin page on http://127.0.0.1:8787/admin
```

Day-to-day content work:

```sh
bun run schedule         # fill upcoming days
bun run export           # write the daily JSON files
bun run dump             # snapshot questions + schedule to content/data/questions.sql (commit it)
```

## The database

The live SQLite file (`content/data/wizzit.db`) is **not** in git: once the game is live it
holds player flags, which stay private. The question bank and schedule are versioned as a
readable SQL snapshot in `content/data/questions.sql`:

- After changing questions or the schedule: `bun run dump`, then commit the snapshot.
- On a new machine or the server: `bun run restore` (refuses to overwrite an existing DB).
- To move the live database, flags included, copy the `.db` file itself while the server is
  stopped.

## Licenses

- **Code:** [MIT](LICENSE).
- **Question content:** [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
  - General knowledge questions come from [Open Trivia Database](https://opentdb.com) and
    [OpenTriviaQA](https://github.com/uberspot/OpenTriviaQA), both CC BY-SA 4.0. Some were
    lightly edited.
  - Everyday math and safety questions were written for Wizzit using public-domain US
    government guidance (USDA, NIST, OSHA, NOAA, USGS). Math topics follow OpenStax
    *Contemporary Mathematics* and *Prealgebra 2e* (CC BY 4.0).
