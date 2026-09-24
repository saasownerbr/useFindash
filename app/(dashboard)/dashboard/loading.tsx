import { KpiCardsSkeleton, ChartSkeleton } from "@/components/dashboard/skeleton-cards";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-card/50" />
          <div className="h-4 w-72 animate-pulse rounded bg-card/50" />
        </div>
        <div className="h-10 w-40 animate-pulse rounded bg-card/50" />
      </div>

      {/* KPI Cards */}
      <KpiCardsSkeleton />

      {/* Payment Methods */}
      <ChartSkeleton />

      {/* Revenue and Channel Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 h-4 w-32 animate-pulse rounded bg-card/50" />
            <div className="h-8 w-24 animate-pulse rounded bg-card/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
