// Marks questions as rejected so they're never scheduled. If one is already on today's or a
// future day, it's swapped out for an unused question from the same pool. Re-run export after.
//
// Usage: bun src/reject.ts <questionId> [questionId ...]

import { openDb } from "./db.ts";
import { rejectQuestion, resolveFlags } from "./ops.ts";

const ids = process.argv.slice(2).map(Number);
if (!ids.length || ids.some((n) => !Number.isInteger(n))) {
  console.error("Usage: bun src/reject.ts <questionId> [questionId ...]");
  process.exit(1);
}

const db = openDb();
for (const id of ids) {
  const r = rejectQuestion(db, id);
  if (!r) {
    console.warn(`#${id}: not found`);
    continue;
  }
  resolveFlags(db, id, "rejected");
  console.log(`#${id} rejected: ${r.prompt}`);
  if (r.replaced) console.log(`  Replaced on ${r.replaced.date} with #${r.replaced.withId}. Re-run export.`);
  if (r.unreplaced) console.warn(`  No unused question to replace it on ${r.unreplaced}!`);
}
db.close();
