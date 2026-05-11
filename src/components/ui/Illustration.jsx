import { BookOpen, Laptop, Smartphone } from 'lucide-react';

export function LearningIllustration({ compact = false }) {
  return (
    <div className="islamic-panel relative min-h-[300px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-50 via-cream to-sky-50 p-6">
      <div className="absolute inset-x-10 bottom-0 h-28 rounded-t-full bg-emerald-200/50" />
      <div className="absolute right-8 top-10 h-36 w-24 rounded-t-full bg-emerald-700/80 shadow-soft">
        <div className="mx-auto mt-8 h-10 w-10 rounded-t-full bg-cream" />
        <div className="absolute -right-8 top-7 h-28 w-8 rounded-t-full bg-amber-200" />
        <div className="absolute -right-5 top-0 h-10 w-3 rounded-t-full bg-emerald-800" />
      </div>
      <div className="absolute right-40 top-24 h-24 w-16 rounded-t-full bg-emerald-600/60">
        <div className="mx-auto mt-7 h-7 w-7 rounded-t-full bg-cream" />
      </div>
      <div className="relative z-10 mt-20 flex items-end justify-center gap-5">
        <div className="relative">
          <div className="mx-auto h-16 w-16 rounded-full bg-amber-100" />
          <div className="mt-[-4px] h-28 w-28 rounded-[2rem] bg-emerald-700 shadow-soft" />
          <div className="absolute left-12 top-8 h-6 w-12 rounded-b-full bg-slate-900" />
          <div className="absolute left-9 top-[104px] rounded-xl bg-slate-800 p-3 text-white shadow-card">
            <Smartphone className="h-9 w-9" />
          </div>
        </div>
        <div className="relative">
          <div className="mx-auto h-16 w-16 rounded-full bg-amber-100" />
          <div className="mt-[-4px] h-28 w-28 rounded-[2rem] bg-emerald-800 shadow-soft" />
          <div className="absolute left-4 top-[102px] rounded-xl bg-slate-700 p-4 text-white shadow-card">
            <Laptop className="h-12 w-12" />
          </div>
        </div>
      </div>
      {!compact && (
        <div className="absolute left-6 top-6 rounded-2xl bg-white/80 p-3 shadow-sm">
          <BookOpen className="h-6 w-6 text-emerald-700" />
        </div>
      )}
    </div>
  );
}
