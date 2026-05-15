import { Skeleton } from '@/components/ui/skeleton';

export default function TeacherAnnouncementsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-[1.25rem]" />
        ))}
      </div>
      <Skeleton className="h-[420px] rounded-[1.25rem]" />
    </div>
  );
}
