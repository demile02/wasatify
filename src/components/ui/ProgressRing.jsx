export function ProgressRing({ value = 50, label = 'Progress' }) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="progress-ring grid h-24 w-24 place-items-center rounded-full"
        style={{ '--progress': `${value}%` }}
        aria-label={`${label} ${value}%`}
      >
        <span className="font-display text-xl font-bold text-emerald-900">{value}%</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="font-display text-2xl font-bold text-ink">Belajar aktif</p>
      </div>
    </div>
  );
}
