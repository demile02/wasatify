import { useState } from 'react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { createModule, deleteModule } from '../../services/learningService';
import { useModules } from '../../hooks/useModules';
import { useAuth } from '../../hooks/useAuth';

export function TeacherModules() {
  const { user } = useAuth();
  const { modules, loading, error, reload } = useModules();
  const [draft, setDraft] = useState({ title: '', description: '', duration: '15 menit' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  async function addModule(event) {
    event.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await createModule(
        {
          ...draft,
          order_number: modules.length + 1,
        },
        user?.id,
      );
      setDraft({ title: '', description: '', duration: '15 menit' });
      await reload();
    } catch (nextError) {
      setFormError(nextError.message || 'Modul gagal disimpan.');
    } finally {
      setSaving(false);
    }
  }

  async function removeModule(id) {
    const confirmed = window.confirm('Hapus modul ini? Progress dan konten terkait juga bisa terdampak.');
    if (!confirmed) return;
    await deleteModule(id);
    await reload();
  }

  return (
    <DashboardLayout role="teacher" title="Modul Pembelajaran" subtitle="Tambah, edit, hapus, dan publikasikan modul microlearning.">
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.25fr]">
        <Card>
          <div className="mb-5 overflow-hidden rounded-3xl bg-emerald-50">
            <img src="/assets/wasatify-module-art.png" alt="" className="h-52 w-full object-cover" />
          </div>
          <h2 className="font-display text-xl font-bold">Tambah Modul Baru</h2>
          <form onSubmit={addModule} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Judul Modul</span>
              <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" placeholder="Contoh: Prinsip Moderasi Beragama" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Deskripsi Singkat</span>
              <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} required className="min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" placeholder="Ringkasan isi modul" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Estimasi Waktu</span>
              <select value={draft.duration} onChange={(event) => setDraft({ ...draft, duration: event.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3">
                <option>10 menit</option>
                <option>15 menit</option>
                <option>20 menit</option>
                <option>30 menit</option>
              </select>
            </label>
            {formError && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{formError}</p>}
            <Button className="w-full" disabled={saving}><Plus className="h-4 w-4" /> {saving ? 'Menyimpan...' : 'Simpan & Lanjut'}</Button>
          </form>
        </Card>
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Daftar Modul</h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">{modules.length} modul</span>
          </div>
          {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
          {loading && <p className="text-sm font-semibold text-slate-500">Memuat modul...</p>}
          <div className="space-y-3">
            {modules.map((module, index) => (
              <div key={module.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-100 to-cream font-display text-xl font-bold text-emerald-800">
                  {module.order_number || index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display font-bold">{module.title}</h3>
                  <p className="line-clamp-2 text-sm text-slate-500">{module.description}</p>
                  <p className="mt-1 text-xs font-bold text-emerald-700">{module.duration}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" title="Edit modul" className="rounded-xl border border-slate-200 p-3 text-emerald-700"><Edit3 className="h-4 w-4" /></button>
                  <button type="button" onClick={() => removeModule(module.id)} title="Hapus modul" className="rounded-xl border border-red-100 p-3 text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
            {!loading && modules.length === 0 && (
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="font-bold">Belum ada modul.</p>
                <p className="mt-2 text-sm text-slate-500">Gunakan form di kiri untuk membuat modul pertama.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
