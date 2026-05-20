import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

type TeacherPageSkeletonProps = {
  variant?: 'dashboard' | 'modules';
};

export function TeacherPageSkeleton({ variant = 'dashboard' }: TeacherPageSkeletonProps) {
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
          <div key={index} className="h-32 rounded-2xl bg-slate-200" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.82fr]">
        <div className="h-96 rounded-2xl bg-slate-200" />
        <div className="h-96 rounded-2xl bg-slate-200" />
      </div>
    </>
  );
}

function ModulesSkeleton() {
  return (
    <>
      <div className="mt-8 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
        <div className="h-12 rounded-xl bg-slate-200" />
        <div className="h-12 rounded-xl bg-slate-200 lg:w-44" />
        <div className="h-12 rounded-xl bg-slate-200 lg:w-44" />
      </div>
      <div className="mt-6 rounded-2xl border border-border bg-white p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={cn('h-16 rounded-xl bg-slate-200', index > 0 && 'mt-3')} />
        ))}
      </div>
    </>
  );
}
