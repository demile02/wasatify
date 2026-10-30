import { useState } from 'react';
import { Save } from 'lucide-react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useModules } from '../../hooks/useModules';
import { saveReflection } from '../../services/learningService';

export function StudentReflection() {
  const [reflection, setReflection] = useState('');
  const [plan, setPlan] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const { user } = useAuth();
  const { modules } = useModules();

  async function saveReflection() {
    setError('');
    setSaved(false);
    const moduleId = selectedModuleId || modules[0]?.id;

    if (!moduleId) {
      setError('Belum ada modul untuk direfleksikan.');
      return;
    }

    if (!reflection.trim()) {
      setError('Refleksi pembelajaran wajib diisi.');
      return;
    }

    try {
      await saveReflection({
        userId: user.id,
        moduleId,
        reflectionText: reflection,
        actionPlan: plan,
      });
      setSaved(true);
      setReflection('');
      setPlan('');
    } catch (nextError) {
      setError(nextError.message || 'Refleksi gagal disimpan.');
    }
  }

  return (
    <DashboardLayout role="student" title="Refleksi dan Aksi" subtitle="Tuliskan pemahaman dan rencana nyata setelah belajar.">
      <Card className="mx-auto max-w-4xl p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_270px]">
          <div>
            <h2 className="font-display text-3xl font-extrabold">Refleksi Diri</h2>
            <p className="mt-2 text-slate-500">Tuliskan hal-hal yang kamu pelajari dari modul ini dan bagaimana kamu akan menerapkannya dalam kehidupan sehari-hari.</p>
            <label className="mt-6 block">
              <span className="mb-2 block font-bold">Pilih Modul</span>
              <select value={selectedModuleId} onChange={(event) => setSelectedModuleId(event.target.value)} className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500">
                <option value="">Pilih modul refleksi</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>{module.title}</option>
                ))}
              </select>
            </label>
            <label className="mt-6 block">
              <span className="mb-2 block font-bold">Refleksi Pembelajaran</span>
              <textarea value={reflection} onChange={(event) => setReflection(event.target.value)} className="min-h-36 w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500" placeholder="Tulis refleksimu di sini..." />
            </label>
            <label className="mt-5 block">
              <span className="mb-2 block font-bold">Aksi Nyata</span>
              <textarea value={plan} onChange={(event) => setPlan(event.target.value)} className="min-h-36 w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500" placeholder="Tulis aksimu di sini..." />
            </label>
            <Button onClick={saveReflection} className="mt-6 w-full"><Save className="h-4 w-4" /> Simpan Refleksi</Button>
            {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">{error}</p>}
            {saved && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">Refleksi tersimpan.</p>}
          </div>
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 to-cream">
            <div className="relative h-80">
              <img src="/assets/wasatify-reflection-quiz.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <div className="p-6">
            <p className="mt-6 text-center text-sm leading-6 text-slate-600">Refleksi yang baik membantu nilai wasathiyah menjadi kebiasaan, bukan hanya pengetahuan.</p>
            </div>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
}
