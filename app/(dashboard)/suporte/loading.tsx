import { Skeleton } from "@/components/ui/skeleton";

export default function SuporteLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="max-w-2xl space-y-5 rounded-xl bg-card shadow-card p-4 md:p-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
