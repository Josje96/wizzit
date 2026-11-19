// Wizzit API + admin server. Runs at home behind a Cloudflare Tunnel; the player app stays static.
//
//   Public:  POST /api/flags          anonymous question flags from players
//            GET  /api/health
//   Admin:   GET  /admin              admin page (asks for ADMIN_TOKEN)
//            /admin/api/*             Bearer ADMIN_TOKEN required
//
// Env:
//   PORT          default 8787
//   HOST          default 127.0.0.1 (the tunnel connects locally; don't expose directly)
//   APP_ORIGINS   comma-separated origins allowed to POST flags (CORS)
//                 default http://localhost:5173,http://localhost:4173
//   ADMIN_TOKEN   long random string; admin API is disabled without it
//   EXPORT_DIR    where daily JSON is written (default ../app/public/daily)
//
// Privacy: flags store question id, date, reason, comment. No IPs, user agents, or ids.
// Client IPs are used only in memory for rate limiting and never written anywhere.

import { createHash, timingSafeEqual } from "node:crypto";
import { join } from "node:path";
import { FLAG_REASONS, MAX_FLAG_COMMENT, QUESTIONS_PER_DAY, type FlagReason, type FlagSubmission } from "@wizzit/shared";
import { openDb } from "./db.ts";
import { isDate } from "./dates.ts";
import { DEFAULT_OUT_DIR, exportDays } from "./export.ts";
import { rejectQuestion, resolveFlags } from "./ops.ts";

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? "127.0.0.1";
const APP_ORIGINS = new Set(
  (process.env.APP_ORIGINS ?? "http://localhost:5173,http://localhost:4173").split(",").map((s) => s.trim()),
);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "";
const EXPORT_DIR = process.env.EXPORT_DIR ?? DEFAULT_OUT_DIR;
const ADMIN_PAGE = join(import.meta.dir, "..", "admin", "index.html");

const db = openDb();

// ---------- helpers ----------

const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  if (!origin || !APP_ORIGINS.has(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

const sha = (s: string) => createHash("sha256").update(s).digest();
function isAdmin(req: Request): boolean {
  if (!ADMIN_TOKEN) return false;
  const header = req.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return timingSafeEqual(sha(token), sha(ADMIN_TOKEN));
}

/** In-memory fixed-window limiter. Nothing is persisted. */
const hits = new Map<string, { count: number; reset: number }>();
function rateLimited(ip: string, limit = 20, windowMs = 10 * 60_000): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    hits.set(ip, { count: 1, reset: now + windowMs });
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return false;
  }
  return ++h.count > limit;
}

async function readJson<T>(req: Request, maxBytes = 16_384): Promise<T | null> {
  const text = await req.text();
  if (text.length > maxBytes) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// ---------- public: flags ----------

const inDaySet = db.query<{ n: number }, [string, number]>(
  "SELECT COUNT(*) AS n FROM daily_set_questions WHERE date = ? AND question_id = ?",
);
const insertFlag = db.query("INSERT INTO flags (question_id, date, reason, comment) VALUES (?, ?, ?, ?)");

async function postFlags(req: Request, ip: string): Promise<Response> {
  const headers = cors(req);
  if (rateLimited(ip)) return json({ error: "Too many requests" }, 429, headers);

  const body = await readJson<FlagSubmission>(req);
  if (!body || typeof body.date !== "string" || !isDate(body.date) || !Array.isArray(body.flags)) {
    return json({ error: "Invalid body" }, 400, headers);
  }
  if (body.flags.length === 0 || body.flags.length > QUESTIONS_PER_DAY) {
    return json({ error: "Invalid number of flags" }, 400, headers);
  }

  const seen = new Set<number>();
  const rows: [number, string, FlagReason, string | null][] = [];
  for (const f of body.flags) {
    if (!f || !Number.isInteger(f.questionId) || seen.has(f.questionId)) continue;
    if (typeof f.reason !== "string" || !(f.reason in FLAG_REASONS)) continue;
    // Only questions that were actually in that day's set can be flagged.
    if (inDaySet.get(body.date, f.questionId)?.n !== 1) continue;
    const comment = typeof f.comment === "string" ? f.comment.trim().slice(0, MAX_FLAG_COMMENT) : "";
    seen.add(f.questionId);
    rows.push([f.questionId, body.date, f.reason as FlagReason, comment || null]);
  }
  if (rows.length === 0) return json({ error: "No valid flags" }, 400, headers);

  db.transaction(() => {
    for (const r of rows) insertFlag.run(...r);
  })();
  return json({ saved: rows.length }, 200, headers);
}

// ---------- admin ----------

interface FlaggedQuestion {
  id: number;
  source: string;
  source_ref: string;
  category: string;
  type: string;
  prompt: string;
  correct: string;
  incorrect: string;
  explanation: string | null;
  status: string;
  flag_count: number;
  last_flagged: string;
  flags: string; // JSON array
  scheduled_on: string | null;
}

function listFlagged(resolved: boolean) {
  const rows = db
    .query<FlaggedQuestion, []>(`
      SELECT q.id, q.source, q.source_ref, q.category, q.type, q.prompt, q.correct, q.incorrect,
             q.explanation, q.status,
             COUNT(f.id) AS flag_count,
             MAX(f.created_at) AS last_flagged,
             json_group_array(json_object(
               'reason', f.reason, 'comment', f.comment, 'date', f.date,
               'created_at', f.created_at, 'resolution', f.resolution
             )) AS flags,
             (SELECT date FROM daily_set_questions d WHERE d.question_id = q.id) AS scheduled_on
      FROM flags f
      JOIN questions q ON q.id = f.question_id
      WHERE f.resolved_at IS ${resolved ? "NOT NULL" : "NULL"}
      GROUP BY q.id
      ORDER BY flag_count DESC, last_flagged DESC
      LIMIT 200
    `)
    .all();
  return rows.map((r) => ({
    ...r,
    incorrect: JSON.parse(r.incorrect) as string[],
    flags: JSON.parse(r.flags) as unknown[],
  }));
}

interface QuestionEdit {
  prompt: string;
  correct: string;
  incorrect: string[];
  explanation?: string | null;
}

function validateEdit(e: QuestionEdit | null, type: string): string | null {
  if (!e) return "Invalid body";
  const str = (s: unknown, max: number) => typeof s === "string" && s.trim().length > 0 && s.length <= max;
  if (!str(e.prompt, 300)) return "Prompt is required (max 300 chars)";
  if (!str(e.correct, 100)) return "Correct answer is required (max 100 chars)";
  const need = type === "boolean" ? 1 : 3;
  if (!Array.isArray(e.incorrect) || e.incorrect.length !== need || !e.incorrect.every((s) => str(s, 100))) {
    return `Exactly ${need} wrong answer(s) required`;
  }
  const all = [e.correct, ...e.incorrect].map((s) => s.trim());
  if (new Set(all).size !== all.length) return "Answers must all be different";
  if (e.explanation != null && (typeof e.explanation !== "string" || e.explanation.length > 500)) {
    return "Explanation max 500 chars";
  }
  return null;
}

async function admin(req: Request, path: string): Promise<Response> {
  if (!ADMIN_TOKEN) return json({ error: "Admin disabled: set ADMIN_TOKEN" }, 503);
  if (!isAdmin(req)) return json({ error: "Unauthorized" }, 401);

  if (req.method === "GET" && path === "/admin/api/flags") {
    const resolved = new URL(req.url).searchParams.get("status") === "resolved";
    return json({ questions: listFlagged(resolved) });
  }

  if (req.method === "POST" && path === "/admin/api/export") {
    return json({ exported: exportDays(db, EXPORT_DIR) });
  }

  const m = path.match(/^\/admin\/api\/questions\/(\d+)(?:\/(reject|dismiss))?$/);
  if (!m) return json({ error: "Not found" }, 404);
  const id = Number(m[1]);
  const action = m[2];

  if (req.method === "POST" && action === "reject") {
    const result = rejectQuestion(db, id);
    if (!result) return json({ error: "Not found" }, 404);
    resolveFlags(db, id, "rejected");
    const exported = exportDays(db, EXPORT_DIR);
    return json({ ...result, exported });
  }

  if (req.method === "POST" && action === "dismiss") {
    resolveFlags(db, id, "dismissed");
    return json({ ok: true });
  }

  if (req.method === "PUT" && !action) {
    const q = db
      .query<{ source: string; source_ref: string; type: string }, [number]>(
        "SELECT source, source_ref, type FROM questions WHERE id = ?",
      )
      .get(id);
    if (!q) return json({ error: "Not found" }, 404);
    if (q.source === "original") {
      // Our own questions live in content/questions/*.ts; `seed` would overwrite a DB edit.
      return json({ error: `Edit ref "${q.source_ref}" in content/questions/*.ts, then run seed + export.` }, 409);
    }
    const edit = await readJson<QuestionEdit>(req);
    const problem = validateEdit(edit, q.type);
    if (problem) return json({ error: problem }, 400);
    db.run("UPDATE questions SET prompt = ?, correct = ?, incorrect = ?, explanation = ? WHERE id = ?", [
      edit!.prompt.trim(),
      edit!.correct.trim(),
      JSON.stringify(edit!.incorrect.map((s) => s.trim())),
      edit!.explanation?.trim() || null,
      id,
    ]);
    resolveFlags(db, id, "edited");
    return json({ ok: true, exported: exportDays(db, EXPORT_DIR) });
  }

  return json({ error: "Not found" }, 404);
}

// ---------- server ----------

const server = Bun.serve({
  port: PORT,
  hostname: HOST,
  async fetch(req, srv) {
    const url = new URL(req.url);
    const path = url.pathname;
    // Behind Cloudflare the real client IP is in CF-Connecting-IP. Memory-only, for rate limiting.
    const ip = req.headers.get("CF-Connecting-IP") ?? srv.requestIP(req)?.address ?? "unknown";

    try {
      if (path === "/api/flags") {
        if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
        if (req.method === "POST") return await postFlags(req, ip);
        return json({ error: "Method not allowed" }, 405);
      }
      if (path === "/api/health") return json({ ok: true });
      if (path === "/admin" || path === "/admin/") {
        return new Response(Bun.file(ADMIN_PAGE), {
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
        });
      }
      if (path.startsWith("/admin/api/")) return await admin(req, path);
      return json({ error: "Not found" }, 404);
    } catch (err) {
      console.error(err);
      return json({ error: "Server error" }, 500);
    }
  },
});

console.log(`Wizzit server on http://${server.hostname}:${server.port}`);
if (!ADMIN_TOKEN) console.warn("ADMIN_TOKEN not set: admin API disabled.");
