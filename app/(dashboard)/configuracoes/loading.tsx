import { Skeleton } from "@/components/ui/skeleton";

export default function ConfiguracoesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* One block per settings card */}
      {[112, 148, 176, 220, 148, 220].map((height, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-border bg-card p-5" style={{ height }}>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
