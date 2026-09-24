import { Skeleton } from "@/components/ui/skeleton";

export default function VendasLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-card/50" />
          <div className="h-4 w-72 animate-pulse rounded bg-card/50" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded bg-card/50" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 w-32 animate-pulse rounded bg-card/50" />
        ))}
      </div>

      {/* Content */}
      <div className="rounded-xl bg-card shadow-card p-4 md:p-5">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 w-full animate-pulse rounded bg-card/50" />
          ))}
        </div>
      </div>
    </div>
  );
}
