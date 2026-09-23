import { Skeleton } from "@/components/ui/skeleton";

export default function CalculadoraLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-[480px] w-full rounded-xl" />
        </div>
        <Skeleton className="h-[520px] w-full rounded-xl" />
      </div>
    </div>
  );
}
