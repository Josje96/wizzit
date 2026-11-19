/** Today's date in the machine's local time zone, as YYYY-MM-DD. */
export function today(): string {
  const d = new Date();
  return formatDate(d);
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return formatDate(new Date(y, m - 1, d + days));
}

export function isDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}
