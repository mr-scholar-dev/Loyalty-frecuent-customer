/**
 * Calendar-date helpers shared by the board UI and the AI capabilities.
 *
 * Deliberately not `server-only`: the Kanban client parses the same
 * `yyyy-mm-dd` strings it renders.
 */

/**
 * Parse `yyyy-mm-dd` into a LOCAL date, or null if it is not a real calendar
 * date. Local matters: `new Date("2026-08-06")` is midnight UTC, which renders
 * as the 5th anywhere west of Greenwich — a due date silently off by a day.
 */
export function parseIsoDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  // Rejects overflow like 2026-02-31, which the Date constructor rolls forward.
  const real =
    date.getFullYear() === y &&
    date.getMonth() === mo - 1 &&
    date.getDate() === d;
  return real ? date : null;
}

/** The input itself when it is a real `yyyy-mm-dd` date, otherwise null. */
export function toIsoDate(value: string): string | null {
  return parseIsoDate(value) ? value : null;
}

/** Today at local midnight — the reference point for "overdue". */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
