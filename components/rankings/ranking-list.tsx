import type { ReactNode } from "react";

export interface RankingItem {
  key: string;
  /** Name shown after the position badge. */
  name: ReactNode;
  /** Main figures, centered on desktop. */
  center: ReactNode;
  /** Secondary figure, right-aligned on desktop. */
  right: ReactNode;
}

/**
 * Shared block layout for every ranking: position + name, a centered figure and a right-aligned one on a single
 * line; on mobile the three stack.
 */
export function RankingList({ title, items, emptyMessage }: { title: string; items: RankingItem[]; emptyMessage: string }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
      <h2 className="border-b border-[#2A2A2A] px-5 py-4 text-base font-semibold text-foreground">{title}</h2>
      {items.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ol>
          {items.map((item, index) => (
            <li
              key={item.key}
              className="flex flex-col gap-1 border-b border-[#2A2A2A] bg-[#1A1A1A] px-5 py-[14px] text-[13px] last:border-b-0 md:grid md:grid-cols-3 md:items-center md:gap-4 md:text-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2A2A2A] text-xs font-semibold tabular-nums text-[#9CA3AF]">
                  {index + 1}
                </span>
                <span className="min-w-0 truncate text-sm font-semibold text-[#F8F8F8]">{item.name}</span>
              </div>
              <div className="pl-9 md:pl-0 md:text-center">{item.center}</div>
              <div className="pl-9 md:pl-0 md:text-right">{item.right}</div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
