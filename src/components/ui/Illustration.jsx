export function LearningIllustration({ compact = false }) {
  return (
    <div
      className={
        compact
          ? 'relative min-h-[220px] overflow-hidden rounded-[1.5rem] bg-emerald-50'
          : 'relative min-h-[360px] overflow-hidden rounded-[2rem] bg-emerald-50 shadow-soft lg:min-h-[520px]'
      }
    >
      <img
        src="/assets/wasatify-hero.png"
        alt="Siswa Madrasah Aliyah belajar Islam Wasathiyah dengan laptop dan tablet"
        className="absolute inset-0 h-full w-full object-cover object-center"
        loading={compact ? 'lazy' : 'eager'}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/10 via-transparent to-white/10" />
    </div>
  );
}
