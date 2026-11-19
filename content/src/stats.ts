// Quick overview of the question bank and schedule.

import { openDb } from "./db.ts";
import { today } from "./dates.ts";

const db = openDb();

console.log("Questions by source/category (approved, unused / total):");
console.table(
  db
    .prepare(`
      SELECT q.source, q.category,
        SUM(q.status = 'approved' AND d.question_id IS NULL) AS unused,
        COUNT(*) AS total
      FROM questions q
      LEFT JOIN daily_set_questions d ON d.question_id = q.id
      GROUP BY q.source, q.category
      ORDER BY q.source, q.category
    `)
    .all(),
);

const sched = db
  .prepare<{ last: string | null; upcoming: number }, { today: string }>(
    "SELECT MAX(date) AS last, SUM(date >= $today) AS upcoming FROM daily_sets",
  )
  .get({ today: today() });
console.log(`Scheduled through: ${sched?.last ?? "nothing yet"} (${sched?.upcoming ?? 0} upcoming day(s))`);
db.close();
