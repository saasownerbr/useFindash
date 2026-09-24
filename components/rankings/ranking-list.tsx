import { cn } from "@/lib/utils";

export interface RankingItem {
  key: string;
  name: string;
  /** Main figure, right-aligned. */
  value: string;
  /** Secondary metrics, shown on the line below joined by " · ". */
  details: string[];
  /** Optional color dot before the name (e.g. the channel's color). */
  accent?: string;
}

// Gold, silver and bronze for the podium; everyone else stays neutral.
const PODIUM = ["#F59E0B", "#9CA3AF", "#B45309"];

/** Shared block layout for every ranking, so all of them line up regardless of how many metrics they carry. */
export function RankingList({ items, emptyMessage }: { items: RankingItem[]; emptyMessage: string }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {items.map((item, index) => {
        const podium = PODIUM[index];
        return (
          <li key={item.key} className="rounded-lg border border-[#2A2A2A] bg-background/40 px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md px-1.5 text-xs font-bold tabular-nums",
                  !podium && "bg-[#2A2A2A] text-[#9CA3AF]"
                )}
                style={podium ? { color: podium, backgroundColor: `${podium}26` } : undefined}
              >
                {index + 1}º
              </span>
              {item.accent && (
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.accent }} aria-hidden />
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{item.name}</span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{item.value}</span>
            </div>
            {item.details.length > 0 && (
              <p className="mt-1 pl-10 text-xs text-muted-foreground">{item.details.join(" · ")}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
