import { useState } from 'react';
import { Save } from 'lucide-react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

export function StudentReflection() {
  const [reflection, setReflection] = useState('');
  const [plan, setPlan] = useState('');
  const [saved, setSaved] = useState(false);

  async function saveReflection() {
    if (supabase) {
      await supabase.from('reflections').insert({
        module_id: 5,
        reflection_text: reflection,
        action_plan: plan,
      });
    }
    setSaved(true);
  }

  return (
    <DashboardLayout role="student" title="Refleksi dan Aksi" subtitle="Tuliskan pemahaman dan rencana nyata setelah belajar.">
      <Card className="mx-auto max-w-4xl p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_270px]">
          <div>
            <h2 className="font-display text-3xl font-extrabold">Refleksi Diri</h2>
            <p className="mt-2 text-slate-500">Tuliskan hal-hal yang kamu pelajari dari modul ini dan bagaimana kamu akan menerapkannya dalam kehidupan sehari-hari.</p>
            <label className="mt-6 block">
              <span className="mb-2 block font-bold">Refleksi Pembelajaran</span>
              <textarea value={reflection} onChange={(event) => setReflection(event.target.value)} className="min-h-36 w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500" placeholder="Tulis refleksimu di sini..." />
            </label>
            <label className="mt-5 block">
              <span className="mb-2 block font-bold">Aksi Nyata</span>
              <textarea value={plan} onChange={(event) => setPlan(event.target.value)} className="min-h-36 w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500" placeholder="Tulis aksimu di sini..." />
            </label>
            <Button onClick={saveReflection} className="mt-6 w-full"><Save className="h-4 w-4" /> Simpan Refleksi</Button>
            {saved && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">Refleksi tersimpan untuk demo.</p>}
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-cream p-6">
            <div className="mx-auto h-28 w-28 rounded-full bg-amber-100" />
            <div className="mx-auto mt-[-8px] h-36 w-36 rounded-[2rem] bg-emerald-600" />
            <p className="mt-6 text-center text-sm leading-6 text-slate-600">Refleksi yang baik membantu nilai wasathiyah menjadi kebiasaan, bukan hanya pengetahuan.</p>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
}
