// Sends anonymous question flags to the API. If the player is offline (or the server is
// unreachable) the submission is queued on-device and retried later.

import type { FlagSubmission } from "@wizzit/shared";

/** "" = same origin (the Vite dev server proxies /api to the local API). */
const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const QUEUE_KEY = "wizzit:flagQueue";

function readQueue(): FlagSubmission[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as FlagSubmission[];
  } catch {
    return [];
  }
}

function writeQueue(q: FlagSubmission[]) {
  try {
    if (q.length) localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    else localStorage.removeItem(QUEUE_KEY);
  } catch {
    // storage unavailable; nothing more we can do
  }
}

/** "sent" = stored on the server; "rejected" = server refused it (don't retry); "offline" = retry later. */
async function post(sub: FlagSubmission): Promise<"sent" | "rejected" | "offline"> {
  try {
    const res = await fetch(`${API}/api/flags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub),
    });
    if (res.ok) return "sent";
    // 4xx (except rate limiting) means the submission itself is bad: retrying won't help.
    if (res.status >= 400 && res.status < 500 && res.status !== 429) return "rejected";
    return "offline";
  } catch {
    return "offline";
  }
}

export async function sendFlags(sub: FlagSubmission): Promise<"sent" | "queued"> {
  const result = await post(sub);
  if (result === "offline") {
    writeQueue([...readQueue(), sub]);
    return "queued";
  }
  return "sent";
}

let flushing = false;
export async function flushFlagQueue() {
  if (flushing || !navigator.onLine) return;
  flushing = true;
  try {
    const remaining: FlagSubmission[] = [];
    for (const sub of readQueue()) {
      if ((await post(sub)) === "offline") remaining.push(sub);
    }
    writeQueue(remaining);
  } finally {
    flushing = false;
  }
}
