// Imports questions from Open Trivia DB (https://opentdb.com) into the local question bank.
//
// License: Open Trivia DB data is CC BY-SA 4.0. The app must credit Open Trivia DB,
// and any questions we modify must stay CC BY-SA. Our own app code is unaffected.
//
// Rate limit: 1 request per 5 seconds per IP. Safe to re-run; duplicates are skipped.
//
// Usage: bun src/import-opentdb.ts [categoryId ...]

import { createHash } from "node:crypto";
import { openDb } from "./db.ts";

/** Categories that fit "general knowledge". Pop-culture categories are left out on purpose. */
const CATEGORIES: Record<number, string> = {
  9: "General Knowledge",
  17: "Science",
  19: "Math",
  22: "Geography",
  23: "History",
  27: "Animals",
};

/** Keep questions readable within the 10-second timer. */
const MAX_PROMPT_CHARS = 150;
const MAX_CHOICE_CHARS = 60;

const API = "https://opentdb.com";
const DELAY_MS = 5500;

interface ApiQuestion {
  type: string;
  difficulty: string;
  category: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const b64 = (s: string) => Buffer.from(s, "base64").toString("utf8").trim();

let lastRequest = 0;
async function getJson<T>(url: string): Promise<T> {
  const wait = lastRequest + DELAY_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequest = Date.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return (await res.json()) as T;
}

async function main() {
  const ids = process.argv.slice(2).map(Number);
  const categories = ids.length ? ids : Object.keys(CATEGORIES).map(Number);
  for (const id of categories) {
    if (!CATEGORIES[id]) throw new Error(`Unknown/excluded category ${id}`);
  }

  const db = openDb();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO questions (source, source_ref, category, difficulty, type, prompt, correct, incorrect)
    VALUES ('opentdb', $ref, $category, $difficulty, $type, $prompt, $correct, $incorrect)
  `);

  const { token } = await getJson<{ token: string }>(`${API}/api_token.php?command=request`);

  for (const categoryId of categories) {
    const name = CATEGORIES[categoryId]!;
    let amount = 50;
    let added = 0;
    let skipped = 0;

    while (true) {
      const url = `${API}/api.php?amount=${amount}&category=${categoryId}&encode=base64&token=${token}`;
      const data = await getJson<{ response_code: number; results: ApiQuestion[] }>(url);

      if (data.response_code === 5) continue; // rate limited; getJson already waits
      if (data.response_code === 1) {
        // Fewer than `amount` left for this category. Ask for fewer.
        if (amount === 1) break;
        amount = Math.max(1, Math.floor(amount / 2));
        continue;
      }
      if (data.response_code === 4) break; // token has seen everything in this category
      if (data.response_code !== 0) throw new Error(`OpenTDB response_code ${data.response_code}`);

      for (const q of data.results) {
        const prompt = b64(q.question);
        const correct = b64(q.correct_answer);
        const incorrect = q.incorrect_answers.map(b64);
        const choices = [correct, ...incorrect];

        if (prompt.length > MAX_PROMPT_CHARS || choices.some((c) => c.length > MAX_CHOICE_CHARS)) {
          skipped++;
          continue;
        }

        const ref = createHash("sha1").update(prompt.toLowerCase()).digest("hex").slice(0, 16);
        const result = insert.run({
          ref,
          category: name,
          difficulty: b64(q.difficulty),
          type: b64(q.type) === "boolean" ? "boolean" : "multiple",
          prompt,
          correct,
          incorrect: JSON.stringify(incorrect),
        });
        added += result.changes;
      }
    }

    console.log(`${name}: +${added} new, ${skipped} skipped (too long)`);
  }

  db.close();
}

await main();
