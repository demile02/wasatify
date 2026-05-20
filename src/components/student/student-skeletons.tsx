import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

type StudentPageSkeletonProps = {
  variant?: 'dashboard' | 'modules';
};

export function StudentPageSkeleton({ variant = 'dashboard' }: StudentPageSkeletonProps) {
  return (
    <div className="animate-pulse">
      <LoadingSpinner compact className="mb-6 min-h-20" />
      <div className="h-4 w-32 rounded-full bg-slate-200" />
      <div className="mt-4 h-9 w-full max-w-xl rounded-2xl bg-slate-200" />
      <div className="mt-3 h-4 w-full max-w-2xl rounded-full bg-slate-200" />

      {variant === 'modules' ? <ModulesSkeleton /> : <DashboardSkeleton />}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 rounded-2xl bg-slate-200" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="h-80 rounded-2xl bg-slate-200" />
        <div className="h-80 rounded-2xl bg-slate-200" />
      </div>
    </>
  );
}

function ModulesSkeleton() {
  return (
    <>
      <div className="mt-8 flex flex-col gap-4 xl:flex-row xl:justify-between">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className={cn('h-10 rounded-xl bg-slate-200', index === 0 ? 'w-20' : 'w-28')} />
          ))}
        </div>
        <div className="h-12 rounded-xl bg-slate-200 xl:w-80" />
      </div>
      <div className="mt-6 space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-32 rounded-2xl bg-slate-200" />
        ))}
      </div>
    </>
  );
}
