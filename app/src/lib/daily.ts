import type { DailySet } from "@wizzit/shared";

export async function fetchDailySet(date: string): Promise<DailySet | null> {
  try {
    const res = await fetch(`/daily/${date}.json`);
    if (!res.ok) return null;
    // Some static hosts answer missing files with index.html; guard against that.
    if (!res.headers.get("content-type")?.includes("json")) return null;
    return (await res.json()) as DailySet;
  } catch {
    return null;
  }
}

export function scoreOf(set: DailySet, answers: (number | null)[]): number {
  return set.questions.reduce((n, q, i) => n + (answers[i] === q.answerIndex ? 1 : 0), 0);
}
