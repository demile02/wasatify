'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, FileImage } from 'lucide-react';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils';

type InfographicPdfViewerProps = {
  src: string;
  title: string;
  className?: string;
};

type LoadState = 'loading' | 'ready' | 'error';

export function InfographicPdfViewer({ src, title, className }: InfographicPdfViewerProps) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [pageState, setPageState] = useState<LoadState>('loading');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let loadingTask: PDFDocumentLoadingTask | null = null;

    setDocument(null);
    setLoadState('loading');
    setPageState('loading');
    setPageNumber(1);
    setPageCount(0);

    async function loadDocument() {
      try {
        const pdfjs = await import('pdfjs-dist');
        if (isCancelled) return;

        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
        loadingTask = pdfjs.getDocument({ url: src });
        const loadedDocument = await loadingTask.promise;

        if (isCancelled) {
          await loadingTask.destroy();
          return;
        }

        setDocument(loadedDocument);
        setPageCount(loadedDocument.numPages);
        setLoadState('ready');
      } catch {
        if (!isCancelled) setLoadState('error');
      }
    }

    void loadDocument();

    return () => {
      isCancelled = true;
      renderTaskRef.current?.cancel();
      if (loadingTask) void loadingTask.destroy();
    };
  }, [src]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [loadState]);

  useEffect(() => {
    if (!document || !containerSize.width || !containerSize.height) return;

    const pdfDocument = document;
    let isCancelled = false;
    let renderTask: RenderTask | null = null;

    async function renderPage() {
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (!canvas || !context) {
        setPageState('error');
        return;
      }

      setPageState('loading');
      try {
        const page = await pdfDocument.getPage(pageNumber);
        if (isCancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(
          (containerSize.width - 24) / baseViewport.width,
          (containerSize.height - 24) / baseViewport.height,
        );
        if (!Number.isFinite(scale) || scale <= 0) return;

        const viewport = page.getViewport({ scale });
        const outputScale = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.ceil(viewport.width * outputScale);
        canvas.height = Math.ceil(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: [outputScale, 0, 0, outputScale, 0, 0],
        });
        renderTaskRef.current = renderTask;
        await renderTask.promise;

        if (!isCancelled) setPageState('ready');
      } catch (error) {
        const wasRenderCancelled = error instanceof Error && error.name === 'RenderingCancelledException';
        if (!isCancelled && !wasRenderCancelled) setPageState('error');
      }
    }

    void renderPage();

    return () => {
      isCancelled = true;
      renderTask?.cancel();
      if (renderTaskRef.current === renderTask) renderTaskRef.current = null;
    };
  }, [containerSize.height, containerSize.width, document, pageNumber]);

  return (
    <div className={cn('flex h-[min(68vh,520px)] min-h-60 w-full min-w-0 flex-col overflow-hidden bg-white', className)}>
      {loadState === 'loading' && (
        <EmptyState
          icon={FileImage}
          title="Memuat infografik"
          description="PDF sedang disiapkan untuk ditampilkan."
          className="grid min-h-0 flex-1 rounded-none border-0 bg-slate-50 p-4"
        />
      )}

      {loadState === 'error' && (
        <EmptyState
          icon={FileImage}
          title="PDF infografik tidak dapat dimuat"
          description="Pastikan tautan PDF dapat diakses publik dan izinkan akses dari aplikasi ini."
          className="grid min-h-0 flex-1 rounded-none border-0 bg-slate-50 p-4"
        />
      )}

      {loadState === 'ready' && (
        <>
          <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border px-3">
            <p className="min-w-0 truncate text-xs font-semibold text-muted-foreground" aria-live="polite">
              Halaman {pageNumber} dari {pageCount}
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                aria-label="Halaman sebelumnya"
                title="Halaman sebelumnya"
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber((current) => Math.max(current - 1, 1))}
                className="grid h-11 w-11 place-items-center rounded-xl border border-slate-400 bg-white text-ink transition hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Halaman berikutnya"
                title="Halaman berikutnya"
                disabled={pageNumber >= pageCount}
                onClick={() => setPageNumber((current) => Math.min(current + 1, pageCount))}
                className="grid h-11 w-11 place-items-center rounded-xl border border-slate-400 bg-white text-ink transition hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            ref={containerRef}
            className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-slate-50 p-3"
          >
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={`${title}, halaman ${pageNumber} dari ${pageCount}`}
              className={cn('max-h-full max-w-full', pageState !== 'ready' && 'invisible')}
            />
            {pageState === 'loading' && (
              <p className="absolute px-4 text-center text-sm text-muted-foreground" aria-live="polite">
                Memuat halaman {pageNumber}...
              </p>
            )}
            {pageState === 'error' && (
              <p className="absolute px-4 text-center text-sm leading-6 text-muted-foreground" role="alert">
                Halaman PDF ini gagal dirender. Coba muat ulang pelajaran.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
