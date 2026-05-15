import { NextResponse, type NextRequest } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = getSafeNextPath(requestUrl.searchParams.get('next'));

  if (code && isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    if (next.startsWith('/login')) {
      await supabase.auth.signOut();
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

function getSafeNextPath(value: string | null) {
  if (!value) return '/login?confirmed=1';
  if (!value.startsWith('/') || value.startsWith('//')) return '/login?confirmed=1';
  return value;
}
