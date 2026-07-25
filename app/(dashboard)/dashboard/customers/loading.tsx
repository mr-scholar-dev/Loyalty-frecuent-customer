import { Skeleton } from "@/components/ui/skeleton";

/** Perceived-performance placeholder while the customers list loads. */
export default function CustomersLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8" aria-busy>
      <Skeleton className="mb-2 h-7 w-36" />
      <Skeleton className="mb-5 h-4 w-72" />

      <div className="mb-5 flex flex-wrap gap-2">
        <Skeleton className="h-11 w-72 max-w-full" />
        <Skeleton className="h-11 w-28" />
        <Skeleton className="h-11 w-24" />
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Skeleton className="h-10 w-full rounded-none" />
        <div className="divide-y">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="ml-auto h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Cargando clientes…</span>
    </main>
  );
}
