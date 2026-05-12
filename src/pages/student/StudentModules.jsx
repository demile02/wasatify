import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, Lightbulb } from 'lucide-react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useModules } from '../../hooks/useModules';
import { useAuth } from '../../hooks/useAuth';
import { completeModule } from '../../services/learningService';

export function StudentModules() {
  const { user } = useAuth();
  const { modules, progress, loading, error, reload } = useModules({ includeProgress: true });
  const [activeIndex, setActiveIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const activeModule = modules[activeIndex];
  const completedIds = useMemo(() => new Set(progress.filter((item) => item.completed).map((item) => item.module_id)), [progress]);
  const maxUnlockedIndex = Math.min(completedIds.size + 1, Math.max(modules.length - 1, 0));

  async function markComplete() {
    if (!user?.id || !activeModule?.id) return;
    setSaving(true);
    try {
      await completeModule(user.id, activeModule.id);
      await reload();
      setActiveIndex((current) => Math.min(current + 1, modules.length - 1));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout role="student" title="Modul Belajar" subtitle="Pilih modul untuk mulai belajar.">
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.35fr]">
        <Card className="space-y-4">
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
          {loading && <p className="text-sm font-semibold text-slate-500">Memuat modul...</p>}
          {!loading && modules.length === 0 && (
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="font-bold">Belum ada modul.</p>
              <p className="mt-2 text-sm text-slate-500">Silakan minta guru menambahkan modul pembelajaran terlebih dahulu.</p>
            </div>
          )}
          {modules.map((module, index) => {
            const isCompleted = completedIds.has(module.id);
            const isLocked = index > maxUnlockedIndex;
            const isActive = index === activeIndex;
            return (
              <button
                type="button"
                key={module.id}
                disabled={isLocked}
                onClick={() => setActiveIndex(index)}
                className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${isActive ? 'border-gold bg-amber-50/60' : 'border-slate-200 bg-white'} ${isLocked ? 'cursor-not-allowed opacity-60' : 'hover:border-emerald-300'}`}
              >
                <div className={`grid h-14 w-14 place-items-center rounded-2xl ${isLocked ? 'bg-slate-100 text-slate-400' : isActive ? 'bg-gold text-white' : 'bg-emerald-50 text-emerald-700'}`}>
                  {isLocked ? <Lock className="h-6 w-6" /> : isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Lightbulb className="h-6 w-6" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-400">Modul {module.order_number || index + 1}</p>
                  <h3 className="truncate font-display font-bold">{module.title}</h3>
                  <p className="text-xs text-slate-500">{isCompleted ? 'Selesai' : isLocked ? 'Terkunci' : 'Tersedia'}</p>
                </div>
                {!isLocked && <ArrowRight className="h-5 w-5 text-emerald-700" />}
              </button>
            );
          })}
        </Card>

        <Card className="p-5 sm:p-8">
          {activeModule ? (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-emerald-700">Modul {activeModule.order_number || activeIndex + 1}</p>
                  <h2 className="font-display text-3xl font-extrabold">{activeModule.title}</h2>
                </div>
                <span className="rounded-full border px-4 py-2 text-sm font-bold text-slate-500">{activeIndex + 1} / {modules.length}</span>
              </div>
              <div className="mb-5 flex gap-6 border-b text-sm font-bold">
                <button className="border-b-2 border-emerald-700 pb-3 text-emerald-700">Materi</button>
                <button className="pb-3 text-slate-500">Video</button>
                <button className="pb-3 text-slate-500">Infografik</button>
              </div>
              <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-cream to-emerald-50">
                <div className="grid gap-6 p-6 md:grid-cols-[1fr_0.8fr]">
                  <div>
                    <h3 className="font-display text-2xl font-bold">{activeModule.title}</h3>
                    <p className="mt-4 leading-8 text-slate-600">{activeModule.description}</p>
                    <p className="mt-5 rounded-2xl bg-white/75 p-4 text-sm font-semibold text-emerald-800">Durasi belajar: {activeModule.duration}</p>
                  </div>
                  <div className="relative min-h-64 overflow-hidden rounded-3xl bg-white">
                    <img src={activeIndex === 1 ? '/assets/wasatify-tawazun.png' : '/assets/wasatify-module-art.png'} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/20 to-transparent" />
                  </div>
                </div>
                <div className="bg-emerald-900 p-5 text-white">
                  <p className="font-bold text-gold">Renungkan</p>
                  <p className="mt-1 text-sm text-emerald-50/85">Apa satu kebiasaan baik yang bisa kamu lakukan setelah mempelajari modul ini?</p>
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <Button variant="secondary" onClick={() => setActiveIndex((current) => Math.max(current - 1, 0))}><ArrowLeft className="h-4 w-4" /> Sebelumnya</Button>
                <Button onClick={markComplete} disabled={saving || completedIds.has(activeModule.id)}>{completedIds.has(activeModule.id) ? 'Sudah Selesai' : saving ? 'Menyimpan...' : 'Tandai Selesai'} <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </>
          ) : (
            <div className="rounded-3xl bg-slate-50 p-8 text-center">
              <p className="font-display text-2xl font-bold">Belum ada materi aktif</p>
              <p className="mt-2 text-slate-500">Modul akan tampil di sini setelah tersedia.</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
