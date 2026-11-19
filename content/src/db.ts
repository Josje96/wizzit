import { Database } from "bun:sqlite";
import { join } from "node:path";
import type { QuestionSource } from "@wizzit/shared";

export const DB_PATH = process.env.WIZZIT_DB ?? join(import.meta.dir, "..", "data", "wizzit.db");

export type QuestionStatus = "approved" | "rejected";

export interface QuestionRow {
  id: number;
  source: QuestionSource;
  source_ref: string;
  category: string;
  difficulty: string | null;
  type: "multiple" | "boolean";
  prompt: string;
  correct: string;
  incorrect: string; // JSON array of strings
  explanation: string | null;
  status: QuestionStatus;
  created_at: string;
}

export function openDb(path = DB_PATH): Database {
  const db = new Database(path, { create: true, strict: true });
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  migrate(db);
  return db;
}

function migrate(db: Database) {
  // v1 restricted `source` with a CHECK constraint. SQLite can't drop a constraint,
  // so rebuild the table once (ids are preserved, so schedules stay valid).
  const existing = db
    .query<{ sql: string }, []>("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'questions'")
    .get();
  if (existing?.sql.includes("CHECK (source IN")) {
    db.exec("PRAGMA foreign_keys = OFF;");
    db.transaction(() => {
      db.exec(`
        CREATE TABLE questions_new (
          id          INTEGER PRIMARY KEY,
          source      TEXT NOT NULL,
          source_ref  TEXT NOT NULL,
          category    TEXT NOT NULL,
          difficulty  TEXT,
          type        TEXT NOT NULL CHECK (type IN ('multiple', 'boolean')),
          prompt      TEXT NOT NULL,
          correct     TEXT NOT NULL,
          incorrect   TEXT NOT NULL,
          explanation TEXT,
          status      TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'rejected')),
          created_at  TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE (source, source_ref)
        );
        INSERT INTO questions_new SELECT * FROM questions;
        DROP TABLE questions;
        ALTER TABLE questions_new RENAME TO questions;
      `);
    })();
    db.exec("PRAGMA foreign_keys = ON;");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id          INTEGER PRIMARY KEY,
      source      TEXT NOT NULL,            -- see SOURCES
      source_ref  TEXT NOT NULL,            -- stable id within the source, used for upserts/dedup
      category    TEXT NOT NULL,
      difficulty  TEXT,
      type        TEXT NOT NULL CHECK (type IN ('multiple', 'boolean')),
      prompt      TEXT NOT NULL,
      correct     TEXT NOT NULL,
      incorrect   TEXT NOT NULL,            -- JSON array
      explanation TEXT,
      status      TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'rejected')),
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (source, source_ref)
    );

    -- One row per scheduled day.
    CREATE TABLE IF NOT EXISTS daily_sets (
      date       TEXT PRIMARY KEY,          -- YYYY-MM-DD
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Player flags. Anonymous by design: no user id, IP, or device info.
    CREATE TABLE IF NOT EXISTS flags (
      id          INTEGER PRIMARY KEY,
      question_id INTEGER NOT NULL REFERENCES questions(id),
      date        TEXT NOT NULL,            -- the daily set it was flagged from
      reason      TEXT NOT NULL,            -- FlagReason
      comment     TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT,
      resolution  TEXT                      -- 'rejected' | 'edited' | 'dismissed'
    );
    CREATE INDEX IF NOT EXISTS flags_open ON flags (resolved_at, question_id);

    -- A question is only ever used once across all days.
    CREATE TABLE IF NOT EXISTS daily_set_questions (
      date        TEXT NOT NULL REFERENCES daily_sets(date) ON DELETE CASCADE,
      position    INTEGER NOT NULL,
      question_id INTEGER NOT NULL UNIQUE REFERENCES questions(id),
      PRIMARY KEY (date, position)
    );
  `);
}
