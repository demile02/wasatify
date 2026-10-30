import { BarChart3, Bell, BookOpen, ClipboardCheck, PenLine, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-semibold text-gold">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-extrabold leading-tight text-ink sm:text-3xl lg:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-muted-foreground sm:leading-8">{description}</p>
    </div>
  );
}

export function HeroDashboardPreview() {
  return (
    <div
      role="img"
      aria-label="Pratinjau dashboard WASATIFY pada layar desktop dan ponsel"
      className="relative mx-auto h-[23rem] w-full max-w-[43rem] sm:h-[27rem] lg:h-[24rem]"
    >
      <div className="absolute inset-x-0 top-0 h-[82%] w-[94%] overflow-hidden rounded-[1.55rem] border border-primary/10 bg-white p-1.5 shadow-soft sm:w-[78%] sm:rounded-[1.8rem] sm:p-2.5 lg:w-[72%]">
        <div className="h-full overflow-hidden rounded-[1.1rem] border border-border bg-[#f4f8f6] sm:rounded-[1.35rem]">
          <div className="flex h-7 items-center gap-1.5 border-b border-border bg-white px-2.5 sm:h-9 sm:px-4">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e58d86] sm:h-2 sm:w-2" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#e2b85f] sm:h-2 sm:w-2" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#71b897] sm:h-2 sm:w-2" />
            <span className="ml-2 min-w-0 flex-1 truncate rounded-full bg-background px-2 py-1 text-[7px] text-muted-foreground sm:ml-4 sm:px-3 sm:text-[9px]">
              wasatify.demile.my.id/student/dashboard
            </span>
          </div>

          <div className="grid h-[calc(100%-1.75rem)] grid-cols-[3.35rem_minmax(0,1fr)] sm:h-[calc(100%-2.25rem)] sm:grid-cols-[7.5rem_minmax(0,1fr)]">
            <aside className="border-r border-border bg-white px-1.5 py-2 sm:px-3 sm:py-4">
              <div className="mb-3 flex items-center justify-center gap-1.5 sm:mb-6 sm:justify-start">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-dark-emerald text-[8px] font-extrabold text-white sm:h-7 sm:w-7 sm:rounded-lg sm:text-[10px]">
                  W
                </span>
                <span className="hidden text-[9px] font-extrabold tracking-wide text-ink sm:inline">WASATIFY</span>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <DashboardNavItem icon={BarChart3} label="Beranda" active />
                <DashboardNavItem icon={BookOpen} label="Modul" />
                <DashboardNavItem icon={ClipboardCheck} label="Kuis" />
                <DashboardNavItem icon={PenLine} label="Refleksi" />
                <DashboardNavItem icon={Settings} label="Pengaturan" />
              </div>
            </aside>

            <div className="min-w-0 overflow-hidden p-2 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[6px] font-semibold uppercase tracking-[0.12em] text-primary sm:text-[8px]">Dashboard siswa</p>
                  <h2 className="mt-0.5 truncate text-[10px] font-extrabold text-ink sm:text-base">Assalamu&apos;alaikum, Nadia</h2>
                </div>
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border bg-white text-primary sm:h-8 sm:w-8">
                  <Bell aria-hidden="true" className="h-3 w-3 sm:h-4 sm:w-4" />
                </span>
              </div>

              <div className="mt-2 flex items-center gap-1 rounded-md bg-cream px-1.5 py-1 text-[6px] font-semibold text-gold sm:mt-4 sm:gap-1.5 sm:rounded-lg sm:px-2.5 sm:py-1.5 sm:text-[8px]">
                Data contoh untuk pratinjau
              </div>

              <div className="mt-2 grid grid-cols-3 gap-1 sm:mt-3 sm:gap-2">
                <DashboardStat label="Modul selesai" value="8" />
                <DashboardStat label="Kuis dikerjakan" value="14" />
                <DashboardStat label="Progress" value="78%" />
              </div>

              <div className="mt-2 rounded-lg border border-primary/10 bg-white p-2 sm:mt-3 sm:rounded-xl sm:p-3">
                <div className="min-w-0">
                  <p className="text-[6px] font-bold text-primary sm:text-[8px]">Lanjutkan Belajar</p>
                  <p className="mt-0.5 truncate text-[8px] font-extrabold text-ink sm:mt-1 sm:text-xs">Tawazun dalam Keseharian</p>
                </div>
                <p className="mt-1 line-clamp-1 text-[6px] leading-3 text-muted-foreground sm:mt-1.5 sm:text-[8px] sm:leading-4">
                  Menjaga keseimbangan dalam belajar, ibadah, dan kehidupan sosial.
                </p>
                <div className="mt-1.5 flex items-center gap-2 sm:mt-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-mint sm:h-1.5">
                    <div className="h-full w-[78%] rounded-full bg-primary" />
                  </div>
                  <span className="text-[6px] font-bold text-primary sm:text-[8px]">78%</span>
                </div>
              </div>

              <div className="mt-2 hidden rounded-lg border border-border bg-white p-2 sm:block sm:rounded-xl sm:p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[8px] font-bold text-ink">Aktivitas belajar</p>
                  <BarChart3 aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="mt-2 flex items-end gap-1.5">
                  {[34, 54, 42, 70, 58, 84, 64].map((height) => (
                    <span
                      key={height}
                      className="flex-1 rounded-t-sm bg-primary/75"
                      style={{ height: `${height}px`, maxHeight: '2.5rem' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 right-1 z-10 h-[82%] w-[34%] max-w-[10.5rem] rounded-[1.65rem] border-[3px] border-white bg-ink p-1 shadow-soft sm:right-4 sm:w-[27%] sm:rounded-[2rem] sm:p-1.5 lg:w-[25%]">
        <div className="relative h-full overflow-hidden rounded-[1.35rem] bg-[#f4f8f6] sm:rounded-[1.65rem]">
          <div className="mx-auto mt-1.5 h-1 w-9 rounded-full bg-ink/75 sm:mt-2 sm:h-1.5 sm:w-12" />
          <div className="px-2 pt-2 sm:px-3 sm:pt-3">
            <div>
              <p className="text-[6px] font-semibold text-primary sm:text-[7px]">Dashboard</p>
              <p className="mt-0.5 text-[8px] font-extrabold text-ink sm:text-[10px]">Halo, Nadia</p>
            </div>
            <div className="mt-2 rounded-lg bg-dark-emerald p-2 text-white sm:mt-3 sm:rounded-xl sm:p-2.5">
              <p className="text-[6px] font-semibold text-amber-300 sm:text-[7px]">Lanjutkan belajar</p>
              <p className="mt-1 line-clamp-2 text-[8px] font-bold leading-3 sm:text-[9px] sm:leading-4">Tawazun dalam Keseharian</p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/25">
                <div className="h-full w-[78%] rounded-full bg-amber-300" />
              </div>
              <p className="mt-1 text-right text-[6px] font-semibold text-white/80">78%</p>
            </div>
            <p className="mt-2 text-[7px] font-bold text-ink sm:mt-3 sm:text-[8px]">Rekomendasi modul</p>
            <div className="mt-1.5 flex items-center gap-1.5 rounded-lg border border-border bg-white p-1.5 sm:mt-2 sm:p-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-mint text-primary sm:h-7 sm:w-7">
                <BookOpen aria-hidden="true" className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[6px] font-bold text-ink sm:text-[7px]">Adab Belajar Digital</p>
                <p className="text-[6px] text-muted-foreground">Modul berikutnya</p>
              </div>
            </div>
          </div>
          <div className="absolute inset-x-1 bottom-1 flex justify-around rounded-xl bg-white px-1 py-1.5 text-primary shadow-sm sm:inset-x-1.5 sm:bottom-1.5">
            {[
              { label: 'Beranda', Icon: BarChart3 },
              { label: 'Modul', Icon: BookOpen },
              { label: 'Kuis', Icon: ClipboardCheck },
              { label: 'Pengaturan', Icon: Settings },
            ].map(({ label, Icon }) => (
              <Icon key={label} aria-hidden="true" className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardNavItem({
  icon: Icon,
  label,
  active = false,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}) {
  return (
    <div className={`flex items-center justify-center gap-2 rounded-md px-1 py-1.5 sm:justify-start sm:px-2 ${active ? 'bg-mint text-primary' : 'text-muted-foreground'}`}>
      <Icon aria-hidden="true" className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
      <span className="hidden truncate text-[9px] font-semibold sm:inline">{label}</span>
    </div>
  );
}

function DashboardStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-white p-1.5 sm:rounded-lg sm:p-2.5">
      <p className="truncate text-[6px] font-medium text-muted-foreground sm:text-[8px]">{label}</p>
      <p className="mt-0.5 text-[10px] font-extrabold text-ink sm:mt-1 sm:text-sm">{value}</p>
    </div>
  );
}

export function AudienceCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-card sm:p-6">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-mint text-primary sm:mb-5 sm:h-12 sm:w-12">
        <Icon aria-hidden="true" className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
