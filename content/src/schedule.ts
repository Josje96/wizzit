// Fills in daily sets for upcoming days that don't have one yet.
// Each set mixes practical math (our questions) with general knowledge (Open Trivia DB).
// A question is never used on more than one day.
//
// Usage: bun src/schedule.ts [days=14] [startDate=today]

import { QUESTIONS_PER_DAY } from "@wizzit/shared";
import { openDb } from "./db.ts";
import { addDays, isDate, today } from "./dates.ts";
import { seededRandom, shuffle } from "./rng.ts";

/** How many of the day's questions are practical math. The rest are general knowledge. */
const PRACTICAL_PER_DAY = 3;

const days = Number(process.argv[2] ?? 14);
const start = process.argv[3] ?? today();
if (!Number.isInteger(days) || days < 1) throw new Error("days must be a positive integer");
if (!isDate(start)) throw new Error("startDate must be YYYY-MM-DD");

const db = openDb();

// Two pools: our practical questions ("original") and trivia (every imported source).
const unused = db.prepare<{ id: number; category: string }, { practical: number }>(`
  SELECT q.id, q.category FROM questions q
  LEFT JOIN daily_set_questions d ON d.question_id = q.id
  WHERE d.question_id IS NULL AND q.status = 'approved'
    AND (q.source = 'original') = ($practical = 1)
  ORDER BY q.id
`);
const hasSet = db.prepare<{ date: string }, { date: string }>("SELECT date FROM daily_sets WHERE date = $date");
const insertSet = db.prepare("INSERT INTO daily_sets (date) VALUES ($date)");
const insertItem = db.prepare(
  "INSERT INTO daily_set_questions (date, position, question_id) VALUES ($date, $position, $question_id)",
);

/** Pick n questions, spreading across categories so a day isn't all one topic. */
function pickSpread(pool: { id: number; category: string }[], n: number, rand: () => number): number[] {
  const byCategory = new Map<string, number[]>();
  for (const q of shuffle(pool, rand)) {
    byCategory.set(q.category, [...(byCategory.get(q.category) ?? []), q.id]);
  }
  const queues = shuffle([...byCategory.values()], rand);
  const picked: number[] = [];
  while (picked.length < n && queues.some((q) => q.length)) {
    for (const q of queues) {
      const id = q.shift();
      if (id !== undefined) picked.push(id);
      if (picked.length === n) break;
    }
  }
  return picked;
}

let created = 0;
for (let i = 0; i < days; i++) {
  const date = addDays(start, i);
  if (hasSet.get({ date })) continue;

  const rand = seededRandom(`schedule:${date}`);
  const practical = pickSpread(unused.all({ practical: 1 }), PRACTICAL_PER_DAY, rand);
  const trivia = pickSpread(unused.all({ practical: 0 }), QUESTIONS_PER_DAY - practical.length, rand);
  const ids = shuffle([...practical, ...trivia], rand);

  if (ids.length < QUESTIONS_PER_DAY) {
    console.error(`Out of questions at ${date} (have ${ids.length}/${QUESTIONS_PER_DAY}). Import or write more.`);
    break;
  }

  db.transaction(() => {
    insertSet.run({ date });
    ids.forEach((question_id, position) => insertItem.run({ date, position, question_id }));
  })();
  created++;
}

const remaining = {
  practical: unused.all({ practical: 1 }).length,
  trivia: unused.all({ practical: 0 }).length,
};
const triviaPerDay = QUESTIONS_PER_DAY - PRACTICAL_PER_DAY;
console.log(`Scheduled ${created} new day(s) from ${start}.`);
console.log(`Unused questions left: ${remaining.practical} practical, ${remaining.trivia} trivia.`);
console.log(
  `That's ~${Math.floor(remaining.practical / PRACTICAL_PER_DAY)} more days of practical math ` +
    `and ~${Math.floor(remaining.trivia / triviaPerDay)} of trivia.`,
);
db.close();
