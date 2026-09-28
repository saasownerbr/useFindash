import { Skeleton } from "@/components/ui/skeleton";

export default function AssistenciaLoading() {
  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-9 w-72 max-w-full" />
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
