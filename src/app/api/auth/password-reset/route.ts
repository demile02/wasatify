import 'server-only';

import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getPasswordRecoveryRedirectUrl } from '@/lib/auth/redirect-urls';

export const runtime = 'nodejs';

const IP_MAX_REQUESTS = 10;
const IP_BLOCK_SECONDS = 10 * 60;
const AUTH_RATE_LIMIT_RETRY_SECONDS = 60;
const passwordResetRequestSchema = z.object({
  email: z.string().trim().email().max(320),
});
const rateLimitDecisionSchema = z.object({
  allowed: z.boolean(),
  retry_after_seconds: z.number().int().nonnegative(),
});

function hashRateLimitKey(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function getClientIp(request: Request) {
  const candidates = [
    request.headers.get('x-vercel-forwarded-for'),
    request.headers.get('x-real-ip'),
    request.headers.get('x-forwarded-for'),
  ];

  for (const candidate of candidates) {
    const ip = candidate?.split(',')[0]?.trim();
    if (ip && isIP(ip)) return ip;
  }

  return process.env.NODE_ENV === 'production' ? null : 'local-development';
}

function jsonResponse(body: Record<string, unknown>, status = 200, retryAfterSeconds?: number) {
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  if (retryAfterSeconds) headers.set('Retry-After', String(retryAfterSeconds));
  return Response.json(body, { status, headers });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ status: 'error', message: 'Permintaan tidak valid.' }, 400);
  }

  const parsed = passwordResetRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonResponse({ status: 'error', message: 'Alamat email tidak valid.' }, 400);
  }

  const email = parsed.data.email.toLowerCase();
  const clientIp = getClientIp(request);
  if (!clientIp) {
    return jsonResponse({ status: 'error', message: 'Tidak dapat memverifikasi alamat jaringan.' }, 503);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ status: 'error', message: 'Layanan reset password belum dikonfigurasi.' }, 503);
  }

  try {
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });

    const ipLimitResponse = await adminClient.rpc('claim_password_reset_rate_limit', {
      p_key_hash: hashRateLimitKey(`ip:${clientIp}`),
      p_max_requests: IP_MAX_REQUESTS,
      p_window_seconds: IP_BLOCK_SECONDS,
    });

    if (ipLimitResponse.error) {
      return jsonResponse({ status: 'error', message: 'Layanan reset password sedang bermasalah.' }, 503);
    }

    const ipLimit = rateLimitDecisionSchema.safeParse(ipLimitResponse.data);
    if (!ipLimit.success) {
      return jsonResponse({ status: 'error', message: 'Layanan reset password sedang bermasalah.' }, 503);
    }

    if (!ipLimit.data.allowed) {
      return jsonResponse(
        { status: 'rate_limited', retryAfterSeconds: ipLimit.data.retry_after_seconds },
        429,
        ipLimit.data.retry_after_seconds,
      );
    }

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, role, class_id')
      .eq('email', email)
      .maybeSingle();

    if (profileError) {
      return jsonResponse({ status: 'error', message: 'Tidak dapat memeriksa alamat email.' }, 503);
    }
    if (!profile) return jsonResponse({ status: 'not_registered' });

    const { data: authUserResponse, error: authUserError } = await adminClient.auth.admin.getUserById(profile.id);
    if (authUserError || !authUserResponse.user) {
      return jsonResponse({ status: 'error', message: 'Tidak dapat memeriksa status akun.' }, 503);
    }

    if (!authUserResponse.user.email_confirmed_at) {
      return jsonResponse({ status: 'email_unconfirmed' });
    }

    if (profile.role === 'student' && !profile.class_id) {
      return jsonResponse({ status: 'registration_incomplete' });
    }

    if (profile.role === 'teacher') {
      const { data: teacherClass, error: teacherClassError } = await adminClient
        .from('classes')
        .select('id')
        .eq('teacher_id', profile.id)
        .limit(1)
        .maybeSingle();

      if (teacherClassError) {
        return jsonResponse({ status: 'error', message: 'Tidak dapat memeriksa status pendaftaran.' }, 503);
      }
      if (!teacherClass) return jsonResponse({ status: 'registration_incomplete' });
    } else if (profile.role !== 'student' && profile.role !== 'admin') {
      return jsonResponse({ status: 'registration_incomplete' });
    }

    const publicClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
    const { error: resetError } = await publicClient.auth.resetPasswordForEmail(email, {
      redirectTo: getPasswordRecoveryRedirectUrl(new URL(request.url).origin),
    });

    if (resetError) {
      const isRateLimited = resetError.status === 429
        || resetError.message.toLowerCase().includes('rate')
        || resetError.message.toLowerCase().includes('too many');
      return jsonResponse(
        {
          status: isRateLimited ? 'rate_limited' : 'error',
          ...(isRateLimited ? { retryAfterSeconds: AUTH_RATE_LIMIT_RETRY_SECONDS } : {}),
        },
        isRateLimited ? 429 : 502,
        isRateLimited ? AUTH_RATE_LIMIT_RETRY_SECONDS : undefined,
      );
    }

    return jsonResponse({ status: 'sent' });
  } catch {
    return jsonResponse({ status: 'error', message: 'Layanan reset password sedang bermasalah.' }, 503);
  }
}
