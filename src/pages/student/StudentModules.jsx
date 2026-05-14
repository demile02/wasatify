import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, Lightbulb, PlayCircle } from 'lucide-react';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useModules } from '../../hooks/useModules';
import { useAuth } from '../../hooks/useAuth';
import { completeModule, fetchModuleContents } from '../../services/learningService';

export function StudentModules() {
  const { user } = useAuth();
  const { modules, progress, loading, error, reload } = useModules({ includeProgress: true });
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('text');
  const [contents, setContents] = useState([]);
  const [allReadableContents, setAllReadableContents] = useState([]);
  const [moduleError, setModuleError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const activeModule = modules[activeIndex];
  const completedIds = useMemo(() => new Set(progress.filter((item) => item.completed).map((item) => item.module_id)), [progress]);
  const maxUnlockedIndex = Math.min(completedIds.size + 1, Math.max(modules.length - 1, 0));
  const contentCounts = useMemo(
    () => ({
      text: contents.filter((content) => content.content_type === 'text').length,
      video: contents.filter((content) => content.content_type === 'video').length,
      infographic: contents.filter((content) => content.content_type === 'infographic').length,
    }),
    [contents],
  );
  const visibleContents = contents.filter((content) => content.content_type === activeTab);
  const primaryContent = visibleContents[0];
  const isDeckMode = activeTab === 'infographic' && isPdfUrl(primaryContent?.media_url || '');

  useEffect(() => {
    let ignore = false;

    async function loadContents() {
      setModuleError('');
      setSuccessMessage('');
      setActiveTab('text');

      if (!activeModule?.id) {
        setContents([]);
        setAllReadableContents([]);
        return;
      }

      try {
        const readableRows = await fetchModuleContents();
        let rows = readableRows.filter((content) => content.module_id === activeModule.id);
        if (rows.length === 0) rows = await fetchModuleContents(activeModule.id);
        if (!ignore) {
          setAllReadableContents(readableRows);
          setContents(rows);
          if (!rows.some((content) => content.content_type === 'text')) {
            setActiveTab(rows[0]?.content_type || 'text');
          }
        }
      } catch (nextError) {
        if (!ignore) setModuleError(nextError.message || 'Konten modul gagal dimuat.');
      }
    }

    loadContents();

    return () => {
      ignore = true;
    };
  }, [activeModule?.id]);

  async function markComplete() {
    if (!user?.id || !activeModule?.id) return;
    setModuleError('');
    setSuccessMessage('');
    setSaving(true);
    try {
      await completeModule(user.id, activeModule.id);
      await reload();
      setSuccessMessage('Progress modul berhasil disimpan.');
      setActiveIndex((current) => Math.min(current + 1, modules.length - 1));
    } catch (nextError) {
      setModuleError(nextError.message || 'Progress gagal disimpan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout role="student" title="Modul Belajar" subtitle="Pilih modul untuk mulai belajar.">
      <div className={`grid items-start gap-6 ${isDeckMode ? 'xl:grid-cols-[0.42fr_1.58fr]' : 'xl:grid-cols-[0.85fr_1.35fr]'}`}>
        <Card className="self-start space-y-4">
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
            const moduleVideos = allReadableContents.filter((content) => content.module_id === module.id && content.content_type === 'video').length;
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
                  <p className="text-xs text-slate-500">{isCompleted ? 'Selesai' : isLocked ? 'Terkunci' : moduleVideos ? `${moduleVideos} video tersedia` : 'Tersedia'}</p>
                </div>
                {!isLocked && <ArrowRight className="h-5 w-5 text-emerald-700" />}
              </button>
            );
          })}
        </Card>

        <Card className={`p-5 sm:p-8 ${isDeckMode ? 'xl:p-6' : ''}`}>
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
                {[
                  ['text', 'Materi'],
                  ['video', 'Video'],
                  ['infographic', 'Infografik'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setActiveTab(value)}
                    className={`pb-3 ${activeTab === value ? 'border-b-2 border-emerald-700 text-emerald-700' : 'text-slate-500'}`}
                  >
                    {label} {contentCounts[value] ? <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">{contentCounts[value]}</span> : null}
                  </button>
                ))}
              </div>
              {moduleError && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{moduleError}</p>}
              {successMessage && <p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{successMessage}</p>}
              {activeTab === 'text' && (
                <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-cream to-emerald-50">
                  <div className="grid gap-6 p-6 md:grid-cols-[1fr_0.8fr]">
                    <div>
                      <h3 className="font-display text-2xl font-bold">{primaryContent?.title || activeModule.title}</h3>
                      <p className="mt-4 leading-8 text-slate-600">{primaryContent?.body || activeModule.description}</p>
                      <p className="mt-5 rounded-2xl bg-white/75 p-4 text-sm font-semibold text-emerald-800">Durasi belajar: {activeModule.duration}</p>
                      <ContentList contents={visibleContents.slice(1)} />
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
              )}
              {activeTab === 'video' && (
                <VideoTab contents={visibleContents} primaryContent={primaryContent} />
              )}
              {activeTab === 'infographic' && (
                <InfographicTab contents={visibleContents} primaryContent={primaryContent} />
              )}
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

function VideoTab({ contents, primaryContent }) {
  if (!primaryContent?.media_url) {
    return <EmptyContent label="video" />;
  }

  return (
    <div className="rounded-3xl border border-emerald-900/10 bg-emerald-950 p-3 shadow-card">
      <VideoContent url={primaryContent.media_url} featured />
      {(primaryContent.title || primaryContent.body) && (
        <div className="px-2 pb-2 pt-4 text-white">
          {primaryContent.title && <p className="text-sm font-bold text-gold">{primaryContent.title}</p>}
          {primaryContent.body && <p className="mt-1 text-sm leading-6 text-emerald-50/80">{primaryContent.body}</p>}
        </div>
      )}
      <ContentList contents={contents.slice(1)} dark />
    </div>
  );
}

function InfographicTab({ contents, primaryContent }) {
  if (!primaryContent?.media_url) {
    return <EmptyContent label="infografik" />;
  }

  const isImage = isImageUrl(primaryContent.media_url);
  const isPdf = isPdfUrl(primaryContent.media_url);

  if (isPdf) {
    return <PdfSlideViewer url={primaryContent.media_url} title={primaryContent.title || 'Slide pembelajaran'} />;
  }

  return (
    <div className="rounded-3xl border border-emerald-900/10 bg-white p-3 shadow-card">
      {isImage ? (
        <img
          src={primaryContent.media_url}
          alt={primaryContent.title || 'Infografik modul'}
          className="max-h-[640px] w-full rounded-2xl bg-slate-50 object-contain"
        />
      ) : (
        <div className="grid min-h-72 place-items-center rounded-2xl bg-emerald-50 p-6 text-center">
          <a href={primaryContent.media_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white">
            <PlayCircle className="h-4 w-4" /> Buka Infografik / PDF
          </a>
        </div>
      )}
      {(primaryContent.title || primaryContent.body) && (
        <div className="px-2 pb-2 pt-4">
          {primaryContent.title && <p className="text-sm font-bold text-emerald-800">{primaryContent.title}</p>}
          {primaryContent.body && <p className="mt-1 text-sm leading-6 text-slate-600">{primaryContent.body}</p>}
        </div>
      )}
      <ContentList contents={contents.slice(1)} />
    </div>
  );
}

function PdfSlideViewer({ url, title }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let loadingTask = null;
    setLoading(true);
    setError('');
    setPdf(null);
    setPageNumber(1);
    setPageCount(0);

    async function loadPdf() {
      try {
        const pdfjs = await import('pdfjs-dist');
        if (cancelled) return;
        pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
        loadingTask = pdfjs.getDocument(url);
        const document = await loadingTask.promise;
        if (cancelled) {
          document.destroy();
          return;
        }
        setPdf(document);
        setPageCount(document.numPages);
      } catch {
        if (!cancelled) setError('Slide PDF gagal dimuat.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPdf();

    return () => {
      cancelled = true;
      loadingTask?.destroy();
    };
  }, [url]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return undefined;
    let cancelled = false;
    let renderTask = null;

    async function renderPage() {
      setRendering(true);
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const availableWidth = Math.max(frameRef.current?.clientWidth || 720, 280);
        const availableHeight = Math.max(frameRef.current?.clientHeight || 405, 220);
        const scale = Math.min(2, Math.max(0.35, Math.min(availableWidth / baseViewport.width, availableHeight / baseViewport.height)));
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
      } catch (nextError) {
        if (!cancelled && nextError?.name !== 'RenderingCancelledException') {
          setError('Halaman slide gagal dirender.');
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    }

    renderPage();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdf, pageNumber]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate font-display text-base font-bold text-slate-950">{title}</p>
          <p className="text-sm font-semibold text-slate-500">Slide {pageCount ? `${pageNumber} dari ${pageCount}` : 'PDF'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPageNumber((current) => Math.max(current - 1, 1))}
            disabled={pageNumber <= 1 || loading || rendering}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Sebelumnya
          </button>
          <button
            type="button"
            onClick={() => setPageNumber((current) => Math.min(current + 1, pageCount || current))}
            disabled={!pageCount || pageNumber >= pageCount || loading || rendering}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Selanjutnya <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={frameRef} className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl bg-slate-100">
        {(loading || rendering) && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-white/70 backdrop-blur-sm">
            <p className="rounded-full bg-white px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm">{loading ? 'Memuat slide...' : 'Merapikan halaman...'}</p>
          </div>
        )}
        {error ? (
          <div className="rounded-2xl bg-white p-6 text-center">
            <p className="font-bold text-red-600">{error}</p>
            <a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white">
              Buka file
            </a>
          </div>
        ) : (
          <div className="grid h-full w-full place-items-center">
            <canvas ref={canvasRef} className="block max-h-full max-w-full rounded-xl bg-white shadow-lg ring-1 ring-black/5" />
          </div>
        )}
      </div>
    </div>
  );
}

function ContentList({ contents, dark = false }) {
  if (!contents.length) return null;

  return (
    <div className="mt-4 space-y-3">
      {contents.map((content) => (
        <div key={content.id} className={`rounded-2xl border p-4 text-sm ${dark ? 'border-white/10 bg-white/10 text-emerald-50' : 'border-slate-200 bg-white/80 text-slate-600'}`}>
          <p className={`font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{content.title}</p>
          {content.body && <p className="mt-1 leading-6">{content.body}</p>}
          {content.media_url && (
            <a href={content.media_url} target="_blank" rel="noreferrer" className={`mt-2 inline-flex text-xs font-bold ${dark ? 'text-gold' : 'text-emerald-700'}`}>
              Buka media
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function EmptyContent({ label }) {
  return (
    <div className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center">
      <div>
        <p className="font-display text-xl font-bold text-slate-900">Belum ada {label} untuk modul ini.</p>
        <p className="mt-2 text-sm text-slate-500">Konten akan muncul otomatis setelah guru menambahkannya di menu Modul Pembelajaran.</p>
      </div>
    </div>
  );
}

function VideoContent({ url, featured = false }) {
  const embedUrl = getYouTubeEmbedUrl(url);

  if (embedUrl) {
    return (
      <div className={`overflow-hidden rounded-2xl bg-black shadow-sm ${featured ? '' : 'mt-5 border border-white/70'}`}>
        <iframe
          title="Video pembelajaran"
          src={embedUrl}
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white">
      <PlayCircle className="h-4 w-4" /> Buka Video
    </a>
  );
}

function getYouTubeEmbedUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '');
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }

    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v') || parsed.pathname.split('/').pop();
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }
  } catch {
    return '';
  }

  return '';
}

function isImageUrl(url) {
  try {
    const parsed = new URL(url);
    return /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(parsed.pathname);
  } catch {
    return /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(url);
  }
}

function isPdfUrl(url) {
  try {
    const parsed = new URL(url);
    return /\.pdf$/i.test(parsed.pathname);
  } catch {
    return /\.pdf(\?.*)?$/i.test(url);
  }
}
