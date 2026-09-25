import { create } from "zustand";

/** The same period options in every module that filters by date (dashboard, DRE, lançamentos, rankings). */
export const PERIOD_TYPES = ["today", "15days", "month", "90days", "custom"] as const;
export type PeriodType = (typeof PERIOD_TYPES)[number];

interface PeriodFilterState {
  periodType: PeriodType;
  startDate: Date | null;
  endDate: Date | null;
  setPeriod: (type: PeriodType, start?: Date, end?: Date) => void;
}

/** [start, end] for a preset, relative to `now`. "Este mês" is the whole calendar month, not just the days so far. */
export function presetRange(type: Exclude<PeriodType, "custom">, now = new Date()): { start: Date; end: Date } {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Ends at the close of today, so sales made after the page opened still count.
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  switch (type) {
    case "today":
      return { start: startOfToday, end: endOfToday };
    // "15 dias" and "90 dias" count today as one of the days.
    case "15days":
      return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14), end: endOfToday };
    case "month":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
      };
    case "90days":
      return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89), end: endOfToday };
  }
}

function isPeriodType(value: unknown): value is PeriodType {
  return (PERIOD_TYPES as readonly unknown[]).includes(value);
}

function readStored(): { periodType?: unknown; startDate?: string; endDate?: string } | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("period_filter") : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const usePeriodFilterStore = create<PeriodFilterState>((set) => {
  const stored = readStored();

  // Presets are relative to today, so only a custom range keeps its saved dates;
  // "Este mês" saved in August must mean September when reopened in September.
  // Options that no longer exist (the old "30 dias") fall back to "Este mês".
  const storedType = isPeriodType(stored?.periodType) ? stored.periodType : "month";
  const isCustom = storedType === "custom" && !!stored?.startDate && !!stored?.endDate;
  const periodType: PeriodType = storedType === "custom" && !isCustom ? "month" : storedType;
  const range =
    isCustom && stored?.startDate && stored?.endDate
      ? { start: new Date(stored.startDate), end: new Date(stored.endDate) }
      : presetRange(periodType === "custom" ? "month" : periodType);

  return {
    periodType,
    startDate: range.start,
    endDate: range.end,
    setPeriod: (type, start, end) => {
      const range = start ? { start, end: end ?? new Date() } : presetRange(type === "custom" ? "month" : type);
      const next = { periodType: type, startDate: range.start, endDate: range.end };
      try {
        localStorage.setItem("period_filter", JSON.stringify(next));
      } catch {
        // Private mode or blocked storage: the filter still applies for this visit.
      }
      set(next);
    },
  };
});
