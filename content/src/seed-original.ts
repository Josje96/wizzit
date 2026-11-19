// Upserts our own questions (content/questions/*.ts) into the question bank.
// Safe to re-run after editing question text; matched by `ref`. Doesn't touch status.

import { openDb } from "./db.ts";
import { practicalMath, type OriginalQuestion } from "../questions/practical-math.ts";
import { everyday } from "../questions/everyday.ts";
import { mathBasics } from "../questions/math-basics.ts";

const MAX_PROMPT_CHARS = 150;

function validate(questions: OriginalQuestion[]) {
  const errors: string[] = [];
  const refs = new Set<string>();
  for (const q of questions) {
    if (refs.has(q.ref)) errors.push(`${q.ref}: duplicate ref`);
    refs.add(q.ref);
    const choices = [q.correct, ...q.incorrect];
    if (new Set(choices).size !== choices.length) errors.push(`${q.ref}: duplicate choices ${choices.join(" | ")}`);
    if (q.incorrect.length !== 3) errors.push(`${q.ref}: needs exactly 3 incorrect answers`);
    if (q.prompt.length > MAX_PROMPT_CHARS) errors.push(`${q.ref}: prompt is ${q.prompt.length} chars (max ${MAX_PROMPT_CHARS})`);
    if (!q.explanation) errors.push(`${q.ref}: missing explanation`);
  }
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
}

const questions = [...practicalMath, ...everyday, ...mathBasics];
validate(questions);

const db = openDb();
const upsert = db.prepare(`
  INSERT INTO questions (source, source_ref, category, type, prompt, correct, incorrect, explanation)
  VALUES ('original', $ref, $category, 'multiple', $prompt, $correct, $incorrect, $explanation)
  ON CONFLICT (source, source_ref) DO UPDATE SET
    category = excluded.category,
    prompt = excluded.prompt,
    correct = excluded.correct,
    incorrect = excluded.incorrect,
    explanation = excluded.explanation
`);

db.transaction(() => {
  for (const q of questions) {
    upsert.run({
      ref: q.ref,
      category: q.category,
      prompt: q.prompt,
      correct: q.correct,
      incorrect: JSON.stringify(q.incorrect),
      explanation: q.explanation,
    });
  }
})();

console.log(`Seeded ${questions.length} original questions.`);
db.close();
