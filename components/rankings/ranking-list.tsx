import type { ReactNode } from "react";

export interface RankingItem {
  key: string;
  /** Name shown after the position badge. */
  name: ReactNode;
  /** Main figures, in the middle column on desktop. */
  center: ReactNode;
  /** Secondary figure, right-aligned on desktop. */
  right: ReactNode;
}

/**
 * Shared block layout for every ranking, read strictly left to right: position + name, the main figure and the
 * secondary one in three equal columns, so every row lines up; everything is left-aligned except the last column.
 * On mobile the three stack.
 */
export function RankingList({ title, items, emptyMessage }: { title: string; items: RankingItem[]; emptyMessage: string }) {
  return (
    <section className="overflow-hidden rounded-xl bg-card shadow-card">
      <h2 className="border-b border-[#242424] px-5 py-4 text-left text-[13px] font-semibold text-foreground">{title}</h2>
      {items.length === 0 ? (
        <p className="px-5 py-6 text-left text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ol>
          {items.map((item, index) => (
            <li
              key={item.key}
              className="flex flex-col gap-1 border-b border-[#242424] bg-[#1A1A1A] px-5 py-[14px] text-left text-[13px] last:border-b-0 md:flex-row md:items-center md:justify-between md:gap-4 md:text-sm"
            >
              <div className="flex min-w-0 items-center gap-3 md:flex-1 md:basis-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#242424] text-xs font-semibold tabular-nums text-[#808080]">
                  {index + 1}
                </span>
                <span className="min-w-0 truncate text-sm font-semibold text-[#F0F0F0]">{item.name}</span>
              </div>
              <div className="pl-9 text-left md:flex-1 md:basis-0 md:pl-0">{item.center}</div>
              <div className="pl-9 text-left md:flex-1 md:basis-0 md:pl-0 md:text-right">{item.right}</div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
