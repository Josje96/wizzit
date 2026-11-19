// All player progress lives on this device only. Nothing is sent to a server.

import { addDays } from "./dates.ts";

export interface DayRecord {
  /** Chosen choice index per question; null = ran out of time. */
  answers: (number | null)[];
  /** Index of the question currently on screen. Used to stop "reload to peek". */
  openIndex?: number;
  completed: boolean;
  score: number;
  /** Question ids the player flagged. */
  flagged?: number[];
  /** Flagged ids whose feedback has been sent (or queued to send). */
  flagsSent?: number[];
}

interface Store {
  version: 1;
  days: Record<string, DayRecord>;
}

const KEY = "wizzit:v1";

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Store;
      if (parsed.version === 1 && parsed.days) return parsed;
    }
  } catch {
    // Private mode / blocked storage: play still works, it just won't be remembered.
  }
  return { version: 1, days: {} };
}

let store = load();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // ignore (see load)
  }
}

export function getDay(date: string): DayRecord | undefined {
  return store.days[date];
}

export function updateDay(date: string, fn: (r: DayRecord) => void): DayRecord {
  const record = store.days[date] ?? { answers: [], completed: false, score: 0 };
  fn(record);
  store.days[date] = record;
  save();
  return record;
}

/**
 * Consecutive completed days ending today, or ending yesterday if today isn't done yet
 * (so the streak isn't shown as broken before you've had a chance to play).
 */
export function currentStreak(today: string): number {
  let d = store.days[today]?.completed ? today : addDays(today, -1);
  let n = 0;
  while (store.days[d]?.completed) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** Ask the browser not to clear our storage under pressure (best effort). */
export async function requestPersistence() {
  try {
    if (navigator.storage?.persisted && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    // not supported
  }
}
