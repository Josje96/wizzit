import type { DailySet } from "@wizzit/shared";

export function shareText(set: DailySet, answers: (number | null)[], score: number, streak: number): string {
  const grid = set.questions.map((q, i) => (answers[i] === q.answerIndex ? "🟩" : "🟥")).join("");
  const streakPart = streak > 1 ? ` 🔥 ${streak}-day streak` : "";
  return `Wizzit ${set.date}: ${score}/${set.questions.length}${streakPart}\n${grid}\n${location.origin}`;
}

/**
 * Opens the phone's native share sheet (every social app, no tracking SDKs).
 * Falls back to copying to the clipboard. Returns what happened.
 */
export async function share(text: string): Promise<"shared" | "copied" | "cancelled" | "failed"> {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
