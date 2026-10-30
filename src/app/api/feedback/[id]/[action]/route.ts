import { setFeedbackStatus, type FeedbackStatus } from '@/lib/dev-feedback-store';

export const runtime = 'nodejs';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string; action: string }> },
) {
  if (process.env.NODE_ENV !== 'development') return new Response(null, { status: 404 });
  const { id, action } = await context.params;
  if (action !== 'done' && action !== 'reopen') {
    return Response.json({ status: 'error', message: 'Aksi tidak dikenal.' }, { status: 404 });
  }

  try {
    const status: FeedbackStatus = action === 'done' ? 'done' : 'open';
    const updated = await setFeedbackStatus(id, status);
    if (!updated) return Response.json({ status: 'error', message: 'Komentar tidak ditemukan.' }, { status: 404 });
    return Response.json({ status: 'ok', id, new_status: status });
  } catch {
    return Response.json({ status: 'error', message: 'Gagal memperbarui status komentar.' }, { status: 500 });
  }
}
