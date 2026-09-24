export interface RankingItem {
  key: string;
  name: string;
  /** Main figure, right-aligned. */
  value: string;
  /** Secondary metrics, shown on the line below joined by " · ". */
  details: string[];
}

/** Shared layout for every ranking, so all of them line up regardless of how many metrics they carry. */
export function RankingList({ items, emptyMessage }: { items: RankingItem[]; emptyMessage: string }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-px">
      {items.map((item, index) => (
        <li key={item.key} className="border-b border-[#2A2A2A] py-[14px]">
          <div className="flex items-center gap-3">
            <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-[#2A2A2A] px-1.5 text-xs font-semibold tabular-nums text-[#9CA3AF]">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{item.name}</span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-[#F8F8F8]">{item.value}</span>
          </div>
          {item.details.length > 0 && (
            <p className="mt-1 pl-9 text-xs text-[#6B7280]">{item.details.join(" · ")}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
