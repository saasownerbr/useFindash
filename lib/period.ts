/** The window of the same length that ends where [start, end] begins, for "vs período anterior". */
export function previousRange(start: Date, end: Date): { start: Date; end: Date } {
  const length = end.getTime() - start.getTime();
  return { start: new Date(start.getTime() - length), end: new Date(start.getTime()) };
}

/** Relative change from `previous` to `current`; null when there is nothing to compare against. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

/** yyyy-mm-dd in local time, for date columns (cost_entries.date, monthly_inputs.month). */
export function localDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** The first day of `date`'s month as yyyy-mm-dd, the key monthly_inputs uses. */
export function firstOfMonth(date: Date): string {
  return localDay(new Date(date.getFullYear(), date.getMonth(), 1));
}

/** The last day of `date`'s month as yyyy-mm-dd. */
export function lastOfMonth(date: Date): string {
  return localDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

/** The whole calendar month before `date`'s, from its first to its last millisecond. */
export function previousCalendarMonth(date: Date): { start: Date; end: Date } {
  return {
    start: new Date(date.getFullYear(), date.getMonth() - 1, 1),
    end: new Date(date.getFullYear(), date.getMonth(), 0, 23, 59, 59, 999),
  };
}
