import { addFeedback, listFeedback } from '@/lib/dev-feedback-store';

export const runtime = 'nodejs';

function unavailable() {
  return new Response(null, { status: 404 });
}

export async function GET() {
  if (process.env.NODE_ENV !== 'development') return unavailable();

  try {
    const items = await listFeedback();
    return Response.json({ status: 'ok', count: items.length, items });
  } catch {
    return Response.json({ status: 'error', message: 'Gagal membaca masukan.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') return unavailable();
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 16_384) {
    return Response.json({ status: 'error', message: 'Ukuran komentar terlalu besar.' }, { status: 413 });
  }

  let data: unknown;
  try {
    const rawBody = await request.text();
    if (rawBody.length > 16_384) {
      return Response.json({ status: 'error', message: 'Ukuran komentar terlalu besar.' }, { status: 413 });
    }
    data = JSON.parse(rawBody);
  } catch {
    return Response.json({ status: 'error', message: 'Body harus berupa JSON.' }, { status: 400 });
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return Response.json({ status: 'error', message: 'Body harus berupa object JSON.' }, { status: 400 });
  }

  const fields = ['comment', 'timestamp', 'page_url', 'selector', 'tag', 'text_snippet', 'viewport'] as const;
  const values = data as Record<string, unknown>;
  if (fields.some((field) => values[field] !== undefined && typeof values[field] !== 'string')) {
    return Response.json({ status: 'error', message: 'Semua field harus berupa teks.' }, { status: 400 });
  }

  const comment = (values.comment as string | undefined)?.trim() ?? '';
  if (!comment) {
    return Response.json({ status: 'error', message: 'Komentar tidak boleh kosong.' }, { status: 400 });
  }

  try {
    const item = await addFeedback({
      comment: comment.slice(0, 2000),
      timestamp: ((values.timestamp as string | undefined) || new Date().toISOString()).slice(0, 40),
      page_url: ((values.page_url as string | undefined) || '').slice(0, 300),
      selector: ((values.selector as string | undefined) || '').slice(0, 300),
      tag: ((values.tag as string | undefined) || '').slice(0, 30),
      text_snippet: ((values.text_snippet as string | undefined) || '').slice(0, 200),
      viewport: ((values.viewport as string | undefined) || '').slice(0, 20),
    });
    return Response.json({ status: 'ok', id: item.id });
  } catch {
    return Response.json({ status: 'error', message: 'Gagal menyimpan komentar.' }, { status: 500 });
  }
}
