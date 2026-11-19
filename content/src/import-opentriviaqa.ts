// Imports questions from OpenTriviaQA (https://github.com/uberspot/OpenTriviaQA).
//
// License: CC BY-SA 4.0, same terms as Open Trivia DB: credit the project in the app;
// questions we edit must stay CC BY-SA.
//
// Quality is uneven: hand-review new imports (and `reject` the weak ones) before
// running `schedule`, since imported questions are immediately eligible.
//
// Usage: bun src/import-opentriviaqa.ts <path-to-OpenTriviaQA-checkout> [category ...]
//   e.g. git clone --depth 1 https://github.com/uberspot/OpenTriviaQA /tmp/otqa
//        bun src/import-opentriviaqa.ts /tmp/otqa animals science-technology

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { openDb } from "./db.ts";

/** OpenTriviaQA file -> our category. Only categories that fit "general knowledge". */
const CATEGORIES: Record<string, string> = {
  animals: "Animals",
  "science-technology": "Science",
};

const MAX_PROMPT_CHARS = 150;
const MAX_CHOICE_CHARS = 60;

interface Parsed {
  prompt: string;
  correct: string;
  choices: string[];
}

/** Format: "#Q prompt" (may continue on following lines), "^ correct", then "A ...", "B ...", blank line. */
export function parse(text: string): Parsed[] {
  const out: Parsed[] = [];
  for (const block of text.replace(/\r/g, "").split(/\n(?=#Q )/)) {
    const lines = block.split("\n");
    if (!lines[0]?.startsWith("#Q ")) continue;
    const promptLines = [lines[0].slice(3)];
    let i = 1;
    while (i < lines.length && !lines[i]!.startsWith("^ ")) promptLines.push(lines[i++]!);
    const correct = lines[i]?.slice(2).trim();
    const choices = lines
      .slice(i + 1)
      .filter((l) => /^[A-Z] /.test(l))
      .map((l) => l.slice(2).trim());
    const prompt = promptLines.join(" ").replace(/\s+/g, " ").trim();
    if (prompt && correct && choices.includes(correct)) out.push({ prompt, correct, choices });
  }
  return out;
}

const [repo, ...requested] = process.argv.slice(2);
if (!repo) {
  console.error("Usage: bun src/import-opentriviaqa.ts <path-to-OpenTriviaQA> [category ...]");
  process.exit(1);
}
const categories = requested.length ? requested : Object.keys(CATEGORIES);

const db = openDb();
const insert = db.prepare(`
  INSERT OR IGNORE INTO questions (source, source_ref, category, type, prompt, correct, incorrect)
  VALUES ('opentriviaqa', $ref, $category, $type, $prompt, $correct, $incorrect)
`);
// Skip anything we already have from any source (same prompt text).
const existingPrompts = new Set(
  db
    .query<{ p: string }, []>("SELECT lower(prompt) AS p FROM questions")
    .all()
    .map((r) => r.p),
);

for (const file of categories) {
  const name = CATEGORIES[file];
  if (!name) throw new Error(`Unknown/excluded category "${file}"`);
  const parsed = parse(readFileSync(join(repo, "categories", file), "utf8"));
  let added = 0;
  let skipped = 0;

  db.transaction(() => {
    for (const q of parsed) {
      const incorrect = q.choices.filter((c) => c !== q.correct);
      const isBool = q.choices.length === 2 && q.choices.every((c) => /^(true|false)$/i.test(c));
      const tooLong = q.prompt.length > MAX_PROMPT_CHARS || q.choices.some((c) => c.length > MAX_CHOICE_CHARS);
      const badShape = isBool ? false : q.choices.length !== 4 || new Set(q.choices).size !== 4;
      if (tooLong || badShape || existingPrompts.has(q.prompt.toLowerCase())) {
        skipped++;
        continue;
      }
      const ref = createHash("sha1").update(`${file}:${q.prompt.toLowerCase()}`).digest("hex").slice(0, 16);
      added += insert.run({
        ref,
        category: name,
        type: isBool ? "boolean" : "multiple",
        prompt: q.prompt,
        correct: isBool ? (q.correct.toLowerCase() === "true" ? "True" : "False") : q.correct,
        incorrect: JSON.stringify(isBool ? [q.correct.toLowerCase() === "true" ? "False" : "True"] : incorrect),
      }).changes;
      existingPrompts.add(q.prompt.toLowerCase());
    }
  })();

  console.log(`${name} (${file}): +${added} new, ${skipped} skipped (too long, odd format, or duplicate)`);
}
db.close();
