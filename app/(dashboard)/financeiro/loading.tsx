import { ChartSkeleton, KpiCardsSkeleton } from "@/components/dashboard/skeleton-cards";

export default function FinanceiroLoading() {
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

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}
