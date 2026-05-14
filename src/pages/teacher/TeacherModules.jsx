import { useEffect, useMemo, useRef, useState } from 'react';
import { Edit3, FileText, Image, Link as LinkIcon, Plus, Trash2, Upload, X } from 'lucide-react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { createModule, createModuleContent, deleteModule, deleteModuleContent, fetchModuleContents, updateModule, uploadModuleMedia } from '../../services/learningService';
import { useModules } from '../../hooks/useModules';
import { useAuth } from '../../hooks/useAuth';

export function TeacherModules() {
  const { profile, user } = useAuth();
  const { modules, loading, error, reload } = useModules();
  const [draft, setDraft] = useState({ title: '', description: '', duration: '15 menit' });
  const [editingModuleId, setEditingModuleId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [contents, setContents] = useState([]);
  const [contentDraft, setContentDraft] = useState({ content_type: 'text', title: '', body: '', media_url: '' });
  const [mediaFile, setMediaFile] = useState(null);
  const [formError, setFormError] = useState('');
  const [contentError, setContentError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingContent, setSavingContent] = useState(false);
  const contentCardRef = useRef(null);
  const formCardRef = useRef(null);

  useEffect(() => {
    if (!selectedModuleId && modules[0]?.id) {
      setSelectedModuleId(modules[0].id);
    }
  }, [modules, selectedModuleId]);

  useEffect(() => {
    let ignore = false;

    async function loadContents() {
      if (!selectedModuleId) {
        setContents([]);
        return;
      }

      try {
        const rows = await fetchModuleContents(selectedModuleId);
        if (!ignore) setContents(rows);
      } catch (nextError) {
        if (!ignore) setContentError(nextError.message || 'Konten modul gagal dimuat.');
      }
    }

    loadContents();

    return () => {
      ignore = true;
    };
  }, [selectedModuleId]);

  const selectedModule = useMemo(() => modules.find((module) => module.id === selectedModuleId), [modules, selectedModuleId]);

  async function addModule(event) {
    event.preventDefault();
    setFormError('');

    if (!user?.id || profile?.role !== 'teacher') {
      setFormError('Akun guru belum valid. Logout lalu login sebagai guru, kemudian coba lagi.');
      return;
    }

    setSaving(true);
    try {
      if (editingModuleId) {
        await updateModule(editingModuleId, draft);
      } else {
        await createModule(
          {
            ...draft,
            order_number: modules.length + 1,
          },
          user?.id,
        );
      }
      setDraft({ title: '', description: '', duration: '15 menit' });
      setEditingModuleId('');
      const nextModules = await reload();
      if (nextModules?.[0]?.id) setSelectedModuleId(nextModules[0].id);
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

  function manageContent(module) {
    setSelectedModuleId(module.id);
    setContentError('');
    window.setTimeout(() => contentCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  function editModule(module) {
    setEditingModuleId(module.id);
    setDraft({
      title: module.title || '',
      description: module.description || '',
      duration: module.duration || '15 menit',
    });
    setFormError('');
    window.setTimeout(() => formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  function cancelEdit() {
    setEditingModuleId('');
    setDraft({ title: '', description: '', duration: '15 menit' });
    setFormError('');
  }

  async function addContent(event) {
    event.preventDefault();
    setContentError('');

    if (!selectedModuleId) {
      setContentError('Pilih modul terlebih dahulu.');
      return;
    }

    if (contentDraft.content_type === 'video' && !contentDraft.media_url) {
      setContentError('Tambahkan URL YouTube untuk konten video.');
      return;
    }

    if (contentDraft.content_type === 'infographic' && !contentDraft.media_url && !mediaFile) {
      setContentError('Tambahkan URL media atau upload file untuk konten infografik.');
      return;
    }

    setSavingContent(true);
    try {
      const uploadedMediaUrl = mediaFile
        ? await uploadModuleMedia({ file: mediaFile, userId: user.id, moduleId: selectedModuleId })
        : '';
      const savedContent = await createModuleContent({
        ...contentDraft,
        media_url: uploadedMediaUrl || contentDraft.media_url,
        module_id: selectedModuleId,
        order_number: contents.length + 1,
      });
      setContents((current) => [...current, savedContent]);
      setContentDraft({ content_type: 'text', title: '', body: '', media_url: '' });
      setMediaFile(null);
    } catch (nextError) {
      setContentError(nextError.message || 'Konten gagal disimpan.');
    } finally {
      setSavingContent(false);
    }
  }

  async function removeContent(id) {
    await deleteModuleContent(id);
    setContents((current) => current.filter((item) => item.id !== id));
  }

  return (
    <DashboardLayout role="teacher" title="Modul Pembelajaran" subtitle="Tambah, edit, hapus, dan publikasikan modul microlearning.">
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.25fr]">
        <Card ref={formCardRef}>
          <div className="mb-5 overflow-hidden rounded-3xl bg-emerald-50">
            <img src="/assets/wasatify-module-art.png" alt="" className="h-52 w-full object-cover" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold">{editingModuleId ? 'Edit Modul' : 'Tambah Modul Baru'}</h2>
            {editingModuleId && (
              <button type="button" onClick={cancelEdit} className="text-sm font-bold text-slate-500 hover:text-red-500">
                Batal
              </button>
            )}
          </div>
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
            <Button className="w-full" disabled={saving}><Plus className="h-4 w-4" /> {saving ? 'Menyimpan...' : editingModuleId ? 'Simpan Perubahan' : 'Simpan & Lanjut'}</Button>
          </form>
        </Card>
        <div className="space-y-6">
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Daftar Modul</h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">{modules.length} modul</span>
          </div>
          {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
          {loading && <p className="text-sm font-semibold text-slate-500">Memuat modul...</p>}
          <div className="space-y-3">
            {modules.map((module, index) => (
              <div key={module.id} className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center ${selectedModuleId === module.id ? 'border-emerald-300 bg-emerald-50/45' : 'border-slate-200'}`}>
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-100 to-cream font-display text-xl font-bold text-emerald-800">
                  {module.order_number || index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display font-bold">{module.title}</h3>
                  <p className="line-clamp-2 text-sm text-slate-500">{module.description}</p>
                  <p className="mt-1 text-xs font-bold text-emerald-700">{module.duration}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => manageContent(module)} title="Kelola konten" className="rounded-xl border border-slate-200 p-3 text-emerald-700 hover:bg-emerald-50"><FileText className="h-4 w-4" /></button>
                  <button type="button" onClick={() => editModule(module)} title="Edit modul" className="rounded-xl border border-slate-200 p-3 text-emerald-700 hover:bg-emerald-50"><Edit3 className="h-4 w-4" /></button>
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
        <Card ref={contentCardRef}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold">Konten Modul</h2>
              <p className="text-sm text-slate-500">{selectedModule ? selectedModule.title : 'Pilih modul untuk mengisi materi.'}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">Konten ini tampil di tab Materi, Video, dan Infografik pada akun siswa.</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">{contents.length} konten</span>
          </div>
          <form onSubmit={addContent} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Modul Target</span>
              <select
                value={selectedModuleId}
                onChange={(event) => {
                  setSelectedModuleId(event.target.value);
                  setContentError('');
                }}
                className="w-full rounded-xl border border-slate-200 px-4 py-3"
                required
              >
                <option value="">Pilih modul</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    Modul {module.order_number || '-'} - {module.title}
                  </option>
                ))}
              </select>
              {selectedModule && (
                <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                  Konten baru akan masuk ke: {selectedModule.title}
                </p>
              )}
            </label>
            <div className="grid gap-3 md:grid-cols-[0.55fr_1fr]">
              <label className="block">
                <span className="mb-2 block text-sm font-bold">Jenis Konten</span>
                <select
                  value={contentDraft.content_type}
                  onChange={(event) => {
                    const nextType = event.target.value;
                    setContentDraft({ ...contentDraft, content_type: nextType });
                    if (nextType !== 'infographic') setMediaFile(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                >
                  <option value="text">Materi</option>
                  <option value="video">Video</option>
                  <option value="infographic">Infografik</option>
                  <option value="reflection">Refleksi</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold">Judul Konten</span>
                <input value={contentDraft.title} onChange={(event) => setContentDraft({ ...contentDraft, title: event.target.value })} required className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" placeholder="Contoh: Tawazun (Keseimbangan)" />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Isi / Narasi</span>
              <textarea value={contentDraft.body} onChange={(event) => setContentDraft({ ...contentDraft, body: event.target.value })} className="min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" placeholder="Tulis materi singkat, instruksi video, atau deskripsi infografik." />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">URL Media</span>
              <input value={contentDraft.media_url} onChange={(event) => setContentDraft({ ...contentDraft, media_url: event.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" placeholder="Link YouTube, gambar infografik, atau PDF/slide" />
            </label>
            {contentDraft.content_type === 'infographic' && (
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/45 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-emerald-900">Upload slide / gambar / PDF</p>
                    <p className="mt-1 text-xs text-slate-500">Gunakan PDF untuk slide yang ingin dibaca langsung di akun siswa. PPT/PPTX akan tampil sebagai file untuk dibuka.</p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-emerald-800 shadow-sm ring-1 ring-emerald-100 hover:bg-emerald-50">
                    <Upload className="h-4 w-4" />
                    Pilih File
                    <input
                      type="file"
                      accept="image/*,.pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                      className="sr-only"
                      onChange={(event) => setMediaFile(event.target.files?.[0] || null)}
                    />
                  </label>
                </div>
                {mediaFile && (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-800">{mediaFile.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(mediaFile.size)}</p>
                    </div>
                    <button type="button" onClick={() => setMediaFile(null)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500" title="Batalkan file">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
            {contentError && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{contentError}</p>}
            <Button className="w-full" disabled={savingContent || !selectedModuleId}><Plus className="h-4 w-4" /> {savingContent ? 'Mengunggah / menyimpan...' : 'Tambah Konten'}</Button>
          </form>
          <div className="mt-5 space-y-3">
            {contents.map((content) => (
              <div key={content.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  {content.content_type === 'infographic' ? <Image className="h-5 w-5" /> : content.media_url ? <LinkIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase text-emerald-700">{content.content_type}</p>
                  <p className="truncate font-bold">{content.title}</p>
                  <p className="truncate text-sm text-slate-500">{content.body || content.media_url || 'Tanpa deskripsi'}</p>
                </div>
                <button type="button" onClick={() => removeContent(content.id)} title="Hapus konten" className="rounded-xl border border-red-100 p-3 text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            {selectedModule && contents.length === 0 && (
              <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Belum ada konten. Tambahkan materi, video, atau infografik untuk modul ini.</div>
            )}
          </div>
        </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function formatFileSize(bytes) {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}
