import { Skeleton } from "@/components/ui/skeleton";

/** Perceived-performance placeholder while the dashboard data loads. */
export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8" aria-busy>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
      </div>
      <span className="sr-only">Cargando el panel…</span>
    </main>
  );
}
