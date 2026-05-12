import { ArrowLeft, ArrowRight, CheckCircle2, Lock, Lightbulb } from 'lucide-react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { modules } from '../../services/demoData';

export function StudentModules() {
  return (
    <DashboardLayout role="student" title="Modul Belajar" subtitle="Pilih modul untuk mulai belajar.">
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.35fr]">
        <Card className="space-y-4">
          {modules.map((module) => (
            <div
              key={module.id}
              className={`flex items-center gap-4 rounded-2xl border p-4 ${module.id === 2 ? 'border-gold bg-amber-50/60' : 'border-slate-200 bg-white'}`}
            >
              <div className={`grid h-14 w-14 place-items-center rounded-2xl ${module.locked ? 'bg-slate-100 text-slate-400' : module.id === 2 ? 'bg-gold text-white' : 'bg-emerald-50 text-emerald-700'}`}>
                {module.locked ? <Lock className="h-6 w-6" /> : module.progress === 100 ? <CheckCircle2 className="h-6 w-6" /> : <Lightbulb className="h-6 w-6" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-400">Modul {module.id}</p>
                <h3 className="truncate font-display font-bold">{module.title}</h3>
                <p className="text-xs text-slate-500">{module.status}</p>
              </div>
              {!module.locked && <ArrowRight className="h-5 w-5 text-emerald-700" />}
            </div>
          ))}
        </Card>

        <Card className="p-5 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-emerald-700">Modul 2 · Prinsip Moderasi Beragama</p>
              <h2 className="font-display text-3xl font-extrabold">Tawazun (Keseimbangan)</h2>
            </div>
            <span className="rounded-full border px-4 py-2 text-sm font-bold text-slate-500">2 / 5</span>
          </div>
          <div className="mb-5 flex gap-6 border-b text-sm font-bold">
            <button className="border-b-2 border-emerald-700 pb-3 text-emerald-700">Materi</button>
            <button className="pb-3 text-slate-500">Video</button>
            <button className="pb-3 text-slate-500">Infografik</button>
          </div>
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-cream to-emerald-50">
            <div className="grid gap-6 p-6 md:grid-cols-[1fr_0.8fr]">
              <div>
                <h3 className="font-display text-2xl font-bold">Bersikap seimbang dalam memahami ajaran agama</h3>
                <p className="mt-4 leading-8 text-slate-600">
                  Tawazun mengajak kita menempatkan urusan dunia dan akhirat secara proporsional, tidak berlebihan, dan tidak mengabaikan tanggung jawab sosial.
                </p>
              </div>
              <div className="relative min-h-64 overflow-hidden rounded-3xl bg-white">
                <img src="/assets/wasatify-module-art.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/20 to-transparent" />
              </div>
            </div>
            <div className="bg-emerald-900 p-5 text-white">
              <p className="font-bold text-gold">Renungkan</p>
              <p className="mt-1 text-sm text-emerald-50/85">Bagaimana cara kamu menerapkan sikap tawazun dalam kehidupan sehari-hari?</p>
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <Button variant="secondary"><ArrowLeft className="h-4 w-4" /> Sebelumnya</Button>
            <Button>Selanjutnya <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
