// Rebuilds a SQLite question bank from the text snapshot (data/questions.sql).
// Use it to set up a fresh machine or the server. Refuses to overwrite an existing database.
//
// Usage: bun src/restore.ts [snapshot=data/questions.sql] [db=$WIZZIT_DB or data/wizzit.db]

import { existsSync, readFileSync } from "node:fs";
import { DB_PATH, openDb } from "./db.ts";
import { SNAPSHOT_PATH } from "./dump.ts";

const snapshot = process.argv[2] ?? SNAPSHOT_PATH;
const target = process.argv[3] ?? DB_PATH;

if (existsSync(target)) {
  console.error(`${target} already exists. Move it aside first; restore never overwrites a database.`);
  process.exit(1);
}

const db = openDb(target); // creates the schema (including the empty flags table)
db.transaction(() => db.exec(readFileSync(snapshot, "utf8")))();

const count = (t: string) => db.query<{ n: number }, []>(`SELECT COUNT(*) AS n FROM ${t}`).get()!.n;
console.log(
  `Restored ${target}: questions=${count("questions")}, daily_sets=${count("daily_sets")}, ` +
    `daily_set_questions=${count("daily_set_questions")}`,
);
db.close();
