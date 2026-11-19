# Plan

## Overview

A quick, fun daily brain workout. Every day, everyone gets the same 10 questions mixing general knowledge (geography, biology, history, fun facts) with **practical everyday math**: formulas that help in daily life, like squaring a wall or comparing interest rates.

It's about personal growth, not competition: no leaderboard, no accounts, no personal data.

## Gameplay

- **10 questions per day**, the same set for everyone, no category picking (everyone learns everything).
- **10 seconds max per question.** Reading time counts, so keep question text short.
- **1 point per correct answer** (max 10/day).
- **Daily streaks:** playing any day's set counts toward the streak, including sets played offline from downloaded content.
- Short explanation after each answer (the "why"), since learning is the point.
- **Share your score** at the end (see Sharing).

## Content

### Practical math (written by us, so we own it fully)
Written so they can be answered in 10 seconds: concept questions, estimates, or round numbers, not long calculations.

- Squaring walls / right angles: 3-4-5 rule, Pythagorean theorem
- Compass: bearings, back-bearings (±180°), cardinal degrees
- Money: simple vs. compound interest, rule of 72, percent off, tips
- Home: area for paint/flooring, roof pitch/slope
- Kitchen: recipe scaling, °C ↔ °F
- Travel: speed × time = distance, fuel economy

Question *templates* with random round numbers can generate many variants.

### General knowledge
- **Open Trivia DB** (opentdb.com): CC BY-SA 4.0. Commercial use OK.
  - Must credit Open Trivia DB in the app (about/credits page).
  - Any questions we edit must stay CC BY-SA (applies to the question data only, not the app code).
  - Import once into our DB (API limit: 1 request / 5 sec, 50 questions per call). Review for quality.
- **OpenTriviaQA** (github.com/uberspot/OpenTriviaQA): CC BY-SA 4.0, same terms. Animals + Science only, hand-reviewed (368 of 3,328 kept).
- **Not using The Trivia API:** CC BY-NC 4.0 (non-commercial only, paid plan otherwise).

## Users & data

- **No accounts. No server-side user data.**
- Streaks, history, and scores stored on-device (localStorage: the data is tiny; same eviction rules as IndexedDB).
- Request `navigator.storage.persist()`; encourage installing the PWA (iOS evicts storage for non-installed sites after 7 days unused).
- "Export / import progress" code for moving to a new device.
- Later, only if needed: optional passkey-based sync.

## Architecture

```
[ home machine ]                                    [ Cloudflare Pages ]
SQLite question bank + flags                        Vue PWA (static)
Bun scripts: import / author / schedule / export ─▶ /daily/YYYY-MM-DD.json
Bun server (bun run serve) ◀── CF Tunnel ── POST /api/flags (from the app)
  └── /admin page (flag review)  ◀── CF Access (recommended) ── me
```

- **Gameplay needs no backend.** Each day's set is static JSON on Cloudflare Pages, so the game works even if the home server is down.
- **Small home server for feedback only:** anonymous question flags in, admin page out. It shares the SQLite DB, so rejecting/editing a flagged question updates the schedule and re-exports the daily files directly. Deploy to Pages afterwards to publish.
- Schedule sets well in advance (always at least 7 days published ahead).
- The day's set is chosen by the **player's local date** (new set at their midnight).
- No cheating concerns (no leaderboard), so answers ship in the JSON.

## Question flags

- After answering, a player can flag the question ("Something wrong with this question?"), or flag any question from the results review.
- At the end, the results screen asks for a reason per flagged question (wrong answer, confusing, too obscure, typo, offensive, other) plus an optional comment, then sends them together.
- **Anonymous:** only question id, date, reason, comment are stored. No IPs (used in memory for rate limiting only), no device or user ids.
- Offline: feedback is queued on-device and sent when back online.
- Server checks: valid date, question really was in that day's set, known reason, comment ≤ 500 chars, max 10 per request, rate limited, CORS restricted to the app's origin.
- **Admin page** (`/admin`, needs `ADMIN_TOKEN`): flagged questions grouped and sorted by flag count, with reasons, comments, and schedule date. Actions: **Reject** (swapped out of upcoming days, files re-exported), **Edit** (imported questions only; our own are edited in `content/questions/*.ts`), **Dismiss**.
- Put the admin path behind **Cloudflare Access** as well as the token.

## Offline / PWA

- `vite-plugin-pwa` for the manifest + service worker.
- When online, prefetch the next 7 days of daily sets.
- App shell cached so it fully works offline.

## Sharing

- **Web Share API** (`navigator.share`) opens the phone's native share sheet, which covers every social app with no SDKs or tracking scripts.
- Fallback on desktop: "copy to clipboard".
- Share text, e.g.:
  ```
  Wizzit 2026-11-19 — 8/10 🔥 12-day streak
  🟩🟩🟥🟩🟩🟩🟥🟩🟩🟩
  https://<domain>
  ```
- Static Open Graph image for link previews (no per-score image generation for now).

## Stack

- **Frontend:** Vue 3 + Vite + TypeScript, `vite-plugin-pwa`
- **Content tooling:** Bun + `bun:sqlite`, TypeScript (shared `Question` types with the frontend)
- **Hosting:** Cloudflare Pages

## MVP scope

1. Question bank schema + Open Trivia DB importer + first batch of practical-math questions
2. Daily set scheduler/exporter to JSON
3. Vue PWA: play daily set, timer, scoring, explanations, streaks (local)
4. Offline prefetch
5. Share button
6. Credits page (Open Trivia DB attribution)

Later: progress export/import, optional sync, stats/history views.
