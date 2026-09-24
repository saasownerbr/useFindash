export default function DashboardLoading() {
  return (
    <div className="space-y-4 px-4 py-6 md:space-y-6 md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="h-6 w-56 animate-pulse rounded bg-card" />
          <div className="h-4 w-40 animate-pulse rounded bg-card" />
        </div>
        <div className="h-8 w-80 max-w-full animate-pulse rounded-full bg-card" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[112px] animate-pulse rounded-xl bg-card" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-5">
        <div className="h-[240px] animate-pulse rounded-xl bg-card md:h-[330px] lg:col-span-3" />
        <div className="h-[240px] animate-pulse rounded-xl bg-card md:h-[330px] lg:col-span-2" />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[120px] animate-pulse rounded-xl bg-card" />
        ))}
      </div>
    </div>
  );
}
