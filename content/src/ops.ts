// Question-bank operations shared by the CLI scripts and the admin server.

import type { Database } from "bun:sqlite";
import { today } from "./dates.ts";

export interface RejectResult {
  id: number;
  prompt: string;
  /** Set when the question was on a current/future day and got swapped out. */
  replaced?: { date: string; withId: number };
  /** Set when it was scheduled but nothing was available to replace it. */
  unreplaced?: string;
}

/**
 * Marks a question rejected so it's never scheduled again. If it sits on today's or a
 * future day, it's swapped for an unused question from the same pool (practical vs trivia).
 * Daily files must be re-exported afterwards.
 */
export function rejectQuestion(db: Database, id: number): RejectResult | null {
  const q = db
    .query<{ id: number; source: string; prompt: string }, [number]>("SELECT id, source, prompt FROM questions WHERE id = ?")
    .get(id);
  if (!q) return null;

  return db.transaction(() => {
    db.run("UPDATE questions SET status = 'rejected' WHERE id = ?", [id]);
    const result: RejectResult = { id, prompt: q.prompt };

    const slot = db
      .query<{ date: string; position: number }, [number]>(
        "SELECT date, position FROM daily_set_questions WHERE question_id = ?",
      )
      .get(id);
    if (!slot || slot.date < today()) return result;

    const replacement = db
      .query<{ id: number }, [string]>(`
        SELECT q.id FROM questions q
        LEFT JOIN daily_set_questions d ON d.question_id = q.id
        WHERE d.question_id IS NULL AND q.status = 'approved'
          AND (q.source = 'original') = (? = 'original')
        ORDER BY random() LIMIT 1
      `)
      .get(q.source);
    if (!replacement) {
      result.unreplaced = slot.date;
      return result;
    }
    db.run("UPDATE daily_set_questions SET question_id = ? WHERE date = ? AND position = ?", [
      replacement.id,
      slot.date,
      slot.position,
    ]);
    result.replaced = { date: slot.date, withId: replacement.id };
    return result;
  })();
}

/** Closes all open flags on a question. */
export function resolveFlags(db: Database, questionId: number, resolution: "rejected" | "edited" | "dismissed") {
  db.run(
    "UPDATE flags SET resolved_at = datetime('now'), resolution = ? WHERE question_id = ? AND resolved_at IS NULL",
    [resolution, questionId],
  );
}
