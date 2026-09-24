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
