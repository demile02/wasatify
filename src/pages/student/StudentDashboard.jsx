import { ArrowRight, BookOpen, CheckCircle2, Flame, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { achievements } from '../../services/demoData';
import { useModules } from '../../hooks/useModules';
import { useAuth } from '../../hooks/useAuth';

export function StudentDashboard() {
  const { profile } = useAuth();
  const { modules, progress, loading, error } = useModules({ includeProgress: true });
  const completedCount = progress.filter((item) => item.completed).length;
  const totalModules = modules.length;
  const progressValue = totalModules ? Math.round((completedCount / totalModules) * 100) : 0;
  const nextModule = modules.find((module) => !progress.some((item) => item.module_id === module.id && item.completed)) || modules[0];
  const stats = [
    { label: 'Modul', value: totalModules, hint: 'Total modul', icon: BookOpen },
    { label: 'Selesai', value: completedCount, hint: 'Modul tuntas', icon: CheckCircle2 },
    { label: 'Hari Streak', value: Math.min(completedCount + 1, 12), hint: 'Belajar konsisten', icon: Flame },
    { label: 'XP', value: completedCount * 150, hint: 'Total poin', icon: Trophy },
  ];

  return (
    <DashboardLayout role="student" title="Belajar Islam Wasathiyah" subtitle={`Jadi generasi moderat, cerdas, dan berakhlak mulia${profile?.class_name ? ` di ${profile.class_name}` : ''}.`}>
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
        <div className="space-y-6">
          {error && <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="p-4">
                  <Icon className="mb-4 h-8 w-8 text-emerald-700" />
                  <p className="font-display text-3xl font-extrabold">{stat.value}</p>
                  <p className="font-bold">{stat.label}</p>
                  <p className="text-xs text-slate-500">{stat.hint}</p>
                </Card>
              );
            })}
          </div>

          <Card className="overflow-hidden p-0">
            <div className="grid md:grid-cols-[1fr_270px]">
              <div className="p-6">
                <p className="text-sm font-bold text-emerald-700">Lanjutkan Belajarmu</p>
                <h2 className="mt-2 font-display text-2xl font-extrabold">{loading ? 'Memuat modul...' : nextModule?.title || 'Belum ada modul'}</h2>
                <p className="mt-2 text-sm text-slate-500">{nextModule?.description || 'Modul akan muncul setelah guru menambahkannya.'}</p>
                <div className="mt-6 h-3 overflow-hidden rounded-full bg-emerald-50">
                  <div className="h-full rounded-full bg-emerald-600" style={{ width: `${progressValue}%` }} />
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="font-bold text-emerald-700">{progressValue}% selesai</span>
                  <Link to="/siswa/modul" className="inline-flex items-center gap-2 font-bold text-emerald-700">
                    Lanjutkan <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="relative min-h-[230px] overflow-hidden bg-emerald-50">
                <img src="/assets/wasatify-module-art.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
              </div>
            </div>
          </Card>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold">Modul Terbaru</h2>
              <Link to="/siswa/modul" className="text-sm font-bold text-emerald-700">Lihat semua</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modules.slice(0, 3).map((module, index) => (
                <Card key={module.id}>
                  <div className="relative mb-4 h-32 overflow-hidden rounded-2xl bg-emerald-50 p-4">
                    <img src="/assets/wasatify-module-art.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/35 to-transparent" />
                    <span className="relative z-10 rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-emerald-700">Modul {module.order_number || index + 1}</span>
                  </div>
                  <h3 className="font-display font-bold">{module.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{module.duration}</p>
                </Card>
              ))}
              {!loading && modules.length === 0 && (
                <Card className="sm:col-span-2 lg:col-span-3">
                  <p className="font-bold">Belum ada modul.</p>
                  <p className="mt-2 text-sm text-slate-500">Modul akan muncul setelah guru menambahkannya.</p>
                </Card>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6 pb-20 lg:pb-0">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-emerald-700">Streak Belajar</p>
                <p className="font-display text-3xl font-extrabold">{Math.min(completedCount + 1, 12)} hari</p>
                <p className="text-sm text-slate-500">Pertahankan semangatmu!</p>
              </div>
              <div className="grid h-16 w-16 place-items-center rounded-full bg-orange-100 text-orange-500">
                <Flame className="h-8 w-8" />
              </div>
            </div>
          </Card>
          <Card>
            <ProgressRing value={progressValue} label="Progress Belajar" />
            <div className="mt-6 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="font-display text-2xl font-bold">{totalModules}</p>
                <p className="text-xs text-slate-500">Total Modul</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="font-display text-2xl font-bold">{completedCount}</p>
                <p className="text-xs text-slate-500">Selesai</p>
              </div>
            </div>
          </Card>
          <Card>
            <h2 className="font-display text-lg font-bold">Pencapaian</h2>
            <div className="mt-4 space-y-3">
              {achievements.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </aside>
      </div>
    </DashboardLayout>
  );
}
