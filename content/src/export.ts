// Writes each scheduled day to <outDir>/YYYY-MM-DD.json for the app to fetch.
// Answer order is shuffled deterministically per question, so re-exports are stable.
//
// Usage: bun src/export.ts [outDir=../app/public/daily] [fromDate=today]

import type { Database } from "bun:sqlite";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { DailyQuestion, DailySet } from "@wizzit/shared";
import { openDb, type QuestionRow } from "./db.ts";
import { isDate, today } from "./dates.ts";
import { seededRandom, shuffle } from "./rng.ts";

export const DEFAULT_OUT_DIR = join(import.meta.dir, "..", "..", "app", "public", "daily");

function toDaily(q: QuestionRow): DailyQuestion {
  const incorrect = JSON.parse(q.incorrect) as string[];
  let choices: string[];
  if (q.type === "boolean") {
    choices = ["True", "False"]; // keep a consistent order for true/false
  } else {
    choices = shuffle([q.correct, ...incorrect], seededRandom(`choices:${q.source}:${q.source_ref}`));
  }
  const out: DailyQuestion = {
    id: q.id,
    category: q.category,
    prompt: q.prompt,
    choices,
    answerIndex: choices.indexOf(q.correct),
    source: q.source,
  };
  if (q.explanation) out.explanation = q.explanation;
  return out;
}

/** Writes every scheduled day from `from` onward. Returns how many files were written. */
export function exportDays(db: Database, outDir = DEFAULT_OUT_DIR, from = today()): number {
  const dates = db
    .query<{ date: string }, [string]>("SELECT date FROM daily_sets WHERE date >= ? ORDER BY date")
    .all(from)
    .map((r) => r.date);
  const questionsFor = db.query<QuestionRow, [string]>(`
    SELECT q.* FROM daily_set_questions d
    JOIN questions q ON q.id = d.question_id
    WHERE d.date = ?
    ORDER BY d.position
  `);

  mkdirSync(outDir, { recursive: true });
  for (const date of dates) {
    const set: DailySet = { date, questions: questionsFor.all(date).map(toDaily) };
    for (const q of set.questions) {
      if (q.answerIndex < 0) throw new Error(`Question ${q.id} on ${date}: correct answer not among choices`);
    }
    writeFileSync(join(outDir, `${date}.json`), JSON.stringify(set, null, 2) + "\n");
  }
  return dates.length;
}

if (import.meta.main) {
  const outDir = resolve(process.argv[2] ?? DEFAULT_OUT_DIR);
  const from = process.argv[3] ?? today();
  if (!isDate(from)) throw new Error("fromDate must be YYYY-MM-DD");
  const db = openDb();
  console.log(`Exported ${exportDays(db, outDir, from)} day(s) to ${outDir}`);
  db.close();
}
