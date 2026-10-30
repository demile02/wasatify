'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FeedbackItem, FeedbackStatus } from '@/lib/dev-feedback-store';

type FeedbackInboxProps = { initialItems: FeedbackItem[] };
type Filter = 'open' | 'done' | 'all';

const filterLabels: Record<Filter, string> = {
  open: 'Belum selesai',
  done: 'Selesai',
  all: 'Semua',
};

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString('id-ID');
}

function viewportLabel(viewport: string) {
  const width = Number(viewport.split('x')[0]);
  if (!Number.isFinite(width)) return viewport || 'Ukuran layar tidak tersedia';
  return `${width < 768 ? 'HP' : 'Desktop'} · ${viewport}`;
}

export function FeedbackInbox({ initialItems }: FeedbackInboxProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<Filter>('open');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const visibleItems = useMemo(
    () => items.filter((item) => filter === 'all' || item.status === filter),
    [filter, items],
  );
  const openCount = items.filter((item) => item.status === 'open').length;

  async function updateStatus(item: FeedbackItem) {
    const nextStatus: FeedbackStatus = item.status === 'open' ? 'done' : 'open';
    const action = nextStatus === 'done' ? 'done' : 'reopen';
    setPendingId(item.id);
    setError('');

    try {
      const response = await fetch(`/api/feedback/${encodeURIComponent(item.id)}/${action}`, { method: 'POST' });
      if (!response.ok) throw new Error('Gagal menyimpan perubahan status.');
      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: nextStatus } : entry)));
      router.refresh();
    } catch {
      setError('Status komentar gagal diperbarui. Coba lagi.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-7">
        <p className="text-sm font-semibold text-primary">WASATIFY · Mode pengembang</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Komentar Revisi</h1>
        <p className="mt-2 text-muted-foreground">
          {openCount} komentar perlu ditinjau. Komentar tersimpan di <code>db/feedback.json</code>.
        </p>
      </header>

      <nav aria-label="Filter komentar" className="mb-5 flex flex-wrap gap-2">
        {(Object.keys(filterLabels) as Filter[]).map((value) => (
          <Button
            key={value}
            type="button"
            variant={filter === value ? 'default' : 'outline'}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className="min-h-11 rounded-full"
          >
            {filterLabels[value]}
            {value === 'open' && <span className="ml-1">({openCount})</span>}
          </Button>
        ))}
      </nav>

      {error && <p role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

      {visibleItems.length === 0 ? (
        <section className="rounded-3xl border border-border bg-card px-5 py-12 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">{filter === 'open' ? 'Tidak ada komentar terbuka' : 'Belum ada komentar di sini'}</h2>
          <p className="mt-2 text-sm text-muted-foreground">Komentar baru dari widget anotasi akan muncul di halaman ini.</p>
        </section>
      ) : (
        <div className="space-y-4">
          {visibleItems.map((item) => (
            <article key={item.id} className="min-w-0 rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === 'done' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-950'}`}>
                  {item.status === 'done' ? 'Selesai' : 'Belum selesai'}
                </span>
                <span className="text-right text-xs text-muted-foreground">{formatTimestamp(item.timestamp)} · {viewportLabel(item.viewport)}</span>
              </div>

              <p className="mt-4 break-all text-sm font-semibold text-primary">{item.page_url || 'Halaman tidak tercatat'}</p>
              <p className="mt-2 break-all rounded-lg bg-muted px-3 py-2 font-mono text-xs text-foreground">
                &lt;{item.tag || 'element'}&gt; · {item.selector || 'Selector tidak tersedia'}
              </p>
              {item.text_snippet && <p className="mt-3 break-words text-sm text-muted-foreground">Elemen: “{item.text_snippet}”</p>}
              <p className="mt-3 whitespace-pre-wrap break-words text-base text-foreground">{item.comment}</p>

              <Button
                type="button"
                variant={item.status === 'open' ? 'default' : 'outline'}
                disabled={pendingId === item.id}
                onClick={() => void updateStatus(item)}
                className="mt-4 min-h-11 rounded-full"
              >
                {item.status === 'open' ? <Check aria-hidden="true" className="h-4 w-4" /> : <RotateCcw aria-hidden="true" className="h-4 w-4" />}
                {pendingId === item.id ? 'Menyimpan…' : item.status === 'open' ? 'Tandai selesai' : 'Buka lagi'}
              </Button>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
