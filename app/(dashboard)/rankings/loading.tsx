import { ChartSkeleton } from "@/components/dashboard/skeleton-cards";
import { Skeleton } from "@/components/ui/skeleton";

export default function RankingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-card/50" />
          <div className="h-4 w-72 animate-pulse rounded bg-card/50" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-24 animate-pulse rounded-t bg-card/50" />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Rankings Table */}
      <div className="rounded-xl bg-card shadow-card">
        <div className="divide-y divide-border">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
