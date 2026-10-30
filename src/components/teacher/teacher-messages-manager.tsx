'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Send } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAsyncAction } from '@/hooks/use-async-action';
import { formatDateTime } from '@/lib/date';
import { sendTeacherMessageAction, type TeacherMessageActionResult } from '@/lib/teacher/message-actions';
import type { TeacherMessageDraft } from '@/lib/teacher/message-validation';
import type { TeacherMessagesData } from '@/lib/teacher/messages';

type TeacherMessagesManagerProps = {
  data: TeacherMessagesData;
  basePath?: string;
  onSend?: (draft: TeacherMessageDraft) => Promise<TeacherMessageActionResult>;
};

const pageSize = 20;

export function TeacherMessagesManager({
  data,
  basePath = '/teacher/messages',
  onSend,
}: TeacherMessagesManagerProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [classId, setClassId] = useState(data.classes[0]?.id ?? '');
  const [demoPage, setDemoPage] = useState(1);
  const [isPending, runAction] = useAsyncAction();
  const isDemo = Boolean(onSend);
  const messages = isDemo
    ? data.messages.slice((demoPage - 1) * pageSize, demoPage * pageSize)
    : data.messages;
  const page = isDemo ? demoPage : data.page;
  const hasPreviousPage = isDemo ? demoPage > 1 : data.hasPreviousPage;
  const hasNextPage = isDemo ? demoPage * pageSize < data.messages.length : data.hasNextPage;
  const canSend = Boolean(classId && title.trim().length >= 5 && body.trim().length >= 20 && !isPending);

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;

    runAction(async () => {
      const draft = { classId, title, body };
      const result = onSend
        ? await onSend(draft)
        : await sendTeacherMessageAction(draft);

      if (!result.ok) {
        toast.error(result.error ?? 'Pesan belum berhasil dikirim.');
        return;
      }

      setTitle('');
      setBody('');
      if (isDemo) setDemoPage(1);
      else router.refresh();
      toast.success(isDemo ? 'Pesan demo disimpan.' : 'Pesan dikirim ke kelas.');
    });
  }

  return (
    <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
      <SectionCard className="h-fit min-w-0">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint text-primary">
            <Send className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-ink">Kirim pesan ke kelas</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Pesan tampil di kotak pesan siswa dalam kelas yang dipilih.</p>
          </div>
        </div>

        {data.classes.length ? (
          <form onSubmit={submitMessage} className="mt-5 grid min-w-0 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="teacher-message-class">Kelas tujuan</Label>
              <select
                id="teacher-message-class"
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
                disabled={isPending}
                required
                className="h-12 min-w-0 w-full rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-60"
              >
                {data.classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>{classItem.name}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="teacher-message-title">Judul pesan</Label>
              <Input
                id="teacher-message-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                minLength={5}
                maxLength={100}
                placeholder="Contoh: Jadwal kuis pekan ini"
                required
                disabled={isPending}
              />
              <p className="text-right text-xs text-muted-foreground">{title.length}/100</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="teacher-message-body">Isi pesan</Label>
              <Textarea
                id="teacher-message-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                minLength={20}
                maxLength={2000}
                rows={5}
                placeholder="Tulis informasi yang perlu diketahui siswa..."
                required
                disabled={isPending}
                className="min-h-32 resize-y rounded-xl bg-white text-foreground"
              />
              <p className="text-right text-xs text-muted-foreground">{body.length}/2.000</p>
            </div>

            <Button type="submit" className="min-h-11 w-full sm:w-auto sm:justify-self-end" disabled={!canSend}>
              <Send className="h-4 w-4" aria-hidden="true" />
              {isPending ? 'Mengirim...' : isDemo ? 'Simpan Pesan Demo' : 'Kirim Pesan'}
            </Button>
          </form>
        ) : (
          <p role="status" className="mt-5 rounded-xl border border-gold/30 bg-cream p-4 text-sm leading-6 text-foreground">
            Buat kelas terlebih dahulu sebelum mengirim pesan.
          </p>
        )}
      </SectionCard>

      <SectionCard className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-ink">Pesan terkirim</h2>
            <p className="mt-1 text-sm text-muted-foreground">Riwayat pesan untuk kelas yang kamu kelola.</p>
          </div>
          {data.messages.length > 0 && <span className="text-sm font-semibold text-muted-foreground">{data.messages.length} pesan di halaman ini</span>}
        </div>

        {messages.length ? (
          <div className="grid min-w-0 gap-3">
            {messages.map((message) => (
              <article key={message.id} className="min-w-0 rounded-2xl border border-border bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="min-w-0 break-words font-bold text-ink">{message.title}</h3>
                  <time className="shrink-0 text-xs font-medium text-muted-foreground" dateTime={message.createdAt}>
                    {formatDateTime(message.createdAt)}
                  </time>
                </div>
                <p className="mt-2 text-xs font-semibold text-primary">Kepada: {message.targetName}</p>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{message.body}</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            className="min-h-56"
            icon={Mail}
            title="Belum ada pesan terkirim"
            description="Pesan yang dikirim ke kelas akan muncul di sini."
          />
        )}

        {(hasPreviousPage || hasNextPage) && (
          <nav aria-label="Navigasi halaman pesan terkirim" className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-1">
            {hasPreviousPage ? (
              isDemo ? (
                <Button type="button" variant="outline" className="min-h-11 justify-self-start" onClick={() => setDemoPage((value) => Math.max(1, value - 1))}>Lebih baru</Button>
              ) : (
                <Button asChild variant="outline" className="min-h-11 justify-self-start"><Link href={page === 2 ? basePath : `${basePath}?page=${page - 1}`}>Lebih baru</Link></Button>
              )
            ) : <span />}
            <span aria-current="page" className="text-center text-sm font-semibold text-muted-foreground">Halaman {page}</span>
            {hasNextPage ? (
              isDemo ? (
                <Button type="button" variant="outline" className="min-h-11 justify-self-end" onClick={() => setDemoPage((value) => value + 1)}>Lebih lama</Button>
              ) : (
                <Button asChild variant="outline" className="min-h-11 justify-self-end"><Link href={`${basePath}?page=${page + 1}`}>Lebih lama</Link></Button>
              )
            ) : <span />}
          </nav>
        )}
      </SectionCard>
    </div>
  );
}
