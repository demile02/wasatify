import { SectionCard } from '@/components/shared/section-card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminInvitesLoading() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-10" aria-busy="true">
      <p role="status" className="sr-only">Memuat daftar kode undangan guru.</p>
      <div className="mx-auto w-full max-w-6xl">
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>

        <SectionCard className="mt-6 grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-11 w-full sm:max-w-xs" />
          </div>
          <Skeleton className="h-11 w-full sm:w-40" />
        </SectionCard>

        <div className="mt-8 space-y-4">
          <Skeleton className="h-6 w-36" />
          <div className="grid gap-3 lg:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <SectionCard key={index} className="space-y-3 p-4 sm:p-5">
                <Skeleton className="h-8 w-48 max-w-full" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-56 max-w-full" />
              </SectionCard>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
